
-- =====================================================
-- FIX: Create missing trigger for rating flag updates
-- =====================================================

-- The function update_booking_rating_flags() exists but the trigger was never created!
-- This trigger updates chef_rated/guest_rated flags when a rating is submitted

CREATE TRIGGER update_booking_rating_flags_trigger
AFTER INSERT ON public.ratings
FOR EACH ROW
EXECUTE FUNCTION public.update_booking_rating_flags();

-- Verify: Also ensure the rating summary views only show mutual ratings
-- (Already fixed in previous migration with security_invoker=on)
