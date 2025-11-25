-- 1. Drop ALL existing gender-related check constraints
ALTER TABLE public.profiles DROP CONSTRAINT IF EXISTS profiles_gender_check;
ALTER TABLE public.profiles DROP CONSTRAINT IF EXISTS valid_gender;
ALTER TABLE public.profiles DROP CONSTRAINT IF EXISTS valid_visibility_mode;
ALTER TABLE public.meals DROP CONSTRAINT IF EXISTS valid_meal_visibility;

-- 2. Create visibility_mode enum
DO $$ 
BEGIN
  CREATE TYPE public.visibility_mode AS ENUM ('women_only', 'women_fli', 'all');
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

-- 3. Add visibility_mode columns with default 'all'
ALTER TABLE public.profiles 
  ADD COLUMN IF NOT EXISTS visibility_mode text DEFAULT 'all';

ALTER TABLE public.meals
  ADD COLUMN IF NOT EXISTS visibility_mode text DEFAULT 'all';

-- 4. Migrate existing gender data from old values to new values
UPDATE public.profiles
SET gender = CASE
  WHEN gender = 'female' THEN 'woman'
  WHEN gender = 'male' THEN 'man'
  WHEN gender IN ('diverse', 'prefer_not_to_say') THEN 'diverse'
  ELSE 'none'
END
WHERE gender IN ('male', 'female', 'diverse', 'prefer_not_to_say');

-- 5. Migrate partner_gender data
UPDATE public.profiles
SET partner_gender = CASE
  WHEN partner_gender = 'female' THEN 'woman'
  WHEN partner_gender = 'male' THEN 'man'
  WHEN partner_gender IN ('diverse', 'prefer_not_to_say') THEN 'diverse'
  ELSE 'none'
END
WHERE partner_gender IN ('male', 'female', 'diverse', 'prefer_not_to_say');

-- 6. Add new check constraints
ALTER TABLE public.profiles
  ADD CONSTRAINT valid_gender CHECK (gender IN ('woman', 'man', 'diverse', 'none') OR gender IS NULL),
  ADD CONSTRAINT valid_visibility_mode CHECK (visibility_mode IN ('women_only', 'women_fli', 'all'));

ALTER TABLE public.meals
  ADD CONSTRAINT valid_meal_visibility CHECK (visibility_mode IN ('women_only', 'women_fli', 'all'));

-- 7. Add validation function for visibility mode based on gender
CREATE OR REPLACE FUNCTION public.validate_visibility_mode()
RETURNS TRIGGER AS $$
BEGIN
  -- Men can only set visibility to 'all'
  IF NEW.gender = 'man' AND NEW.visibility_mode != 'all' THEN
    RAISE EXCEPTION 'Men can only set visibility mode to "all"';
  END IF;
  
  -- Diverse and none can set 'all' or 'women_fli' but not 'women_only'
  IF NEW.gender IN ('diverse', 'none') AND NEW.visibility_mode = 'women_only' THEN
    RAISE EXCEPTION 'Diverse/None users cannot set visibility mode to "women_only"';
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 8. Create trigger to enforce visibility validation on profiles
DROP TRIGGER IF EXISTS validate_profile_visibility ON public.profiles;
CREATE TRIGGER validate_profile_visibility
  BEFORE INSERT OR UPDATE ON public.profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.validate_visibility_mode();

-- 9. Create function to check if a meal is visible to a user based on visibility rules
CREATE OR REPLACE FUNCTION public.can_view_meal(meal_visibility text, viewer_gender text)
RETURNS boolean AS $$
BEGIN
  -- women_only: Only visible to women
  IF meal_visibility = 'women_only' THEN
    RETURN viewer_gender = 'woman';
  END IF;
  
  -- women_fli: Visible to women OR diverse
  IF meal_visibility = 'women_fli' THEN
    RETURN viewer_gender IN ('woman', 'diverse');
  END IF;
  
  -- all: Visible to everyone
  RETURN true;
END;
$$ LANGUAGE plpgsql IMMUTABLE;