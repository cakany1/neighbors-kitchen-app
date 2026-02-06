-- Drop and recreate profile_ratings view with SECURITY DEFINER to bypass RLS recursion
DROP VIEW IF EXISTS public.profile_ratings;

CREATE OR REPLACE VIEW public.profile_ratings
WITH (security_invoker = false)
AS
SELECT 
    p.id AS user_id,
    -- Chef ratings (when user is the chef who got rated)
    COALESCE(c.total_ratings, 0) AS chef_total,
    COALESCE(c.avg_rating, 0) AS chef_avg,
    COALESCE(c.stars_5, 0) AS chef_stars_5,
    COALESCE(c.stars_4, 0) AS chef_stars_4,
    COALESCE(c.stars_3, 0) AS chef_stars_3,
    COALESCE(c.stars_2, 0) AS chef_stars_2,
    COALESCE(c.stars_1, 0) AS chef_stars_1,
    -- Guest ratings (when user is the guest who got rated)
    COALESCE(g.total_ratings, 0) AS guest_total,
    COALESCE(g.avg_rating, 0) AS guest_avg,
    COALESCE(g.stars_5, 0) AS guest_stars_5,
    COALESCE(g.stars_4, 0) AS guest_stars_4,
    COALESCE(g.stars_3, 0) AS guest_stars_3,
    COALESCE(g.stars_2, 0) AS guest_stars_2,
    COALESCE(g.stars_1, 0) AS guest_stars_1
FROM public.profiles p
LEFT JOIN public.chef_rating_summary c ON c.user_id = p.id
LEFT JOIN public.guest_rating_summary g ON g.user_id = p.id;

-- Grant SELECT to authenticated and anon so ratings are publicly visible
GRANT SELECT ON public.profile_ratings TO authenticated;
GRANT SELECT ON public.profile_ratings TO anon;