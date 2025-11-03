-- =====================================================
-- DAGMAL PRODUCTION DATABASE SETUP
-- =====================================================
-- This script sets up the complete database schema for production
-- Run this in your Supabase SQL Editor

-- =====================================================
-- 1. ENABLE EXTENSIONS
-- =====================================================
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- =====================================================
-- 2. CREATE CUSTOM TYPES
-- =====================================================
-- Service types for claims
CREATE TYPE service_type AS ENUM ('dine_in', 'takeaway');

-- Claim status
CREATE TYPE claim_status AS ENUM ('pending', 'confirmed', 'ready', 'completed', 'cancelled');

-- Application status
CREATE TYPE application_status AS ENUM ('pending', 'approved', 'rejected');

-- =====================================================
-- 3. CREATE TABLES
-- =====================================================

-- Profiles table
CREATE TABLE IF NOT EXISTS profiles (
  id UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
  display_name TEXT,
  phone TEXT,
  cuisines TEXT[] DEFAULT '{}',
  dietary TEXT[] DEFAULT '{}',
  favorites TEXT[] DEFAULT '{}',
  favorite_deals TEXT[] DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Restaurants table
CREATE TABLE IF NOT EXISTS restaurants (
  id TEXT PRIMARY KEY DEFAULT 'rest-' || uuid_generate_v4()::TEXT,
  name TEXT NOT NULL,
  description TEXT,
  image_url TEXT,
  phone TEXT,
  address TEXT,
  city TEXT,
  lat DECIMAL(10, 8),
  lng DECIMAL(11, 8),
  categories TEXT[] DEFAULT '{}',
  dine_in BOOLEAN DEFAULT true,
  takeaway BOOLEAN DEFAULT true,
  menu_pdf_url TEXT,
  owner_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Deals table
CREATE TABLE IF NOT EXISTS deals (
  id TEXT PRIMARY KEY DEFAULT 'deal-' || uuid_generate_v4()::TEXT,
  restaurant_id TEXT REFERENCES restaurants(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  image_url TEXT,
  original_price INTEGER, -- in øre (cents)
  discount_percentage INTEGER NOT NULL,
  final_price INTEGER, -- in øre (cents)
  available_for service_type[] DEFAULT '{dine_in,takeaway}',
  dietary_info TEXT[] DEFAULT '{}',
  available_days TEXT[] DEFAULT '{"1","2","3","4","5","6","7"}',
  start_time TIME NOT NULL,
  end_time TIME NOT NULL,
  per_user_limit INTEGER DEFAULT 1,
  total_limit INTEGER, -- NULL means unlimited
  claimed_count INTEGER DEFAULT 0,
  is_active BOOLEAN DEFAULT true,
  verification_code TEXT NOT NULL DEFAULT 'VERIFY-' || substr(md5(random()::text), 1, 6),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Claims table
CREATE TABLE IF NOT EXISTS claims (
  id TEXT PRIMARY KEY DEFAULT 'claim-' || uuid_generate_v4()::TEXT,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  deal_id TEXT REFERENCES deals(id) ON DELETE CASCADE,
  restaurant_id TEXT REFERENCES restaurants(id) ON DELETE CASCADE,
  quantity INTEGER NOT NULL DEFAULT 1,
  service_type service_type NOT NULL,
  first_name TEXT,
  last_name TEXT,
  claim_date DATE,
  phone TEXT,
  special_requests TEXT,
  status claim_status DEFAULT 'pending',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Notifications table
CREATE TABLE IF NOT EXISTS notifications (
  id TEXT PRIMARY KEY DEFAULT 'notif-' || uuid_generate_v4()::TEXT,
  restaurant_id TEXT NOT NULL REFERENCES restaurants(id) ON DELETE CASCADE,
  deal_id TEXT NOT NULL REFERENCES deals(id) ON DELETE CASCADE,
  claim_id TEXT NOT NULL REFERENCES claims(id) ON DELETE CASCADE,
  customer_name TEXT NOT NULL,
  customer_phone TEXT,
  deal_title TEXT NOT NULL,
  quantity INTEGER NOT NULL DEFAULT 1,
  service_type service_type NOT NULL,
  claim_date DATE NOT NULL,
  is_read BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Restaurant applications table
CREATE TABLE IF NOT EXISTS restaurant_applications (
  id TEXT PRIMARY KEY DEFAULT 'app-' || uuid_generate_v4()::TEXT,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  restaurant_name TEXT NOT NULL,
  contact_name TEXT NOT NULL,
  contact_email TEXT NOT NULL,
  contact_phone TEXT NOT NULL,
  restaurant_address TEXT NOT NULL,
  city TEXT NOT NULL,
  cuisine_types TEXT[] DEFAULT '{}',
  description TEXT,
  status application_status DEFAULT 'pending',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Menu items table
CREATE TABLE IF NOT EXISTS menu_items (
  id TEXT PRIMARY KEY DEFAULT 'menu-' || uuid_generate_v4()::TEXT,
  restaurant_id TEXT REFERENCES restaurants(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  price INTEGER, -- in øre (cents)
  category TEXT,
  is_available BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- =====================================================
-- 4. CREATE INDEXES FOR PERFORMANCE
-- =====================================================

-- Profiles indexes
CREATE INDEX IF NOT EXISTS idx_profiles_favorites ON profiles USING GIN (favorites);
CREATE INDEX IF NOT EXISTS idx_profiles_favorite_deals ON profiles USING GIN (favorite_deals);
CREATE INDEX IF NOT EXISTS idx_profiles_cuisines ON profiles USING GIN (cuisines);

-- Restaurants indexes
CREATE INDEX IF NOT EXISTS idx_restaurants_owner ON restaurants(owner_id);
CREATE INDEX IF NOT EXISTS idx_restaurants_city ON restaurants(city);
CREATE INDEX IF NOT EXISTS idx_restaurants_categories ON restaurants USING GIN (categories);
CREATE INDEX IF NOT EXISTS idx_restaurants_active ON restaurants(is_active);
CREATE INDEX IF NOT EXISTS idx_restaurants_location ON restaurants(lat, lng);

-- Deals indexes
CREATE INDEX IF NOT EXISTS idx_deals_restaurant ON deals(restaurant_id);
CREATE INDEX IF NOT EXISTS idx_deals_active ON deals(is_active);
CREATE INDEX IF NOT EXISTS idx_deals_available_for ON deals USING GIN (available_for);
CREATE INDEX IF NOT EXISTS idx_deals_dietary ON deals USING GIN (dietary_info);
CREATE INDEX IF NOT EXISTS idx_deals_created_at ON deals(created_at);
CREATE INDEX IF NOT EXISTS idx_deals_discount ON deals(discount_percentage);

-- Claims indexes
CREATE INDEX IF NOT EXISTS idx_claims_user ON claims(user_id);
CREATE INDEX IF NOT EXISTS idx_claims_deal ON claims(deal_id);
CREATE INDEX IF NOT EXISTS idx_claims_restaurant ON claims(restaurant_id);
CREATE INDEX IF NOT EXISTS idx_claims_status ON claims(status);
CREATE INDEX IF NOT EXISTS idx_claims_created_at ON claims(created_at);
CREATE INDEX IF NOT EXISTS idx_claims_claim_date ON claims(claim_date);

-- Notifications indexes
CREATE INDEX IF NOT EXISTS idx_notifications_restaurant ON notifications(restaurant_id);
CREATE INDEX IF NOT EXISTS idx_notifications_created_at ON notifications(created_at);
CREATE INDEX IF NOT EXISTS idx_notifications_is_read ON notifications(is_read);

-- Applications indexes
CREATE INDEX IF NOT EXISTS idx_applications_user ON restaurant_applications(user_id);
CREATE INDEX IF NOT EXISTS idx_applications_status ON restaurant_applications(status);
CREATE INDEX IF NOT EXISTS idx_applications_created_at ON restaurant_applications(created_at);

-- Menu items indexes
CREATE INDEX IF NOT EXISTS idx_menu_items_restaurant ON menu_items(restaurant_id);
CREATE INDEX IF NOT EXISTS idx_menu_items_category ON menu_items(category);
CREATE INDEX IF NOT EXISTS idx_menu_items_available ON menu_items(is_available);

-- =====================================================
-- 5. CREATE FUNCTIONS AND TRIGGERS
-- =====================================================

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Triggers for updated_at
CREATE TRIGGER update_profiles_updated_at BEFORE UPDATE ON profiles
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_restaurants_updated_at BEFORE UPDATE ON restaurants
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_deals_updated_at BEFORE UPDATE ON deals
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_applications_updated_at BEFORE UPDATE ON restaurant_applications
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Function to update claimed_count when claims are made
CREATE OR REPLACE FUNCTION update_claimed_count()
RETURNS TRIGGER AS $$
BEGIN
    IF TG_OP = 'INSERT' THEN
        UPDATE deals 
        SET claimed_count = claimed_count + NEW.quantity
        WHERE id = NEW.deal_id;
        RETURN NEW;
    ELSIF TG_OP = 'DELETE' THEN
        UPDATE deals 
        SET claimed_count = claimed_count - OLD.quantity
        WHERE id = OLD.deal_id;
        RETURN OLD;
    ELSIF TG_OP = 'UPDATE' THEN
        UPDATE deals 
        SET claimed_count = claimed_count - OLD.quantity + NEW.quantity
        WHERE id = NEW.deal_id;
        RETURN NEW;
    END IF;
    RETURN NULL;
END;
$$ language 'plpgsql';

-- Trigger for claimed_count
CREATE TRIGGER update_deals_claimed_count
    AFTER INSERT OR UPDATE OR DELETE ON claims
    FOR EACH ROW EXECUTE FUNCTION update_claimed_count();

-- =====================================================
-- 6. ROW LEVEL SECURITY (RLS) POLICIES
-- =====================================================

-- Enable RLS on all tables
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE restaurants ENABLE ROW LEVEL SECURITY;
ALTER TABLE deals ENABLE ROW LEVEL SECURITY;
ALTER TABLE claims ENABLE ROW LEVEL SECURITY;
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE restaurant_applications ENABLE ROW LEVEL SECURITY;
ALTER TABLE menu_items ENABLE ROW LEVEL SECURITY;

-- Profiles policies
CREATE POLICY "Users can view own profile" ON profiles
    FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Users can update own profile" ON profiles
    FOR UPDATE USING (auth.uid() = id);

CREATE POLICY "Users can insert own profile" ON profiles
    FOR INSERT WITH CHECK (auth.uid() = id);

-- Restaurants policies
CREATE POLICY "Anyone can view active restaurants" ON restaurants
    FOR SELECT USING (is_active = true);

CREATE POLICY "Restaurant owners can manage their restaurants" ON restaurants
    FOR ALL USING (auth.uid() = owner_id);

-- Deals policies
CREATE POLICY "Anyone can view active deals" ON deals
    FOR SELECT USING (is_active = true);

CREATE POLICY "Restaurant owners can manage their deals" ON deals
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM restaurants 
            WHERE id = deals.restaurant_id 
            AND owner_id = auth.uid()
        )
    );

-- Claims policies
CREATE POLICY "Users can view own claims" ON claims
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can create own claims" ON claims
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Restaurant owners can view claims for their restaurants" ON claims
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM restaurants 
            WHERE id = claims.restaurant_id 
            AND owner_id = auth.uid()
        )
    );

-- Notifications policies
CREATE POLICY "Restaurant owners can view their notifications" ON notifications
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM restaurants 
            WHERE id = notifications.restaurant_id 
            AND owner_id = auth.uid()
        )
    );

CREATE POLICY "Restaurant owners can update their notifications" ON notifications
    FOR UPDATE USING (
        EXISTS (
            SELECT 1 FROM restaurants 
            WHERE id = notifications.restaurant_id 
            AND owner_id = auth.uid()
        )
    );

-- Applications policies
CREATE POLICY "Users can view own applications" ON restaurant_applications
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can create applications" ON restaurant_applications
    FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Menu items policies
CREATE POLICY "Anyone can view menu items" ON menu_items
    FOR SELECT USING (true);

CREATE POLICY "Restaurant owners can manage their menu items" ON menu_items
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM restaurants 
            WHERE id = menu_items.restaurant_id 
            AND owner_id = auth.uid()
        )
    );

-- =====================================================
-- 7. SAMPLE DATA FOR TESTING
-- =====================================================

-- Insert sample restaurants (only if they don't exist)
INSERT INTO restaurants (id, name, description, phone, address, city, lat, lng, categories, owner_id)
VALUES 
    ('rest-1', 'Fjord & Furu', 'Sesongbasert norsk mat', '+47 40000000', 'Karl Johans gate 10', 'Oslo', 59.9139, 10.7522, '{"Norsk", "Moderne"}', NULL),
    ('rest-2', 'Bella Vista', 'Autentisk italiensk pizza', '+47 45000000', 'Aker Brygge 5', 'Oslo', 59.9107, 10.7327, '{"Italiensk", "Pizza"}', NULL),
    ('rest-3', 'Sushi Zen', 'Fersk sushi og japansk mat', '+47 42000000', 'Grünerløkka 15', 'Oslo', 59.9200, 10.7500, '{"Japansk", "Sushi"}', NULL)
ON CONFLICT (id) DO NOTHING;

-- Insert sample deals (only if they don't exist)
INSERT INTO deals (id, restaurant_id, title, description, original_price, discount_percentage, final_price, start_time, end_time, total_limit, claimed_count)
VALUES 
    ('deal-1', 'rest-1', 'Laks med poteter', 'Fersk laks med nye poteter', 25000, 20, 20000, '11:00', '15:00', 10, 3),
    ('deal-2', 'rest-2', 'Pizza Margherita', 'Klassisk italiensk pizza', 18000, 25, 13500, '12:00', '22:00', 15, 7),
    ('deal-3', 'rest-3', 'Sushi Combo', '12 stk sushi med miso suppe', 30000, 30, 21000, '17:00', '21:00', 8, 2)
ON CONFLICT (id) DO NOTHING;

-- =====================================================
-- 8. COMMENTS FOR DOCUMENTATION
-- =====================================================

COMMENT ON TABLE profiles IS 'User profiles with preferences and favorites';
COMMENT ON TABLE restaurants IS 'Restaurant information and details';
COMMENT ON TABLE deals IS 'Food deals and offers from restaurants';
COMMENT ON TABLE claims IS 'User claims for deals';
COMMENT ON TABLE notifications IS 'Notifications for restaurant owners when deals are claimed';
COMMENT ON TABLE restaurant_applications IS 'Applications from restaurants wanting to join the platform';
COMMENT ON TABLE menu_items IS 'Menu items for restaurants';

-- =====================================================
-- 9. VERIFICATION QUERIES
-- =====================================================

-- Check if all tables exist
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public' 
AND table_name IN ('profiles', 'restaurants', 'deals', 'claims', 'notifications', 'restaurant_applications', 'menu_items')
ORDER BY table_name;

-- Check if indexes exist
SELECT indexname 
FROM pg_indexes 
WHERE schemaname = 'public' 
AND indexname LIKE 'idx_%'
ORDER BY indexname;

-- Check if RLS is enabled
SELECT schemaname, tablename, rowsecurity 
FROM pg_tables 
WHERE schemaname = 'public' 
AND tablename IN ('profiles', 'restaurants', 'deals', 'claims', 'notifications', 'restaurant_applications', 'menu_items')
ORDER BY tablename;

SELECT 'Database setup completed successfully!' as status;






