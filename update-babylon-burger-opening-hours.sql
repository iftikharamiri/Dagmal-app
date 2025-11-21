-- Update opening hours for Babylon Burger
-- Run this in your Supabase SQL Editor

-- Opening hours structure:
-- Mandag-torsdag og søndag: 13-21
-- Fredag-lørdag: 13-22

UPDATE restaurants
SET opening_hours = '{
  "monday": { "open": "13:00", "close": "21:00", "closed": false },
  "tuesday": { "open": "13:00", "close": "21:00", "closed": false },
  "wednesday": { "open": "13:00", "close": "21:00", "closed": false },
  "thursday": { "open": "13:00", "close": "21:00", "closed": false },
  "friday": { "open": "13:00", "close": "22:00", "closed": false },
  "saturday": { "open": "13:00", "close": "22:00", "closed": false },
  "sunday": { "open": "13:00", "close": "21:00", "closed": false }
}'::jsonb
WHERE LOWER(name) LIKE '%babylon%';

