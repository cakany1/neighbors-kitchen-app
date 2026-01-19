-- Fix: Remove overly permissive meals policy that exposes exact_address
DROP POLICY IF EXISTS "Public can view meal listings" ON public.meals;

-- Create a more restrictive policy for meals - only chef can see their own meals directly
-- Public access should go through meals_public view which excludes exact_address
CREATE POLICY "Users can view their own meals"
ON public.meals FOR SELECT
TO authenticated
USING (auth.uid() = chef_id);

-- Add RLS to contact_requests to ensure only admins can SELECT
-- (INSERT already works for public, we just need to protect existing data)
CREATE POLICY "Only admins can view contact requests"
ON public.contact_requests FOR SELECT
TO authenticated
USING (public.has_role(auth.uid(), 'admin'));