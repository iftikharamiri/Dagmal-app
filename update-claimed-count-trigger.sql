-- Trigger to automatically update claimed_count when claims are made or updated
-- Run this in your Supabase SQL Editor

-- Function to update claimed count
CREATE OR REPLACE FUNCTION update_claimed_count()
RETURNS TRIGGER AS $$
BEGIN
  -- Handle INSERT (new claim)
  IF TG_OP = 'INSERT' THEN
    UPDATE deals 
    SET claimed_count = claimed_count + NEW.quantity
    WHERE id = NEW.deal_id;
    RETURN NEW;
  END IF;
  
  -- Handle DELETE (claim cancelled/deleted)
  IF TG_OP = 'DELETE' THEN
    UPDATE deals 
    SET claimed_count = GREATEST(0, claimed_count - OLD.quantity)
    WHERE id = OLD.deal_id;
    RETURN OLD;
  END IF;
  
  -- Handle UPDATE (claim quantity changed)
  IF TG_OP = 'UPDATE' THEN
    -- Only update if quantity changed
    IF NEW.quantity != OLD.quantity THEN
      UPDATE deals 
      SET claimed_count = claimed_count - OLD.quantity + NEW.quantity
      WHERE id = NEW.deal_id;
    END IF;
    RETURN NEW;
  END IF;
  
  RETURN NULL;
END;
$$ LANGUAGE plpgsql;

-- Create triggers for all claim operations
DROP TRIGGER IF EXISTS update_claimed_count_insert ON claims;
DROP TRIGGER IF EXISTS update_claimed_count_update ON claims;  
DROP TRIGGER IF EXISTS update_claimed_count_delete ON claims;

CREATE TRIGGER update_claimed_count_insert
  AFTER INSERT ON claims
  FOR EACH ROW EXECUTE FUNCTION update_claimed_count();

CREATE TRIGGER update_claimed_count_update
  AFTER UPDATE ON claims
  FOR EACH ROW EXECUTE FUNCTION update_claimed_count();

CREATE TRIGGER update_claimed_count_delete
  AFTER DELETE ON claims
  FOR EACH ROW EXECUTE FUNCTION update_claimed_count();

-- Recalculate existing claimed counts (run once to fix existing data)
UPDATE deals 
SET claimed_count = (
  SELECT COALESCE(SUM(quantity), 0)
  FROM claims 
  WHERE claims.deal_id = deals.id
);






























