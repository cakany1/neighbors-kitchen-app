-- Attach the existing check_meal_content trigger function to the meals table
-- This enforces banned content validation on INSERT and UPDATE

DROP TRIGGER IF EXISTS check_meal_content_trigger ON public.meals;

CREATE TRIGGER check_meal_content_trigger
BEFORE INSERT OR UPDATE ON public.meals
FOR EACH ROW
EXECUTE FUNCTION public.check_meal_content();