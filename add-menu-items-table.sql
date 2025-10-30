-- Add menu_items table to the database
-- Run this in your Supabase SQL Editor

-- Menu items table
CREATE TABLE menu_items (
  id TEXT PRIMARY KEY DEFAULT 'menu-' || uuid_generate_v4()::TEXT,
  restaurant_id TEXT REFERENCES restaurants(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  price INTEGER NOT NULL, -- in øre (Norwegian currency subunit)
  category TEXT,
  dietary_info TEXT[] DEFAULT '{}',
  image_url TEXT,
  is_available BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS on menu_items table
ALTER TABLE menu_items ENABLE ROW LEVEL SECURITY;

-- Menu items policies
CREATE POLICY "Anyone can view available menu items" ON menu_items FOR SELECT USING (is_available = true);
CREATE POLICY "Restaurant owners can manage their menu items" ON menu_items FOR ALL USING (
  EXISTS (
    SELECT 1 FROM restaurants 
    WHERE restaurants.id = menu_items.restaurant_id 
    AND restaurants.owner_id = auth.uid()
  )
);

-- Indexes for better performance
CREATE INDEX idx_menu_items_restaurant ON menu_items(restaurant_id);
CREATE INDEX idx_menu_items_category ON menu_items(category);
CREATE INDEX idx_menu_items_available ON menu_items(is_available) WHERE is_available = true;
CREATE INDEX idx_menu_items_dietary ON menu_items USING GIN(dietary_info);

-- Trigger for updated_at
CREATE TRIGGER update_menu_items_updated_at 
  BEFORE UPDATE ON menu_items 
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Add owner_id to restaurants table if it doesn't exist
DO $$ 
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                 WHERE table_name = 'restaurants' AND column_name = 'owner_id') THEN
    ALTER TABLE restaurants ADD COLUMN owner_id UUID REFERENCES auth.users(id) ON DELETE CASCADE;
  END IF;
END $$;

-- Update restaurants policies to include owner management
DROP POLICY IF EXISTS "Anyone can view restaurants" ON restaurants;
CREATE POLICY "Anyone can view restaurants" ON restaurants FOR SELECT USING (true);
CREATE POLICY "Restaurant owners can manage their restaurants" ON restaurants FOR ALL USING (owner_id = auth.uid());





