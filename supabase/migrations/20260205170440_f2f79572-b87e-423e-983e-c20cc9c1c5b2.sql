-- =====================================================
-- P0: CANCEL / NO-SHOW PROTECTION + RATINGS SYSTEM
-- Migration is idempotent (safe to re-run)
-- =====================================================

-- 1. Extend booking status to support full lifecycle
DO $$ 
BEGIN
  -- Drop existing constraint if it exists
  ALTER TABLE public.bookings DROP CONSTRAINT IF EXISTS bookings_status_check;
  
  -- Add new constraint with full status enum
  ALTER TABLE public.bookings ADD CONSTRAINT bookings_status_check 
    CHECK (status IN (
      'pending', 
      'confirmed', 
      'cancelled_by_guest', 
      'cancelled_by_host', 
      'completed', 
      'no_show_guest', 
      'no_show_host',
      'inquiry',
      'cancelled'  -- Legacy support
    ));
EXCEPTION WHEN OTHERS THEN NULL;
END $$;

-- 2. Add cancellation and no-show tracking fields to bookings
DO $$
BEGIN
  ALTER TABLE public.bookings ADD COLUMN IF NOT EXISTS cancelled_at timestamptz;
  ALTER TABLE public.bookings ADD COLUMN IF NOT EXISTS cancellation_reason text;
  ALTER TABLE public.bookings ADD COLUMN IF NOT EXISTS no_show_marked_at timestamptz;
  ALTER TABLE public.bookings ADD COLUMN IF NOT EXISTS no_show_marked_by uuid REFERENCES profiles(id);
EXCEPTION WHEN OTHERS THEN NULL;
END $$;

-- 3. Create ratings table for mutual reviews (Airbnb-light)
CREATE TABLE IF NOT EXISTS public.ratings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  booking_id uuid NOT NULL REFERENCES bookings(id) ON DELETE CASCADE,
  rater_id uuid NOT NULL REFERENCES profiles(id),
  rated_user_id uuid NOT NULL REFERENCES profiles(id),
  stars integer NOT NULL CHECK (stars >= 1 AND stars <= 5),
  tags text[] DEFAULT '{}',
  comment text,
  created_at timestamptz NOT NULL DEFAULT now(),
  -- Prevent duplicate ratings
  CONSTRAINT unique_rating_per_booking UNIQUE (booking_id, rater_id)
);

-- 4. Enable RLS on ratings
ALTER TABLE public.ratings ENABLE ROW LEVEL SECURITY;

-- 5. RLS policies for ratings
DROP POLICY IF EXISTS "Users can create ratings for their bookings" ON public.ratings;
CREATE POLICY "Users can create ratings for their bookings" ON public.ratings
  FOR INSERT WITH CHECK (
    auth.uid() = rater_id AND
    (
      -- User is guest of the booking
      EXISTS (SELECT 1 FROM bookings WHERE id = booking_id AND guest_id = auth.uid())
      OR
      -- User is host of the meal
      EXISTS (
        SELECT 1 FROM bookings b
        JOIN meals m ON b.meal_id = m.id
        WHERE b.id = booking_id AND m.chef_id = auth.uid()
      )
    )
  );

DROP POLICY IF EXISTS "Users can view ratings where both parties rated" ON public.ratings;
CREATE POLICY "Users can view ratings where both parties rated" ON public.ratings
  FOR SELECT USING (
    -- Admin can see all
    has_role(auth.uid(), 'admin')
    OR
    -- User can see their own ratings
    rater_id = auth.uid()
    OR
    rated_user_id = auth.uid()
    OR
    -- Public: Both parties have rated (Airbnb mechanic)
    (
      EXISTS (
        SELECT 1 FROM ratings r2 
        WHERE r2.booking_id = ratings.booking_id 
        AND r2.rater_id = ratings.rated_user_id
      )
    )
    OR
    -- Or 14 days have passed
    created_at < now() - interval '14 days'
  );

DROP POLICY IF EXISTS "Users can update their own ratings" ON public.ratings;
CREATE POLICY "Users can update their own ratings" ON public.ratings
  FOR UPDATE USING (rater_id = auth.uid());

