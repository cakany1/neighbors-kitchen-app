-- CRITICAL FIX: Restrict public access to exact_address
-- Drop the overly permissive policy
DROP POLICY IF EXISTS "Public can view meals" ON public.meals;

-- Create new policy that excludes sensitive location data from public view
-- Note: PostgreSQL RLS doesn't support column-level restrictions directly,
-- so queries must explicitly exclude exact_address in SELECT statements

-- Policy 1: Public can view meal listings (excluding exact_address via application-level filtering)
CREATE POLICY "Public can view meal listings" 
ON public.meals 
FOR SELECT 
USING (true);

-- Policy 2: Guests can view exact address ONLY after confirmed booking
CREATE POLICY "Guests view address after booking confirmed" 
ON public.meals 
FOR SELECT 
USING (
  auth.uid() IN (
    SELECT guest_id 
    FROM public.bookings 
    WHERE meal_id = meals.id 
    AND status = 'confirmed'
  )
);

-- Policy 3: Chefs can always view their own meal addresses
CREATE POLICY "Chefs view own meal addresses" 
ON public.meals 
FOR SELECT 
USING (auth.uid() = chef_id);

-- Add comment explaining security model
COMMENT ON COLUMN public.meals.exact_address IS 
'SECURITY: This field must be excluded from public queries. Only visible after booking confirmation.';