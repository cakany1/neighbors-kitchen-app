-- Create table to track Stripe webhook events for mode visibility and debugging
CREATE TABLE public.stripe_webhook_events (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  event_id TEXT NOT NULL,
  event_type TEXT NOT NULL,
  stripe_mode TEXT NOT NULL CHECK (stripe_mode IN ('test', 'live')),
  processed_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  payload_summary JSONB,
  success BOOLEAN NOT NULL DEFAULT true,
  error_message TEXT
);

-- Create index for fast mode-based queries
CREATE INDEX idx_stripe_webhook_events_mode ON public.stripe_webhook_events(stripe_mode);
CREATE INDEX idx_stripe_webhook_events_processed ON public.stripe_webhook_events(processed_at DESC);

-- Enable RLS
ALTER TABLE public.stripe_webhook_events ENABLE ROW LEVEL SECURITY;

-- Only admins can view webhook events
CREATE POLICY "Admins can view webhook events"
ON public.stripe_webhook_events
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = auth.uid() AND role = 'admin'
  )
);

-- Create a settings entry for current Stripe mode (defaults to test)
INSERT INTO public.admin_settings (setting_key, setting_value)
VALUES ('stripe_mode', '"test"')
ON CONFLICT (setting_key) DO NOTHING;