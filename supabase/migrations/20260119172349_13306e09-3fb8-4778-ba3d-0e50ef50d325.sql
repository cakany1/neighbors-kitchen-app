-- Drop and recreate profiles_public view with security_invoker
DROP VIEW IF EXISTS public.profiles_public;

CREATE VIEW public.profiles_public
WITH (security_invoker = on) AS
SELECT 
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

-- Grant select access to authenticated users
GRANT SELECT ON public.profiles_public TO authenticated;

-- Drop and recreate meals_public view with security_invoker  
DROP VIEW IF EXISTS public.meals_public;

CREATE VIEW public.meals_public
WITH (security_invoker = on) AS
SELECT 
    id,
    title,
    title_en,
    description,
    description_en,
    image_url,
    chef_id,
    fuzzy_lat,
    fuzzy_lng,
    neighborhood,
    tags,
    allergens,
    ingredients,
    available_portions,
    booked_seats,
    max_seats,
    pricing_minimum,
    pricing_suggested,
    estimated_restaurant_value,
    restaurant_reference_price,
    is_cooking_experience,
    is_stock_photo,
    scheduled_date,
    collection_window_start,
    collection_window_end,
    arrival_time,
    handover_mode,
    exchange_mode,
    barter_requests,
    unit_type,
    visibility_mode,
    visibility_radius,
    women_only,
    created_at,
    updated_at
FROM public.meals;

-- Grant select access to authenticated users
GRANT SELECT ON public.meals_public TO authenticated;

-- Add RLS policy for profiles table to allow authenticated users to view public profile data
-- This works with the security_invoker view
CREATE POLICY "Authenticated users can view public profile data via view"
ON public.profiles
FOR SELECT
TO authenticated
USING (true);

-- Add RLS policy for meals table to allow authenticated users to view meals via view
CREATE POLICY "Authenticated users can view meals via view"
ON public.meals
FOR SELECT
TO authenticated
USING (true);