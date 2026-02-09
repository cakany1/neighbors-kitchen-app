
-- =====================================================
-- SECURITY AUDIT FIX: Protect PII from public access
-- =====================================================

-- STEP 1: Drop the overly permissive policy on profiles
-- This policy currently allows anonymous access to ALL columns!
DROP POLICY IF EXISTS "Anyone can view public profile fields" ON public.profiles;

-- STEP 2: Create a more restrictive policy
-- Authenticated users can view non-disabled profiles (but columns are controlled by the view)
-- The view profiles_public already filters sensitive columns
CREATE POLICY "Authenticated users can view non-disabled profiles"
ON public.profiles FOR SELECT
TO authenticated
USING (is_disabled = false);

-- STEP 3: Recreate rating views with security_invoker=on
-- These views currently bypass RLS which is a security risk

-- chef_rating_summary
DROP VIEW IF EXISTS public.chef_rating_summary;
CREATE VIEW public.chef_rating_summary
WITH (security_invoker=on) AS
SELECT 
    m.chef_id AS user_id,
    count(*) AS total_ratings,
    round(avg(r.stars), 1) AS avg_rating,
    count(*) FILTER (WHERE r.stars = 5) AS stars_5,
    count(*) FILTER (WHERE r.stars = 4) AS stars_4,
    count(*) FILTER (WHERE r.stars = 3) AS stars_3,
    count(*) FILTER (WHERE r.stars = 2) AS stars_2,
    count(*) FILTER (WHERE r.stars = 1) AS stars_1
FROM ratings r
JOIN bookings b ON r.booking_id = b.id
JOIN meals m ON b.meal_id = m.id
WHERE r.rated_user_id = m.chef_id 
    AND b.chef_rated = true 
    AND b.guest_rated = true
GROUP BY m.chef_id;

-- guest_rating_summary
DROP VIEW IF EXISTS public.guest_rating_summary;
CREATE VIEW public.guest_rating_summary
WITH (security_invoker=on) AS
SELECT 
    b.guest_id AS user_id,
    count(*) AS total_ratings,
    round(avg(r.stars), 1) AS avg_rating,
    count(*) FILTER (WHERE r.stars = 5) AS stars_5,
    count(*) FILTER (WHERE r.stars = 4) AS stars_4,
    count(*) FILTER (WHERE r.stars = 3) AS stars_3,
    count(*) FILTER (WHERE r.stars = 2) AS stars_2,
    count(*) FILTER (WHERE r.stars = 1) AS stars_1
FROM ratings r
JOIN bookings b ON r.booking_id = b.id
WHERE r.rated_user_id = b.guest_id 
    AND b.chef_rated = true 
    AND b.guest_rated = true
GROUP BY b.guest_id;

-- user_rating_summary
DROP VIEW IF EXISTS public.user_rating_summary;
CREATE VIEW public.user_rating_summary
WITH (security_invoker=on) AS
SELECT 
    r.rated_user_id AS user_id,
    count(*) AS total_ratings,
    round(avg(r.stars), 1) AS avg_rating,
    count(*) FILTER (WHERE r.stars >= 4) AS positive_ratings,
    count(*) FILTER (WHERE r.stars <= 2) AS negative_ratings
FROM ratings r
JOIN bookings b ON r.booking_id = b.id
WHERE b.chef_rated = true AND b.guest_rated = true
GROUP BY r.rated_user_id;

