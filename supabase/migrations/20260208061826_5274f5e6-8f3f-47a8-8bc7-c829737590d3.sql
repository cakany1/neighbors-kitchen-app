
-- Add rating completion flags to bookings table
ALTER TABLE public.bookings 
ADD COLUMN IF NOT EXISTS chef_rated BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS guest_rated BOOLEAN DEFAULT false;

-- Create function to update rating flags when a rating is submitted
CREATE OR REPLACE FUNCTION public.update_booking_rating_flags()
RETURNS TRIGGER AS $$
DECLARE
  v_booking_id UUID;
  v_guest_id UUID;
  v_chef_id UUID;
  v_rater_id UUID;
BEGIN
  v_booking_id := NEW.booking_id;
  v_rater_id := NEW.rater_id;
  
  -- Get booking details
  SELECT b.guest_id, m.chef_id 
  INTO v_guest_id, v_chef_id
  FROM bookings b
  JOIN meals m ON b.meal_id = m.id
  WHERE b.id = v_booking_id;
  
  -- Update the appropriate flag based on who is rating
  IF v_rater_id = v_guest_id THEN
    UPDATE bookings SET guest_rated = true WHERE id = v_booking_id;
  ELSIF v_rater_id = v_chef_id THEN
    UPDATE bookings SET chef_rated = true WHERE id = v_booking_id;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Create trigger to auto-update flags on rating insert
DROP TRIGGER IF EXISTS update_rating_flags_trigger ON ratings;
CREATE TRIGGER update_rating_flags_trigger
AFTER INSERT ON public.ratings
FOR EACH ROW
EXECUTE FUNCTION public.update_booking_rating_flags();

-- Update existing RLS policy to enforce mutual rating visibility
DROP POLICY IF EXISTS "Users can view ratings where both parties rated" ON public.ratings;
CREATE POLICY "Users can view ratings where both parties rated" 
ON public.ratings FOR SELECT
USING (
  -- Admins see all
  has_role(auth.uid(), 'admin'::app_role) 
  -- Rater always sees their own rating
  OR rater_id = auth.uid() 
  -- Rated user sees rating only if BOTH have rated
  OR (
    rated_user_id = auth.uid() 
    AND EXISTS (
      SELECT 1 FROM bookings b 
      WHERE b.id = ratings.booking_id 
      AND b.chef_rated = true 
      AND b.guest_rated = true
    )
  )
  -- Third parties see only after both rated OR after 14 days
  OR (
    EXISTS (
      SELECT 1 FROM bookings b 
      WHERE b.id = ratings.booking_id 
      AND b.chef_rated = true 
      AND b.guest_rated = true
    )
  )
  OR (created_at < (now() - '14 days'::interval))
);

-- Update profile_ratings view to only count ratings where both parties rated
DROP VIEW IF EXISTS public.profile_ratings;
CREATE VIEW public.profile_ratings WITH (security_invoker = false) AS
SELECT 
  p.id as user_id,
  -- Chef ratings (when user was the chef, only count if both rated)
  COALESCE(chef_stats.total_ratings, 0) as chef_total,
  COALESCE(chef_stats.avg_rating, 0) as chef_avg,
  COALESCE(chef_stats.stars_5, 0) as chef_stars_5,
  COALESCE(chef_stats.stars_4, 0) as chef_stars_4,
  COALESCE(chef_stats.stars_3, 0) as chef_stars_3,
  COALESCE(chef_stats.stars_2, 0) as chef_stars_2,
  COALESCE(chef_stats.stars_1, 0) as chef_stars_1,
  -- Guest ratings (when user was the guest, only count if both rated)
  COALESCE(guest_stats.total_ratings, 0) as guest_total,
  COALESCE(guest_stats.avg_rating, 0) as guest_avg,
  COALESCE(guest_stats.stars_5, 0) as guest_stars_5,
  COALESCE(guest_stats.stars_4, 0) as guest_stars_4,
  COALESCE(guest_stats.stars_3, 0) as guest_stars_3,
  COALESCE(guest_stats.stars_2, 0) as guest_stars_2,
  COALESCE(guest_stats.stars_1, 0) as guest_stars_1
