-- Simple fix for claims functionality
-- Run this in your Supabase SQL Editor

-- First, check if the claims table exists and has the right structure
SELECT column_name, data_type, is_nullable 
FROM information_schema.columns 
WHERE table_name = 'claims' AND table_schema = 'public'
ORDER BY ordinal_position;

-- Check if there are any existing policies that might be blocking claims
SELECT tablename, policyname, permissive, roles, cmd, qual 
FROM pg_policies 
WHERE tablename = 'claims';

-- If the above shows restrictive policies, let's create a more permissive one for testing
-- (You can make this more restrictive later)
DROP POLICY IF EXISTS "Users can create claims" ON claims;
CREATE POLICY "Users can create claims" 
ON claims FOR INSERT 
WITH CHECK (auth.uid() = user_id);

-- Make sure the claims table has all required columns
-- Add missing columns if they don't exist
DO $$ 
BEGIN
    -- Check if status column exists, if not add it
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'claims' AND column_name = 'status') THEN
        ALTER TABLE claims ADD COLUMN status TEXT DEFAULT 'pending' 
        CHECK (status IN ('pending', 'confirmed', 'ready', 'completed', 'cancelled'));
    END IF;
END $$;

-- Test insert (replace with a real deal_id from your deals table)
-- This will help us see what error occurs
-- Uncomment and replace 'your-deal-id' with an actual deal ID:
-- INSERT INTO claims (deal_id, user_id, restaurant_id, quantity, service_type, status) 
-- VALUES ('your-deal-id', auth.uid(), 'rest-1', 1, 'dine_in', 'pending');

























