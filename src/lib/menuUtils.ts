import { MenuItem } from './database.types'

export interface MenuCategory {
  id: string
  name: string
  description?: string
  display_order: number
  items: MenuItem[]
}

export interface MenuRestaurantInfo {
  name: string
  description?: string
  phone?: string
  address?: string
  city?: string
  categories: string[]
}

export interface MenuMetadata {
  version?: string
  last_updated?: string
  currency?: string
  language?: string
  dining_options?: {
    dine_in?: boolean
    takeaway?: boolean
    delivery?: boolean
  }
}

export interface MenuVariant {
  name: string
  price_modifier: number
  description?: string
}

export interface MenuItemExtended extends MenuItem {
  allergens?: string[]
  spice_level?: number
  is_popular?: boolean
  preparation_time?: number
  calories?: number
  variants?: MenuVariant[]
  tags?: string[]
}

export interface MenuCategoryExtended {
  id: string
  name: string
  description?: string
  display_order: number
  items: MenuItemExtended[]
}

export interface CompleteMenu {
  restaurant_info: MenuRestaurantInfo
  menu_metadata?: MenuMetadata
  categories: MenuCategoryExtended[]
  special_sections?: {
    daily_specials?: Array<{
      day: string
      items: string[]
    }>
    seasonal_items?: Array<{
      name: string
      season: string
      available_from?: string
      available_until?: string
      items: string[]
    }>
  }
}

/**
 * Parse a complete menu JSON and convert it to database-compatible format
 */
export function parseMenuToDatabase(menuJson: CompleteMenu, restaurantId: string): {
  menuItems: MenuItem[]
  categories: string[]
} {
  console.log('Parsing menu JSON:', menuJson)
  console.log('Restaurant ID:', restaurantId)
  
  const menuItems: MenuItem[] = []
  const categories: string[] = []

  // Extract restaurant categories
  if (menuJson.restaurant_info.categories) {
    categories.push(...menuJson.restaurant_info.categories)
    console.log('Restaurant categories:', categories)
  }

  // Helper to create safe, globally-unique IDs per restaurant
  const slugify = (value: string) => value.toLowerCase().trim().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '')

  // Process each category and its items
  menuJson.categories.forEach(category => {
    // Add category to categories list if not already present
    if (!categories.includes(category.name)) {
      categories.push(category.name)
    }

    // Process items in this category
    console.log(`Processing category: ${category.name} with ${category.items.length} items`)
    category.items.forEach((item, index) => {
      console.log(`Processing item ${index + 1}:`, item.name, 'Price:', item.price)
      const baseId = `${restaurantId}-${slugify(item.name)}-${index}`
      const menuItem: MenuItem = {
        id: baseId,
        restaurant_id: restaurantId,
        name: item.name,
        description: item.description || null,
        price: item.price,
        category: category.name,
        dietary_info: item.dietary_info || [],
        image_url: item.image_url || null,
        is_available: item.is_available !== false, // Default to true
        price_tiers: (item as any).price_tiers || null, // Extract price_tiers from JSON
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      }

      console.log('Created menu item:', menuItem)
      menuItems.push(menuItem)

      // Add variants as separate menu items
      if (item.variants && item.variants.length > 0) {
        item.variants.forEach((variant) => {
          const variantItem: MenuItem = {
            id: `${baseId}-${slugify(variant.name)}`,
            restaurant_id: restaurantId,
            name: `${item.name} (${variant.name})`,
            description: variant.description || item.description || null,
            price: item.price + variant.price_modifier,
            category: category.name,
            dietary_info: item.dietary_info || [],
            image_url: item.image_url || null,
            is_available: item.is_available !== false,
            price_tiers: null,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
          }
          menuItems.push(variantItem)
        })
      }
    })
  })

  console.log('Final parsing result:')
  console.log('- Menu items count:', menuItems.length)
  console.log('- Categories:', categories)
  console.log('- Sample menu item:', menuItems[0])
  
  return { menuItems, categories }
}

/**
 * Convert database menu items back to complete menu format
 */
