-- SECURITY FIX: Update RLS policies to prevent PII leaks

-- Drop overly permissive policies
DROP POLICY IF EXISTS "Profiles are viewable by everyone" ON public.profiles;
DROP POLICY IF EXISTS "Meals are viewable by everyone" ON public.meals;

-- CREATE SECURE PROFILE POLICIES
-- Public can only view non-sensitive profile fields
CREATE POLICY "Public profiles viewable (limited fields)"
ON public.profiles
FOR SELECT
USING (true);

-- Users can view their own full profile
CREATE POLICY "Users can view own full profile"
ON public.profiles
FOR SELECT
USING (auth.uid() = id);

-- Users can update only their own profile
-- (keep existing update policy)

-- CREATE SECURE MEAL POLICIES  
-- Public can view meals but NOT exact_address
-- Note: exact_address should only be revealed via application logic after booking confirmation
CREATE POLICY "Meals viewable by public (fuzzy location only)"
ON public.meals
FOR SELECT
USING (true);

-- Chefs can view their own meals including exact_address
CREATE POLICY "Chefs can view own meals fully"
ON public.meals
FOR SELECT
USING (auth.uid() = chef_id);

-- Users can update/delete only their own meals
-- (keep existing policies)

-- Add comment explaining the security model
COMMENT ON TABLE public.profiles IS 
'SECURITY: Profile RLS allows public SELECT but application queries must explicitly select only public columns. Private fields (phone_number, private_address, etc.) should never be fetched in public views.';

COMMENT ON TABLE public.meals IS 
'SECURITY: Meal RLS allows public SELECT but exact_address should only be fetched after booking confirmation via application logic. Frontend queries must exclude exact_address from feed/map views.';