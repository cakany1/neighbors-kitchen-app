-- Fix Ladies Only Enforcement in book_meal function
create or replace function public.book_meal(
  p_meal_id uuid,
  p_guest_id uuid
) returns json
language plpgsql
security definer
set search_path = public
as $$
declare
  v_available int;
  v_booking_id uuid;
  v_women_only boolean;
  v_guest_gender text;
begin
  -- 1. Lock the row and get current availability + women_only flag
  select available_portions, women_only
  into v_available, v_women_only
  from meals 
  where id = p_meal_id 
  for update;

  -- 2. Validation: Check if meal exists
  if v_available is null then
    return json_build_object('success', false, 'message', 'Meal not found');
  end if;

  if v_available <= 0 then
    return json_build_object('success', false, 'message', 'Sold out - no portions available');
  end if;

  -- 3. LADIES ONLY ENFORCEMENT: Check guest gender if women_only is enabled
  if v_women_only = true then
    select gender into v_guest_gender
    from profiles
    where id = p_guest_id;

    if v_guest_gender is null or v_guest_gender != 'female' then
      return json_build_object(
        'success', false, 
        'message', 'Entschuldigung, dieses Angebot ist nur für weibliche Gäste reserviert.'
      );
    end if;
  end if;

  -- 4. Update Inventory atomically
  update meals 
  set available_portions = available_portions - 1,
      booked_seats = coalesce(booked_seats, 0) + 1
  where id = p_meal_id;

  -- 5. Create Booking Record
  insert into bookings (meal_id, guest_id, status)
  values (p_meal_id, p_guest_id, 'pending')
  returning id into v_booking_id;

  return json_build_object('success', true, 'booking_id', v_booking_id);
end;
$$;

-- Create app_feedback table for bug reports and suggestions
create table if not exists public.app_feedback (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete cascade not null,
  subject text not null,
  message text not null,
  status text default 'pending' not null,
  created_at timestamp with time zone default now() not null
);

-- Enable RLS on app_feedback
alter table public.app_feedback enable row level security;

-- Users can create their own feedback
create policy "Users can create their own feedback"
on public.app_feedback
for insert
to authenticated
with check (auth.uid() = user_id);

-- Users can view their own feedback
create policy "Users can view their own feedback"
on public.app_feedback
for select
to authenticated
using (auth.uid() = user_id);

-- Admins can view all feedback
create policy "Admins can view all feedback"
on public.app_feedback
for select
to authenticated
using (public.has_role(auth.uid(), 'admin'));

-- Admins can update feedback status
create policy "Admins can update feedback"
on public.app_feedback
for update
to authenticated
using (public.has_role(auth.uid(), 'admin'));