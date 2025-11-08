-- Fix the deals table schema to allow manual final_price values
-- Run this in your Supabase SQL Editor

-- 1. Remove the DEFAULT constraint and computed column behavior from final_price
ALTER TABLE deals 
ALTER COLUMN final_price DROP DEFAULT;

-- 2. If final_price is a computed column, we need to recreate it as a regular column
-- First, let's check if we need to drop any constraints or triggers

-- 3. Ensure final_price can accept manual values
-- (This should now work with the DEFAULT constraint removed)

-- 4. Optional: Update any existing records to have proper final_price values
-- (Skip this if your table is empty)
UPDATE deals 
SET final_price = CASE 
  WHEN discount_percentage > 0 AND original_price > 0 
  THEN ROUND(original_price * (100 - discount_percentage) / 100.0)
  ELSE original_price 
END
WHERE final_price IS NULL OR final_price = 0;

-- 5. Verify the change worked
SELECT column_name, column_default, is_nullable
FROM information_schema.columns 
WHERE table_name = 'deals' AND column_name = 'final_price';



































