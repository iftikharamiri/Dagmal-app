# Menu Upload Guide

This guide explains how to use the new menu upload feature for restaurants to create deals with real menu items.

## Features

### 1. JSON Menu Upload
Restaurants can upload their menu as a JSON file through the restaurant dashboard. This allows for:
- Bulk menu item management
- Structured data with categories, dietary information, and pricing
- Easy integration with the deal creation system

### 2. PDF Menu Import (NEW! - Easiest!)
Restaurants can now upload their PDF menu and automatically convert it to a searchable format:
- Simply upload your PDF menu file
- Automatic text extraction and menu item detection
- Works with text-based PDFs (Norwegian format supported)
- Preview and edit before uploading
- Perfect for restaurants with PDF menus!

### 3. URL Menu Import (NEW!)
Restaurants can now paste a link to their online menu and automatically extract menu items:
- Simply paste your menu URL
- Automatic extraction of dishes, prices, and categories
- Works with most Norwegian restaurant websites
- Preview and edit before uploading
- Perfect for quick menu setup!

### 4. Dish Selection Interface
When creating deals, restaurant owners can now:
- Search through their uploaded menu items
- Filter by dietary preferences (Vegetarian, Vegan, Gluten-free, etc.)
- Select dishes with a modern, intuitive interface
- See real-time preview of selected items

## JSON Menu Format

### Required Fields
- `name`: Dish name (string)
- `price`: Price in Norwegian Kroner (number)
- `category`: Menu category (string, optional)
- `description`: Dish description (string, optional)
- `dietary_info`: Array of dietary tags (array, optional)
- `image_url`: Image URL (string, optional)

### Dietary Tags
Supported dietary tags:
- `vegetarian` - Vegetarian dishes
- `vegan` - Vegan dishes
- `gluten-free` - Gluten-free options
- `dairy-free` - Lactose-free options
- `halal` - Halal certified
- `kosher` - Kosher certified

### Example JSON Structure
```json
[
  {
    "name": "Bruschetta",
    "description": "Fersk bruschetta med tomat og basilikum",
    "price": 129,
    "category": "Forretter",
    "dietary_info": ["vegetarian"],
    "image_url": "https://example.com/image.jpg"
  }
]
```

## How to Use

### For Restaurant Owners

#### Option 1: Upload PDF Menu (Recommended - Easiest!)

1. **Upload PDF Menu**:
   - Go to your restaurant dashboard at `/business/dashboard`
   - Click the edit button (pencil icon) on your restaurant profile
   - Scroll down to the "Complete Menu (JSON)" section
   - Click "Upload Complete Menu" button
   - In the modal, click the "PDF" tab (top right)
   - Click "Choose PDF File" and select your PDF menu
   - Wait for processing (automatic extraction)
   - Review the extracted menu items and statistics
   - Click "Upload Menu" to save

2. **Create Deals**:
   - Go to "Opprett tilbud" (Create Deal)
   - Click "Velg rett fra meny" (Select dish from menu)
   - Use the search bar to find specific dishes
   - Apply dietary filters if needed
   - Click "Legg til" (Add) on your chosen dish
   - Customize your deal settings
   - Publish your deal

#### Option 2: Import from URL

1. **Import Menu from URL**:
   - Go to your restaurant dashboard at `/business/dashboard`
   - Click the edit button (pencil icon) on your restaurant profile
   - Scroll down to the "Complete Menu (JSON)" section
   - Click "Upload Complete Menu" button
   - In the modal, click the "URL" tab
   - Paste your menu URL (e.g., `https://babylonpizza.no/meny-babylon-burger/`)
   - Click "Extract Menu"
   - Review the extracted menu items and statistics
   - Click "Upload Menu" to save

2. **Create Deals** (same as above):
   - Go to "Opprett tilbud" (Create Deal)
   - Click "Velg rett fra meny" (Select dish from menu)
   - Use the search bar to find specific dishes
   - Apply dietary filters if needed
   - Click "Legg til" (Add) on your chosen dish
   - Customize your deal settings
   - Publish your deal

#### Option 3: Upload JSON File

1. **Upload Menu JSON**:
   - Go to your restaurant dashboard
   - Click the edit button (pencil icon) on your restaurant profile
   - Scroll down to the "Complete Menu (JSON)" section
   - Click "Upload Complete Menu" button
   - In the modal, click the "JSON" tab
   - Click "Choose File" or download a sample template
   - Select your JSON file (max 5MB)
   - The system will automatically process and store your menu items

