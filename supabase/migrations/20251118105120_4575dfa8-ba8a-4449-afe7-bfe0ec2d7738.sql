-- Add gender and couple status to profiles table
ALTER TABLE public.profiles 
ADD COLUMN gender text CHECK (gender IN ('male', 'female')),
ADD COLUMN is_couple boolean DEFAULT false;

-- Add comment to explain the fields
COMMENT ON COLUMN public.profiles.gender IS 'User gender for safety matching (male/female)';
COMMENT ON COLUMN public.profiles.is_couple IS 'Whether user is registering as a couple (affects portion sizes)';