-- Add special_requests column to notifications table
-- This will store customer notes/special requests

-- Add special_requests column if it doesn't exist
ALTER TABLE notifications ADD COLUMN IF NOT EXISTS special_requests TEXT;

-- Add comment for clarity
COMMENT ON COLUMN notifications.special_requests IS 'Customer special requests or notes from the claim form';

-- Test the update
SELECT 'Special requests column added to notifications table successfully' as status;
