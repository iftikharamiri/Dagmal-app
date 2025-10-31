import React, { useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { ArrowLeft, Star, Clock, Flame, Leaf, Wheat, Milk, Egg, AlertTriangle } from 'lucide-react'
import { supabase } from '@/lib/supabase'
import { MenuDisplay } from '@/components/MenuDisplay'
import { CompleteMenu, convertDatabaseToMenu, MenuItemExtended } from '@/lib/menuUtils'

export function MenuPage() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const [selectedItem, setSelectedItem] = useState<MenuItemExtended | null>(null)

  // Fetch restaurant data
  const { data: restaurant, isLoading: restaurantLoading } = useQuery({
    queryKey: ['restaurant', id],
    queryFn: async () => {
      if (!id) throw new Error('Restaurant ID required')

      const { data, error } = await supabase
        .from('restaurants')
        .select('*')
        .eq('id', id)
        .single()

      if (error) throw error
      return data as any // Temporary fix for type issues
    },
    enabled: !!id,
  })

  // Fetch menu items
  const { data: menuItems = [], isLoading: menuLoading } = useQuery({
    queryKey: ['menu-items', id],
    queryFn: async () => {
      if (!id) return []

      const { data, error } = await supabase
        .from('menu_items')
        .select('*')
        .eq('restaurant_id', id)
        .eq('is_available', true)
        .order('category')
        .order('name')

      if (error) throw error
      return data
    },
    enabled: !!id,
  })

  // Convert database menu items to complete menu format
  const completeMenu: CompleteMenu | null = React.useMemo(() => {
    if (!restaurant || menuItems.length === 0) return null

    const restaurantInfo = {
      name: restaurant.name,
      description: restaurant.description,
      phone: restaurant.phone,
      address: restaurant.address,
      city: restaurant.city,
      categories: restaurant.categories || []
    }

    const metadata = {
      version: '1.0',
      last_updated: new Date().toISOString(),
      currency: 'NOK',
      language: 'no',
      dining_options: {
        dine_in: restaurant.dine_in,
        takeaway: restaurant.takeaway,
        delivery: false
      }
    }

    return convertDatabaseToMenu(menuItems, restaurantInfo, metadata)
  }, [restaurant, menuItems])

  const handleItemSelect = (item: MenuItemExtended) => {
    setSelectedItem(item)
  }

  const formatPrice = (price: number) => {
    return `${Math.round(price / 100)} NOK`
  }

  if (restaurantLoading || menuLoading) {
    return (
      <div className="min-h-screen bg-bg flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p>Loading menu...</p>
        </div>
      </div>
    )
  }

  if (!restaurant) {
    return (
      <div className="min-h-screen bg-bg flex items-center justify-center">
        <div className="text-center max-w-md">
          <div className="text-6xl mb-4">🍽️</div>
          <h2 className="text-xl font-bold mb-2">Restaurant not found</h2>
          <p className="text-muted-fg mb-6">The restaurant you're looking for doesn't exist.</p>
          <button
            onClick={() => navigate('/')}
            className="bg-primary text-primary-fg px-6 py-3 rounded-xl hover:bg-primary/90 transition-colors"
          >
            Back to Home
          </button>
        </div>
      </div>
    )
  }

  if (!completeMenu || completeMenu.categories.length === 0) {
    return (
      <div className="min-h-screen bg-bg">
        {/* Header */}
        <div className="bg-white border-b px-4 py-4">
          <div className="flex items-center gap-4">
            <button 
              onClick={() => navigate(`/restaurant/${id}`)}
              className="p-2 hover:bg-muted rounded-full transition-colors"
            >
              <ArrowLeft className="h-5 w-5" />
            </button>
            <div>
              <h1 className="text-xl font-bold">{restaurant.name}</h1>
              <p className="text-sm text-muted-fg">Menu</p>
            </div>
          </div>
        </div>

        <div className="max-w-4xl mx-auto px-4 py-12">
          <div className="text-center">
            <div className="text-6xl mb-4">📋</div>
            <h2 className="text-2xl font-bold mb-2">No menu available</h2>
            <p className="text-muted-fg mb-6">
              This restaurant hasn't uploaded their menu yet.
            </p>
            <button
              onClick={() => navigate(`/restaurant/${id}`)}
              className="bg-primary text-primary-fg px-6 py-3 rounded-xl hover:bg-primary/90 transition-colors"
            >
              View Restaurant
            </button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-bg pb-[calc(72px+env(safe-area-inset-bottom))] md:pb-6">
      {/* Header */}
      <div className="bg-white border-b px-4 py-4 sticky top-0 z-10">
        <div className="flex items-center gap-4">
          <button 
            onClick={() => navigate(`/restaurant/${id}`)}
            className="p-2 hover:bg-muted rounded-full transition-colors"
          >
            <ArrowLeft className="h-5 w-5" />
          </button>
          <div>
            <h1 className="text-xl font-bold">{restaurant.name}</h1>
            <p className="text-sm text-muted-fg">Menu</p>
          </div>
        </div>
      </div>

      {/* Menu Content */}
      <div className="max-w-4xl mx-auto px-4 py-6">
        <MenuDisplay
          menu={completeMenu}
          onItemSelect={handleItemSelect}
          showSearch={true}
          showFilters={true}
        />
      </div>

      {/* Bottom spacer to ensure last item is not hidden by bottom nav on small screens */}
      <div className="h-4 md:h-0" />

      {/* Item Detail Modal */}
      {selectedItem && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl max-w-md w-full max-h-[90vh] overflow-hidden">
            {/* Header */}
            <div className="flex items-center justify-between p-6 border-b">
              <h3 className="text-lg font-semibold">{selectedItem.name}</h3>
              <button
                onClick={() => setSelectedItem(null)}
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <ArrowLeft className="w-5 h-5" />
              </button>
            </div>

            {/* Content */}
            <div className="p-6 space-y-4">
              {selectedItem.image_url && (
                <div className="w-full h-48 bg-gray-100 rounded-xl overflow-hidden">
                  <img
                    src={selectedItem.image_url}
                    alt={selectedItem.name}
                    className="w-full h-full object-cover"
                  />
                </div>
              )}

              {selectedItem.description && (
                <p className="text-gray-600">{selectedItem.description}</p>
              )}

              <div className="flex items-center justify-between">
                <div className="text-2xl font-bold text-primary">
                  {formatPrice(selectedItem.price)}
                </div>
                {selectedItem.is_popular && (
                  <div className="flex items-center gap-1 text-orange-500">
                    <Star className="w-4 h-4 fill-current" />
                    <span className="text-sm font-medium">Popular</span>
                  </div>
                )}
              </div>

              {/* Item Details */}
              <div className="space-y-3">
                {selectedItem.preparation_time && (
                  <div className="flex items-center gap-2 text-sm text-gray-600">
                    <Clock className="w-4 h-4" />
                    <span>{selectedItem.preparation_time} minutes</span>
                  </div>
                )}

                {selectedItem.calories && (
                  <div className="text-sm text-gray-600">
                    <span className="font-medium">Calories:</span> {selectedItem.calories}
                  </div>
                )}

                {selectedItem.spice_level && selectedItem.spice_level > 0 && (
                  <div className="flex items-center gap-2 text-sm text-gray-600">
                    <span className="font-medium">Spice level:</span>
                    <div className="flex gap-1">
                      {Array.from({ length: 5 }, (_, i) => (
                        <Flame 
                          key={i} 
                          className={`w-3 h-3 ${i < selectedItem.spice_level! ? 'text-red-500 fill-current' : 'text-gray-300'}`} 
                        />
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {/* Dietary Information */}
              {selectedItem.dietary_info && selectedItem.dietary_info.length > 0 && (
                <div>
                  <h4 className="font-medium mb-2">Dietary Information</h4>
                  <div className="flex flex-wrap gap-2">
                    {selectedItem.dietary_info.map((diet) => {
                      const dietaryIcons: Record<string, any> = {
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
                      const Icon = dietaryIcons[diet] || AlertTriangle

                      return (
                        <span
                          key={diet}
                          className="inline-flex items-center gap-1 px-3 py-1 bg-gray-100 text-gray-700 rounded-full text-sm"
                        >
                          <Icon className="w-3 h-3" />
                          {diet}
                        </span>
                      )
                    })}
                  </div>
                </div>
              )}

              {/* Variants */}
              {selectedItem.variants && selectedItem.variants.length > 0 && (
                <div>
                  <h4 className="font-medium mb-2">Available Variants</h4>
                  <div className="space-y-2">
                    {selectedItem.variants.map((variant, index) => (
                      <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                        <div>
                          <div className="font-medium">{variant.name}</div>
                          {variant.description && (
                            <div className="text-sm text-gray-600">{variant.description}</div>
                          )}
                        </div>
                        <div className="text-right">
                          <div className="font-bold text-primary">
                            {formatPrice(selectedItem.price + variant.price_modifier)}
                          </div>
                          {variant.price_modifier !== 0 && (
                            <div className="text-xs text-gray-500">
                              {variant.price_modifier > 0 ? '+' : ''}{Math.round(variant.price_modifier / 100)} NOK
                            </div>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Footer */}
            <div className="p-6 border-t bg-gray-50">
              <button
                onClick={() => setSelectedItem(null)}
                className="w-full bg-primary text-primary-fg py-3 rounded-xl hover:bg-primary/90 transition-colors font-medium"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
