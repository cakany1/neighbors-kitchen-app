-- Add new fields to meals table for handover modes and capacity
ALTER TABLE public.meals 
ADD COLUMN handover_mode text DEFAULT 'pickup_box',
ADD COLUMN max_seats integer,
ADD COLUMN collection_window_start time,
ADD COLUMN collection_window_end time,
ADD COLUMN arrival_time time,
ADD COLUMN is_stock_photo boolean DEFAULT false,
ADD COLUMN estimated_restaurant_value numeric;

-- Rename restaurant_reference_price to estimated_restaurant_value (data migration)
UPDATE public.meals 
SET estimated_restaurant_value = restaurant_reference_price 
WHERE restaurant_reference_price IS NOT NULL;

-- Add new fields to profiles table
ALTER TABLE public.profiles
ADD COLUMN display_real_name boolean DEFAULT true,
ADD COLUMN role text DEFAULT 'both';

-- Add check constraint for handover_mode
ALTER TABLE public.meals
ADD CONSTRAINT meals_handover_mode_check 
CHECK (handover_mode IN ('pickup_box', 'neighbor_plate', 'anonymous_drop', 'dine_in'));

-- Add check constraint for role
ALTER TABLE public.profiles
ADD CONSTRAINT profiles_role_check 
CHECK (role IN ('guest', 'chef', 'both'));