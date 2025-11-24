-- Add avatar_url column to profiles table for main user profile photo
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS avatar_url TEXT;