-- Add visibility_radius column to meals table
-- null = no limit (visible to all)
-- value in meters (e.g., 100, 500, 1000)
ALTER TABLE public.meals 
ADD COLUMN visibility_radius integer DEFAULT NULL;

-- Add comment for documentation
COMMENT ON COLUMN public.meals.visibility_radius IS 'Chef-set visibility radius in meters. NULL means no distance restriction.';

-- Update the meals_public view to include the new column
DROP VIEW IF EXISTS public.meals_public;
CREATE VIEW public.meals_public AS
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