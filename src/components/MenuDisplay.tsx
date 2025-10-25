import React, { useState } from 'react'
import { Search, Filter, Star, Clock, Flame, Leaf, Wheat, Milk, Egg, AlertTriangle } from 'lucide-react'
import { CompleteMenu, MenuItemExtended, searchMenuItems, filterMenuByDietary } from '@/lib/menuUtils'

interface MenuDisplayProps {
  menu: CompleteMenu
  onItemSelect?: (item: MenuItemExtended) => void
  showSearch?: boolean
  showFilters?: boolean
  className?: string
}

const dietaryIcons = {
  vegetarian: Leaf,
  vegan: Leaf,
  'gluten-free': Wheat,
  'dairy-free': Milk,
  'nut-free': AlertTriangle,
  soy: AlertTriangle,
  egg: Egg,
  milk: Milk,
  mustard: AlertTriangle,
  celery: AlertTriangle,
  gluten: Wheat,
  sesame: AlertTriangle
}

const dietaryLabels = {
  vegetarian: 'Vegetarian',
  vegan: 'Vegan',
  'gluten-free': 'Gluten-Free',
  'dairy-free': 'Dairy-Free',
  'nut-free': 'Nut-Free',
  soy: 'Contains Soy',
  egg: 'Contains Egg',
  milk: 'Contains Milk',
  mustard: 'Contains Mustard',
  celery: 'Contains Celery',
  gluten: 'Contains Gluten',
  sesame: 'Contains Sesame'
}

