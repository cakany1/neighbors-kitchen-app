
-- P0.8: Add past-time validation to book_meal RPC
-- Also extend validate_meal_pickup_time trigger to cover UPDATE

-- 1) Update book_meal to reject bookings for meals with past pickup times
CREATE OR REPLACE FUNCTION public.book_meal(p_meal_id uuid, p_guest_id uuid)
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  v_available int;
  v_booking_id uuid;
  v_women_only boolean;
  v_guest_gender text;
  v_scheduled_date timestamptz;
  v_collection_start time;
  v_pickup_datetime timestamptz;
BEGIN
  -- SECURITY: Verify the caller is booking for themselves
  IF p_guest_id != auth.uid() THEN
    RETURN json_build_object(
      'success', false, 
      'message', 'Unauthorized: Cannot book for another user'
    );
  END IF;

  -- 1. Lock the row and get current availability + women_only flag + time fields
  SELECT available_portions, women_only, scheduled_date, collection_window_start
  INTO v_available, v_women_only, v_scheduled_date, v_collection_start
  FROM meals 
  WHERE id = p_meal_id 
  FOR UPDATE;

  -- 2. Validation: Check if meal exists
  IF v_available IS NULL THEN
    RETURN json_build_object('success', false, 'message', 'Meal not found');
  END IF;

  -- 3. TIME VALIDATION: Block booking for past pickup slots
  IF v_scheduled_date IS NOT NULL AND v_collection_start IS NOT NULL THEN
    v_pickup_datetime := v_scheduled_date::date + v_collection_start;
    IF v_pickup_datetime < now() THEN
      RETURN json_build_object(
        'success', false, 
        'message', 'Dieses Angebot ist bereits abgelaufen. / This offer has expired.'
      );
    END IF;
  ELSIF v_scheduled_date IS NOT NULL THEN
    -- If no collection window, check date only (end of day)
    IF v_scheduled_date::date < CURRENT_DATE THEN
      RETURN json_build_object(
        'success', false, 
        'message', 'Dieses Angebot ist bereits abgelaufen. / This offer has expired.'
      );
    END IF;
  END IF;

  IF v_available <= 0 THEN
    RETURN json_build_object('success', false, 'message', 'Sold out - no portions available');
  END IF;

  -- 4. LADIES ONLY ENFORCEMENT: Check guest gender if women_only is enabled
  IF v_women_only = true THEN
    SELECT gender INTO v_guest_gender
    FROM profiles
    WHERE id = p_guest_id;

    IF v_guest_gender IS NULL OR v_guest_gender != 'female' THEN
      RETURN json_build_object(
        'success', false, 
        'message', 'Entschuldigung, dieses Angebot ist nur für weibliche Gäste reserviert.'
      );
    END IF;
  END IF;

  -- 5. Update Inventory atomically
  UPDATE meals 
  SET available_portions = available_portions - 1,
      booked_seats = coalesce(booked_seats, 0) + 1
  WHERE id = p_meal_id;

  -- 6. Create Booking Record
  INSERT INTO bookings (meal_id, guest_id, status)
  VALUES (p_meal_id, p_guest_id, 'pending')
  RETURNING id INTO v_booking_id;

  RETURN json_build_object('success', true, 'booking_id', v_booking_id);
END;
$function$;

-- 2) Extend validate_meal_pickup_time trigger to also fire on UPDATE
DROP TRIGGER IF EXISTS validate_meal_pickup_time_trigger ON meals;
CREATE TRIGGER validate_meal_pickup_time_trigger
  BEFORE INSERT OR UPDATE ON meals
  FOR EACH ROW
  EXECUTE FUNCTION public.validate_meal_pickup_time();
