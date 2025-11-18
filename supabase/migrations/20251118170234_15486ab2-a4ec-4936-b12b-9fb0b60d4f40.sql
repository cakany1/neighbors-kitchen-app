-- Add latitude and longitude columns to profiles for geocoding
ALTER TABLE profiles 
ADD COLUMN IF NOT EXISTS latitude FLOAT,
ADD COLUMN IF NOT EXISTS longitude FLOAT;

-- Add index for faster geospatial queries
CREATE INDEX IF NOT EXISTS idx_profiles_location ON profiles(latitude, longitude);