-- Test script to check if your database is properly set up for restaurant deals
-- Run this in Supabase SQL Editor to diagnose issues

-- 1. Check if restaurant_applications table exists
SELECT 'restaurant_applications table' as check_type, 
       CASE WHEN EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'restaurant_applications') 
            THEN '✅ EXISTS' 
            ELSE '❌ MISSING' 
       END as status;

-- 2. Check if restaurants table has owner_id column
SELECT 'restaurants.owner_id column' as check_type,
       CASE WHEN EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'restaurants' AND column_name = 'owner_id')
            THEN '✅ EXISTS'
            ELSE '❌ MISSING'
       END as status;

-- 3. Check if profiles table has role column
SELECT 'profiles.role column' as check_type,
       CASE WHEN EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'profiles' AND column_name = 'role')
            THEN '✅ EXISTS'
            ELSE '❌ MISSING'
       END as status;

-- 4. Check if approve_restaurant_application function exists
SELECT 'approve_restaurant_application function' as check_type,
       CASE WHEN EXISTS (SELECT 1 FROM information_schema.routines WHERE routine_name = 'approve_restaurant_application')
            THEN '✅ EXISTS'
            ELSE '❌ MISSING'
       END as status;

-- 5. Check current user authentication
SELECT 'Current user' as check_type, 
       COALESCE(auth.uid()::text, '❌ NOT AUTHENTICATED') as status;

-- 6. Check if current user has a restaurant
SELECT 'User has restaurant' as check_type,
       CASE WHEN EXISTS (SELECT 1 FROM restaurants WHERE owner_id = auth.uid())
            THEN '✅ YES - ' || (SELECT name FROM restaurants WHERE owner_id = auth.uid() LIMIT 1)
            ELSE '❌ NO RESTAURANT'
       END as status;

-- 7. Check RLS policies for deals table
SELECT 'Deals RLS policies' as check_type,
       COUNT(*)::text || ' policies found' as status
FROM pg_policies 
WHERE tablename = 'deals';

-- 8. Test deals table insert permission (this will fail if no restaurant)
-- Comment this out if you don't have a restaurant yet
/*
INSERT INTO deals (
  restaurant_id, title, description, original_price, discount_percentage, 
  final_price, available_for, dietary_info, available_days, start_time, 
  end_time, per_user_limit, is_active
) VALUES (
  (SELECT id FROM restaurants WHERE owner_id = auth.uid() LIMIT 1),
  'Test Deal', 'Test description', 10000, 20, 8000, 
  ARRAY['dine_in'], ARRAY[]::text[], ARRAY['monday'], 
  '12:00', '14:00', 1, true
) RETURNING 'Test deal created successfully' as status;
*/































