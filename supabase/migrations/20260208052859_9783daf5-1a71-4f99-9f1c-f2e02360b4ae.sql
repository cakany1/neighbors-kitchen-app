-- TASK 32: Update meals_public view to hide meals from chefs in vacation mode
-- This ensures that when a user enables vacation mode, their meal offers are hidden from the feed

DROP VIEW IF EXISTS public.meals_public;

CREATE VIEW public.meals_public
WITH (security_invoker=on) AS
SELECT 
  m.id,
  m.title,
  m.title_en,
  m.description,
  m.description_en,
  m.image_url,
  m.chef_id,
  m.fuzzy_lat,
  m.fuzzy_lng,
  m.neighborhood,
  m.tags,
  m.allergens,
  m.available_portions,
  m.pricing_minimum,
  m.pricing_suggested,
  m.restaurant_reference_price,
  m.estimated_restaurant_value,
  m.exchange_mode,
  m.handover_mode,
  m.collection_window_start,
  m.collection_window_end,
  m.arrival_time,
  m.max_seats,
  m.booked_seats,
  m.unit_type,
  m.barter_requests,
  m.ingredients,
  m.is_stock_photo,
  m.women_only,
  m.is_cooking_experience,
  m.visibility_mode,
  m.visibility_radius,
  m.scheduled_date,
  m.created_at,
  m.updated_at,
  m.address_id
FROM meals m
INNER JOIN profiles p ON m.chef_id = p.id
WHERE 
  -- Only show meals with visibility_mode = 'all' or NULL (gender filtering handled in app)
  (m.visibility_mode = 'all' OR m.visibility_mode IS NULL)
  -- Hide meals from chefs in vacation mode
  AND (p.vacation_mode IS NULL OR p.vacation_mode = false);