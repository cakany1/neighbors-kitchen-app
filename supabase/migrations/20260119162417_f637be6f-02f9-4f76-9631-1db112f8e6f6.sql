-- Fix the view to use SECURITY INVOKER (default, safer)
DROP VIEW IF EXISTS public.meals_public;
CREATE VIEW public.meals_public 
WITH (security_invoker = true)
AS
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