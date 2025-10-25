-- Update deals to have proper total_limit values for testing availability display
-- This ensures all deals have a total_limit so the availability count shows up

-- Update deals that have null total_limit to have a default limit
UPDATE deals 
SET total_limit = 10 
WHERE total_limit IS NULL;

-- Update deals that have 0 total_limit to have a default limit
UPDATE deals 
SET total_limit = 10 
WHERE total_limit = 0;

-- Ensure claimed_count is not null
UPDATE deals 
SET claimed_count = 0 
WHERE claimed_count IS NULL;

-- Add some variety to the limits for testing
UPDATE deals 
SET total_limit = 8 
WHERE id IN (
  SELECT id FROM deals 
  WHERE title ILIKE '%burger%' 
  LIMIT 1
);

UPDATE deals 
SET total_limit = 15 
WHERE id IN (
  SELECT id FROM deals 
  WHERE title ILIKE '%pizza%' 
  LIMIT 1
);

UPDATE deals 
SET total_limit = 5 
WHERE id IN (
  SELECT id FROM deals 
  WHERE title ILIKE '%laks%' OR title ILIKE '%salmon%'
  LIMIT 1
);

-- Test the updates
SELECT 
  id,
  title,
  total_limit,
  claimed_count,
  (total_limit - claimed_count) as remaining
FROM deals 
ORDER BY created_at DESC
LIMIT 10;
