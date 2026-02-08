-- Add referred_by column to track referrals
ALTER TABLE public.profiles 
ADD COLUMN referred_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL;

-- Add referral_rewarded to track if karma was already granted
ALTER TABLE public.profiles 
ADD COLUMN referral_rewarded BOOLEAN DEFAULT FALSE;

-- Create index for faster lookups
CREATE INDEX idx_profiles_referred_by ON public.profiles(referred_by) WHERE referred_by IS NOT NULL;

-- Comment for documentation
COMMENT ON COLUMN public.profiles.referred_by IS 'User ID of the person who referred this user';
COMMENT ON COLUMN public.profiles.referral_rewarded IS 'Whether the referrer has received karma for this referral';