-- Create api_rate_limits table for DB-based rate limiting
-- This replaces in-memory rate limiting which doesn't persist across function restarts

CREATE TABLE IF NOT EXISTS public.api_rate_limits (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  identifier TEXT NOT NULL,  -- IP address or user ID
  endpoint TEXT NOT NULL,    -- Function name or endpoint path
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Index for efficient lookups and cleanup
CREATE INDEX IF NOT EXISTS idx_rate_limits_lookup 
ON public.api_rate_limits (identifier, endpoint, created_at DESC);

-- Index for cleanup job
CREATE INDEX IF NOT EXISTS idx_rate_limits_created 
ON public.api_rate_limits (created_at);

-- Enable RLS but allow service role access only
ALTER TABLE public.api_rate_limits ENABLE ROW LEVEL SECURITY;

-- Only service role can access this table (used by edge functions)
CREATE POLICY "Service role only"
ON public.api_rate_limits
FOR ALL
USING (false);

-- Add comment for documentation
COMMENT ON TABLE public.api_rate_limits IS 'Rate limiting records for API endpoints. Used by edge functions to enforce request limits per IP/user.';

-- Cleanup function to remove old entries (call periodically via cron or manually)
CREATE OR REPLACE FUNCTION public.cleanup_rate_limits(max_age_hours INTEGER DEFAULT 24)
RETURNS INTEGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  deleted_count INTEGER;
BEGIN
  DELETE FROM public.api_rate_limits
  WHERE created_at < (now() - (max_age_hours || ' hours')::interval);
  
  GET DIAGNOSTICS deleted_count = ROW_COUNT;
  RETURN deleted_count;
END;
$$;