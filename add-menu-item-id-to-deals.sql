-- Add menu_item_id to deals table
-- This allows deals to reference menu items with price_tiers (student/ansatt pricing)

ALTER TABLE deals 
ADD COLUMN IF NOT EXISTS menu_item_id TEXT REFERENCES menu_items(id) ON DELETE SET NULL;

-- Add index for faster lookups
CREATE INDEX IF NOT EXISTS idx_deals_menu_item_id ON deals(menu_item_id);

-- Add comment
COMMENT ON COLUMN deals.menu_item_id IS 'Reference to menu_item for items with price_tiers (student/ansatt pricing). If set, both prices will be displayed.';

