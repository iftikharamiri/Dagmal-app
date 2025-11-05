-- Add selected_price_tiers to deals table
-- This stores which price tiers (student/ansatt) should be displayed for this deal

ALTER TABLE deals 
ADD COLUMN IF NOT EXISTS selected_price_tiers TEXT[] DEFAULT NULL;

-- Add comment
COMMENT ON COLUMN deals.selected_price_tiers IS 'Array of selected price tier types to display (e.g., ["student", "ansatt"]). Only used when menu_item_id has price_tiers.';

