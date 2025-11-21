-- Create verification status enum
CREATE TYPE public.verification_status AS ENUM ('pending', 'approved', 'rejected');

-- Add verification and partner fields to profiles table
ALTER TABLE public.profiles
ADD COLUMN verification_status public.verification_status NOT NULL DEFAULT 'pending',
ADD COLUMN partner_photo_url text,
ADD COLUMN partner_name text,
ADD COLUMN partner_gender text;