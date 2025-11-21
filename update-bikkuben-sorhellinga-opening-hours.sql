-- Update opening hours for Bikkuben and Sørhellinga
-- Run this in your Supabase SQL Editor

-- Opening hours structure:
-- Mandag til torsdag: 09:00 - 18:00
-- Fredag: 09:00 - 15:00
-- Lørdag og søndag: Stengt

UPDATE restaurants
SET opening_hours = '{
  "monday": { "open": "09:00", "close": "18:00", "closed": false },
  "tuesday": { "open": "09:00", "close": "18:00", "closed": false },
  "wednesday": { "open": "09:00", "close": "18:00", "closed": false },
  "thursday": { "open": "09:00", "close": "18:00", "closed": false },
  "friday": { "open": "09:00", "close": "15:00", "closed": false },
  "saturday": { "open": "09:00", "close": "18:00", "closed": true },
  "sunday": { "open": "09:00", "close": "18:00", "closed": true }
}'::jsonb
WHERE LOWER(name) LIKE '%bikkuben%' 
   OR LOWER(name) LIKE '%bikuben%'
   OR LOWER(name) LIKE '%sør hellinga%'
   OR LOWER(name) LIKE '%sørhellinga%'
   OR LOWER(name) LIKE '%sorhellinga%';

