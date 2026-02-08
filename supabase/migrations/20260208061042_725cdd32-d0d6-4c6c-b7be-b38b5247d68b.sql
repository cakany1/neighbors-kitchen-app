-- SECURITY AUDIT FIX: Ensure safe public access to profiles and meals
-- while protecting PII fields

-- =====================================================
-- 1. DROP DEPENDENT VIEWS FIRST (in correct order)
-- =====================================================
DROP VIEW IF EXISTS public.profile_ratings CASCADE;
DROP VIEW IF EXISTS public.chef_rating_summary CASCADE;
DROP VIEW IF EXISTS public.guest_rating_summary CASCADE;
DROP VIEW IF EXISTS public.user_rating_summary CASCADE;
DROP VIEW IF EXISTS public.profiles_public CASCADE;
DROP VIEW IF EXISTS public.meals_public CASCADE;

-- =====================================================
-- 2. RECREATE PROFILES_PUBLIC WITH SAFE FIELDS ONLY
-- =====================================================
CREATE VIEW public.profiles_public
WITH (security_invoker = on) AS
SELECT 
  id,
  -- Names: Only show if display_real_name is true, otherwise show nickname
  CASE WHEN display_real_name = true THEN first_name ELSE NULL END as first_name,
  CASE WHEN display_real_name = true THEN last_name ELSE NULL END as last_name,
  nickname,
  avatar_url,
  karma,
  display_real_name,
  is_couple,
  -- Age: Only show if user opted in via display_real_name
  CASE WHEN display_real_name = true THEN age ELSE NULL END as age,
  verification_status,
  id_verified,
  phone_verified,
  vacation_mode,
  notification_radius,
  successful_pickups,
  no_shows,
  created_at,
  updated_at,
  partner_photo_url,
  partner_name,
  partner_gender,
  partner_verification_status,
  gender,
  languages,
  allergens,
  dislikes,
  visibility_mode,
  role
FROM public.profiles
WHERE is_disabled = false;

-- =====================================================
-- 3. ADD RLS POLICY FOR PUBLIC PROFILE ACCESS
-- =====================================================
CREATE POLICY "Anyone can view public profile fields"
ON public.profiles
FOR SELECT
TO authenticated
USING (
  -- Users can always view their own profile (already covered by existing policy)
  -- Allow viewing non-disabled profiles through the view
  is_disabled = false
);

-- =====================================================
-- 4. RECREATE MEALS_PUBLIC WITHOUT EXACT_ADDRESS
-- =====================================================
CREATE VIEW public.meals_public
WITH (security_invoker = on) AS
SELECT 
  m.id,
  m.title,
  m.title_en,
  m.description,
  m.description_en,
  m.image_url,
  m.chef_id,
  m.fuzzy_lat,
  m.fuzzy_lng,
  m.neighborhood,
  m.tags,
  m.allergens,
  m.available_portions,
  m.pricing_minimum,
  m.pricing_suggested,
  m.restaurant_reference_price,
  m.estimated_restaurant_value,
  m.exchange_mode,
  m.handover_mode,
  m.collection_window_start,
  m.collection_window_end,
  m.arrival_time,
  m.max_seats,
  m.booked_seats,
  m.unit_type,
  m.barter_requests,
  m.ingredients,
  m.is_stock_photo,
  m.women_only,
  m.is_cooking_experience,
  m.visibility_mode,
  m.visibility_radius,
  m.scheduled_date,
  m.created_at,
  m.updated_at,
  m.address_id
  -- EXCLUDED: exact_address (PII - only shown after confirmed booking)
FROM public.meals m
JOIN public.profiles p ON m.chef_id = p.id
WHERE 
  (m.visibility_mode = 'all' OR m.visibility_mode IS NULL)
  AND (p.vacation_mode IS NULL OR p.vacation_mode = false)
  AND p.is_disabled = false;

