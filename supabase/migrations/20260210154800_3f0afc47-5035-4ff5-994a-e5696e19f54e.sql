
-- P1.6: Fix chef home address exposure vulnerabilities
-- Must DROP function first to rename parameters

-- ═══════════════════════════════════════════
-- STEP 1: Fix user_can_view_meal_address function
-- ═══════════════════════════════════════════
-- Drop dependent RLS policy first
DROP POLICY IF EXISTS "Users can view meal addresses if authorized" ON public.meals;

-- Drop and recreate function with safe parameter names
DROP FUNCTION IF EXISTS public.user_can_view_meal_address(uuid, uuid);

CREATE FUNCTION public.user_can_view_meal_address(p_meal_id uuid, p_user_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path TO 'public'
AS $$
  SELECT EXISTS (
    SELECT 1 FROM meals WHERE meals.id = p_meal_id AND meals.chef_id = p_user_id
  )
  OR
  EXISTS (
    SELECT 1 FROM bookings 
    WHERE bookings.meal_id = p_meal_id 
      AND bookings.guest_id = p_user_id 
      AND bookings.status = 'confirmed'
  );
$$;

-- Recreate RLS policy using fixed function
CREATE POLICY "Users can view meal addresses if authorized"
  ON public.meals FOR SELECT
  USING (public.user_can_view_meal_address(id, auth.uid()));

-- ═══════════════════════════════════════════
-- STEP 2: Lock down meals base table
-- ═══════════════════════════════════════════
DROP POLICY IF EXISTS "Anyone can view public meals" ON public.meals;

-- ═══════════════════════════════════════════
-- STEP 3: Recreate meals_public WITHOUT security_invoker
-- ═══════════════════════════════════════════
DROP VIEW IF EXISTS public.meals_public;
CREATE VIEW public.meals_public AS
SELECT 
    m.id, m.title, m.title_en, m.description, m.description_en, m.image_url,
    m.chef_id, m.fuzzy_lat, m.fuzzy_lng, m.neighborhood, m.tags, m.allergens,
    m.available_portions, m.pricing_minimum, m.pricing_suggested,
    m.restaurant_reference_price, m.estimated_restaurant_value,
    m.exchange_mode, m.handover_mode, m.collection_window_start,
    m.collection_window_end, m.arrival_time, m.max_seats, m.booked_seats,
    m.unit_type, m.barter_requests, m.ingredients, m.is_stock_photo,
    m.women_only, m.is_cooking_experience, m.visibility_mode,
    m.visibility_radius, m.scheduled_date, m.created_at, m.updated_at,
    m.address_id
FROM meals m
JOIN profiles p ON m.chef_id = p.id
WHERE (m.visibility_mode = 'all' OR m.visibility_mode IS NULL)
  AND (p.vacation_mode IS NULL OR p.vacation_mode = false)
  AND p.is_disabled = false;

GRANT SELECT ON public.meals_public TO anon, authenticated;

-- ═══════════════════════════════════════════
-- STEP 4: Lock down profiles base table
-- ═══════════════════════════════════════════
DROP POLICY IF EXISTS "Authenticated users can view non-disabled profiles" ON public.profiles;

-- ═══════════════════════════════════════════
-- STEP 5: Recreate profiles_public WITHOUT security_invoker
-- ═══════════════════════════════════════════
DROP VIEW IF EXISTS public.profiles_public;
CREATE VIEW public.profiles_public AS
SELECT 
    id,
    CASE WHEN display_real_name = true THEN first_name ELSE NULL::text END AS first_name,
    CASE WHEN display_real_name = true THEN last_name ELSE NULL::text END AS last_name,
    nickname, avatar_url, karma, display_real_name, is_couple,
    CASE WHEN display_real_name = true THEN age ELSE NULL::integer END AS age,
    verification_status, id_verified, phone_verified, vacation_mode,
    notification_radius, successful_pickups, no_shows, created_at, updated_at,
    partner_photo_url, partner_name, partner_gender, partner_verification_status,
    gender, languages, allergens, dislikes, visibility_mode, role
FROM profiles
WHERE is_disabled = false;

GRANT SELECT ON public.profiles_public TO anon, authenticated;
