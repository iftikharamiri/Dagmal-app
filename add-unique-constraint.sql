-- Add the missing unique constraint to menu_items table
-- This fixes the "ON CONFLICT" error

-- Check if the constraint already exists and add it if it doesn't
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint 
    WHERE conname = 'menu_items_restaurant_id_name_key'
  ) THEN
    ALTER TABLE menu_items ADD CONSTRAINT menu_items_restaurant_id_name_key 
    UNIQUE (restaurant_id, name);
    RAISE NOTICE 'Added unique constraint on (restaurant_id, name)';
  ELSE
    RAISE NOTICE 'Unique constraint already exists';
  END IF;
END $$;

-- Verify the constraint was added
SELECT 
  conname as constraint_name,
  contype as constraint_type,
  pg_get_constraintdef(oid) as constraint_definition
FROM pg_constraint 
WHERE conrelid = 'menu_items'::regclass 
AND conname = 'menu_items_restaurant_id_name_key';








