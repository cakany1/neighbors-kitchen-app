-- Create function to cancel bookings with inventory restoration
create or replace function cancel_booking(
  p_booking_id uuid,
  p_guest_id uuid
) returns json as $$
declare
  v_meal_id uuid;
  v_status text;
  v_created_at timestamptz;
begin
  -- 1. Get booking details & lock
  select meal_id, status, created_at
  into v_meal_id, v_status, v_created_at
  from bookings 
  where id = p_booking_id and guest_id = p_guest_id
  for update;

  if v_meal_id is null then
    return json_build_object('success', false, 'message', 'Booking not found or unauthorized');
  end if;

  if v_status = 'cancelled' then
    return json_build_object('success', false, 'message', 'Booking already cancelled');
  end if;

  -- Check if within 15-minute grace period
  if (now() - v_created_at) > interval '15 minutes' then
    return json_build_object('success', false, 'message', 'Cancellation period expired. Please contact the chef.');
  end if;

  -- 2. Update Booking Status to cancelled
  update bookings 
  set status = 'cancelled' 
  where id = p_booking_id;

  -- 3. Restore Inventory (each booking = 1 portion)
  update meals 
  set available_portions = available_portions + 1,
      booked_seats = coalesce(booked_seats, 0) - 1
  where id = v_meal_id;

  return json_build_object('success', true, 'message', 'Booking cancelled successfully');
end;
$$ language plpgsql security definer set search_path = public;