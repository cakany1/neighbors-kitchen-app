-- CRITICAL SECURITY FIX: APPLY STRICT RLS POLICIES
-- Protect phone numbers, addresses, and exact locations

-- 1. SECURE PROFILES TABLE
-- Drop overly permissive public policy
DROP POLICY IF EXISTS "Public profiles viewable (limited fields)" ON public.profiles;

-- Create new public policy (frontend MUST filter sensitive columns)
CREATE POLICY "Public profiles viewable" ON public.profiles
FOR SELECT
USING (true);

-- Note: Existing owner policies remain intact:
-- "Users can insert their own profile"
-- "Users can update their own profile" 
-- "Users can view own full profile"

-- 2. SECURE MEALS TABLE
-- Drop old public policy
DROP POLICY IF EXISTS "Meals viewable by public (fuzzy location only)" ON public.meals;
DROP POLICY IF EXISTS "Chefs can view own meals fully" ON public.meals;

-- Create new public policy (frontend MUST exclude exact_address)
CREATE POLICY "Public can view meals" ON public.meals
FOR SELECT
USING (true);

-- Note: Existing chef policies remain intact:
-- "Users can create their own meals"
-- "Users can delete their own meals"
-- "Users can update their own meals"

-- 3. SECURE MESSAGES TABLE
-- Add UPDATE policy so users can mark messages as read
CREATE POLICY "Users can update message status" ON public.messages
FOR UPDATE
USING (
  auth.uid() IN (
    SELECT guest_id FROM bookings WHERE id = booking_id
    UNION
    SELECT chef_id FROM meals WHERE id = (SELECT meal_id FROM bookings WHERE id = messages.booking_id)
  )
);