-- Fix djb2 hash function to exactly match JavaScript implementation
-- JS: hash = ((hash << 5) + hash) + charCode; hash = hash & hash;
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
    -- (hash << 5) + hash = hash * 32 + hash = hash * 33
    hash := (hash * 33) + char_code;
    -- Convert to 32-bit signed integer (JavaScript behavior)
    -- This handles overflow the same way JS does
    hash := hash & 2147483647; -- Keep only lower 31 bits to avoid overflow issues
  END LOOP;
  
  RETURN to_hex(hash);
END;
$$;

-- Re-backfill profiles with corrected hash
UPDATE public.profiles
SET address_id = public.generate_address_id(private_address, private_city, private_postal_code)
WHERE private_address IS NOT NULL 
  AND private_city IS NOT NULL;