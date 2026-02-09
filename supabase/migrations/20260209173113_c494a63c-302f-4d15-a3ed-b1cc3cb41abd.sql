
-- Trigger function: auto-approve partner_verification_status when partner_photo_verified is set to true
CREATE OR REPLACE FUNCTION public.auto_approve_partner_on_photo_verified()
RETURNS TRIGGER AS $$
BEGIN
  -- When partner_photo_verified changes from false/null to true, auto-approve partner status
  IF NEW.partner_photo_verified = true AND (OLD.partner_photo_verified IS NULL OR OLD.partner_photo_verified = false) THEN
    NEW.partner_verification_status := 'approved';
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

-- Drop existing trigger if it exists
DROP TRIGGER IF EXISTS trg_auto_approve_partner_on_photo ON public.profiles;

-- Create the trigger
CREATE TRIGGER trg_auto_approve_partner_on_photo
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.auto_approve_partner_on_photo_verified();
