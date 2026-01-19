-- Create a secure public view for meals that excludes exact_address
-- This view is for public feed/map queries
CREATE OR REPLACE VIEW public.meals_public
WITH (security_invoker = on)
AS SELECT 
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
  is_cooking_experience,
  scheduled_date,
  created_at,
  updated_at,
  handover_mode,
  collection_window_start,
  collection_window_end,
  arrival_time,
  max_seats,
  booked_seats,
  unit_type,
  exchange_mode,
  barter_requests,
  restaurant_reference_price,
  estimated_restaurant_value,
  ingredients,
  is_stock_photo,
  women_only,
  visibility_mode
  -- EXCLUDED: exact_address (only revealed after booking confirmation)
FROM public.meals;

-- Grant access to the public view
GRANT SELECT ON public.meals_public TO anon, authenticated;