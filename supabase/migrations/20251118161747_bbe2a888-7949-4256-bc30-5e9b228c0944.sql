-- Add missing columns to profiles table
ALTER TABLE public.profiles
ADD COLUMN IF NOT EXISTS nickname TEXT UNIQUE,
ADD COLUMN IF NOT EXISTS age INTEGER,
ADD COLUMN IF NOT EXISTS vacation_mode BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS notification_radius INTEGER DEFAULT 1000;

-- Change language from TEXT to TEXT[] to support multiple languages
ALTER TABLE public.profiles
DROP COLUMN IF EXISTS language CASCADE;

ALTER TABLE public.profiles
ADD COLUMN languages TEXT[] DEFAULT ARRAY['de']::TEXT[];

-- Add missing columns to meals table
ALTER TABLE public.meals
ADD COLUMN IF NOT EXISTS unit_type TEXT DEFAULT 'portions',
ADD COLUMN IF NOT EXISTS booked_seats INTEGER DEFAULT 0;

-- Create trigger function to increment karma when booking is completed
CREATE OR REPLACE FUNCTION public.increment_karma_on_booking_complete()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Increment guest karma by 10
  UPDATE public.profiles
  SET karma = karma + 10
  WHERE id = NEW.guest_id;
  
  -- Increment chef karma by 10
  UPDATE public.profiles
  SET karma = karma + 10
  WHERE id IN (
    SELECT chef_id FROM public.meals WHERE id = NEW.meal_id
  );
  
  RETURN NEW;
END;
$$;

-- Create trigger to fire on booking status update to 'completed'
DROP TRIGGER IF EXISTS on_booking_completed ON public.bookings;

CREATE TRIGGER on_booking_completed
  AFTER UPDATE OF status ON public.bookings
  FOR EACH ROW
  WHEN (NEW.status = 'completed' AND OLD.status != 'completed')
  EXECUTE FUNCTION public.increment_karma_on_booking_complete();