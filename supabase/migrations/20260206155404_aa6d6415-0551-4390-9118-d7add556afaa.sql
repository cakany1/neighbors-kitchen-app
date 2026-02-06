
-- Drop and recreate the meals_public view to include address_id
DROP VIEW IF EXISTS public.meals_public CASCADE;

CREATE VIEW public.meals_public WITH (security_invoker=on) AS
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
  available_portions,
  pricing_minimum,
  pricing_suggested,
  restaurant_reference_price,
  estimated_restaurant_value,
  exchange_mode,
  handover_mode,
  collection_window_start,
  collection_window_end,
  arrival_time,
  max_seats,
  booked_seats,
  unit_type,
  barter_requests,
  ingredients,
  is_stock_photo,
  women_only,
  is_cooking_experience,
  visibility_mode,
  visibility_radius,
  scheduled_date,
  created_at,
  updated_at,
  address_id
FROM public.meals
WHERE visibility_mode = 'all' OR visibility_mode IS NULL;
