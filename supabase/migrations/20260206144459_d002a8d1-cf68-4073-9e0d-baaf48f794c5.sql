-- Create views to separate chef and guest ratings with distribution

-- View for ratings received as a chef (when someone rated the meal host)
CREATE OR REPLACE VIEW public.chef_rating_summary 
WITH (security_invoker = on) AS
SELECT 
  m.chef_id AS user_id,
  COUNT(r.id) AS total_ratings,
  ROUND(AVG(r.stars)::numeric, 1) AS avg_rating,
  COUNT(CASE WHEN r.stars = 5 THEN 1 END) AS stars_5,
  COUNT(CASE WHEN r.stars = 4 THEN 1 END) AS stars_4,
  COUNT(CASE WHEN r.stars = 3 THEN 1 END) AS stars_3,
  COUNT(CASE WHEN r.stars = 2 THEN 1 END) AS stars_2,
  COUNT(CASE WHEN r.stars = 1 THEN 1 END) AS stars_1
FROM ratings r
JOIN bookings b ON r.booking_id = b.id
JOIN meals m ON b.meal_id = m.id
WHERE r.rated_user_id = m.chef_id
GROUP BY m.chef_id;

-- View for ratings received as a guest (when chef rated the guest)
CREATE OR REPLACE VIEW public.guest_rating_summary 
WITH (security_invoker = on) AS
SELECT 
  b.guest_id AS user_id,
  COUNT(r.id) AS total_ratings,
  ROUND(AVG(r.stars)::numeric, 1) AS avg_rating,
  COUNT(CASE WHEN r.stars = 5 THEN 1 END) AS stars_5,
  COUNT(CASE WHEN r.stars = 4 THEN 1 END) AS stars_4,
  COUNT(CASE WHEN r.stars = 3 THEN 1 END) AS stars_3,
  COUNT(CASE WHEN r.stars = 2 THEN 1 END) AS stars_2,
  COUNT(CASE WHEN r.stars = 1 THEN 1 END) AS stars_1
FROM ratings r
JOIN bookings b ON r.booking_id = b.id
WHERE r.rated_user_id = b.guest_id
GROUP BY b.guest_id;

-- Combined ratings view for public profiles
CREATE OR REPLACE VIEW public.profile_ratings 
WITH (security_invoker = on) AS
SELECT 
  p.id AS user_id,
  COALESCE(c.total_ratings, 0) AS chef_total,
  COALESCE(c.avg_rating, 0) AS chef_avg,
  COALESCE(c.stars_5, 0) AS chef_stars_5,
  COALESCE(c.stars_4, 0) AS chef_stars_4,
  COALESCE(c.stars_3, 0) AS chef_stars_3,
  COALESCE(c.stars_2, 0) AS chef_stars_2,
  COALESCE(c.stars_1, 0) AS chef_stars_1,
  COALESCE(g.total_ratings, 0) AS guest_total,
  COALESCE(g.avg_rating, 0) AS guest_avg,
  COALESCE(g.stars_5, 0) AS guest_stars_5,
  COALESCE(g.stars_4, 0) AS guest_stars_4,
  COALESCE(g.stars_3, 0) AS guest_stars_3,
  COALESCE(g.stars_2, 0) AS guest_stars_2,
  COALESCE(g.stars_1, 0) AS guest_stars_1
FROM profiles p
LEFT JOIN chef_rating_summary c ON p.id = c.user_id
LEFT JOIN guest_rating_summary g ON p.id = g.user_id;