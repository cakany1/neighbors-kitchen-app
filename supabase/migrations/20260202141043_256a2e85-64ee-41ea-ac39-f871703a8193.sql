-- SECURITY FIX: Remove overly permissive RLS policy that exposes exact_address
-- The policy "Users can view public meal data" with USING (true) allows any authenticated 
-- user to query exact_address directly via DevTools, bypassing application-level protection.

-- Drop the problematic policy
DROP POLICY IF EXISTS "Users can view public meal data" ON public.meals;

-- The following policies remain in place:
-- - "Users can view their own meals" - chef can see their own meals
-- - "Users can view meal addresses if authorized" - user_can_view_meal_address() checks confirmed booking
-- - CRUD policies for meal owners

-- Application code will be updated to query meals_public view for listings
-- which already excludes exact_address column