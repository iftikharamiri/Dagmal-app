-- =====================================================
-- DAGMAL INCREMENTAL DATABASE UPDATE
-- =====================================================
-- This script safely updates your existing database for production
-- Run this in your existing Supabase SQL Editor

-- =====================================================
-- 1. ADD MISSING COLUMNS SAFELY
-- =====================================================

-- Add is_active column to restaurants if it doesn't exist
ALTER TABLE restaurants 
ADD COLUMN IF NOT EXISTS is_active BOOLEAN DEFAULT true;

-- Add updated_at column to restaurants if it doesn't exist
ALTER TABLE restaurants 
ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW();

-- Add favorite_deals column to profiles if it doesn't exist
ALTER TABLE profiles 
ADD COLUMN IF NOT EXISTS favorite_deals TEXT[] DEFAULT '{}';

-- Add first_name and last_name to claims if they don't exist
ALTER TABLE claims 
ADD COLUMN IF NOT EXISTS first_name TEXT,
ADD COLUMN IF NOT EXISTS last_name TEXT;

-- Add claim_date to claims if it doesn't exist
ALTER TABLE claims 
ADD COLUMN IF NOT EXISTS claim_date DATE;

-- =====================================================
-- 2. CREATE MISSING TABLES
-- =====================================================

-- Create notifications table if it doesn't exist
CREATE TABLE IF NOT EXISTS notifications (
  id TEXT PRIMARY KEY DEFAULT 'notif-' || uuid_generate_v4()::TEXT,
  restaurant_id TEXT NOT NULL REFERENCES restaurants(id) ON DELETE CASCADE,
  deal_id TEXT NOT NULL REFERENCES deals(id) ON DELETE CASCADE,
  claim_id TEXT NOT NULL REFERENCES claims(id) ON DELETE CASCADE,
  customer_name TEXT NOT NULL,
  customer_phone TEXT,
  deal_title TEXT NOT NULL,
  quantity INTEGER NOT NULL DEFAULT 1,
  service_type TEXT NOT NULL CHECK (service_type IN ('dine_in', 'takeaway')),
  claim_date DATE NOT NULL,
  is_read BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create restaurant_applications table if it doesn't exist
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
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create menu_items table if it doesn't exist
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
-- 3. ADD MISSING INDEXES
-- =====================================================

-- Add indexes for performance (only if they don't exist)
CREATE INDEX IF NOT EXISTS idx_profiles_favorite_deals ON profiles USING GIN (favorite_deals);
CREATE INDEX IF NOT EXISTS idx_restaurants_is_active ON restaurants(is_active);
CREATE INDEX IF NOT EXISTS idx_restaurants_owner ON restaurants(owner_id);
CREATE INDEX IF NOT EXISTS idx_deals_is_active ON deals(is_active);
CREATE INDEX IF NOT EXISTS idx_deals_restaurant ON deals(restaurant_id);
CREATE INDEX IF NOT EXISTS idx_claims_user ON claims(user_id);
CREATE INDEX IF NOT EXISTS idx_claims_deal ON claims(deal_id);
CREATE INDEX IF NOT EXISTS idx_claims_restaurant ON claims(restaurant_id);
CREATE INDEX IF NOT EXISTS idx_notifications_restaurant ON notifications(restaurant_id);
CREATE INDEX IF NOT EXISTS idx_notifications_created_at ON notifications(created_at);
CREATE INDEX IF NOT EXISTS idx_notifications_is_read ON notifications(is_read);

-- =====================================================
-- 4. ADD MISSING FUNCTIONS AND TRIGGERS
-- =====================================================

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Add triggers for updated_at (only if they don't exist)
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'update_restaurants_updated_at') THEN
        CREATE TRIGGER update_restaurants_updated_at 
        BEFORE UPDATE ON restaurants
        FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
    END IF;
END $$;

DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'update_deals_updated_at') THEN
        CREATE TRIGGER update_deals_updated_at 
        BEFORE UPDATE ON deals
        FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
    END IF;
END $$;

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

-- Add trigger for claimed_count (only if it doesn't exist)
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'update_deals_claimed_count') THEN
        CREATE TRIGGER update_deals_claimed_count
        AFTER INSERT OR UPDATE OR DELETE ON claims
        FOR EACH ROW EXECUTE FUNCTION update_claimed_count();
    END IF;
END $$;

-- =====================================================
-- 5. UPDATE EXISTING DATA
-- =====================================================

-- Set is_active to true for all existing restaurants
UPDATE restaurants SET is_active = true WHERE is_active IS NULL;

-- Set total_limit for deals that don't have it (optional - you can adjust this)
UPDATE deals 
SET total_limit = 10 
WHERE total_limit IS NULL;

-- =====================================================
-- 6. ENABLE ROW LEVEL SECURITY (if not already enabled)
-- =====================================================

-- Enable RLS on tables (only if not already enabled)
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE restaurants ENABLE ROW LEVEL SECURITY;
ALTER TABLE deals ENABLE ROW LEVEL SECURITY;
ALTER TABLE claims ENABLE ROW LEVEL SECURITY;
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE restaurant_applications ENABLE ROW LEVEL SECURITY;
ALTER TABLE menu_items ENABLE ROW LEVEL SECURITY;

-- =====================================================
-- 7. ADD BASIC RLS POLICIES (if they don't exist)
-- =====================================================

-- Profiles policies
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'profiles' AND policyname = 'Users can view own profile') THEN
        CREATE POLICY "Users can view own profile" ON profiles
            FOR SELECT USING (auth.uid() = id);
    END IF;
END $$;

DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'profiles' AND policyname = 'Users can update own profile') THEN
        CREATE POLICY "Users can update own profile" ON profiles
            FOR UPDATE USING (auth.uid() = id);
    END IF;
