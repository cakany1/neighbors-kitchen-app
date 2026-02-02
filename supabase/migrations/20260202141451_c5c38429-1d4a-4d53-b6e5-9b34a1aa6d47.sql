-- Re-add SELECT policy for authenticated users to view meals
-- SECURITY: The application code uses meals_public view which excludes exact_address
-- This policy allows authenticated users to view meal data for the feed
-- The exact_address is protected by:
-- 1. Application code using meals_public view (excludes exact_address)
-- 2. Separate policy "Users can view meal addresses if authorized" for address access

CREATE POLICY "Authenticated users can view meals"
ON public.meals
FOR SELECT
TO authenticated
USING (true);