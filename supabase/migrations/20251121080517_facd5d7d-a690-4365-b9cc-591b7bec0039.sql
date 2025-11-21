-- Add gender field to profiles table
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS gender text 
CHECK (gender IN ('female', 'male', 'diverse', 'prefer_not_to_say'));

-- Add women_only flag to meals table
ALTER TABLE public.meals 
ADD COLUMN IF NOT EXISTS women_only boolean DEFAULT false;

-- Create language_requests table for tracking custom language requests
CREATE TABLE IF NOT EXISTS public.language_requests (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  language_name text NOT NULL,
  requested_by_user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at timestamp with time zone DEFAULT now()
);

-- Enable RLS on language_requests
ALTER TABLE public.language_requests ENABLE ROW LEVEL SECURITY;

-- RLS Policy: Users can insert their own language requests
CREATE POLICY "Users can insert their own language requests"
ON public.language_requests
FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = requested_by_user_id);

-- RLS Policy: Admins can view all language requests
CREATE POLICY "Admins can view all language requests"
ON public.language_requests
FOR SELECT
TO authenticated
USING (public.has_role(auth.uid(), 'admin'));

-- Create index for performance on language aggregation queries
CREATE INDEX IF NOT EXISTS idx_language_requests_language_name 
ON public.language_requests(language_name);

COMMENT ON COLUMN public.profiles.gender IS 'User gender for safety features (e.g., women-only meals)';
COMMENT ON COLUMN public.meals.women_only IS 'When true, only female guests can book this meal';
COMMENT ON TABLE public.language_requests IS 'Tracks user requests for languages not yet supported in the app';