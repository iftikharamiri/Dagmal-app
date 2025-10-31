-- Add menu_pdf_url column to restaurants table
ALTER TABLE restaurants 
ADD COLUMN IF NOT EXISTS menu_pdf_url TEXT;

-- Add comment to the column
COMMENT ON COLUMN restaurants.menu_pdf_url IS 'URL to the restaurant menu PDF file';












