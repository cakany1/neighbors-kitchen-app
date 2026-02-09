-- Add is_demo flag to meals table for admin marking
ALTER TABLE public.meals ADD COLUMN IF NOT EXISTS is_demo boolean NOT NULL DEFAULT false;

-- Index for quick filtering
CREATE INDEX IF NOT EXISTS idx_meals_is_demo ON public.meals(is_demo) WHERE is_demo = true;