export function MenuDisplay({ 
  menu, 
  onItemSelect, 
  showSearch = true, 
  showFilters = true,
  className = '' 
}: MenuDisplayProps) {
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedDietary, setSelectedDietary] = useState<string[]>([])
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null)

  // Get all available dietary options
  const allDietaryOptions = new Set<string>()
  menu.categories.forEach(category => {
    category.items.forEach(item => {
      if (item.dietary_info) {
        item.dietary_info.forEach(diet => allDietaryOptions.add(diet))
      }
    })
  })

  // Filter and search menu
  let filteredMenu = menu
  if (selectedDietary.length > 0) {
    filteredMenu = filterMenuByDietary(menu, selectedDietary)
  }

  // Apply search
  let searchResults: MenuItemExtended[] = []
  if (searchQuery.trim()) {
    searchResults = searchMenuItems(filteredMenu, searchQuery)
  }

  // Get categories to display
  const categoriesToShow = searchQuery.trim() 
    ? [] // If searching, we'll show search results instead
    : filteredMenu.categories
        .filter(category => !selectedCategory || category.id === selectedCategory)
        .sort((a, b) => a.display_order - b.display_order)

  const formatPrice = (price: number) => {
    return `${Math.round(price / 100)} NOK`
  }

  const getSpiceLevel = (level?: number) => {
    if (!level) return null
    return Array.from({ length: 5 }, (_, i) => (
      <Flame 
        key={i} 
        className={`w-3 h-3 ${i < level ? 'text-red-500 fill-current' : 'text-gray-300'}`} 
      />
    ))
  }

  const renderMenuItem = (item: MenuItemExtended) => {
    const DietaryIcon = dietaryIcons[item.dietary_info?.[0] as keyof typeof dietaryIcons] || AlertTriangle

    return (
      <div
        key={item.id}
        className="bg-white rounded-xl p-4 border border-gray-200 hover:border-primary/30 transition-colors cursor-pointer group"
        onClick={() => onItemSelect?.(item)}
      >
        <div className="flex items-start justify-between gap-4">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-2">
              <h3 className="font-medium text-gray-900 group-hover:text-primary transition-colors">
                {item.name}
              </h3>
              {item.is_popular && (
                <div className="flex items-center gap-1 text-orange-500">
                  <Star className="w-4 h-4 fill-current" />
                  <span className="text-xs font-medium">Popular</span>
                </div>
              )}
            </div>
            
            {item.description && (
              <p className="text-sm text-gray-600 mb-3 line-clamp-2">
                {item.description}
              </p>
            )}

            <div className="flex items-center gap-4 text-xs text-gray-500">
              {item.preparation_time && (
                <div className="flex items-center gap-1">
                  <Clock className="w-3 h-3" />
                  <span>{item.preparation_time} min</span>
                </div>
              )}
              
              {item.calories && (
                <span>{item.calories} cal</span>
              )}

              {item.spice_level && item.spice_level > 0 && (
                <div className="flex items-center gap-1">
                  {getSpiceLevel(item.spice_level)}
                </div>
              )}
            </div>

            {item.dietary_info && item.dietary_info.length > 0 && (
              <div className="flex flex-wrap gap-1 mt-3">
                {item.dietary_info.slice(0, 3).map((diet) => {
                  const Icon = dietaryIcons[diet as keyof typeof dietaryIcons] || AlertTriangle
                  return (
                    <span
                      key={diet}
                      className="inline-flex items-center gap-1 px-2 py-1 bg-gray-100 text-gray-700 rounded-full text-xs"
                    >
                      <Icon className="w-3 h-3" />
                      {dietaryLabels[diet as keyof typeof dietaryLabels] || diet}
                    </span>
                  )
                })}
                {item.dietary_info.length > 3 && (
                  <span className="text-xs text-gray-500">
                    +{item.dietary_info.length - 3} more
                  </span>
                )}
              </div>
            )}

            {item.variants && item.variants.length > 0 && (
              <div className="mt-2">
                <p className="text-xs text-gray-500 mb-1">Variants:</p>
                <div className="flex flex-wrap gap-1">
                  {item.variants.map((variant, index) => (
                    <span
                      key={index}
                      className="text-xs px-2 py-1 bg-blue-50 text-blue-700 rounded"
                    >
                      {variant.name}
                      {variant.price_modifier !== 0 && (
                        <span className="ml-1">
                          {variant.price_modifier > 0 ? '+' : ''}{Math.round(variant.price_modifier / 100)} NOK
                        </span>
                      )}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>

          <div className="text-right">
            <div className="text-lg font-bold text-primary">
              {formatPrice(item.price)}
            </div>
            {item.variants && item.variants.length > 0 && (
              <div className="text-xs text-gray-500">
                from {formatPrice(item.price)}
              </div>
            )}
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Restaurant Info */}
      <div className="text-center">
        <h1 className="text-2xl font-bold text-gray-900 mb-2">
          {menu.restaurant_info.name}
        </h1>
        {menu.restaurant_info.description && (
          <p className="text-gray-600">{menu.restaurant_info.description}</p>
        )}
        {menu.restaurant_info.phone && (
          <p className="text-sm text-gray-500 mt-2">
            📞 {menu.restaurant_info.phone}
          </p>
        )}
      </div>

      {/* Search and Filters */}
      {(showSearch || showFilters) && (
        <div className="space-y-4">
          {showSearch && (
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                type="text"
                placeholder="Search menu items..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-primary/20 focus:border-primary transition-colors"
              />
            </div>
          )}

          {showFilters && (
            <div className="flex flex-wrap gap-2">
              {/* Category Filter */}
              <select
                value={selectedCategory || ''}
                onChange={(e) => setSelectedCategory(e.target.value || null)}
                className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-primary/20 focus:border-primary"
              >
                <option value="">All Categories</option>
                {menu.categories.map(category => (
                  <option key={category.id} value={category.id}>
                    {category.name}
                  </option>
                ))}
              </select>

              {/* Dietary Filter */}
              <div className="flex flex-wrap gap-2">
                {Array.from(allDietaryOptions).map(diet => (
                  <button
                    key={diet}
                    onClick={() => {
                      setSelectedDietary(prev => 
                        prev.includes(diet) 
                          ? prev.filter(d => d !== diet)
                          : [...prev, diet]
                      )
                    }}
                    className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                      selectedDietary.includes(diet)
                        ? 'bg-primary text-white'
                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                    }`}
                  >
                    {dietaryLabels[diet as keyof typeof dietaryLabels] || diet}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Menu Content */}
      {searchQuery.trim() ? (
        // Search Results
        <div className="space-y-4">
          <h2 className="text-lg font-semibold">
            Search Results ({searchResults.length})
          </h2>
          {searchResults.length > 0 ? (
            <div className="grid gap-4">
              {searchResults.map(renderMenuItem)}
            </div>
          ) : (
            <div className="text-center py-8 text-gray-500">
              <Search className="w-12 h-12 mx-auto mb-4 text-gray-300" />
              <p>No items found matching "{searchQuery}"</p>
            </div>
          )}
        </div>
      ) : (
        // Categories
        <div className="space-y-8">
          {categoriesToShow.map(category => (
            <div key={category.id}>
              <div className="flex items-center gap-3 mb-4">
                <h2 className="text-xl font-semibold text-gray-900">
                  {category.name}
                </h2>
                {category.description && (
                  <span className="text-sm text-gray-500">
                    {category.description}
                  </span>
                )}
                <div className="flex-1 h-px bg-gray-200" />
                <span className="text-sm text-gray-500">
                  {category.items.length} items
                </span>
              </div>
              
              <div className="grid gap-4">
                {category.items.map(renderMenuItem)}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Empty State */}
      {!searchQuery.trim() && categoriesToShow.length === 0 && (
        <div className="text-center py-12 text-gray-500">
          <Filter className="w-12 h-12 mx-auto mb-4 text-gray-300" />
          <p>No menu items available</p>
        </div>
      )}
    </div>
  )
}


