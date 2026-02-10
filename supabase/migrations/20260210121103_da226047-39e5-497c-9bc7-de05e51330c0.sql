
-- Content filter trigger for messages table (reuses same blacklist as check_meal_content)
CREATE OR REPLACE FUNCTION public.check_message_content()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  combined_text text;
  blacklist text[] := ARRAY[
    'fuck', 'shit', 'bitch', 'cunt', 'nigger', 'faggot', 'retard',
    'fotze', 'wichser', 'hurensohn', 'schlampe', 'schwuchtel', 'spast',
    'arschloch', 'missgeburt', 'behindert',
    'nazi', 'hitler', 'heil hitler', 'sieg heil',
    'porno', 'porn', 'sex video', 'nackt'
  ];
  word text;
BEGIN
  combined_text := lower(COALESCE(NEW.message_text, ''));
  
  -- Leetspeak normalization (same as check_meal_content)
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
  
  FOREACH word IN ARRAY blacklist LOOP
    IF position(word in combined_text) > 0 THEN
      RAISE EXCEPTION 'Bitte respektvolle Sprache verwenden.';
    END IF;
  END LOOP;
  
  RETURN NEW;
END;
$function$;

DROP TRIGGER IF EXISTS check_message_content_trigger ON public.messages;
CREATE TRIGGER check_message_content_trigger
BEFORE INSERT OR UPDATE ON public.messages
FOR EACH ROW
EXECUTE FUNCTION public.check_message_content();
