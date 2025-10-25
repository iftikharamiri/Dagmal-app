-- Fix database schema for menu_pdf_url column
-- This adds the missing menu_pdf_url column to the restaurants table

-- First, check if column exists
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 
        FROM information_schema.columns 
        WHERE table_name = 'restaurants' 
        AND column_name = 'menu_pdf_url'
        AND table_schema = 'public'
    ) THEN
        -- Add the column if it doesn't exist
        ALTER TABLE public.restaurants 
        ADD COLUMN menu_pdf_url TEXT;
        
        RAISE NOTICE 'Added menu_pdf_url column to restaurants table';
    ELSE
        RAISE NOTICE 'menu_pdf_url column already exists in restaurants table';
    END IF;
END $$;

-- Add comment to the column
COMMENT ON COLUMN public.restaurants.menu_pdf_url IS 'URL to the restaurant menu PDF file';

-- Verify the column was added
SELECT column_name, data_type, is_nullable 
FROM information_schema.columns 
WHERE table_name = 'restaurants' 
AND table_schema = 'public'
AND column_name = 'menu_pdf_url';







