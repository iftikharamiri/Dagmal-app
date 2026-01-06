-- Fix for claimed_count not updating for deals without total_limit
-- Run this in your Supabase SQL Editor to fix existing data and update the trigger

-- Step 1: Fix the trigger function to handle NULL values
CREATE OR REPLACE FUNCTION public.update_claimed_count()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Handle INSERT (new claim)
  IF TG_OP = 'INSERT' THEN
    UPDATE deals 
    SET claimed_count = COALESCE(claimed_count, 0) + NEW.quantity
    WHERE id = NEW.deal_id;
    RETURN NEW;
  END IF;
  
  -- Handle DELETE (claim cancelled/deleted)
  IF TG_OP = 'DELETE' THEN
    UPDATE deals 
    SET claimed_count = GREATEST(0, COALESCE(claimed_count, 0) - OLD.quantity)
    WHERE id = OLD.deal_id;
    RETURN OLD;
  END IF;
  
  -- Handle UPDATE (claim quantity changed)
  IF TG_OP = 'UPDATE' THEN
    -- Only update if quantity changed
    IF NEW.quantity != OLD.quantity THEN
      UPDATE deals 
      SET claimed_count = COALESCE(claimed_count, 0) - OLD.quantity + NEW.quantity
      WHERE id = NEW.deal_id;
    END IF;
    RETURN NEW;
  END IF;
  
  RETURN NULL;
END;
$$;

-- Step 2: Fix all existing deals where claimed_count is NULL
-- Set them to 0 or recalculate from actual claims
UPDATE deals 
SET claimed_count = COALESCE((
  SELECT SUM(quantity)
  FROM claims 
  WHERE claims.deal_id = deals.id
), 0)
WHERE claimed_count IS NULL;

-- Step 3: Ensure claimed_count defaults to 0 for future deals
-- (This is already in the schema, but we ensure it here)
ALTER TABLE deals 
ALTER COLUMN claimed_count SET DEFAULT 0;

-- Step 4: Recreate triggers to ensure they use the updated function
DROP TRIGGER IF EXISTS update_claimed_count_insert ON claims;
DROP TRIGGER IF EXISTS update_claimed_count_update ON claims;  
DROP TRIGGER IF EXISTS update_claimed_count_delete ON claims;
DROP TRIGGER IF EXISTS update_deals_claimed_count ON claims;

CREATE TRIGGER update_claimed_count_insert
  AFTER INSERT ON claims
  FOR EACH ROW EXECUTE FUNCTION update_claimed_count();

CREATE TRIGGER update_claimed_count_update
  AFTER UPDATE ON claims
  FOR EACH ROW EXECUTE FUNCTION update_claimed_count();

CREATE TRIGGER update_claimed_count_delete
  AFTER DELETE ON claims
  FOR EACH ROW EXECUTE FUNCTION update_claimed_count();

-- Step 5: Recalculate all claimed counts from actual claims data
-- This ensures accuracy for all deals (with or without total_limit)
UPDATE deals 
SET claimed_count = COALESCE((
  SELECT SUM(quantity)
  FROM claims 
  WHERE claims.deal_id = deals.id
), 0);




