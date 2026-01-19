-- Drop the overly permissive public SELECT policy on profiles
DROP POLICY IF EXISTS "Public profiles viewable" ON public.profiles;

-- Drop duplicate INSERT policies (keep only one)
DROP POLICY IF EXISTS "Users can insert their own profile" ON public.profiles;

-- Drop duplicate UPDATE policies (keep only one)  
DROP POLICY IF EXISTS "Users can update their own profile" ON public.profiles;

-- Add admin SELECT policy for profiles (for verification queue)
DROP POLICY IF EXISTS "Admins can view all profiles" ON public.profiles;
CREATE POLICY "Admins can view all profiles"
ON public.profiles
FOR SELECT
TO authenticated
USING (public.has_role(auth.uid(), 'admin'));