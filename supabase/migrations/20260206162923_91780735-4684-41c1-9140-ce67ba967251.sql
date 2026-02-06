-- Create djb2 hash function to match JavaScript implementation
CREATE OR REPLACE FUNCTION public.djb2_hash(input_text text)
RETURNS text
LANGUAGE plpgsql
IMMUTABLE
SET search_path TO 'public'
AS $$
DECLARE
  hash bigint := 5381;
  i int;
  char_code int;
BEGIN
  FOR i IN 1..length(input_text) LOOP
    char_code := ascii(substr(input_text, i, 1));
    hash := ((hash * 32) + hash) + char_code;
    -- Simulate JavaScript's 32-bit integer overflow
    hash := hash & x'FFFFFFFF'::bigint;
  END LOOP;
  
  -- Return absolute value as hex string
  RETURN to_hex(abs(hash));
END;
$$;

-- Create function to generate address_id matching JavaScript logic
CREATE OR REPLACE FUNCTION public.generate_address_id(street text, city text, postal_code text)
RETURNS text
LANGUAGE plpgsql
IMMUTABLE
SET search_path TO 'public'
AS $$
DECLARE
  normalized text;
BEGIN
  normalized := lower(trim(street)) || '-' || lower(trim(city)) || '-' || trim(coalesce(postal_code, ''));
  RETURN public.djb2_hash(normalized);
END;
$$;

-- Backfill existing profiles that have addresses but no address_id
UPDATE public.profiles
SET address_id = public.generate_address_id(private_address, private_city, private_postal_code)
WHERE private_address IS NOT NULL 
  AND private_city IS NOT NULL 
  AND address_id IS NULL;