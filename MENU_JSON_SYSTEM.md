# Complete Menu JSON System

This document describes the comprehensive menu management system that allows restaurants to upload and manage complete menus in JSON format.

## Overview

The new menu system provides:
- **Structured JSON format** for complete restaurant menus
- **Rich metadata** including restaurant info, categories, and item details
- **Advanced features** like dietary information, variants, and special sections
- **Easy upload interface** for restaurant owners
- **Beautiful display** for customers with search and filtering
- **Database integration** that converts JSON to structured data

## JSON Schema

### Complete Menu Structure

```json
{
  "restaurant_info": {
    "name": "Restaurant Name",
    "description": "Restaurant description",
    "phone": "+47 123 45 678",
    "address": "Street Address",
    "city": "City",
    "categories": ["Cuisine Type"]
  },
  "menu_metadata": {
    "version": "1.0",
    "last_updated": "2024-01-15T10:30:00Z",
    "currency": "NOK",
    "language": "no",
    "dining_options": {
      "dine_in": true,
      "takeaway": true,
      "delivery": false
    }
  },
  "categories": [
    {
      "id": "burgers",
      "name": "BURGERS",
      "description": "Our signature burgers",
      "display_order": 1,
      "items": [
        {
          "id": "classic-burger",
          "name": "Classic Burger",
          "description": "Hamburger with cheese and vegetables",
          "price": 16900,
          "image_url": "https://example.com/image.jpg",
          "dietary_info": ["vegetarian", "gluten-free"],
          "allergens": ["Gluten", "Dairy"],
          "spice_level": 1,
          "is_available": true,
          "is_popular": true,
          "preparation_time": 12,
          "calories": 650,
          "variants": [
            {
              "name": "Large",
              "price_modifier": 2000,
              "description": "Served with fries"
            }
          ],
          "tags": ["signature", "classic"]
        }
      ]
    }
  ],
  "special_sections": {
    "daily_specials": [
      {
        "day": "monday",
        "items": ["classic-burger"]
      }
    ],
    "seasonal_items": [
      {
        "name": "Summer Specials",
        "season": "summer",
        "available_from": "2024-06-01",
        "available_until": "2024-08-31",
        "items": []
      }
    ]
  }
}
```

### Key Features

#### Restaurant Information
- Basic restaurant details (name, description, contact)
- Location information (address, city)
- Cuisine categories

#### Menu Metadata
- Version control
- Last updated timestamp
- Currency and language settings
- Dining options (dine-in, takeaway, delivery)

#### Categories
- Organized menu sections
- Display order for proper sequencing
- Category descriptions

#### Menu Items
- **Basic Info**: ID, name, description, price
- **Visual**: Image URL support
- **Dietary**: Comprehensive dietary information and allergens
- **Details**: Spice level, preparation time, calories
- **Status**: Availability and popularity flags
- **Variants**: Different sizes or types with price modifications
- **Tags**: Custom categorization for filtering

#### Special Sections
- **Daily Specials**: Items available on specific days
- **Seasonal Items**: Time-limited menu items

## File Structure

### Core Files

```
src/lib/menuUtils.ts              # Menu parsing and conversion utilities
src/components/MenuUploadModal.tsx # Restaurant menu upload interface
src/components/MenuDisplay.tsx     # Customer menu display component
src/routes/menu.tsx               # Menu page for customers
```

### Database Integration

The system automatically converts JSON menus to database entries:

1. **Restaurant Info** → Updates restaurant table
2. **Menu Items** → Inserts into menu_items table
3. **Categories** → Updates restaurant categories
4. **Variants** → Creates separate menu items

### Database Schema

```sql
-- Menu items table (already exists)
CREATE TABLE menu_items (
  id TEXT PRIMARY KEY,
  restaurant_id TEXT REFERENCES restaurants(id),
  name TEXT NOT NULL,
  description TEXT,
  price INTEGER NOT NULL, -- in øre
  category TEXT,
  dietary_info TEXT[] DEFAULT '{}',
  image_url TEXT,
  is_available BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

## Usage

### For Restaurant Owners

1. **Access Dashboard**: Go to restaurant dashboard
2. **Upload Menu**: Click "Upload Complete Menu" button
3. **Select JSON File**: Choose a properly formatted JSON file
4. **Validate**: System validates the JSON structure
5. **Preview**: Review menu statistics and preview
6. **Upload**: Confirm upload to database

### For Customers

1. **View Restaurant**: Visit restaurant page
2. **Access Menu**: Click "Menu" button
3. **Browse**: View organized categories and items
4. **Search**: Use search to find specific items
5. **Filter**: Filter by dietary requirements
6. **View Details**: Click items for detailed information

## API Functions

### Menu Utilities (`src/lib/menuUtils.ts`)

```typescript
// Parse JSON menu to database format
parseMenuToDatabase(menu: CompleteMenu, restaurantId: string): {
  menuItems: MenuItem[]
  categories: string[]
}

// Convert database items back to complete menu
convertDatabaseToMenu(
  menuItems: MenuItem[],
  restaurantInfo: MenuRestaurantInfo,
  metadata?: MenuMetadata
): CompleteMenu

// Validate menu JSON structure
validateMenuJson(menuJson: any): { valid: boolean; errors: string[] }

// Get menu statistics
getMenuStats(menu: CompleteMenu): MenuStats

// Filter menu by dietary requirements
filterMenuByDietary(menu: CompleteMenu, dietaryRequirements: string[]): CompleteMenu

// Search menu items
searchMenuItems(menu: CompleteMenu, query: string): MenuItemExtended[]
```

## Sample Files

- `menu-schema.json` - JSON Schema definition
- `sample-complete-menu.json` - Example complete menu
- `babylon-burger-menu.json` - Existing simple format (still supported)

## Migration from Simple Format

The system supports both the new comprehensive format and the existing simple array format:

### Simple Format (Still Supported)
```json
[
  {
    "name": "Burger",
    "description": "Delicious burger",
    "price": 150,
    "category": "Main",
    "dietary_info": ["vegetarian"]
  }
]
```

### Complete Format (New)
```json
{
  "restaurant_info": { ... },
  "categories": [
    {
      "name": "Main",
      "items": [
        {
          "name": "Burger",
          "description": "Delicious burger",
          "price": 15000,
          "dietary_info": ["vegetarian"]
        }
      ]
    }
  ]
}
```

## Benefits

1. **Rich Data**: Comprehensive item information with variants, dietary info, etc.
2. **Better UX**: Advanced search and filtering for customers
3. **Structured**: Organized categories and metadata
4. **Flexible**: Supports various menu structures and special sections
5. **Validated**: JSON schema validation ensures data quality
6. **Scalable**: Easy to extend with new features
7. **Backward Compatible**: Still supports simple format

## Future Enhancements

- **Menu Analytics**: Track popular items and categories
- **Dynamic Pricing**: Time-based or demand-based pricing
- **Nutritional Info**: Detailed nutritional information
- **Multi-language**: Support for multiple languages
- **Menu Templates**: Pre-built templates for different cuisines
- **Integration**: API endpoints for external menu management systems


