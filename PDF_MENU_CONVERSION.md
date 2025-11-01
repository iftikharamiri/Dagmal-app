# PDF to JSON Menu Conversion 🔄

## Overview

This system now automatically converts PDF menus into searchable JSON format! Restaurants can upload their PDF menus and the system will:

1. ✅ Extract text from PDF
2. ✅ Detect menu items with prices
3. ✅ Group items by categories
4. ✅ Convert to structured JSON
5. ✅ Make it searchable in the app

## How It Works

### The Complete Flow

```
PDF Upload → Text Extraction → Pattern Matching → JSON Conversion → Database Storage → Searchable Menu
```

### Step-by-Step Process

1. **PDF Upload**
   - Restaurant owner uploads PDF menu file
   - System receives PDF file through MenuUploadModal

2. **Text Extraction** (`pdfUtils.ts`)
   - Uses PDF.js library to extract text from PDF
   - Processes each page
   - Returns full text content

3. **Menu Item Detection**
   - Analyzes text using pattern matching
   - Detects Norwegian price formats: `169,-`, `199 kr`, `NOK 199`
   - Identifies category headers (BURGERS, DESSERTS, etc.)
   - Extracts dish names and descriptions

4. **JSON Conversion**
   - Groups items by category
   - Converts prices to øre (multiply by 100)
   - Creates structured JSON format
   - Validates the result

5. **Database Storage**
   - Stores menu items in database
   - Makes items available for deal creation
   - Enables search and filtering

## Technical Details

### Files Created

1. **`src/lib/pdfUtils.ts`**
   - PDF text extraction
   - Menu item pattern matching
   - Category detection
   - Price extraction and validation

2. **Updated `src/components/MenuUploadModal.tsx`**
   - Added PDF upload mode
   - Integrated conversion pipeline
   - Error handling and validation

### Pattern Matching

The system recognizes:
- Norwegian prices: `169,-`, `199 kr`
- International prices: `NOK 199`
- Categories: BURGERS, DESSERTS, DRINKS, etc.
- Item formats: "Item Name - Description 169,-"

### Supported Formats

✅ **Works Well:**
- Text-based PDFs
- Standard Norwegian menu layouts
- Clear headings and prices
- Structured categories

❌ **Won't Work:**
- Scanned image PDFs
- Handwritten menus
- Complex formatting
- Image-heavy menus

## Usage

### For Restaurant Owners

1. Go to `/business/dashboard`
2. Click edit (pencil icon) on your restaurant
3. Scroll to "Complete Menu (JSON)"
4. Click "Upload Complete Menu"
5. Select "PDF" tab
6. Upload your PDF menu
7. Wait for conversion
8. Review and upload!

### For Developers

```typescript
import { convertPdfToMenuItems } from '@/lib/pdfUtils'

// Convert PDF to menu items
const menuItems = await convertPdfToMenuItems(pdfFile)

// Result:
[
  {
    name: "Classic Burger",
    description: "Hamburger with cheese",
    price: 16900, // in øre
    category: "BURGERS",
    dietary_info: []
  },
  // ... more items
]
```

## Dependencies

- **pdfjs-dist**: PDF text extraction library
- Already installed via npm
- **Worker**: Uses CDN-hosted worker from Cloudflare for reliability
- **Version**: Compatible with pdfjs-dist v5.4+

## Integration Points

### MenuUploadModal
- Added PDF mode toggle
- Handles file upload
- Shows conversion progress
- Displays extracted items

### Menu Utils
- Uses existing `convertArrayToCompleteMenu` function
- Validates with `validateMenuJson`
- Integrates with existing database schema

### Restaurant Dashboard
- No changes needed
- Uses existing "Upload Complete Menu" button
- Same flow for all upload types

## Error Handling

The system handles:
- Invalid PDFs
- Text extraction failures
- Pattern matching errors
- Validation issues
- Large file sizes
- Missing workers
- Image-based PDFs

User-friendly error messages guide restaurants to solutions:

**Common Error Messages:**
- "PDF worker not loaded" → Refresh the page
- "No text could be extracted" → PDF is image-based (use OCR first)
- "Invalid PDF" → Check your file format
- "Failed to extract text" → Try a different PDF or check console

## Future Enhancements

Potential improvements:
- OCR support for scanned PDFs
- Machine learning for better pattern recognition
- Multi-language support
- Custom category detection
- Price validation rules
- Image extraction from PDFs

## Testing

To test the PDF conversion:
1. Create a simple PDF menu with test items
2. Upload through the interface
3. Verify items are extracted correctly
4. Check category grouping
5. Confirm prices are in øre format

## Related Files

- `src/lib/pdfUtils.ts` - PDF processing utilities
- `src/components/MenuUploadModal.tsx` - Upload interface
- `src/lib/menuUtils.ts` - Menu validation and conversion
- `MENU_UPLOAD_GUIDE.md` - User documentation
- `QUICK_START_MENU.md` - Quick start guide

---

**Created:** 2024  
**Status:** ✅ Complete and Ready for Use
