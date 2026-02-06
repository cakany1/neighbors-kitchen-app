-- Add last_payout_at column to profiles to track when last payout was made
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS last_payout_at timestamptz DEFAULT NULL;

-- Add comment for clarity
COMMENT ON COLUMN public.profiles.last_payout_at IS 'Timestamp of when the last payout was made to this user';