-- Create a secure public view for non-sensitive profile data
-- This view excludes: phone_number, private_address, private_city, private_postal_code, 
-- iban, id_document_url, latitude, longitude
CREATE OR REPLACE VIEW public.profiles_public
WITH (security_invoker = on)
AS SELECT 
  id,
  first_name,
  last_name,
  nickname,
  display_real_name,
  avatar_url,
  partner_photo_url,
  partner_name,
  partner_gender,
  is_couple,
  gender,
  karma,
  languages,
  allergens,
  dislikes,
  age,
  verification_status,
  id_verified,
  phone_verified,
  visibility_mode,
  vacation_mode,
  role,
  notification_radius,
  created_at,
  updated_at
FROM public.profiles;

-- Grant access to the public view
GRANT SELECT ON public.profiles_public TO anon, authenticated;