END $$;

-- Restaurants policies
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'restaurants' AND policyname = 'Anyone can view active restaurants') THEN
        CREATE POLICY "Anyone can view active restaurants" ON restaurants
            FOR SELECT USING (is_active = true);
    END IF;
END $$;

-- Deals policies
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'deals' AND policyname = 'Anyone can view active deals') THEN
        CREATE POLICY "Anyone can view active deals" ON deals
            FOR SELECT USING (is_active = true);
    END IF;
END $$;

-- Claims policies
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'claims' AND policyname = 'Users can view own claims') THEN
        CREATE POLICY "Users can view own claims" ON claims
            FOR SELECT USING (auth.uid() = user_id);
    END IF;
END $$;

DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'claims' AND policyname = 'Users can create own claims') THEN
        CREATE POLICY "Users can create own claims" ON claims
            FOR INSERT WITH CHECK (auth.uid() = user_id);
    END IF;
END $$;

-- =====================================================
-- 8. VERIFICATION
-- =====================================================

-- Check if all required columns exist
SELECT 
    table_name,
    column_name,
    data_type
FROM information_schema.columns 
WHERE table_schema = 'public' 
AND table_name IN ('profiles', 'restaurants', 'deals', 'claims')
AND column_name IN ('is_active', 'favorite_deals', 'first_name', 'last_name', 'claim_date')
ORDER BY table_name, column_name;

-- Check if all tables exist
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public' 
AND table_name IN ('profiles', 'restaurants', 'deals', 'claims', 'notifications', 'restaurant_applications', 'menu_items')
ORDER BY table_name;

-- Check if RLS is enabled
SELECT 
    schemaname, 
    tablename, 
    rowsecurity as rls_enabled
FROM pg_tables 
WHERE schemaname = 'public' 
AND tablename IN ('profiles', 'restaurants', 'deals', 'claims', 'notifications')
ORDER BY tablename;

SELECT 'Incremental database update completed successfully!' as status;







