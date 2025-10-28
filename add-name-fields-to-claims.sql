-- Add first name and last name fields to claims table
-- This allows restaurants to see customer names when processing claims

-- Add first_name and last_name columns to claims table
ALTER TABLE claims 
ADD COLUMN IF NOT EXISTS first_name TEXT,
ADD COLUMN IF NOT EXISTS last_name TEXT;

-- Add comments for clarity
COMMENT ON COLUMN claims.first_name IS 'Customer first name for claim processing';
COMMENT ON COLUMN claims.last_name IS 'Customer last name for claim processing';

-- Test the new columns
SELECT 'Name fields added to claims table successfully' as status;

