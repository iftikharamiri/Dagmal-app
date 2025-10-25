-- Add verification_code column to deals table
-- This allows each deal to have a unique code for verification

ALTER TABLE deals 
ADD COLUMN verification_code VARCHAR(6);

-- Add index for faster lookups
CREATE INDEX idx_deals_verification_code ON deals(verification_code);

-- Function to generate unique verification codes
CREATE OR REPLACE FUNCTION generate_unique_verification_code() 
RETURNS VARCHAR(6) AS $$
DECLARE
    chars TEXT := 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    result VARCHAR(6);
    attempts INTEGER := 0;
BEGIN
    LOOP
        -- Generate a random 6-character code
        result := '';
        FOR i IN 1..6 LOOP
            result := result || substr(chars, floor(random() * length(chars) + 1)::integer, 1);
        END LOOP;
        
        -- Check if this code already exists
        IF NOT EXISTS (SELECT 1 FROM deals WHERE verification_code = result) THEN
            RETURN result;
        END IF;
        
        -- Prevent infinite loop (very unlikely with 36^6 possibilities)
        attempts := attempts + 1;
        IF attempts > 100 THEN
            RAISE EXCEPTION 'Could not generate unique verification code after 100 attempts';
        END IF;
    END LOOP;
END;
$$ LANGUAGE plpgsql;

-- Update existing deals with unique verification codes
DO $$
DECLARE
    deal_record RECORD;
BEGIN
    FOR deal_record IN SELECT id FROM deals WHERE verification_code IS NULL LOOP
        UPDATE deals 
        SET verification_code = generate_unique_verification_code()
        WHERE id = deal_record.id;
    END LOOP;
END $$;

-- Make verification_code NOT NULL after updating existing records
ALTER TABLE deals 
ALTER COLUMN verification_code SET NOT NULL;

-- Add unique constraint to prevent duplicate codes
ALTER TABLE deals 
ADD CONSTRAINT unique_verification_code UNIQUE (verification_code);

-- Drop the helper function as it's no longer needed
DROP FUNCTION generate_unique_verification_code();

-- Comment
COMMENT ON COLUMN deals.verification_code IS 'Unique 6-character verification code shown to both restaurant and customer for validation';
