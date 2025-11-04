-- Temporarily make deals and restaurants publicly readable for testing
-- Run this in your Supabase SQL Editor

-- Drop existing restrictive policies
DROP POLICY IF EXISTS "Anyone can view restaurants" ON restaurants;
DROP POLICY IF EXISTS "Anyone can view active deals" ON deals;

-- Create new public read policies
CREATE POLICY "Public can view restaurants" ON restaurants FOR SELECT USING (true);
CREATE POLICY "Public can view deals" ON deals FOR SELECT USING (true);

-- Also make sure restaurants table allows public access
ALTER TABLE restaurants ENABLE ROW LEVEL SECURITY;
ALTER TABLE deals ENABLE ROW LEVEL SECURITY;
