export function convertDatabaseToMenu(
  menuItems: MenuItem[],
  restaurantInfo: MenuRestaurantInfo,
  metadata?: MenuMetadata
): CompleteMenu {
  // Group items by category
  const categoryMap = new Map<string, MenuItemExtended[]>()
  
  menuItems.forEach(item => {
    if (!categoryMap.has(item.category || '')) {
      categoryMap.set(item.category || '', [])
    }
    
    // Check if this is a variant (contains parentheses)
    const isVariant = item.name.includes('(') && item.name.includes(')')
    
    if (isVariant) {
      // Extract base name and variant name
      const match = item.name.match(/^(.+?)\s+\((.+?)\)$/)
      if (match) {
        const [, baseName, variantName] = match
        const baseItem = categoryMap.get(item.category || '')?.find(i => i.name === baseName)
        
        if (baseItem) {
          // Add variant to existing item
          if (!baseItem.variants) {
            baseItem.variants = []
          }
          baseItem.variants.push({
            name: variantName,
            price_modifier: item.price - (menuItems.find(i => i.name === baseName)?.price || 0),
            description: item.description || undefined
          })
        } else {
          // Create new item with variant
          const menuItem: MenuItemExtended = {
            ...item,
            variants: [{
              name: variantName,
              price_modifier: 0,
              description: item.description || undefined
            }]
          }
          categoryMap.get(item.category || '')!.push(menuItem)
        }
      }
    } else {
      // Regular item
      const menuItem: MenuItemExtended = {
        ...item,
        variants: []
      }
      categoryMap.get(item.category || '')!.push(menuItem)
    }
  })

  // Convert to categories array
  const categories: MenuCategoryExtended[] = Array.from(categoryMap.entries()).map(([categoryName, items], index) => ({
    id: categoryName.toLowerCase().replace(/\s+/g, '-'),
    name: categoryName,
    display_order: index + 1,
    items: items.sort((a, b) => a.name.localeCompare(b.name))
  }))

  return {
    restaurant_info: restaurantInfo,
    menu_metadata: metadata,
    categories
  }
}

/**
 * Validate menu JSON against schema
 */
export function validateMenuJson(menuJson: any): { valid: boolean; errors: string[] } {
  const errors: string[] = []

  // Check required fields
  if (!menuJson.restaurant_info) {
    errors.push('Missing restaurant_info')
  } else {
    if (!menuJson.restaurant_info.name) {
      errors.push('Missing restaurant name')
    }
  }

  if (!menuJson.categories || !Array.isArray(menuJson.categories)) {
    errors.push('Missing or invalid categories array')
  } else {
    menuJson.categories.forEach((category: any, categoryIndex: number) => {
      if (!category.id) {
        errors.push(`Category ${categoryIndex}: Missing id`)
      }
      if (!category.name) {
        errors.push(`Category ${categoryIndex}: Missing name`)
      }
      if (!category.items || !Array.isArray(category.items)) {
        errors.push(`Category ${categoryIndex}: Missing or invalid items array`)
      } else {
        category.items.forEach((item: any, itemIndex: number) => {
          if (!item.id) {
            errors.push(`Category ${categoryIndex}, Item ${itemIndex}: Missing id`)
          }
          if (!item.name) {
            errors.push(`Category ${categoryIndex}, Item ${itemIndex}: Missing name`)
          }
          if (typeof item.price !== 'number' || item.price < 0) {
            errors.push(`Category ${categoryIndex}, Item ${itemIndex}: Invalid price`)
          }
        })
      }
    })
  }

  return {
    valid: errors.length === 0,
    errors
  }
}

/**
 * Get menu statistics
 */
export function getMenuStats(menu: CompleteMenu): {
  totalItems: number
  totalCategories: number
  averagePrice: number
  priceRange: { min: number; max: number }
  dietaryOptions: string[]
} {
  let totalItems = 0
  let totalPrice = 0
  let minPrice = Infinity
  let maxPrice = 0
  const dietaryOptions = new Set<string>()

  menu.categories.forEach(category => {
    totalItems += category.items.length
    category.items.forEach(item => {
      totalPrice += item.price
      minPrice = Math.min(minPrice, item.price)
      maxPrice = Math.max(maxPrice, item.price)
      
      if (item.dietary_info) {
        item.dietary_info.forEach(diet => dietaryOptions.add(diet))
      }
    })
  })

  return {
    totalItems,
    totalCategories: menu.categories.length,
    averagePrice: totalItems > 0 ? Math.round(totalPrice / totalItems) : 0,
    priceRange: {
      min: minPrice === Infinity ? 0 : minPrice,
      max: maxPrice
    },
    dietaryOptions: Array.from(dietaryOptions)
  }
}

/**
 * Filter menu items by dietary requirements
 */
export function filterMenuByDietary(menu: CompleteMenu, dietaryRequirements: string[]): CompleteMenu {
  if (dietaryRequirements.length === 0) return menu

  const filteredMenu = {
    ...menu,
    categories: menu.categories.map(category => ({
      ...category,
      items: category.items.filter(item => {
        if (!item.dietary_info) return true
        return dietaryRequirements.every(req => item.dietary_info!.includes(req))
      })
    }))
  }

  return filteredMenu
}

/**
 * Search menu items
 */
export function searchMenuItems(menu: CompleteMenu, query: string): MenuItemExtended[] {
  const searchTerm = query.toLowerCase()
  const results: MenuItemExtended[] = []

  menu.categories.forEach(category => {
    category.items.forEach(item => {
      if (
        item.name.toLowerCase().includes(searchTerm) ||
        item.description?.toLowerCase().includes(searchTerm) ||
        item.tags?.some(tag => tag.toLowerCase().includes(searchTerm))
      ) {
        results.push(item)
      }
    })
  })

  return results
}
