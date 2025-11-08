-- =====================================================
-- DAGMAL PRODUCTION SECURITY SETUP
-- =====================================================
-- This script sets up additional security measures for production
-- Run this AFTER the main database setup

-- =====================================================
-- 1. ADDITIONAL SECURITY POLICIES
-- =====================================================

-- More restrictive policies for production
CREATE POLICY "Users can only view their own claims" ON claims
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can only create claims for themselves" ON claims
    FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Prevent users from updating other users' claims
CREATE POLICY "Users can only update their own claims" ON claims
    FOR UPDATE USING (auth.uid() = user_id);

-- Restaurant owners can only update claim status, not user data
CREATE POLICY "Restaurant owners can update claim status only" ON claims
    FOR UPDATE USING (
        EXISTS (
            SELECT 1 FROM restaurants 
            WHERE id = claims.restaurant_id 
            AND owner_id = auth.uid()
        )
    ) WITH CHECK (
        -- Only allow updating status and special_requests
        OLD.user_id = NEW.user_id AND
        OLD.deal_id = NEW.deal_id AND
        OLD.restaurant_id = NEW.restaurant_id AND
        OLD.quantity = NEW.quantity AND
        OLD.service_type = NEW.service_type AND
        OLD.first_name = NEW.first_name AND
        OLD.last_name = NEW.last_name AND
        OLD.claim_date = NEW.claim_date AND
        OLD.phone = NEW.phone
    );

-- =====================================================
-- 2. AUDIT LOGGING
-- =====================================================

-- Create audit log table
CREATE TABLE IF NOT EXISTS audit_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    table_name TEXT NOT NULL,
    operation TEXT NOT NULL,
    old_data JSONB,
    new_data JSONB,
    user_id UUID REFERENCES auth.users(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS on audit logs
ALTER TABLE audit_logs ENABLE ROW LEVEL SECURITY;

-- Only admins can view audit logs
CREATE POLICY "Only admins can view audit logs" ON audit_logs
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM profiles 
            WHERE id = auth.uid() 
            AND display_name = 'admin'
        )
    );

-- Function to create audit log entries
CREATE OR REPLACE FUNCTION create_audit_log()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO audit_logs (table_name, operation, old_data, new_data, user_id)
    VALUES (
        TG_TABLE_NAME,
        TG_OP,
        CASE WHEN TG_OP = 'DELETE' THEN to_jsonb(OLD) ELSE NULL END,
        CASE WHEN TG_OP = 'INSERT' OR TG_OP = 'UPDATE' THEN to_jsonb(NEW) ELSE NULL END,
        auth.uid()
    );
    RETURN COALESCE(NEW, OLD);
END;
$$ language 'plpgsql';

-- Add audit triggers for sensitive tables
CREATE TRIGGER audit_claims_changes
    AFTER INSERT OR UPDATE OR DELETE ON claims
    FOR EACH ROW EXECUTE FUNCTION create_audit_log();

CREATE TRIGGER audit_deals_changes
    AFTER INSERT OR UPDATE OR DELETE ON deals
    FOR EACH ROW EXECUTE FUNCTION create_audit_log();

CREATE TRIGGER audit_restaurants_changes
    AFTER INSERT OR UPDATE OR DELETE ON restaurants
    FOR EACH ROW EXECUTE FUNCTION create_audit_log();

-- =====================================================
-- 3. RATE LIMITING FUNCTIONS
-- =====================================================