-- profile_ratings (depends on chef/guest rating summaries, so we recreate it)
DROP VIEW IF EXISTS public.profile_ratings;
CREATE VIEW public.profile_ratings
WITH (security_invoker=on) AS
SELECT 
    p.id AS user_id,
    COALESCE(chef_stats.total_ratings, 0::bigint) AS chef_total,
    COALESCE(chef_stats.avg_rating, 0::numeric) AS chef_avg,
    COALESCE(chef_stats.stars_5, 0::bigint) AS chef_stars_5,
    COALESCE(chef_stats.stars_4, 0::bigint) AS chef_stars_4,
    COALESCE(chef_stats.stars_3, 0::bigint) AS chef_stars_3,
    COALESCE(chef_stats.stars_2, 0::bigint) AS chef_stars_2,
    COALESCE(chef_stats.stars_1, 0::bigint) AS chef_stars_1,
    COALESCE(guest_stats.total_ratings, 0::bigint) AS guest_total,
    COALESCE(guest_stats.avg_rating, 0::numeric) AS guest_avg,
    COALESCE(guest_stats.stars_5, 0::bigint) AS guest_stars_5,
    COALESCE(guest_stats.stars_4, 0::bigint) AS guest_stars_4,
    COALESCE(guest_stats.stars_3, 0::bigint) AS guest_stars_3,
    COALESCE(guest_stats.stars_2, 0::bigint) AS guest_stars_2,
    COALESCE(guest_stats.stars_1, 0::bigint) AS guest_stars_1
FROM profiles p
LEFT JOIN (
    SELECT 
        m.chef_id AS user_id,
        count(*) AS total_ratings,
        round(avg(r.stars), 1) AS avg_rating,
        count(*) FILTER (WHERE r.stars = 5) AS stars_5,
        count(*) FILTER (WHERE r.stars = 4) AS stars_4,
        count(*) FILTER (WHERE r.stars = 3) AS stars_3,
        count(*) FILTER (WHERE r.stars = 2) AS stars_2,
        count(*) FILTER (WHERE r.stars = 1) AS stars_1
    FROM ratings r
    JOIN bookings b ON r.booking_id = b.id
    JOIN meals m ON b.meal_id = m.id
    WHERE r.rated_user_id = m.chef_id 
        AND b.chef_rated = true 
        AND b.guest_rated = true
    GROUP BY m.chef_id
) chef_stats ON p.id = chef_stats.user_id
LEFT JOIN (
    SELECT 
        b.guest_id AS user_id,
        count(*) AS total_ratings,
        round(avg(r.stars), 1) AS avg_rating,
        count(*) FILTER (WHERE r.stars = 5) AS stars_5,
        count(*) FILTER (WHERE r.stars = 4) AS stars_4,
        count(*) FILTER (WHERE r.stars = 3) AS stars_3,
        count(*) FILTER (WHERE r.stars = 2) AS stars_2,
        count(*) FILTER (WHERE r.stars = 1) AS stars_1
    FROM ratings r
    JOIN bookings b ON r.booking_id = b.id
    WHERE r.rated_user_id = b.guest_id 
        AND b.chef_rated = true 
        AND b.guest_rated = true
    GROUP BY b.guest_id
) guest_stats ON p.id = guest_stats.user_id;

-- admin_reads_summary - already protected by RLS on admin_reads but let's make it invoker too
DROP VIEW IF EXISTS public.admin_reads_summary;
CREATE VIEW public.admin_reads_summary
WITH (security_invoker=on) AS
SELECT 
    ar.id,
    ar.admin_id,
    ap.first_name AS admin_first_name,
    ap.last_name AS admin_last_name,
    ar.target_user_id,
    tp.first_name AS target_first_name,
    tp.last_name AS target_last_name,
    ar.action,
    array_length(ar.fields_accessed, 1) AS fields_count,
    ar.context,
    ar.created_at,
    ar.notes
FROM admin_reads ar
JOIN profiles ap ON ar.admin_id = ap.id
JOIN profiles tp ON ar.target_user_id = tp.id
ORDER BY ar.created_at DESC;

-- STEP 4: Grant SELECT on views to authenticated and anon roles
-- Rating views should be publicly readable (aggregated data, no PII)
GRANT SELECT ON public.chef_rating_summary TO authenticated, anon;
GRANT SELECT ON public.guest_rating_summary TO authenticated, anon;
GRANT SELECT ON public.user_rating_summary TO authenticated, anon;
GRANT SELECT ON public.profile_ratings TO authenticated, anon;
GRANT SELECT ON public.admin_reads_summary TO authenticated;
