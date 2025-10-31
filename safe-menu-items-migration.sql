-- Safe menu_items table migration for Supabase
-- This handles existing policies and tables gracefully

-- First, let's check what exists and create only what's missing

-- 1. Create menu_items table if it doesn't exist
CREATE TABLE IF NOT EXISTS menu_items (
  id TEXT PRIMARY KEY DEFAULT 'menu-' || gen_random_uuid()::TEXT,
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

-- 2. Enable RLS on menu_items table (safe to run multiple times)
ALTER TABLE menu_items ENABLE ROW LEVEL SECURITY;

-- 3. Drop existing policies if they exist, then create new ones
DROP POLICY IF EXISTS "Anyone can view available menu items" ON menu_items;
CREATE POLICY "Anyone can view available menu items" ON menu_items FOR SELECT USING (is_available = true);

DROP POLICY IF EXISTS "Restaurant owners can manage their menu items" ON menu_items;
CREATE POLICY "Restaurant owners can manage their menu items" ON menu_items FOR ALL USING (
  EXISTS (
    SELECT 1 FROM restaurants 
    WHERE restaurants.id = menu_items.restaurant_id 
    AND restaurants.owner_id = auth.uid()
  )
);

-- 4. Create indexes (safe to run multiple times)
CREATE INDEX IF NOT EXISTS idx_menu_items_restaurant ON menu_items(restaurant_id);
CREATE INDEX IF NOT EXISTS idx_menu_items_category ON menu_items(category);
CREATE INDEX IF NOT EXISTS idx_menu_items_available ON menu_items(is_available) WHERE is_available = true;
CREATE INDEX IF NOT EXISTS idx_menu_items_dietary ON menu_items USING GIN(dietary_info);

-- 5. Add owner_id to restaurants table if it doesn't exist
DO $$ 
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                 WHERE table_name = 'restaurants' AND column_name = 'owner_id') THEN
    ALTER TABLE restaurants ADD COLUMN owner_id UUID REFERENCES auth.users(id) ON DELETE CASCADE;
    RAISE NOTICE 'Added owner_id column to restaurants table';
  ELSE
    RAISE NOTICE 'owner_id column already exists in restaurants table';
  END IF;
END $$;

-- 6. Update restaurants policies safely
DROP POLICY IF EXISTS "Anyone can view restaurants" ON restaurants;
CREATE POLICY "Anyone can view restaurants" ON restaurants FOR SELECT USING (true);

-- Only create the owner policy if it doesn't exist
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'restaurants' 
    AND policyname = 'Restaurant owners can manage their restaurants'
  ) THEN
    CREATE POLICY "Restaurant owners can manage their restaurants" ON restaurants FOR ALL USING (owner_id = auth.uid());
    RAISE NOTICE 'Created restaurant owner policy';
  ELSE
    RAISE NOTICE 'Restaurant owner policy already exists';
  END IF;
END $$;

-- 7. Create the update trigger function if it doesn't exist
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- 8. Create trigger for updated_at (safe to run multiple times)
DROP TRIGGER IF EXISTS update_menu_items_updated_at ON menu_items;
CREATE TRIGGER update_menu_items_updated_at 
  BEFORE UPDATE ON menu_items 
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- 9. Test the setup
SELECT 
  'menu_items table' as component,
  CASE WHEN EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'menu_items') 
       THEN 'EXISTS' 
       ELSE 'MISSING' 
  END as status
UNION ALL
SELECT 
  'owner_id column' as component,
  CASE WHEN EXISTS (SELECT 1 FROM information_schema.columns 
                    WHERE table_name = 'restaurants' AND column_name = 'owner_id') 
       THEN 'EXISTS' 
       ELSE 'MISSING' 
  END as status
UNION ALL
SELECT 
  'RLS enabled' as component,
  CASE WHEN EXISTS (SELECT 1 FROM pg_class WHERE relname = 'menu_items' AND relrowsecurity = true)
       THEN 'ENABLED'
       ELSE 'DISABLED'
  END as status;








