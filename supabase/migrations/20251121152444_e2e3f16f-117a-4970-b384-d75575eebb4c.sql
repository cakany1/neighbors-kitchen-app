-- Add payout_status column to bookings table
ALTER TABLE public.bookings 
ADD COLUMN payout_status TEXT DEFAULT 'pending' CHECK (payout_status IN ('pending', 'accumulating', 'requested', 'paid'));

-- Add IBAN field to profiles table for payout destination
ALTER TABLE public.profiles 
ADD COLUMN iban TEXT;

-- Create index for faster wallet queries
CREATE INDEX idx_bookings_payout_status ON public.bookings(payout_status);
CREATE INDEX idx_bookings_chef_payout ON public.bookings(meal_id, payout_status);

-- Create a function to automatically update payout_status when booking is completed
CREATE OR REPLACE FUNCTION public.auto_accumulate_payout()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $$
BEGIN
  -- When booking status changes to 'completed', set payout_status to 'accumulating'
  IF NEW.status = 'completed' AND OLD.status != 'completed' THEN
    NEW.payout_status := 'accumulating';
  END IF;
  RETURN NEW;
END;
$$;

-- Create trigger on bookings table
CREATE TRIGGER trigger_auto_accumulate_payout
BEFORE UPDATE ON public.bookings
FOR EACH ROW
EXECUTE FUNCTION public.auto_accumulate_payout();