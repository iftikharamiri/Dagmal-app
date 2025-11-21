-- Add opening_hours column to restaurants table
-- Run this in your Supabase SQL Editor

ALTER TABLE restaurants 
ADD COLUMN IF NOT EXISTS opening_hours JSONB;

-- Add comment to explain the structure
COMMENT ON COLUMN restaurants.opening_hours IS 'Opening hours stored as JSONB with structure: { "monday": { "open": "09:00", "close": "22:00", "closed": false }, ... }';

