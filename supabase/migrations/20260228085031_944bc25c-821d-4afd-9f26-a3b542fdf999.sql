-- Fix contact_requests: "Anyone can submit contact requests" policy applies to ALL commands
-- but should only apply to INSERT. Drop and recreate as INSERT-only.

DROP POLICY IF EXISTS "Anyone can submit contact requests" ON public.contact_requests;

CREATE POLICY "Anyone can submit contact requests"
ON public.contact_requests
FOR INSERT
TO public
WITH CHECK (true);