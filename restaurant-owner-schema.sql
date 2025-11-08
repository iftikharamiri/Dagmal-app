-- Additional schema for restaurant ownership and management
-- Run this in your Supabase SQL Editor AFTER the main schema

-- Add owner_id to restaurants table
ALTER TABLE restaurants ADD COLUMN IF NOT EXISTS owner_id UUID REFERENCES auth.users(id) ON DELETE CASCADE;

-- Add restaurant owner role enum
DO $$ BEGIN
    CREATE TYPE user_role AS ENUM ('customer', 'restaurant_owner', 'admin');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- Add role column to profiles
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS role user_role DEFAULT 'customer';

-- Create restaurant_applications table for pending registrations
CREATE TABLE IF NOT EXISTS restaurant_applications (
  id TEXT PRIMARY KEY DEFAULT 'app-' || uuid_generate_v4()::TEXT,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  restaurant_name TEXT NOT NULL,
  owner_name TEXT NOT NULL,
  email TEXT NOT NULL,
  phone TEXT NOT NULL,
  address TEXT NOT NULL,
  city TEXT NOT NULL,
  postal_code TEXT,
  description TEXT,
  cuisine_types TEXT[] DEFAULT '{}',
  
  -- Location data
  lat DECIMAL,
  lng DECIMAL,
  
  -- Opening hours (JSON format)
  opening_hours JSONB,
  
  -- Business info
  org_number TEXT,
  website_url TEXT,
  
  -- Application status
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected', 'under_review')),
  admin_notes TEXT,
  
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- RLS policies for restaurant_applications
ALTER TABLE restaurant_applications ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own applications" ON restaurant_applications 
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can create applications" ON restaurant_applications 
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own applications" ON restaurant_applications 
  FOR UPDATE USING (auth.uid() = user_id);

-- Update restaurants RLS to include owner access
DROP POLICY IF EXISTS "Anyone can view restaurants" ON restaurants;
DROP POLICY IF EXISTS "Public can view restaurants" ON restaurants;

CREATE POLICY "Anyone can view restaurants" ON restaurants FOR SELECT USING (true);
CREATE POLICY "Owners can update own restaurants" ON restaurants 
  FOR UPDATE USING (auth.uid() = owner_id);
CREATE POLICY "Owners can insert restaurants" ON restaurants 
  FOR INSERT WITH CHECK (auth.uid() = owner_id);

-- Update deals RLS to include restaurant owner access
CREATE POLICY "Restaurant owners can manage own deals" ON deals 
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM restaurants 
      WHERE restaurants.id = deals.restaurant_id 
      AND restaurants.owner_id = auth.uid()
    )
  );

-- Function to approve restaurant application
CREATE OR REPLACE FUNCTION approve_restaurant_application(application_id TEXT)
RETURNS TEXT
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  app_record restaurant_applications%ROWTYPE;
  new_restaurant_id TEXT;
BEGIN
  -- Get application details
  SELECT * INTO app_record FROM restaurant_applications WHERE id = application_id;
  
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Application not found';
  END IF;
  
  -- Create restaurant record
  INSERT INTO restaurants (
    owner_id, name, description, phone, address, city, 
    lat, lng, categories, created_at
  ) VALUES (
    app_record.user_id,
    app_record.restaurant_name,
    app_record.description,
    app_record.phone,
    app_record.address,
    app_record.city,
    app_record.lat,
    app_record.lng,
    app_record.cuisine_types,
    NOW()
  ) RETURNING id INTO new_restaurant_id;
  
  -- Update user role to restaurant_owner
  UPDATE profiles 
  SET role = 'restaurant_owner' 
  WHERE id = app_record.user_id;
  
  -- Update application status
  UPDATE restaurant_applications 
  SET status = 'approved', updated_at = NOW() 
  WHERE id = application_id;
  
  RETURN new_restaurant_id;
END;
$$;

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_restaurant_applications_user ON restaurant_applications(user_id);
CREATE INDEX IF NOT EXISTS idx_restaurant_applications_status ON restaurant_applications(status);
CREATE INDEX IF NOT EXISTS idx_restaurants_owner ON restaurants(owner_id);
CREATE INDEX IF NOT EXISTS idx_profiles_role ON profiles(role);



































