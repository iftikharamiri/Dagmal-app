-- Update opening hours for Hjerterommet Kaffebar
-- Run this in your Supabase SQL Editor

-- Opening hours structure:
-- Mandag til torsdag: 07:45 - 15:00
-- Fredag: 07:45 - 14:00
-- Lørdag og søndag: Stengt

UPDATE restaurants
SET opening_hours = '{
  "monday": { "open": "07:45", "close": "15:00", "closed": false },
  "tuesday": { "open": "07:45", "close": "15:00", "closed": false },
  "wednesday": { "open": "07:45", "close": "15:00", "closed": false },
  "thursday": { "open": "07:45", "close": "15:00", "closed": false },
  "friday": { "open": "07:45", "close": "14:00", "closed": false },
  "saturday": { "open": "07:45", "close": "15:00", "closed": true },
  "sunday": { "open": "07:45", "close": "15:00", "closed": true }
}'::jsonb
WHERE LOWER(name) LIKE '%hjerterommet%'
   OR LOWER(name) LIKE '%hjerterommet kaffebar%';

