-- ============================================================
-- CRITICAL SECURITY FIX: Remove permissive RLS policy that exposes exact_address
-- This policy allows ANY authenticated user to query ALL meal data including
-- the sensitive exact_address field, bypassing the meals_public view protection.
-- ============================================================

-- Step 1: Drop the vulnerable policy
DROP POLICY IF EXISTS "Authenticated users can view meals" ON public.meals;

-- Step 2: Keep only the authorized access policies:
-- - "Users can view their own meals" (chef sees their own meals)
-- - "Users can view meal addresses if authorized" (confirmed booking guests)
-- The application must now query meals_public view for public meal listings.

-- Step 3: Verify the meals_public view exists and is the correct security boundary
-- (This view excludes exact_address and is already properly configured)

-- IMPORTANT: All frontend code must use meals_public for feed/map queries
-- Only direct meal table access for chef's own meals or authorized bookings