FROM profiles p
LEFT JOIN (
  -- Chef rating stats: ratings received as chef, only where both parties rated
  SELECT 
    m.chef_id as user_id,
    COUNT(*) as total_ratings,
    ROUND(AVG(r.stars)::numeric, 1) as avg_rating,
    COUNT(*) FILTER (WHERE r.stars = 5) as stars_5,
    COUNT(*) FILTER (WHERE r.stars = 4) as stars_4,
    COUNT(*) FILTER (WHERE r.stars = 3) as stars_3,
    COUNT(*) FILTER (WHERE r.stars = 2) as stars_2,
    COUNT(*) FILTER (WHERE r.stars = 1) as stars_1
  FROM ratings r
  JOIN bookings b ON r.booking_id = b.id
  JOIN meals m ON b.meal_id = m.id
  WHERE r.rated_user_id = m.chef_id
    AND b.chef_rated = true
    AND b.guest_rated = true
  GROUP BY m.chef_id
) chef_stats ON chef_stats.user_id = p.id
LEFT JOIN (
  -- Guest rating stats: ratings received as guest, only where both parties rated
  SELECT 
    b.guest_id as user_id,
    COUNT(*) as total_ratings,
    ROUND(AVG(r.stars)::numeric, 1) as avg_rating,
    COUNT(*) FILTER (WHERE r.stars = 5) as stars_5,
    COUNT(*) FILTER (WHERE r.stars = 4) as stars_4,
    COUNT(*) FILTER (WHERE r.stars = 3) as stars_3,
    COUNT(*) FILTER (WHERE r.stars = 2) as stars_2,
    COUNT(*) FILTER (WHERE r.stars = 1) as stars_1
  FROM ratings r
  JOIN bookings b ON r.booking_id = b.id
  WHERE r.rated_user_id = b.guest_id
    AND b.chef_rated = true
    AND b.guest_rated = true
  GROUP BY b.guest_id
) guest_stats ON guest_stats.user_id = p.id;

-- Also update chef_rating_summary view
DROP VIEW IF EXISTS public.chef_rating_summary;
CREATE VIEW public.chef_rating_summary WITH (security_invoker = false) AS
SELECT 
  m.chef_id as user_id,
  COUNT(*) as total_ratings,
  ROUND(AVG(r.stars)::numeric, 1) as avg_rating,
  COUNT(*) FILTER (WHERE r.stars = 5) as stars_5,
  COUNT(*) FILTER (WHERE r.stars = 4) as stars_4,
  COUNT(*) FILTER (WHERE r.stars = 3) as stars_3,
  COUNT(*) FILTER (WHERE r.stars = 2) as stars_2,
  COUNT(*) FILTER (WHERE r.stars = 1) as stars_1
FROM ratings r
JOIN bookings b ON r.booking_id = b.id
JOIN meals m ON b.meal_id = m.id
WHERE r.rated_user_id = m.chef_id
  AND b.chef_rated = true
  AND b.guest_rated = true
GROUP BY m.chef_id;

-- Also update guest_rating_summary view
DROP VIEW IF EXISTS public.guest_rating_summary;
CREATE VIEW public.guest_rating_summary WITH (security_invoker = false) AS
SELECT 
  b.guest_id as user_id,
  COUNT(*) as total_ratings,
  ROUND(AVG(r.stars)::numeric, 1) as avg_rating,
  COUNT(*) FILTER (WHERE r.stars = 5) as stars_5,
  COUNT(*) FILTER (WHERE r.stars = 4) as stars_4,
  COUNT(*) FILTER (WHERE r.stars = 3) as stars_3,
  COUNT(*) FILTER (WHERE r.stars = 2) as stars_2,
  COUNT(*) FILTER (WHERE r.stars = 1) as stars_1
FROM ratings r
JOIN bookings b ON r.booking_id = b.id
WHERE r.rated_user_id = b.guest_id
  AND b.chef_rated = true
  AND b.guest_rated = true
GROUP BY b.guest_id;

-- Update user_rating_summary view
DROP VIEW IF EXISTS public.user_rating_summary;
CREATE VIEW public.user_rating_summary WITH (security_invoker = false) AS
SELECT 
  r.rated_user_id as user_id,
  COUNT(*) as total_ratings,
  ROUND(AVG(r.stars)::numeric, 1) as avg_rating,
  COUNT(*) FILTER (WHERE r.stars >= 4) as positive_ratings,
  COUNT(*) FILTER (WHERE r.stars <= 2) as negative_ratings
FROM ratings r
JOIN bookings b ON r.booking_id = b.id
WHERE b.chef_rated = true
  AND b.guest_rated = true
GROUP BY r.rated_user_id;

-- Grant access to views
GRANT SELECT ON public.profile_ratings TO authenticated, anon;
GRANT SELECT ON public.chef_rating_summary TO authenticated, anon;
GRANT SELECT ON public.guest_rating_summary TO authenticated, anon;
GRANT SELECT ON public.user_rating_summary TO authenticated, anon;
