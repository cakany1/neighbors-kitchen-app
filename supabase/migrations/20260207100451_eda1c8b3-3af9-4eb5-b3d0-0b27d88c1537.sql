-- Add photo verification columns to profiles table
-- This is separate from ID document verification - it's for profile photo verification

ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS photo_verified boolean DEFAULT false;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS partner_photo_verified boolean DEFAULT false;

-- Note: partner_id_document_url already exists from previous migration

-- Create trigger function to validate photo verification for women-only meals
CREATE OR REPLACE FUNCTION public.check_photo_verification_for_women_only_meal()
RETURNS TRIGGER AS $$
DECLARE
  v_is_couple boolean;
  v_photo_verified boolean;
  v_partner_photo_verified boolean;
BEGIN
  -- Only check for women_only visibility mode
  IF NEW.visibility_mode != 'women_only' THEN
    RETURN NEW;
  END IF;

  -- Get profile details for the chef
  SELECT is_couple, photo_verified, partner_photo_verified
  INTO v_is_couple, v_photo_verified, v_partner_photo_verified
  FROM public.profiles 
  WHERE id = NEW.chef_id;

  -- Check primary user's photo verified
  IF NOT COALESCE(v_photo_verified, false) THEN
    RAISE EXCEPTION 'Für Women-Only Gerichte muss dein Profilfoto verifiziert sein.';
  END IF;

  -- If couple, check partner photo verified
  IF COALESCE(v_is_couple, false) AND NOT COALESCE(v_partner_photo_verified, false) THEN
    RAISE EXCEPTION 'Für Women-Only Gerichte muss auch das Profilbild deiner Partnerin verifiziert sein.';
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = 'public';

-- Create trigger for photo verification check on meal insert/update
DROP TRIGGER IF EXISTS check_photo_verification_before_meal ON public.meals;
CREATE TRIGGER check_photo_verification_before_meal
  BEFORE INSERT OR UPDATE ON public.meals
  FOR EACH ROW
  EXECUTE FUNCTION public.check_photo_verification_for_women_only_meal();

-- Add comment for documentation
COMMENT ON COLUMN public.profiles.photo_verified IS 'Whether the user profile photo has been verified by admin (required for women-only meals)';
COMMENT ON COLUMN public.profiles.partner_photo_verified IS 'Whether the partner profile photo has been verified by admin (required for couples offering women-only meals)';