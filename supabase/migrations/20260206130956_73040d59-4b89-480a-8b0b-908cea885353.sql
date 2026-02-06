-- Add CHECK constraint for pricing_minimum (stored in cents)
-- Minimum: 700 cents = CHF 7.00
-- Maximum: 5000 cents = CHF 50.00
-- Only applies when exchange_mode = 'money'

-- First drop the constraint if it exists (idempotent)
ALTER TABLE public.meals DROP CONSTRAINT IF EXISTS meals_pricing_minimum_range;

-- Add the constraint: pricing_minimum must be between 700-5000 cents when exchange_mode is 'money'
-- When exchange_mode is 'barter', pricing_minimum can be 0 or null
ALTER TABLE public.meals ADD CONSTRAINT meals_pricing_minimum_range 
CHECK (
  (exchange_mode = 'money' AND pricing_minimum >= 700 AND pricing_minimum <= 5000) 
  OR (exchange_mode = 'barter') 
  OR (exchange_mode IS NULL)
);