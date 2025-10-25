-- Norwegian Restaurant Deals Database Schema
-- Run this in your Supabase SQL Editor

-- Enable necessary extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- User profiles table
CREATE TABLE profiles (
  id UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
  display_name TEXT,
  phone TEXT,
  cuisines TEXT[] DEFAULT '{}',
  dietary TEXT[] DEFAULT '{}',
  favorites TEXT[] DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Restaurants table
CREATE TABLE restaurants (
  id TEXT PRIMARY KEY DEFAULT 'rest-' || uuid_generate_v4()::TEXT,
  name TEXT NOT NULL,
  description TEXT,
  image_url TEXT,
  phone TEXT,
  address TEXT,
  city TEXT,
  lat DECIMAL,
  lng DECIMAL,
  categories TEXT[] DEFAULT '{}',
  dine_in BOOLEAN DEFAULT true,
  takeaway BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Deals table
CREATE TABLE deals (
  id TEXT PRIMARY KEY DEFAULT 'deal-' || uuid_generate_v4()::TEXT,
  restaurant_id TEXT REFERENCES restaurants(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  image_url TEXT,
  original_price INTEGER NOT NULL, -- in øre (Norwegian currency subunit)
  discount_percentage INTEGER NOT NULL CHECK (discount_percentage > 0 AND discount_percentage <= 100),
  final_price INTEGER GENERATED ALWAYS AS (original_price * (100 - discount_percentage) / 100) STORED,
  available_for TEXT[] DEFAULT '{}' CHECK (available_for <@ ARRAY['dine_in', 'takeaway']),
  dietary_info TEXT[] DEFAULT '{}',
  available_days TEXT[] DEFAULT '{}' CHECK (available_days <@ ARRAY['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday']),
  start_time TIME,
  end_time TIME,
  per_user_limit INTEGER DEFAULT 1,
  total_limit INTEGER,
  claimed_count INTEGER DEFAULT 0,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Claims table
CREATE TABLE claims (
  id TEXT PRIMARY KEY DEFAULT 'claim-' || uuid_generate_v4()::TEXT,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  deal_id TEXT REFERENCES deals(id) ON DELETE CASCADE,
  restaurant_id TEXT REFERENCES restaurants(id) ON DELETE CASCADE,
  quantity INTEGER NOT NULL DEFAULT 1,
  service_type TEXT NOT NULL CHECK (service_type IN ('dine_in', 'takeaway')),
  phone TEXT,
  special_requests TEXT,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'confirmed', 'ready', 'completed', 'cancelled')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Row Level Security (RLS) Policies

-- Enable RLS on all tables
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE restaurants ENABLE ROW LEVEL SECURITY;
ALTER TABLE deals ENABLE ROW LEVEL SECURITY;
ALTER TABLE claims ENABLE ROW LEVEL SECURITY;

-- Profiles policies
CREATE POLICY "Users can view own profile" ON profiles FOR SELECT USING (auth.uid() = id);
CREATE POLICY "Users can update own profile" ON profiles FOR UPDATE USING (auth.uid() = id);
CREATE POLICY "Users can insert own profile" ON profiles FOR INSERT WITH CHECK (auth.uid() = id);

-- Restaurants policies (public read)
CREATE POLICY "Anyone can view restaurants" ON restaurants FOR SELECT USING (true);

-- Deals policies (public read)
CREATE POLICY "Anyone can view active deals" ON deals FOR SELECT USING (is_active = true);

-- Claims policies
CREATE POLICY "Users can view own claims" ON claims FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can create claims" ON claims FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own claims" ON claims FOR UPDATE USING (auth.uid() = user_id);

-- Indexes for better performance
CREATE INDEX idx_restaurants_location ON restaurants(lat, lng);
CREATE INDEX idx_deals_restaurant ON deals(restaurant_id);
CREATE INDEX idx_deals_active ON deals(is_active) WHERE is_active = true;
CREATE INDEX idx_deals_available_days ON deals USING GIN(available_days);
CREATE INDEX idx_claims_user ON claims(user_id);
CREATE INDEX idx_claims_deal ON claims(deal_id);

-- Functions for updated_at timestamps
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Triggers for updated_at
CREATE TRIGGER update_profiles_updated_at BEFORE UPDATE ON profiles FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Function to automatically create profile on user signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, display_name)
  VALUES (NEW.id, COALESCE(NEW.raw_user_meta_data->>'display_name', split_part(NEW.email, '@', 1)));
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger for new user signup
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();
