-- Drop and recreate profiles_public view to include reliability tracking columns
DROP VIEW IF EXISTS public.profiles_public;

CREATE VIEW public.profiles_public AS
SELECT 
  id,
  first_name,
  last_name,
  nickname,
  avatar_url,
  partner_photo_url,
  partner_name,
  partner_gender,
  karma,
  display_real_name,
  is_couple,
  age,
  gender,
  languages,
  allergens,
  dislikes,
  verification_status,
  id_verified,
  phone_verified,
  vacation_mode,
  visibility_mode,
  notification_radius,
  role,
  successful_pickups,
  no_shows,
  created_at,
  updated_at
FROM public.profiles;