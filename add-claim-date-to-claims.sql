-- Add claim_date field to claims table
-- This allows customers to specify when they want to claim their deal

-- Add claim_date column to claims table
ALTER TABLE claims 
ADD COLUMN IF NOT EXISTS claim_date DATE;

-- Add comment for clarity
COMMENT ON COLUMN claims.claim_date IS 'Date when the customer wants to claim the deal';

-- Test the new column
SELECT 'Claim date field added to claims table successfully' as status;















