-- Add dietary preferences to profiles table
ALTER TABLE public.profiles ADD COLUMN allergens TEXT[] DEFAULT '{}';
ALTER TABLE public.profiles ADD COLUMN dislikes TEXT[] DEFAULT '{}';

-- Add ingredient tracking and exchange model to meals table
ALTER TABLE public.meals ADD COLUMN ingredients TEXT[] DEFAULT '{}';
ALTER TABLE public.meals ADD COLUMN exchange_mode TEXT DEFAULT 'money' CHECK (exchange_mode IN ('money', 'barter'));
ALTER TABLE public.meals ADD COLUMN barter_requests TEXT[] DEFAULT '{}';
ALTER TABLE public.meals ADD COLUMN restaurant_reference_price NUMERIC;