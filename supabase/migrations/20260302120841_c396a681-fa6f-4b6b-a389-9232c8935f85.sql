-- Fix delete_meal_with_karma: remove trust in client-supplied p_is_admin
-- Instead, check admin role server-side using has_role()
CREATE OR REPLACE FUNCTION public.delete_meal_with_karma(p_meal_id uuid, p_user_id uuid, p_is_admin boolean DEFAULT false)
 RETURNS json
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  v_chef_id UUID;
  v_created_at TIMESTAMP WITH TIME ZONE;
  v_age_minutes DOUBLE PRECISION;
  v_has_active_bookings BOOLEAN;
  v_karma_penalty INTEGER := 0;
  v_is_admin BOOLEAN;
BEGIN
  -- SERVER-SIDE admin check: ignore client-supplied p_is_admin entirely
  v_is_admin := has_role(auth.uid(), 'admin');

  -- Get meal details
  SELECT chef_id, created_at INTO v_chef_id, v_created_at
  FROM meals WHERE id = p_meal_id;
  
  IF v_chef_id IS NULL THEN
    RETURN json_build_object('success', false, 'message', 'Gericht nicht gefunden');
  END IF;
  
  -- SECURITY: Verify caller owns the meal OR is admin (server-verified)
  IF NOT v_is_admin AND v_chef_id != auth.uid() THEN
    RETURN json_build_object('success', false, 'message', 'Nur der Ersteller kann sein Gericht löschen');
  END IF;
  
  -- Calculate age in minutes
  v_age_minutes := EXTRACT(EPOCH FROM (now() - v_created_at)) / 60;
  
  -- Check for active bookings
  SELECT EXISTS(
    SELECT 1 FROM bookings 
    WHERE meal_id = p_meal_id 
    AND status NOT IN ('cancelled', 'cancelled_by_guest', 'cancelled_by_host', 'completed', 'no_show_guest', 'no_show_host')
  ) INTO v_has_active_bookings;
  
  -- KARMA PENALTY: Apply -10 karma if older than 5 minutes AND not admin
  IF NOT v_is_admin AND v_age_minutes > 5 THEN
    v_karma_penalty := -10;
    
    UPDATE profiles
    SET karma = GREATEST(0, karma + v_karma_penalty)
    WHERE id = v_chef_id;
  END IF;
  
  -- Delete the meal
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
$function$;