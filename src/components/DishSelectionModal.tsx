import React, { useState, useEffect } from 'react'
import { X, Search, Plus, ChefHat } from 'lucide-react'
import { supabase } from '@/lib/supabase'
import { MenuItem } from '@/lib/database.types'
import { formatPrice } from '@/lib/utils'

interface DishSelectionModalProps {
  isOpen: boolean
  onClose: () => void
  onSelectDish: (dish: MenuItem) => void
  restaurantId: string
}

const dietaryOptions = [
  { id: 'vegetarian', label: 'Vegetar', color: 'bg-green-100 text-green-800' },
  { id: 'vegan', label: 'Vegan', color: 'bg-green-100 text-green-800' },
  { id: 'gluten-free', label: 'Glutenfri', color: 'bg-blue-100 text-blue-800' },
  { id: 'dairy-free', label: 'Laktosefri', color: 'bg-purple-100 text-purple-800' },
  { id: 'halal', label: 'Halal', color: 'bg-orange-100 text-orange-800' },
  { id: 'kosher', label: 'Kosher', color: 'bg-yellow-100 text-yellow-800' }
]

export function DishSelectionModal({ isOpen, onClose, onSelectDish, restaurantId }: DishSelectionModalProps) {
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedFilters, setSelectedFilters] = useState<string[]>([])
  const [menuItems, setMenuItems] = useState<MenuItem[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Fetch menu items when modal opens
  useEffect(() => {
    console.log('Modal opened, restaurantId:', restaurantId, 'isOpen:', isOpen)
    if (isOpen && restaurantId) {
      fetchMenuItems()
    }
  }, [isOpen, restaurantId])

  const fetchMenuItems = async () => {
    setLoading(true)
    setError(null)
    
    try {
      console.log('Fetching menu items for restaurant:', restaurantId)
      
      const { data, error } = await supabase
        .from('menu_items')
        .select('*')
        .eq('restaurant_id', restaurantId)
        .eq('is_available', true)
        .order('category')
        .order('name')

      if (error) {
        console.error('Error fetching menu items:', error)
        // Fallback to sample data if database fails
        const sampleMenuItems = [
          {
            id: 'sample-1',
            restaurant_id: restaurantId,
            name: 'Classic Burger',
            description: 'Hamburger, ost, isbergsalat, tomat, karamellisert løk, syltet løk, dressing',
            price: 16900, // in øre
            category: 'BURGERS',
            dietary_info: ['soy', 'egg', 'milk', 'mustard', 'celery', 'gluten'],
            image_url: null,
            is_available: true,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
          },
          {
            id: 'sample-2',
            restaurant_id: restaurantId,
            name: 'Babylon Burger',
            description: 'Hamburger, ost, karamellisert løk, kål med dressing',
            price: 17400,
            category: 'BURGERS',
            dietary_info: ['soy', 'egg', 'milk', 'mustard', 'celery', 'gluten'],
            image_url: null,
            is_available: true,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
          },
          {
            id: 'sample-3',
            restaurant_id: restaurantId,
            name: 'Chilli Cheese Burger',
            description: 'Hamburger, ost, kokt chilli, karamellisert løk, Kål med dressing',
            price: 17600,
            category: 'BURGERS',
            dietary_info: ['soy', 'egg', 'milk', 'mustard', 'celery', 'gluten'],
            image_url: null,
            is_available: true,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
          },
          {
            id: 'sample-4',
            restaurant_id: restaurantId,
            name: 'Truffle Burger',
            description: 'Hamburger, trøffel saus med champignon, cheddar ost, karamelisert løk, dressing',
            price: 18600,
            category: 'BURGERS',
            dietary_info: ['soy', 'egg', 'milk', 'mustard', 'celery', 'gluten'],
            image_url: null,
            is_available: true,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
          },
          {
            id: 'sample-5',
            restaurant_id: restaurantId,
            name: 'Falafel Burger',
            description: 'Falafel, isbergsalat, persille, tomat, mynt, pfefferoni, falafel saus',
            price: 15500,
            category: 'VEGETARIAN',
            dietary_info: ['soy', 'mustard', 'celery', 'sesame', 'gluten'],
            image_url: null,
            is_available: true,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
          },
          {
            id: 'sample-6',
            restaurant_id: restaurantId,
            name: 'Pommes Frites',
            description: 'Krispige pommes frites',
            price: 6900,
            category: 'SIDES',
            dietary_info: ['soy', 'egg', 'celery', 'gluten'],
            image_url: null,
            is_available: true,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
          },
          {
            id: 'sample-7',
            restaurant_id: restaurantId,
            name: 'Mozzarella Sticks (5 stk)',
            description: '5 stykker mozzarella sticks',
            price: 6500,
            category: 'SIDES',
            dietary_info: ['soy', 'egg', 'milk', 'celery', 'gluten'],
            image_url: null,
            is_available: true,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
          },
          {
            id: 'sample-8',
            restaurant_id: restaurantId,
            name: 'Sjokolade Shake',
            description: 'Vaniljeis, melk, Monin sjokoladesaus',
            price: 9500,
            category: 'ICE CREAM SHAKES',
            dietary_info: ['milk'],
            image_url: null,
            is_available: true,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
          }
        ]
        console.log('Sample menu items loaded:', sampleMenuItems.length)
        setMenuItems(sampleMenuItems)
      } else {
        console.log('Menu items loaded from database:', data.length)
        setMenuItems(data)
      }
    } catch (err: any) {
      console.error('Error loading menu:', err)
      setError(`Kunne ikke laste menyen: ${err.message || 'Ukjent feil'}`)
    } finally {
      setLoading(false)
    }
  }

  const filteredMenuItems = menuItems.filter(item => {
    // Search filter
    const matchesSearch = item.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         item.description?.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         item.category?.toLowerCase().includes(searchQuery.toLowerCase())

    // Dietary filter
    const matchesDietary = selectedFilters.length === 0 || 
                          selectedFilters.some(filter => item.dietary_info.includes(filter))

    return matchesSearch && matchesDietary
  })

  const handleFilterToggle = (filterId: string) => {
    setSelectedFilters(prev => 
      prev.includes(filterId) 
        ? prev.filter(f => f !== filterId)
        : [...prev, filterId]
    )
  }

  const handleSelectDish = (dish: MenuItem) => {
    onSelectDish(dish)
    onClose()
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl w-full max-w-2xl max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-100">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-purple-100 rounded-full flex items-center justify-center">
              <ChefHat className="w-5 h-5 text-purple-600" />
            </div>
            <h2 className="text-xl font-semibold text-gray-900">Velg retter for tilbudet</h2>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center hover:bg-gray-200 transition-colors"
          >
            <X className="w-4 h-4 text-gray-600" />
          </button>
        </div>

        {/* Search and Filters */}
        <div className="p-6 space-y-4">
          {/* Search Bar */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              placeholder="Søk i din meny..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-transparent outline-none"
            />
          </div>

          {/* Filter Buttons */}
          <div className="flex flex-wrap gap-2">
            {dietaryOptions.map(option => (
              <button
                key={option.id}
                onClick={() => handleFilterToggle(option.id)}
                className={`px-4 py-2 rounded-full text-sm font-medium transition-colors ${
                  selectedFilters.includes(option.id)
                    ? option.color
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                {option.label}
              </button>
            ))}
          </div>
        </div>

        {/* Menu Items List */}
        <div className="px-6 pb-6 max-h-96 overflow-y-auto">
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-600"></div>
            </div>
          ) : error ? (
            <div className="text-center py-12">
              <p className="text-red-600 mb-4">{error}</p>
              <button
                onClick={fetchMenuItems}
                className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors"
              >
                Prøv igjen
              </button>
            </div>
          ) : filteredMenuItems.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-gray-500 mb-2">
                {searchQuery || selectedFilters.length > 0 
                  ? 'Ingen retter funnet med disse filterne'
                  : 'Ingen retter i menyen ennå'
                }
              </p>
              {!searchQuery && selectedFilters.length === 0 && (
                <p className="text-sm text-gray-400">
                  Last opp en meny for å komme i gang
                </p>
              )}
            </div>
          ) : (
            <div className="space-y-3">
              {filteredMenuItems.map(item => (
                <div
                  key={item.id}
                  className="bg-white border border-gray-200 rounded-xl p-4 hover:shadow-md transition-shadow"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <h3 className="font-semibold text-gray-900">{item.name}</h3>
                        <span className="text-gray-900 font-medium">
                          {formatPrice(item.price)}
                        </span>
                      </div>
                      
                      {item.description && (
                        <p className="text-gray-600 text-sm mb-2">{item.description}</p>
                      )}
                      
                      <div className="flex items-center gap-2">
                        {item.dietary_info.map(dietary => {
                          const option = dietaryOptions.find(opt => opt.id === dietary)
                          return option ? (
                            <span
                              key={dietary}
                              className={`px-2 py-1 rounded-full text-xs font-medium ${option.color}`}
                            >
                              {option.label}
                            </span>
                          ) : null
                        })}
                      </div>
                    </div>
                    
                    <button
                      onClick={() => handleSelectDish(item)}
                      className="ml-4 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors flex items-center gap-2"
                    >
                      <Plus className="w-4 h-4" />
                      Legg til
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
