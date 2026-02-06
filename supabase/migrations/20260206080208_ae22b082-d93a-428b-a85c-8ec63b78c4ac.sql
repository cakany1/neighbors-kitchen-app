-- Add rejection tracking fields to profiles table
ALTER TABLE public.profiles
ADD COLUMN IF NOT EXISTS rejection_reason TEXT,
ADD COLUMN IF NOT EXISTS rejection_details TEXT,
ADD COLUMN IF NOT EXISTS rejected_at TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS rejected_by UUID REFERENCES auth.users(id);

-- Add index for faster queries on rejected users
CREATE INDEX IF NOT EXISTS idx_profiles_verification_rejected 
ON public.profiles (verification_status, rejected_at DESC) 
WHERE verification_status = 'rejected';

-- Comment for documentation
COMMENT ON COLUMN public.profiles.rejection_reason IS 'Standardized rejection reason code: blurred_photo, missing_document, incomplete_profile, duplicate_account, other';
COMMENT ON COLUMN public.profiles.rejection_details IS 'Optional free text details for rejection';
COMMENT ON COLUMN public.profiles.rejected_at IS 'Timestamp when verification was rejected';
COMMENT ON COLUMN public.profiles.rejected_by IS 'Admin user ID who rejected the verification';