-- Add partner_verification_status column to profiles
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS partner_verification_status verification_status NOT NULL DEFAULT 'pending';

-- Add partner_id_document_url for partner ID uploads
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS partner_id_document_url text;

-- Update profiles_public view to include partner_verification_status
DROP VIEW IF EXISTS public.profiles_public;
CREATE VIEW public.profiles_public
WITH (security_invoker=on) AS
SELECT 
  id,
  first_name,
  last_name,
  nickname,
  avatar_url,
  karma,
  display_real_name,
  is_couple,
  age,
  verification_status,
  id_verified,
  phone_verified,
  vacation_mode,
  notification_radius,
  successful_pickups,
  no_shows,
  created_at,
  updated_at,
  partner_photo_url,
  partner_name,
  partner_gender,
  gender,
  languages,
  allergens,
  dislikes,
  visibility_mode,
  role,
  partner_verification_status
FROM public.profiles;

-- Create function to check if couple is fully verified
CREATE OR REPLACE FUNCTION public.is_couple_fully_verified(user_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path TO 'public'
AS $$
  SELECT CASE 
    WHEN is_couple = true THEN 
      (verification_status = 'approved' AND partner_verification_status = 'approved')
    ELSE 
      verification_status = 'approved'
  END
  FROM public.profiles
  WHERE id = user_id;
$$;

-- Create trigger function to block meal creation for unverified couples
CREATE OR REPLACE FUNCTION public.check_couple_verification_for_meal()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  v_is_couple boolean;
  v_verification_status verification_status;
  v_partner_verification_status verification_status;
BEGIN
  -- Get profile verification details
  SELECT is_couple, verification_status, partner_verification_status
  INTO v_is_couple, v_verification_status, v_partner_verification_status
  FROM public.profiles
  WHERE id = NEW.chef_id;

  -- If couple account, both must be verified
  IF v_is_couple = true THEN
    IF v_verification_status != 'approved' THEN
      RAISE EXCEPTION 'Dein Account muss verifiziert sein, bevor du Gerichte anbieten kannst.';
    END IF;
    IF v_partner_verification_status != 'approved' THEN
      RAISE EXCEPTION 'Dein Partner muss ebenfalls verifiziert sein, bevor ihr Gerichte anbieten könnt.';
    END IF;
  END IF;

  RETURN NEW;
END;
$function$;

-- Create trigger on meals table
DROP TRIGGER IF EXISTS check_couple_verification_before_meal ON public.meals;
CREATE TRIGGER check_couple_verification_before_meal
  BEFORE INSERT ON public.meals
  FOR EACH ROW
  EXECUTE FUNCTION public.check_couple_verification_for_meal();

-- Create trigger function to block booking confirmation for unverified couples
CREATE OR REPLACE FUNCTION public.check_couple_verification_for_booking()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  v_chef_id uuid;
  v_is_couple boolean;
  v_verification_status verification_status;
  v_partner_verification_status verification_status;
BEGIN
  -- Only check when status changes to 'confirmed'
  IF NEW.status = 'confirmed' AND (OLD.status IS NULL OR OLD.status != 'confirmed') THEN
    -- Get chef_id from meal
    SELECT chef_id INTO v_chef_id FROM public.meals WHERE id = NEW.meal_id;
    
    -- Get profile verification details
    SELECT is_couple, verification_status, partner_verification_status
    INTO v_is_couple, v_verification_status, v_partner_verification_status
    FROM public.profiles
    WHERE id = v_chef_id;

    -- If couple account, both must be verified
    IF v_is_couple = true THEN
      IF v_verification_status != 'approved' THEN
        RAISE EXCEPTION 'Buchungen können erst bestätigt werden, wenn dein Account verifiziert ist.';
      END IF;
      IF v_partner_verification_status != 'approved' THEN
        RAISE EXCEPTION 'Buchungen können erst bestätigt werden, wenn auch dein Partner verifiziert ist.';
      END IF;
    END IF;
  END IF;

  RETURN NEW;
END;
$function$;

-- Create trigger on bookings table
DROP TRIGGER IF EXISTS check_couple_verification_before_booking_confirm ON public.bookings;
CREATE TRIGGER check_couple_verification_before_booking_confirm
  BEFORE UPDATE ON public.bookings
  FOR EACH ROW
  EXECUTE FUNCTION public.check_couple_verification_for_booking();