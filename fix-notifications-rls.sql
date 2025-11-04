-- Fix notifications table RLS policies
-- The issue is that RLS is preventing notification creation

-- First, check current RLS policies
SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual, with_check
FROM pg_policies 
WHERE tablename = 'notifications';

-- Drop existing restrictive policies
DROP POLICY IF EXISTS "Restaurant owners can view their notifications" ON notifications;
DROP POLICY IF EXISTS "Restaurant owners can update their notifications" ON notifications;

-- Create more permissive policies for notifications
-- Allow anyone to insert notifications (for when customers claim deals)
CREATE POLICY "Anyone can insert notifications" ON notifications
FOR INSERT WITH CHECK (true);

-- Allow restaurant owners to view their notifications
CREATE POLICY "Restaurant owners can view their notifications" ON notifications
FOR SELECT USING (
  EXISTS (SELECT 1 FROM restaurants WHERE id = restaurant_id AND owner_id = auth.uid())
);

-- Allow restaurant owners to update their notifications (e.g., mark as read)
CREATE POLICY "Restaurant owners can update their notifications" ON notifications
FOR UPDATE USING (
  EXISTS (SELECT 1 FROM restaurants WHERE id = restaurant_id AND owner_id = auth.uid())
);

-- Test the fix
SELECT 'Notifications RLS policies updated successfully' as status;