-- 6. Create QA runs table for self-test logging
CREATE TABLE IF NOT EXISTS public.qa_runs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  run_type text NOT NULL DEFAULT 'automated',
  triggered_by uuid REFERENCES profiles(id),
  started_at timestamptz NOT NULL DEFAULT now(),
  completed_at timestamptz,
  status text NOT NULL DEFAULT 'running' CHECK (status IN ('running', 'passed', 'failed', 'partial')),
  test_results jsonb NOT NULL DEFAULT '[]',
  summary jsonb,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- 7. Enable RLS on qa_runs
ALTER TABLE public.qa_runs ENABLE ROW LEVEL SECURITY;

-- 8. Only admins can access QA runs
DROP POLICY IF EXISTS "Admins can manage QA runs" ON public.qa_runs;
CREATE POLICY "Admins can manage QA runs" ON public.qa_runs
  FOR ALL USING (has_role(auth.uid(), 'admin'));

-- 9. Function to handle guest cancellation with deadline check
CREATE OR REPLACE FUNCTION public.cancel_booking_with_reason(
  p_booking_id uuid,
  p_guest_id uuid,
  p_reason text DEFAULT NULL
)
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $$
DECLARE
  v_meal_id uuid;
  v_status text;
  v_created_at timestamptz;
  v_scheduled_date timestamptz;
  v_deadline timestamptz;
BEGIN
  -- SECURITY: Verify the caller is cancelling their own booking
  IF p_guest_id != auth.uid() THEN
    RETURN json_build_object(
      'success', false, 
      'message', 'Unauthorized: Cannot cancel booking for another user'
    );
  END IF;

  -- Get booking details
  SELECT b.meal_id, b.status, b.created_at, m.scheduled_date
  INTO v_meal_id, v_status, v_created_at, v_scheduled_date
  FROM bookings b
  JOIN meals m ON b.meal_id = m.id
  WHERE b.id = p_booking_id AND b.guest_id = p_guest_id
  FOR UPDATE;

  IF v_meal_id IS NULL THEN
    RETURN json_build_object('success', false, 'message', 'Booking not found or unauthorized');
  END IF;

  IF v_status LIKE 'cancelled%' THEN
    RETURN json_build_object('success', false, 'message', 'Booking already cancelled');
  END IF;

  -- Calculate deadline: 60 minutes before pickup
  v_deadline := v_scheduled_date - interval '60 minutes';

  -- Check if within cancellation window
  IF now() > v_deadline THEN
    RETURN json_build_object(
      'success', false, 
      'message', 'Stornierungsfrist abgelaufen. Bitte kontaktiere den Koch direkt.'
    );
  END IF;

  -- Update booking status
  UPDATE bookings 
  SET status = 'cancelled_by_guest',
      cancelled_at = now(),
      cancellation_reason = p_reason
  WHERE id = p_booking_id;

  -- Restore inventory
  UPDATE meals 
  SET available_portions = available_portions + 1,
      booked_seats = GREATEST(0, COALESCE(booked_seats, 0) - 1)
  WHERE id = v_meal_id;

  RETURN json_build_object('success', true, 'message', 'Buchung erfolgreich storniert');
END;
$$;

-- 10. Function for host to cancel booking
CREATE OR REPLACE FUNCTION public.host_cancel_booking(
  p_booking_id uuid,
  p_reason text DEFAULT NULL
)
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $$
DECLARE
  v_meal_id uuid;
  v_chef_id uuid;
  v_status text;
BEGIN
  -- Get booking and verify host ownership
  SELECT b.meal_id, m.chef_id, b.status
  INTO v_meal_id, v_chef_id, v_status
  FROM bookings b
  JOIN meals m ON b.meal_id = m.id
  WHERE b.id = p_booking_id;

  -- Verify caller is the host
  IF v_chef_id != auth.uid() THEN
    RETURN json_build_object('success', false, 'message', 'Unauthorized: Only host can cancel');
  END IF;

  IF v_status LIKE 'cancelled%' THEN
    RETURN json_build_object('success', false, 'message', 'Booking already cancelled');
  END IF;

  -- Update booking
  UPDATE bookings 
  SET status = 'cancelled_by_host',
      cancelled_at = now(),
      cancellation_reason = p_reason
  WHERE id = p_booking_id;

  -- Restore inventory
  UPDATE meals 
  SET available_portions = available_portions + 1,
      booked_seats = GREATEST(0, COALESCE(booked_seats, 0) - 1)
  WHERE id = v_meal_id;

  RETURN json_build_object('success', true, 'message', 'Buchung wurde storniert');