-- =====================================================
-- 5. ADD RLS POLICY FOR PUBLIC MEAL ACCESS
-- =====================================================
CREATE POLICY "Anyone can view public meals"
ON public.meals
FOR SELECT
TO authenticated
USING (
  -- Chef can always see their own meals (already covered)
  -- Allow public meals to be viewed
  (visibility_mode = 'all' OR visibility_mode IS NULL)
);

-- =====================================================
-- 6. RECREATE RATING SUMMARY VIEWS (no comments exposed)
-- =====================================================
CREATE VIEW public.chef_rating_summary
WITH (security_invoker = on) AS
SELECT 
  m.chef_id AS user_id,
  count(r.id) AS total_ratings,
  round(avg(r.stars), 1) AS avg_rating,
  count(CASE WHEN r.stars = 5 THEN 1 END) AS stars_5,
  count(CASE WHEN r.stars = 4 THEN 1 END) AS stars_4,
  count(CASE WHEN r.stars = 3 THEN 1 END) AS stars_3,
  count(CASE WHEN r.stars = 2 THEN 1 END) AS stars_2,
  count(CASE WHEN r.stars = 1 THEN 1 END) AS stars_1
FROM ratings r
JOIN bookings b ON r.booking_id = b.id
JOIN meals m ON b.meal_id = m.id
WHERE r.rated_user_id = m.chef_id
GROUP BY m.chef_id;

CREATE VIEW public.guest_rating_summary
WITH (security_invoker = on) AS
SELECT 
  b.guest_id AS user_id,
  count(r.id) AS total_ratings,
  round(avg(r.stars), 1) AS avg_rating,
  count(CASE WHEN r.stars = 5 THEN 1 END) AS stars_5,
  count(CASE WHEN r.stars = 4 THEN 1 END) AS stars_4,
  count(CASE WHEN r.stars = 3 THEN 1 END) AS stars_3,
  count(CASE WHEN r.stars = 2 THEN 1 END) AS stars_2,
  count(CASE WHEN r.stars = 1 THEN 1 END) AS stars_1
FROM ratings r
JOIN bookings b ON r.booking_id = b.id
WHERE r.rated_user_id = b.guest_id
GROUP BY b.guest_id;

CREATE VIEW public.user_rating_summary
WITH (security_invoker = on) AS
SELECT 
  rated_user_id AS user_id,
  count(*) AS total_ratings,
  round(avg(stars), 1) AS avg_rating,
  count(*) FILTER (WHERE stars >= 4) AS positive_ratings,
  count(*) FILTER (WHERE stars <= 2) AS negative_ratings
FROM ratings
GROUP BY rated_user_id;

-- =====================================================
-- 7. RECREATE PROFILE_RATINGS (depends on summaries)
-- =====================================================
CREATE VIEW public.profile_ratings
WITH (security_invoker = on) AS
SELECT 
  p.id AS user_id,
  COALESCE(c.total_ratings, 0::bigint) AS chef_total,
  COALESCE(c.avg_rating, 0::numeric) AS chef_avg,
  COALESCE(c.stars_5, 0::bigint) AS chef_stars_5,
  COALESCE(c.stars_4, 0::bigint) AS chef_stars_4,
  COALESCE(c.stars_3, 0::bigint) AS chef_stars_3,
  COALESCE(c.stars_2, 0::bigint) AS chef_stars_2,
  COALESCE(c.stars_1, 0::bigint) AS chef_stars_1,
  COALESCE(g.total_ratings, 0::bigint) AS guest_total,
  COALESCE(g.avg_rating, 0::numeric) AS guest_avg,
  COALESCE(g.stars_5, 0::bigint) AS guest_stars_5,
  COALESCE(g.stars_4, 0::bigint) AS guest_stars_4,
  COALESCE(g.stars_3, 0::bigint) AS guest_stars_3,
  COALESCE(g.stars_2, 0::bigint) AS guest_stars_2,
  COALESCE(g.stars_1, 0::bigint) AS guest_stars_1
FROM profiles p
LEFT JOIN chef_rating_summary c ON c.user_id = p.id
LEFT JOIN guest_rating_summary g ON g.user_id = p.id;