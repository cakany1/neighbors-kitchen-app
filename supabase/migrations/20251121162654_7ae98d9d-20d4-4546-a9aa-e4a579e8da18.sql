-- 1. Die "Tür öffnen" für neue Registrierungen
DROP POLICY IF EXISTS "Enable insert for users based on user_id" ON public.profiles;
CREATE POLICY "Enable insert for users based on user_id" 
ON public.profiles FOR INSERT 
WITH CHECK (auth.uid() = id);

-- 2. Der Automatismus (Trigger) für fehlerfreie Registrierung
-- Funktion erstellen:
CREATE OR REPLACE FUNCTION public.handle_new_user() 
RETURNS trigger AS $$
BEGIN
  INSERT INTO public.profiles (id, first_name, last_name, email)
  VALUES (
    new.id, 
    COALESCE(new.raw_user_meta_data->>'first_name', 'New'), 
    COALESCE(new.raw_user_meta_data->>'last_name', 'User'),
    new.email
  )
  ON CONFLICT (id) DO NOTHING;
  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger aktivieren:
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();