END;
$$;

-- 11. Function for host to mark guest as no-show
CREATE OR REPLACE FUNCTION public.mark_no_show(
  p_booking_id uuid,
  p_is_guest_noshow boolean DEFAULT true
)
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $$
DECLARE
  v_meal_id uuid;
  v_chef_id uuid;
  v_guest_id uuid;
  v_status text;
  v_scheduled_date timestamptz;
  v_grace_period interval := interval '30 minutes';
BEGIN
  -- Get booking details
  SELECT b.meal_id, m.chef_id, b.guest_id, b.status, m.scheduled_date
  INTO v_meal_id, v_chef_id, v_guest_id, v_status, v_scheduled_date
  FROM bookings b
  JOIN meals m ON b.meal_id = m.id
  WHERE b.id = p_booking_id;

  -- Verify caller is participant
  IF auth.uid() NOT IN (v_chef_id, v_guest_id) THEN
    RETURN json_build_object('success', false, 'message', 'Unauthorized');
  END IF;

  -- Check if past grace period
  IF now() < (v_scheduled_date + v_grace_period) THEN
    RETURN json_build_object(
      'success', false, 
      'message', 'No-show kann erst 30 Minuten nach der Abholzeit markiert werden'
    );
  END IF;

  IF v_status NOT IN ('pending', 'confirmed') THEN
    RETURN json_build_object('success', false, 'message', 'Booking status does not allow no-show marking');
  END IF;

  -- Update booking
  UPDATE bookings 
  SET status = CASE WHEN p_is_guest_noshow THEN 'no_show_guest' ELSE 'no_show_host' END,
      no_show_marked_at = now(),
      no_show_marked_by = auth.uid()
  WHERE id = p_booking_id;

  -- Trigger will handle reliability score update via existing trigger

  RETURN json_build_object('success', true, 'message', 'No-show wurde markiert');
END;
$$;

-- 12. Function to submit rating
CREATE OR REPLACE FUNCTION public.submit_rating(
  p_booking_id uuid,
  p_rated_user_id uuid,
  p_stars integer,
  p_tags text[] DEFAULT NULL,
  p_comment text DEFAULT NULL
)
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $$
DECLARE
  v_booking_status text;
  v_rater_id uuid := auth.uid();
BEGIN
  -- Get booking status
  SELECT status INTO v_booking_status
  FROM bookings WHERE id = p_booking_id;

  IF v_booking_status IS NULL THEN
    RETURN json_build_object('success', false, 'message', 'Booking not found');
  END IF;

  -- Only allow rating after completion or no-show
  IF v_booking_status NOT IN ('completed', 'no_show_guest', 'no_show_host') THEN
    RETURN json_build_object('success', false, 'message', 'Bewertung nur nach Abschluss möglich');
  END IF;

  -- Check if already rated
  IF EXISTS (SELECT 1 FROM ratings WHERE booking_id = p_booking_id AND rater_id = v_rater_id) THEN
    RETURN json_build_object('success', false, 'message', 'Du hast bereits bewertet');
  END IF;

  -- Insert rating
  INSERT INTO ratings (booking_id, rater_id, rated_user_id, stars, tags, comment)
  VALUES (p_booking_id, v_rater_id, p_rated_user_id, p_stars, COALESCE(p_tags, '{}'), p_comment);

  RETURN json_build_object('success', true, 'message', 'Bewertung gespeichert');
END;
$$;

-- 13. View for aggregated user ratings (admin + public display)
CREATE OR REPLACE VIEW public.user_rating_summary AS
SELECT 
  rated_user_id as user_id,
  COUNT(*) as total_ratings,
  ROUND(AVG(stars)::numeric, 1) as avg_rating,
  COUNT(*) FILTER (WHERE stars >= 4) as positive_ratings,
  COUNT(*) FILTER (WHERE stars <= 2) as negative_ratings
FROM ratings
GROUP BY rated_user_id;

-- 14. Enable realtime for ratings (optional)
-- ALTER PUBLICATION supabase_realtime ADD TABLE public.ratings;