-- Update the content filter to include "hitler" as standalone word
CREATE OR REPLACE FUNCTION public.check_meal_content()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  combined_text text;
  blacklist text[] := ARRAY[
    'fuck', 'shit', 'bitch', 'cunt', 'nigger', 'faggot', 'retard',
    'asshole', 'damn', 'idiot', 'stupid', 'moron', 'loser', 'dumbass',
    'fotze', 'wichser', 'hurensohn', 'schlampe', 'schwuchtel', 'spast',
    'arschloch', 'missgeburt', 'behindert',
    'dumm', 'blöd', 'idiot', 'trottel', 'depp', 'vollidiot', 'loser',
    'nazi', 'hitler', 'heil hitler', 'sieg heil',
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
$function$;