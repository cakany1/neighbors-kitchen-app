
-- Add address_id column to profiles table (deterministic hash of address)
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS address_id TEXT;

-- Add address_id column to meals table (deterministic hash of address)
ALTER TABLE public.meals ADD COLUMN IF NOT EXISTS address_id TEXT;

-- Create indexes for faster filtering
CREATE INDEX IF NOT EXISTS idx_profiles_address_id ON public.profiles(address_id);
CREATE INDEX IF NOT EXISTS idx_meals_address_id ON public.meals(address_id);
