-- Add UNIQUE constraint on event_id for idempotency
CREATE UNIQUE INDEX IF NOT EXISTS idx_stripe_webhook_events_event_id_unique 
ON public.stripe_webhook_events (event_id);

-- Comment for documentation
COMMENT ON INDEX idx_stripe_webhook_events_event_id_unique IS 'Ensures webhook idempotency - duplicate events are rejected';