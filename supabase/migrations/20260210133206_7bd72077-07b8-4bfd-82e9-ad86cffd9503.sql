
-- P0.9: Add content filter to profiles + improve normalization

-- 1) Improve check_meal_content with repeated-char collapsing
CREATE OR REPLACE FUNCTION public.check_meal_content()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  combined_text text;
  blacklist text[] := ARRAY[
    'fuck','shit','bitch','cunt','nigger','faggot','retard',
    'fotze','wichser','hurensohn','schlampe','schwuchtel','spast',
    'arschloch','missgeburt','behindert',
    'nazi','hitler','heil hitler','sieg heil',
    'porno','porn','sex video','nackt'
  ];
  word text;
BEGIN
  combined_text := lower(NEW.title || ' ' || COALESCE(NEW.description, ''));

  -- Leetspeak normalization
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

  -- Collapse repeated chars (e.g. fuuuck -> fuck)
  combined_text := regexp_replace(combined_text, '(.)\1{2,}', '\1\1', 'g');

  FOREACH word IN ARRAY blacklist LOOP
    IF position(word in combined_text) > 0 THEN
      RAISE EXCEPTION 'Bitte respektvolle Sprache verwenden.';
    END IF;
  END LOOP;

  RETURN NEW;
END;
$function$;

-- 2) Improve check_message_content with repeated-char collapsing
CREATE OR REPLACE FUNCTION public.check_message_content()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  combined_text text;
  blacklist text[] := ARRAY[
    'fuck','shit','bitch','cunt','nigger','faggot','retard',
    'fotze','wichser','hurensohn','schlampe','schwuchtel','spast',
    'arschloch','missgeburt','behindert',
    'nazi','hitler','heil hitler','sieg heil',
    'porno','porn','sex video','nackt'
  ];
  word text;
BEGIN
  combined_text := lower(COALESCE(NEW.message_text, ''));

  combined_text := replace(combined_text, '0', 'o');
  combined_text := replace(combined_text, '1', 'i');
  combined_text := replace(combined_text, '3', 'e');
  combined_text := replace(combined_text, '4', 'a');
  combined_text := replace(combined_text, '5', 's');
  combined_text := replace(combined_text, '7', 't');
  combined_text := replace(combined_text, '@', 'a');
  combined_text := replace(combined_text, '$', 's');

  combined_text := regexp_replace(combined_text, '[^a-zäöüß\s]', '', 'g');
  combined_text := regexp_replace(combined_text, '(.)\1{2,}', '\1\1', 'g');

  FOREACH word IN ARRAY blacklist LOOP
    IF position(word in combined_text) > 0 THEN
      RAISE EXCEPTION 'Bitte respektvolle Sprache verwenden.';
    END IF;
  END LOOP;

  RETURN NEW;
END;
$function$;

-- 3) New: content filter for profiles (nickname, partner_name)
CREATE OR REPLACE FUNCTION public.check_profile_content()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  combined_text text;
  blacklist text[] := ARRAY[
    'fuck','shit','bitch','cunt','nigger','faggot','retard',
    'fotze','wichser','hurensohn','schlampe','schwuchtel','spast',
    'arschloch','missgeburt','behindert',
    'nazi','hitler','heil hitler','sieg heil',
    'porno','porn','sex video','nackt'
  ];
  word text;
BEGIN
  combined_text := lower(COALESCE(NEW.nickname, '') || ' ' || COALESCE(NEW.partner_name, ''));

  combined_text := replace(combined_text, '0', 'o');
  combined_text := replace(combined_text, '1', 'i');
  combined_text := replace(combined_text, '3', 'e');
  combined_text := replace(combined_text, '4', 'a');
  combined_text := replace(combined_text, '5', 's');
  combined_text := replace(combined_text, '7', 't');
  combined_text := replace(combined_text, '@', 'a');
  combined_text := replace(combined_text, '$', 's');

  combined_text := regexp_replace(combined_text, '[^a-zäöüß\s]', '', 'g');
  combined_text := regexp_replace(combined_text, '(.)\1{2,}', '\1\1', 'g');

  FOREACH word IN ARRAY blacklist LOOP
    IF position(word in combined_text) > 0 THEN
      RAISE EXCEPTION 'Bitte respektvolle Sprache verwenden.';
    END IF;
  END LOOP;

  RETURN NEW;
END;
$function$;

-- 4) Attach trigger to profiles
DROP TRIGGER IF EXISTS check_profile_content_trigger ON profiles;
CREATE TRIGGER check_profile_content_trigger
  BEFORE INSERT OR UPDATE ON profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.check_profile_content();
