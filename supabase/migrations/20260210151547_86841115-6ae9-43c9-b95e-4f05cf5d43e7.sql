
-- P1.2: Security & RLS hardening

-- 1) analytics_events: restrict INSERT to authenticated users
DROP POLICY IF EXISTS "Anyone can insert analytics events" ON public.analytics_events;
CREATE POLICY "Authenticated users can insert analytics events"
  ON public.analytics_events
  FOR INSERT
  TO authenticated
  WITH CHECK (true);

-- 2) faq_requests: enforce user_id matches auth.uid() when provided
DROP POLICY IF EXISTS "Anyone can submit FAQ questions" ON public.faq_requests;
CREATE POLICY "Users can submit FAQ questions"
  ON public.faq_requests
  FOR INSERT
  TO authenticated
  WITH CHECK (
    user_id IS NULL OR user_id = auth.uid()
  );

-- 3) contact_requests: remove duplicate SELECT policy
DROP POLICY IF EXISTS "Only admins can view contact requests" ON public.contact_requests;
