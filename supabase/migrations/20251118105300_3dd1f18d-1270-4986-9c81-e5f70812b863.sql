-- Update the handle_new_user function to include gender and is_couple fields
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
BEGIN
  INSERT INTO public.profiles (id, first_name, last_name, language, gender, is_couple)
  VALUES (
    new.id, 
    COALESCE(new.raw_user_meta_data->>'first_name', 'User'),
    COALESCE(new.raw_user_meta_data->>'last_name', ''),
    COALESCE(new.raw_user_meta_data->>'language', 'en'),
    new.raw_user_meta_data->>'gender',
    COALESCE((new.raw_user_meta_data->>'is_couple')::boolean, false)
  );
  RETURN new;
END;
$function$;