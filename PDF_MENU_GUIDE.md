# PDF Menu Upload and Search Guide

## Overview
The application now supports uploading PDF menus and searching for dishes within them. This makes it much easier for restaurant owners to create deals based on their actual menu items.

## How to Upload a PDF Menu

### For Restaurant Owners:

1. **Navigate to Restaurant Dashboard**
   - Go to `/business/dashboard` (or click "Business" in the main menu)
   - Make sure you're logged in as a restaurant owner

2. **Edit Restaurant Profile**
   - Click the edit button (pencil icon) on your restaurant profile
   - Scroll down to the "Menypdf" section

3. **Upload PDF**
   - Click "Last opp menypdf" button
   - Select a PDF file (max 10MB)
   - The PDF will be uploaded to Supabase Storage
   - The URL will be saved in your restaurant profile

4. **Alternative: URL Input**
   - If you already have a PDF hosted elsewhere, you can paste the URL directly

## How to Search in PDF Menus

### When Creating Deals:

1. **Navigate to Create Deal**
   - Go to `/business/create-deal`
   - You'll see a "Menypdf tilgjengelig" section if a PDF is uploaded

2. **Use PDF Search**
   - **Search**: Type dish names to search within the PDF
   - **Auto Detection**: Click "Auto" button to automatically detect all menu items
   - **Download**: Click the download icon to view the original PDF

3. **Search Results**
   - Found items will be highlighted and shown with page numbers
   - Search results appear in real-time as you type
   - Auto-detected items are shown with a count badge

4. **Enhanced Search**
   - The search bar below the PDF section will show matching items from the PDF
   - Items are filtered and sorted by relevance
   - Norwegian characters (æ, ø, å) are fully supported

## Technical Details

### Supported PDF Formats:
- Standard PDF files with text content
- Norwegian language support (æ, ø, å)
- Maximum file size: 10MB
- Text-based PDFs work best (scanned images may not be searchable)

### Menu Item Detection Patterns:
The system automatically detects menu items using these patterns:
- `150 kr - Pizza Margherita` (price first)
- `Pizza Margherita 150 kr` (description first)
- `150,-` (Norwegian currency format)
- `Pizza Margherita - Tomat, mozzarella og basilikum` (with description)
- Items with dots leading to price: `Pasta Carbonara........219 kr`

### Storage:
- PDFs are stored in Supabase Storage bucket `restaurant-images`
- URLs are saved in the `menu_pdf_url` field of the restaurants table
- Files are organized by restaurant ID for easy management

## Troubleshooting

### PDF Upload Issues:
- **File too large**: Reduce PDF size to under 10MB
- **Storage error**: Check if Supabase Storage is properly configured
- **Permission error**: Ensure you're logged in as the restaurant owner

### Search Issues:
- **No text found**: The PDF might be a scanned image. Use OCR tools to convert to text-based PDF
- **Poor detection**: Try the manual search function instead of auto-detection
- **Norwegian characters**: Make sure the PDF contains proper Norwegian text encoding

### Performance:
- Large PDFs may take longer to process
- Search results are limited to 50 items for performance
- PDF text is cached after first extraction

## Future Enhancements

Potential improvements for the PDF menu system:
- OCR support for scanned PDFs
- Menu item categorization (appetizers, mains, desserts)
- Price extraction and validation
- Integration with external menu management systems
- Bulk menu item import from detected items







