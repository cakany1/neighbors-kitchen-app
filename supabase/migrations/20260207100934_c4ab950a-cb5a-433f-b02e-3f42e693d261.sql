-- Function to delete meal with karma penalty after gentleman minutes
CREATE OR REPLACE FUNCTION public.delete_meal_with_karma(p_meal_id UUID, p_user_id UUID, p_is_admin BOOLEAN DEFAULT FALSE)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  v_chef_id UUID;
  v_created_at TIMESTAMP WITH TIME ZONE;
  v_age_minutes DOUBLE PRECISION;
  v_has_active_bookings BOOLEAN;
  v_karma_penalty INTEGER := 0;
BEGIN
  -- Get meal details
  SELECT chef_id, created_at INTO v_chef_id, v_created_at
  FROM meals WHERE id = p_meal_id;
  
  IF v_chef_id IS NULL THEN
    RETURN json_build_object('success', false, 'message', 'Gericht nicht gefunden');
  END IF;
  
  -- SECURITY: Verify caller owns the meal (unless admin)
  IF NOT p_is_admin AND v_chef_id != p_user_id THEN
    RETURN json_build_object('success', false, 'message', 'Nur der Ersteller kann sein Gericht löschen');
  END IF;
  
  -- Calculate age in minutes
  v_age_minutes := EXTRACT(EPOCH FROM (now() - v_created_at)) / 60;
  
  -- Check for active bookings (inform user but don't block)
  SELECT EXISTS(
    SELECT 1 FROM bookings 
    WHERE meal_id = p_meal_id 
    AND status NOT IN ('cancelled', 'cancelled_by_guest', 'cancelled_by_host', 'completed', 'no_show_guest', 'no_show_host')
  ) INTO v_has_active_bookings;
  
  -- KARMA PENALTY: Apply -10 karma if older than 5 minutes AND not admin
  IF NOT p_is_admin AND v_age_minutes > 5 THEN
    v_karma_penalty := -10;
    
    UPDATE profiles
    SET karma = GREATEST(0, karma + v_karma_penalty) -- Prevent negative karma
    WHERE id = v_chef_id;
  END IF;
  
  -- Delete the meal (cascades to related bookings via FK)
  DELETE FROM meals WHERE id = p_meal_id;
  
  RETURN json_build_object(
    'success', true, 
    'message', CASE 
      WHEN v_karma_penalty < 0 THEN 'Gericht gelöscht. Karma-Abzug: ' || ABS(v_karma_penalty)
      ELSE 'Gericht gelöscht (keine Karma-Änderung)'
    END,
    'karma_penalty', v_karma_penalty,
    'had_bookings', v_has_active_bookings,
    'age_minutes', v_age_minutes
  );
END;
$$;