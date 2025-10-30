-- Add notifications table for restaurant owners
-- This allows restaurants to see when customers claim their deals

-- Create notifications table
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

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_notifications_restaurant ON notifications(restaurant_id);
CREATE INDEX IF NOT EXISTS idx_notifications_created_at ON notifications(created_at);
CREATE INDEX IF NOT EXISTS idx_notifications_is_read ON notifications(is_read);

-- Add comments for clarity
COMMENT ON TABLE notifications IS 'Notifications for restaurant owners when customers claim deals';
COMMENT ON COLUMN notifications.customer_name IS 'Name of the customer who claimed the deal';
COMMENT ON COLUMN notifications.customer_phone IS 'Phone number of the customer (if provided)';
COMMENT ON COLUMN notifications.deal_title IS 'Title of the deal that was claimed';
COMMENT ON COLUMN notifications.quantity IS 'Number of deals claimed';
COMMENT ON COLUMN notifications.service_type IS 'Whether customer chose dine_in or takeaway';
COMMENT ON COLUMN notifications.claim_date IS 'Date when the customer wants to claim the deal';

-- Test the new table
SELECT 'Notifications table created successfully' as status;


