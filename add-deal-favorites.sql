-- Add deal favorites functionality
-- This allows users to favorite individual deals instead of just restaurants

-- Add favorite_deals column to profiles table
ALTER TABLE profiles 
ADD COLUMN IF NOT EXISTS favorite_deals TEXT[] DEFAULT '{}';

-- Create index for better performance when querying favorite deals
CREATE INDEX IF NOT EXISTS idx_profiles_favorite_deals 
ON profiles USING GIN (favorite_deals);

-- Update the existing favorites column comment for clarity
COMMENT ON COLUMN profiles.favorites IS 'Array of restaurant IDs that the user has favorited';
COMMENT ON COLUMN profiles.favorite_deals IS 'Array of deal IDs that the user has favorited';

-- Test the new column
SELECT 'Deal favorites functionality added successfully' as status;



