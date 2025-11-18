-- Add guest_composition field to bookings table
ALTER TABLE public.bookings 
ADD COLUMN guest_composition text CHECK (guest_composition IN ('mixed_couple', 'mixed_group', 'women_only', 'men_only', 'diverse_group', 'prefer_not_say'));

COMMENT ON COLUMN public.bookings.guest_composition IS 'Composition of visiting group for safety and comfort purposes';

-- Add verification and private address fields to profiles
ALTER TABLE public.profiles
ADD COLUMN phone_number text,
ADD COLUMN phone_verified boolean DEFAULT false,
ADD COLUMN id_verified boolean DEFAULT false,
ADD COLUMN private_address text,
ADD COLUMN private_city text,
ADD COLUMN private_postal_code text;

COMMENT ON COLUMN public.profiles.phone_number IS 'Phone number for verification purposes';
COMMENT ON COLUMN public.profiles.phone_verified IS 'Phone number verified via SMS';
COMMENT ON COLUMN public.profiles.id_verified IS 'ID document verified by admin';
COMMENT ON COLUMN public.profiles.private_address IS 'Private address, only shown after booking confirmation';

-- Create user roles enum and table
CREATE TYPE public.app_role AS ENUM ('admin', 'moderator', 'user');

CREATE TABLE public.user_roles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  role app_role NOT NULL,
  created_at timestamp with time zone DEFAULT now(),
  UNIQUE (user_id, role)
);

ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

-- Security definer function to check roles (avoids RLS recursion)
CREATE OR REPLACE FUNCTION public.has_role(_user_id uuid, _role app_role)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.user_roles
    WHERE user_id = _user_id
      AND role = _role
  )
$$;

-- RLS policies for user_roles
CREATE POLICY "Users can view their own roles"
ON public.user_roles
FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Admins can view all roles"
ON public.user_roles
FOR SELECT
USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can manage roles"
ON public.user_roles
FOR ALL
USING (public.has_role(auth.uid(), 'admin'));

-- Create blocked_users table
CREATE TABLE public.blocked_users (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  blocker_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  blocked_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  created_at timestamp with time zone DEFAULT now(),
  UNIQUE (blocker_id, blocked_id)
);

ALTER TABLE public.blocked_users ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own blocks"
ON public.blocked_users
FOR SELECT
USING (auth.uid() = blocker_id);

CREATE POLICY "Users can block others"
ON public.blocked_users
FOR INSERT
WITH CHECK (auth.uid() = blocker_id);

CREATE POLICY "Users can unblock others"
ON public.blocked_users
FOR DELETE
USING (auth.uid() = blocker_id);

-- Create reports table
CREATE TABLE public.reports (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  reporter_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  reported_user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  reported_meal_id uuid REFERENCES public.meals(id) ON DELETE CASCADE,
  reason text NOT NULL CHECK (reason IN ('safety_concern', 'harassment', 'fake_profile', 'inappropriate_content', 'spam', 'other')),
  description text,
  status text DEFAULT 'pending' CHECK (status IN ('pending', 'reviewed', 'resolved', 'dismissed')),
  created_at timestamp with time zone DEFAULT now(),
  reviewed_at timestamp with time zone,
  reviewed_by uuid REFERENCES auth.users(id)
);

ALTER TABLE public.reports ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can create reports"
ON public.reports
FOR INSERT
WITH CHECK (auth.uid() = reporter_id);

CREATE POLICY "Users can view their own reports"
ON public.reports
FOR SELECT
USING (auth.uid() = reporter_id);

CREATE POLICY "Admins can view all reports"
ON public.reports
FOR SELECT
USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can update reports"
ON public.reports
FOR UPDATE
USING (public.has_role(auth.uid(), 'admin'));