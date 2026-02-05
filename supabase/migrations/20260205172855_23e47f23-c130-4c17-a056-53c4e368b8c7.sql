-- Add validation trigger for past pickup times
CREATE OR REPLACE FUNCTION public.validate_meal_pickup_time()
RETURNS TRIGGER AS $$
DECLARE
  pickup_datetime TIMESTAMP WITH TIME ZONE;
  grace_time TIMESTAMP WITH TIME ZONE;
BEGIN
  -- Combine scheduled_date with collection_window_start
  IF NEW.scheduled_date IS NOT NULL AND NEW.collection_window_start IS NOT NULL THEN
    pickup_datetime := NEW.scheduled_date::date + NEW.collection_window_start::time;
    grace_time := now() + interval '15 minutes';
    
    -- Block if pickup time is in the past (with 15 min grace)
    IF pickup_datetime < grace_time THEN
      RAISE EXCEPTION 'Abholzeit liegt in der Vergangenheit. Bitte wähle einen späteren Zeitpunkt.';
    END IF;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Create trigger if not exists
DROP TRIGGER IF EXISTS validate_meal_pickup_time_trigger ON meals;
CREATE TRIGGER validate_meal_pickup_time_trigger
  BEFORE INSERT ON meals
  FOR EACH ROW
  EXECUTE FUNCTION public.validate_meal_pickup_time();

-- Add gentleman_minutes: Allow withdrawal within 5 minutes
CREATE OR REPLACE FUNCTION public.withdraw_meal(p_meal_id uuid)
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_chef_id uuid;
  v_created_at TIMESTAMP WITH TIME ZONE;
  v_has_bookings boolean;
BEGIN
  -- Get meal details
  SELECT chef_id, created_at INTO v_chef_id, v_created_at
  FROM meals WHERE id = p_meal_id;
  
  IF v_chef_id IS NULL THEN
    RETURN json_build_object('success', false, 'message', 'Gericht nicht gefunden');
  END IF;
  
  -- Verify caller is the chef
  IF v_chef_id != auth.uid() THEN
    RETURN json_build_object('success', false, 'message', 'Nur der Koch kann sein Gericht zurückziehen');
  END IF;
  
  -- Check if within 5-minute window
  IF (now() - v_created_at) > interval '5 minutes' THEN
    RETURN json_build_object('success', false, 'message', 'Die 5-Minuten-Frist zum Zurückziehen ist abgelaufen. Bitte lösche das Gericht manuell.');
  END IF;
  
  -- Check for existing bookings
  SELECT EXISTS(SELECT 1 FROM bookings WHERE meal_id = p_meal_id AND status NOT IN ('cancelled', 'cancelled_by_guest', 'cancelled_by_host'))
  INTO v_has_bookings;
  
  IF v_has_bookings THEN
    RETURN json_build_object('success', false, 'message', 'Es gibt bereits Buchungen für dieses Gericht.');
  END IF;
  
  -- Delete the meal (no penalty)
  DELETE FROM meals WHERE id = p_meal_id;
  
  RETURN json_build_object('success', true, 'message', 'Gericht erfolgreich zurückgezogen');
END;
$$;

-- Grant execute to authenticated users
GRANT EXECUTE ON FUNCTION public.withdraw_meal(uuid) TO authenticated;