-- Create transactional booking function to prevent overbooking
create or replace function book_meal(
  p_meal_id uuid,
  p_guest_id uuid
) returns json as $$
declare
  v_available int;
  v_booking_id uuid;
begin
  -- 1. Lock the row and get current availability
  select available_portions 
  into v_available
  from meals 
  where id = p_meal_id 
  for update;

  -- 2. Validation
  if v_available is null then
    return json_build_object('success', false, 'message', 'Meal not found');
  end if;

  if v_available <= 0 then
    return json_build_object('success', false, 'message', 'Sold out - no portions available');
  end if;

  -- 3. Update Inventory atomically
  update meals 
  set available_portions = available_portions - 1,
      booked_seats = coalesce(booked_seats, 0) + 1
  where id = p_meal_id;

  -- 4. Create Booking Record
  insert into bookings (meal_id, guest_id, status)
  values (p_meal_id, p_guest_id, 'pending')
  returning id into v_booking_id;

  return json_build_object('success', true, 'booking_id', v_booking_id);
end;
$$ language plpgsql security definer;