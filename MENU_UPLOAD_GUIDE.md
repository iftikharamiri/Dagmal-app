# Menu Upload Guide

This guide explains how to use the new menu upload feature for restaurants to create deals with real menu items.

## Features

### 1. JSON Menu Upload
Restaurants can upload their menu as a JSON file through the restaurant dashboard. This allows for:
- Bulk menu item management
- Structured data with categories, dietary information, and pricing
- Easy integration with the deal creation system

### 2. Dish Selection Interface
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

1. **Upload Menu**:
   - Go to your restaurant dashboard
   - Scroll to the "Meny (JSON)" section
   - Click "Last opp meny (JSON)"
   - Select your JSON file (max 5MB)
   - The system will automatically process and store your menu items

2. **Create Deals**:
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

## Troubleshooting

### Common Issues

1. **JSON Upload Fails**:
   - Check file format (must be valid JSON)
   - Ensure file size is under 5MB
   - Verify all required fields are present

2. **Dish Selection Not Working**:
   - Ensure menu items are uploaded first
   - Check that items are marked as available
   - Verify restaurant ID is correct

3. **Price Display Issues**:
   - Prices are stored in øre (multiply by 100)
   - Display automatically converts to Norwegian Kroner

For additional support, contact the development team or check the application logs.





