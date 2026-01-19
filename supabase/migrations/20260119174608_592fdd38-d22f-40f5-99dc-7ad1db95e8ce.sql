-- Fix security issue: Add auth.uid() verification to book_meal function
-- This prevents users from creating bookings on behalf of other users

CREATE OR REPLACE FUNCTION public.book_meal(p_meal_id uuid, p_guest_id uuid)
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
declare
  v_available int;
  v_booking_id uuid;
  v_women_only boolean;
  v_guest_gender text;
begin
  -- SECURITY: Verify the caller is booking for themselves
  IF p_guest_id != auth.uid() THEN
    RETURN json_build_object(
      'success', false, 
      'message', 'Unauthorized: Cannot book for another user'
    );
  END IF;

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
$function$;