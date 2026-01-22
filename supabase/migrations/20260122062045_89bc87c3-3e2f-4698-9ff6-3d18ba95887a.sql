-- Add 'no_show' to allowed booking statuses
ALTER TABLE public.bookings DROP CONSTRAINT IF EXISTS bookings_status_check;
ALTER TABLE public.bookings ADD CONSTRAINT bookings_status_check 
  CHECK (status IN ('pending', 'confirmed', 'completed', 'cancelled', 'no_show'));

-- Add reliability tracking columns to profiles
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS successful_pickups INTEGER NOT NULL DEFAULT 0,
ADD COLUMN IF NOT EXISTS no_shows INTEGER NOT NULL DEFAULT 0;

-- Create function to update reliability stats when booking status changes
CREATE OR REPLACE FUNCTION public.update_reliability_on_status_change()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- When booking is completed, increment successful_pickups for guest
  IF NEW.status = 'completed' AND OLD.status != 'completed' THEN
    UPDATE public.profiles
    SET successful_pickups = successful_pickups + 1
    WHERE id = NEW.guest_id;
  END IF;
  
  -- When booking is marked as no_show, increment no_shows and apply karma penalty if > 3
  IF NEW.status = 'no_show' AND OLD.status != 'no_show' THEN
    UPDATE public.profiles
    SET no_shows = no_shows + 1,
        karma = CASE 
          WHEN no_shows >= 3 THEN karma - 10  -- -10 karma after 3rd no-show
          ELSE karma
        END
    WHERE id = NEW.guest_id;
  END IF;
  
  RETURN NEW;
END;
$$;

-- Create trigger for reliability tracking
DROP TRIGGER IF EXISTS trigger_update_reliability ON public.bookings;
CREATE TRIGGER trigger_update_reliability
  AFTER UPDATE OF status ON public.bookings
  FOR EACH ROW
  EXECUTE FUNCTION public.update_reliability_on_status_change();