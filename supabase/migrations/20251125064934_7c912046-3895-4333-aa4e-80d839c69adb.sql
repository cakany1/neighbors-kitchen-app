-- Fix infinite recursion in meals RLS policies
-- The issue is that "Chefs view own meal addresses" and "Guests view address after booking confirmed" 
-- policies are causing recursion when querying meals that reference meals

-- Drop the problematic policies
DROP POLICY IF EXISTS "Chefs view own meal addresses" ON public.meals;
DROP POLICY IF EXISTS "Guests view address after booking confirmed" ON public.meals;

-- Recreate them without recursion by using a security definer function
CREATE OR REPLACE FUNCTION public.user_can_view_meal_address(meal_id uuid, user_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  -- Chef can always view their own meal addresses
  SELECT EXISTS (
    SELECT 1 FROM meals WHERE id = meal_id AND chef_id = user_id
  )
  OR
  -- Guest can view address if they have a confirmed booking
  EXISTS (
    SELECT 1 FROM bookings 
    WHERE meal_id = meal_id 
      AND guest_id = user_id 
      AND status = 'confirmed'
  );
$$;

-- Add the new safe policies
CREATE POLICY "Users can view meal addresses if authorized"
ON public.meals
FOR SELECT
USING (public.user_can_view_meal_address(id, auth.uid()));

-- Add translation columns to meals table
ALTER TABLE public.meals
  ADD COLUMN IF NOT EXISTS title_en text,
  ADD COLUMN IF NOT EXISTS description_en text;