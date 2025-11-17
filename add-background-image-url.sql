-- Add background_image_url column to restaurants table
-- Run this in Supabase SQL Editor

ALTER TABLE restaurants 
ADD COLUMN IF NOT EXISTS background_image_url TEXT;

-- Add comment to document the column
COMMENT ON COLUMN restaurants.background_image_url IS 'URL to the background image for the restaurant, stored in Supabase Storage';

