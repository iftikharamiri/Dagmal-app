-- Cleanup script in case the previous migration failed
-- Run this ONLY if you got the duplicate key error

-- Remove the unique constraint if it was partially created
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.table_constraints 
               WHERE constraint_name = 'unique_verification_code' 
               AND table_name = 'deals') THEN
        ALTER TABLE deals DROP CONSTRAINT unique_verification_code;
    END IF;
END $$;

-- Remove the index if it was created
DROP INDEX IF EXISTS idx_deals_verification_code;

-- Drop the column if it was added (this will remove all data in the column)
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.columns 
               WHERE table_name = 'deals' 
               AND column_name = 'verification_code') THEN
        ALTER TABLE deals DROP COLUMN verification_code;
    END IF;
END $$;

-- Clean up any leftover functions
DROP FUNCTION IF EXISTS generate_unique_verification_code();

-- Now you can run the fixed add-verification-code-column.sql script


