2. **Create Deals** (same as above):
   - Go to "Opprett tilbud" (Create Deal)
   - Click "Velg rett fra meny" (Select dish from menu)
   - Use the search bar to find specific dishes
   - Apply dietary filters if needed
   - Click "Legg til" (Add) on your chosen dish
   - Customize your deal settings
   - Publish your deal

### For Developers

#### Database Schema
The menu items are stored in the `menu_items` table with the following structure:
- `id`: Unique identifier
- `restaurant_id`: Reference to restaurant
- `name`: Dish name
- `description`: Dish description
- `price`: Price in øre (Norwegian currency subunit)
- `category`: Menu category
- `dietary_info`: Array of dietary tags
- `image_url`: Image URL
- `is_available`: Availability status
- `created_at`: Creation timestamp
- `updated_at`: Last update timestamp

#### API Integration
Menu items are automatically fetched when the dish selection modal opens:
```typescript
const { data, error } = await supabase
  .from('menu_items')
  .select('*')
  .eq('restaurant_id', restaurantId)
  .eq('is_available', true)
  .order('name')
```

## Sample Files

- `sample-menu.json`: Example menu file with various dish types and dietary information
- Use this as a template for creating your own menu files

## Error Handling

The system includes comprehensive error handling for:
- Invalid JSON format
- Missing required fields
- File size limits (5MB max)
- Database connection issues
- Duplicate menu items

## Benefits

1. **Efficiency**: Bulk upload instead of manual entry
2. **Accuracy**: Structured data reduces errors
3. **Flexibility**: Easy to update and manage menu items
4. **User Experience**: Modern, intuitive dish selection interface
5. **Integration**: Seamless connection between menu and deal creation

## Supported Menu Formats

### PDF Menu Compatibility

The PDF import feature works best with:
- **Text-based PDFs** (not scanned images)
- **Norwegian price formats**: `169,-`, `199 kr`, or `NOK 199`
- **Structured menus** with clear categories and item names
- **Standard menu layouts** with dish names and prices

**How It Works:**
1. Upload your PDF menu file
2. System automatically extracts text from PDF
3. Detects menu items using pattern matching
4. Groups items by categories (BURGERS, DESSERTS, etc.)
5. Converts prices to øre format (NOK)
6. Creates searchable menu items

**Known Format Support:**
- Norwegian restaurant menus with traditional layout
- Standard menu structures
- Clear headings and categories

**Limitations:**
- Image-based/scanned PDFs won't work (requires OCR)
- Complex formatting might need manual editing
- Handwritten menus won't work

If PDF import doesn't work, you can always:
1. Use the "Upload JSON" option instead
2. Try the URL import if your menu is online

### URL Import Compatibility

The URL import feature works best with:
- **Norwegian restaurant websites** with prices in format: `169,-` or `199 kr`
- **Structured menus** with clear headings and item names
- **Menu pages** that are publicly accessible

**Known Working Websites:**
- Babylon Pizza menu pages
- Most Norwegian restaurants with structured HTML menus

**Limitations:**
- JavaScript-heavy sites may not work (requires server-side rendering)
- Scanned PDFs or images won't work (use PDF upload instead)
- Some complex layouts might need manual JSON editing

If URL import doesn't work for your website, you can always:
1. Upload the PDF version using the PDF option
2. Manually create a JSON file using the sample template
3. Use the "Upload JSON" option instead

## Troubleshooting

### Common Issues

1. **PDF Import Fails**:
   - Make sure the PDF contains text (not just images)
   - Try a text-based PDF instead of a scanned image
   - Check that prices are in a recognizable format
   - For image-based PDFs, use an OCR tool first

2. **URL Import Fails**:
   - Check that the URL is publicly accessible
   - Try a different page if the menu is split across multiple pages
   - Verify the website is not behind a login wall
   - Some JavaScript-heavy sites may not work (try uploading the PDF instead)

3. **JSON Upload Fails**:
   - Check file format (must be valid JSON)
   - Ensure file size is under 5MB
   - Verify all required fields are present

4. **Dish Selection Not Working**:
   - Ensure menu items are uploaded first
   - Check that items are marked as available
   - Verify restaurant ID is correct

5. **Price Display Issues**:
   - Prices are stored in øre (multiply by 100)
   - Display automatically converts to Norwegian Kroner

For additional support, contact the development team or check the application logs.







