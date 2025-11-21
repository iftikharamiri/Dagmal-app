-- Update opening hours for Charlie's Diner
-- Run this in your Supabase SQL Editor

-- Opening hours structure:
-- Fredag, mandag, onsdag: 10-22
-- Lørdag, tirsdag, torsdag: 11-22
-- Søndag: 12-22

UPDATE restaurants
SET opening_hours = '{
  "monday": { "open": "10:00", "close": "22:00", "closed": false },
  "tuesday": { "open": "11:00", "close": "22:00", "closed": false },
  "wednesday": { "open": "10:00", "close": "22:00", "closed": false },
  "thursday": { "open": "11:00", "close": "22:00", "closed": false },
  "friday": { "open": "10:00", "close": "22:00", "closed": false },
  "saturday": { "open": "11:00", "close": "22:00", "closed": false },
  "sunday": { "open": "12:00", "close": "22:00", "closed": false }
}'::jsonb
WHERE LOWER(name) LIKE '%charlie%';

