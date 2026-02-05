-- P1: Add is_disabled column to profiles for admin deactivation
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS is_disabled boolean NOT NULL DEFAULT false;

-- P2: Add container_policy column to meals
DO $$ BEGIN
  CREATE TYPE container_policy_type AS ENUM ('bring_container', 'plate_ok', 'either_ok');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

ALTER TABLE public.meals 
ADD COLUMN IF NOT EXISTS container_policy text DEFAULT 'either_ok';

-- Add constraint for container_policy values
DO $$ BEGIN
  ALTER TABLE public.meals 
  ADD CONSTRAINT meals_container_policy_check 
  CHECK (container_policy IN ('bring_container', 'plate_ok', 'either_ok'));
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- Create content_filter function for server-side validation
CREATE OR REPLACE FUNCTION public.check_meal_content()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  combined_text text;
  blacklist text[] := ARRAY[
    'fuck', 'shit', 'bitch', 'cunt', 'nigger', 'faggot', 'retard',
    'fotze', 'wichser', 'hurensohn', 'schlampe', 'schwuchtel', 'spast',
    'arschloch', 'missgeburt', 'behindert',
    'nazi', 'heil hitler', 'sieg heil',
    'porno', 'porn', 'sex video', 'nackt'
  ];
  word text;
BEGIN
  -- Combine and normalize text
  combined_text := lower(NEW.title || ' ' || COALESCE(NEW.description, ''));
  
  -- Simple leetspeak normalization
  combined_text := replace(combined_text, '0', 'o');
  combined_text := replace(combined_text, '1', 'i');
  combined_text := replace(combined_text, '3', 'e');
  combined_text := replace(combined_text, '4', 'a');
  combined_text := replace(combined_text, '5', 's');
  combined_text := replace(combined_text, '7', 't');
  combined_text := replace(combined_text, '@', 'a');
  combined_text := replace(combined_text, '$', 's');
  
  -- Remove special chars except spaces
  combined_text := regexp_replace(combined_text, '[^a-zäöüß\s]', '', 'g');
  
  -- Check against blacklist
  FOREACH word IN ARRAY blacklist LOOP
    IF position(word in combined_text) > 0 THEN
      RAISE EXCEPTION 'Bitte respektvolle Sprache verwenden.';
    END IF;
  END LOOP;
  
  RETURN NEW;
END;
$$;

-- Create trigger for content filtering
DROP TRIGGER IF EXISTS check_meal_content_trigger ON public.meals;
CREATE TRIGGER check_meal_content_trigger
BEFORE INSERT OR UPDATE ON public.meals
FOR EACH ROW
EXECUTE FUNCTION public.check_meal_content();

-- Create function to check if user is disabled
CREATE OR REPLACE FUNCTION public.check_user_disabled()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  user_disabled boolean;
BEGIN
  -- Check if the user is disabled
  SELECT is_disabled INTO user_disabled
  FROM public.profiles
  WHERE id = auth.uid();
  
  IF user_disabled = true THEN
    RAISE EXCEPTION 'Account deaktiviert. Bitte Support kontaktieren.';
  END IF;
  
  RETURN NEW;
END;
$$;

-- Add trigger to meals to block disabled users from creating
DROP TRIGGER IF EXISTS check_disabled_on_meal_create ON public.meals;
CREATE TRIGGER check_disabled_on_meal_create
BEFORE INSERT ON public.meals
FOR EACH ROW
EXECUTE FUNCTION public.check_user_disabled();

-- Add trigger to bookings to block disabled users from booking
DROP TRIGGER IF EXISTS check_disabled_on_booking_create ON public.bookings;
CREATE TRIGGER check_disabled_on_booking_create
BEFORE INSERT ON public.bookings
FOR EACH ROW
EXECUTE FUNCTION public.check_user_disabled();

-- Add trigger to messages to block disabled users from messaging
DROP TRIGGER IF EXISTS check_disabled_on_message_send ON public.messages;
CREATE TRIGGER check_disabled_on_message_send
BEFORE INSERT ON public.messages
FOR EACH ROW
EXECUTE FUNCTION public.check_user_disabled();