-- Create rate limiting table
CREATE TABLE IF NOT EXISTS rate_limits (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES auth.users(id),
    action TEXT NOT NULL,
    count INTEGER DEFAULT 1,
    window_start TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE rate_limits ENABLE ROW LEVEL SECURITY;

-- Function to check rate limits
CREATE OR REPLACE FUNCTION check_rate_limit(
    p_user_id UUID,
    p_action TEXT,
    p_max_attempts INTEGER DEFAULT 10,
    p_window_minutes INTEGER DEFAULT 60
)
RETURNS BOOLEAN AS $$
DECLARE
    current_count INTEGER;
    window_start TIMESTAMP WITH TIME ZONE;
BEGIN
    -- Get current window start
    window_start := NOW() - (p_window_minutes || ' minutes')::INTERVAL;
    
    -- Get current count for this user and action
    SELECT COALESCE(SUM(count), 0) INTO current_count
    FROM rate_limits
    WHERE user_id = p_user_id
    AND action = p_action
    AND window_start >= $3;
    
    -- Check if limit exceeded
    IF current_count >= p_max_attempts THEN
        RETURN FALSE;
    END IF;
    
    -- Record this attempt
    INSERT INTO rate_limits (user_id, action, window_start)
    VALUES (p_user_id, p_action, NOW());
    
    RETURN TRUE;
END;
$$ language 'plpgsql';

-- =====================================================
-- 4. DATA VALIDATION FUNCTIONS
-- =====================================================

-- Function to validate email format
CREATE OR REPLACE FUNCTION is_valid_email(email TEXT)
RETURNS BOOLEAN AS $$
BEGIN
    RETURN email ~* '^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$';
END;
$$ language 'plpgsql';

-- Function to validate phone number (Norwegian format)
CREATE OR REPLACE FUNCTION is_valid_phone(phone TEXT)
RETURNS BOOLEAN AS $$
BEGIN
    -- Remove all non-digit characters
    phone := regexp_replace(phone, '[^0-9]', '', 'g');
    
    -- Check if it's a valid Norwegian phone number
    RETURN phone ~ '^(\+47|47)?[2-9][0-9]{7}$';
END;
$$ language 'plpgsql';

-- Function to validate discount percentage
CREATE OR REPLACE FUNCTION is_valid_discount(percentage INTEGER)
RETURNS BOOLEAN AS $$
BEGIN
    RETURN percentage > 0 AND percentage <= 100;
END;
$$ language 'plpgsql';

-- =====================================================
-- 5. ADD CONSTRAINTS FOR DATA INTEGRITY
-- =====================================================

-- Add check constraints
ALTER TABLE deals ADD CONSTRAINT check_discount_percentage 
    CHECK (discount_percentage > 0 AND discount_percentage <= 100);

ALTER TABLE deals ADD CONSTRAINT check_positive_prices 
    CHECK (original_price > 0 AND final_price > 0);

ALTER TABLE deals ADD CONSTRAINT check_final_price_lower 
    CHECK (final_price < original_price);

ALTER TABLE claims ADD CONSTRAINT check_positive_quantity 
    CHECK (quantity > 0);

ALTER TABLE claims ADD CONSTRAINT check_claim_date_future 
    CHECK (claim_date >= CURRENT_DATE);

-- Add unique constraints
ALTER TABLE deals ADD CONSTRAINT unique_verification_code 
    UNIQUE (verification_code);

-- =====================================================
-- 6. SECURITY VIEWS
-- =====================================================

-- Create view for public restaurant data (no sensitive info)
CREATE OR REPLACE VIEW public_restaurants AS
SELECT 
    id,
    name,
    description,
    image_url,
    phone,
    address,
    city,
    lat,
    lng,
    categories,
    dine_in,
    takeaway,
    is_active,
    created_at
FROM restaurants
WHERE is_active = true;

-- Create view for public deal data
CREATE OR REPLACE VIEW public_deals AS
SELECT 
    d.id,
    d.restaurant_id,
    d.title,
    d.description,
    d.image_url,
    d.original_price,
    d.discount_percentage,
    d.final_price,
    d.available_for,
    d.dietary_info,
    d.available_days,
    d.start_time,
    d.end_time,
    d.per_user_limit,
    d.total_limit,
    d.claimed_count,
    d.is_active,
    d.created_at,
    r.name as restaurant_name,
    r.address as restaurant_address,
    r.city as restaurant_city
FROM deals d
JOIN restaurants r ON d.restaurant_id = r.id
WHERE d.is_active = true AND r.is_active = true;

-- =====================================================
-- 7. CLEANUP FUNCTIONS
-- =====================================================

-- Function to clean up old rate limit entries
CREATE OR REPLACE FUNCTION cleanup_rate_limits()
RETURNS VOID AS $$
BEGIN
    DELETE FROM rate_limits 
    WHERE created_at < NOW() - INTERVAL '24 hours';
END;
$$ language 'plpgsql';

-- Function to clean up old audit logs (keep for 1 year)
CREATE OR REPLACE FUNCTION cleanup_audit_logs()
RETURNS VOID AS $$
BEGIN
    DELETE FROM audit_logs 
    WHERE created_at < NOW() - INTERVAL '1 year';
END;
$$ language 'plpgsql';

-- =====================================================
-- 8. SCHEDULED JOBS (if using pg_cron)
-- =====================================================

-- Uncomment if you have pg_cron extension enabled
-- SELECT cron.schedule('cleanup-rate-limits', '0 2 * * *', 'SELECT cleanup_rate_limits();');
-- SELECT cron.schedule('cleanup-audit-logs', '0 3 * * 0', 'SELECT cleanup_audit_logs();');

-- =====================================================
-- 9. SECURITY MONITORING
-- =====================================================

-- Create table for security events
CREATE TABLE IF NOT EXISTS security_events (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    event_type TEXT NOT NULL,
    user_id UUID REFERENCES auth.users(id),
    ip_address INET,
    user_agent TEXT,
    details JSONB,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE security_events ENABLE ROW LEVEL SECURITY;

-- Function to log security events
CREATE OR REPLACE FUNCTION log_security_event(
    p_event_type TEXT,
    p_user_id UUID DEFAULT NULL,
    p_ip_address INET DEFAULT NULL,
    p_user_agent TEXT DEFAULT NULL,
    p_details JSONB DEFAULT NULL
)
RETURNS VOID AS $$
BEGIN
    INSERT INTO security_events (event_type, user_id, ip_address, user_agent, details)
    VALUES (p_event_type, p_user_id, p_ip_address, p_user_agent, p_details);
END;
$$ language 'plpgsql';

-- =====================================================
-- 10. FINAL SECURITY CHECKS
-- =====================================================

-- Verify RLS is enabled on all tables
SELECT 
    schemaname, 
    tablename, 
    rowsecurity as rls_enabled
FROM pg_tables 
WHERE schemaname = 'public' 
AND tablename IN (
    'profiles', 'restaurants', 'deals', 'claims', 
    'notifications', 'restaurant_applications', 'menu_items',
    'audit_logs', 'rate_limits', 'security_events'
)
ORDER BY tablename;

-- Check for any tables without RLS
SELECT 
    schemaname, 
    tablename
FROM pg_tables 
WHERE schemaname = 'public' 
AND rowsecurity = false
AND tablename NOT LIKE 'pg_%'
ORDER BY tablename;

-- Verify constraints are in place
SELECT 
    conname as constraint_name,
    contype as constraint_type,
    pg_get_constraintdef(oid) as definition
FROM pg_constraint 
WHERE conrelid = 'public.deals'::regclass
ORDER BY conname;

SELECT 'Security setup completed successfully!' as status;










