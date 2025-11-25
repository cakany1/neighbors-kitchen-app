-- Fix search_path security warnings for the new functions

-- 1. Fix validate_visibility_mode function
CREATE OR REPLACE FUNCTION public.validate_visibility_mode()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Men can only set visibility to 'all'
  IF NEW.gender = 'man' AND NEW.visibility_mode != 'all' THEN
    RAISE EXCEPTION 'Men can only set visibility mode to "all"';
  END IF;
  
  -- Diverse and none can set 'all' or 'women_fli' but not 'women_only'
  IF NEW.gender IN ('diverse', 'none') AND NEW.visibility_mode = 'women_only' THEN
    RAISE EXCEPTION 'Diverse/None users cannot set visibility mode to "women_only"';
  END IF;
  
  RETURN NEW;
END;
$$;

-- 2. Fix can_view_meal function
CREATE OR REPLACE FUNCTION public.can_view_meal(meal_visibility text, viewer_gender text)
RETURNS boolean
LANGUAGE plpgsql
IMMUTABLE
SET search_path = public
AS $$
BEGIN
  -- women_only: Only visible to women
  IF meal_visibility = 'women_only' THEN
    RETURN viewer_gender = 'woman';
  END IF;
  
  -- women_fli: Visible to women OR diverse
  IF meal_visibility = 'women_fli' THEN
    RETURN viewer_gender IN ('woman', 'diverse');
  END IF;
  
  -- all: Visible to everyone
  RETURN true;
END;
$$;