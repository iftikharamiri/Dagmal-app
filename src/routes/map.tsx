import { useState, useEffect } from 'react'
import { useQuery } from '@tanstack/react-query'
import { useNavigate } from 'react-router-dom'
import { Locate, Filter } from 'lucide-react'
import { Header } from '@/components/Header'
import { RestaurantMap } from '@/components/RestaurantMap'
import { FilterSheet } from '@/components/FilterSheet'
import { supabase } from '@/lib/supabase'
import { norwegianText } from '@/i18n/no'
import { cn } from '@/lib/utils'
import { useGeolocation } from '@/hooks/useGeolocation'
import { filterDealsWithinActiveDateRange } from '@/lib/dealUtils'

interface FilterState {
  cuisines: string[]
  dietary: string[]
  distance?: number
}

export function MapPage() {
  const [userLocation, setUserLocation] = useState<[number, number] | null>(null)
  const [locationError, setLocationError] = useState<string | null>(null)
  const geo = useGeolocation({ enableHighAccuracy: true, maximumAge: 0, timeout: 20000 })
  const [filters, setFilters] = useState<FilterState>({
    cuisines: [],
    dietary: [],
  })
  const [showFilters, setShowFilters] = useState(false)
  const navigate = useNavigate()

  // Handle restaurant click
  const handleRestaurantClick = (restaurant: any) => {
    navigate(`/restaurant/${restaurant.id}`)
  }

  // Get user location via high-accuracy watcher
  useEffect(() => {
    if (geo.latitude != null && geo.longitude != null) {
      setUserLocation([geo.latitude, geo.longitude])
      setLocationError(null)
    } else if (geo.error) {
      setLocationError(geo.error)
    }
  }, [geo.latitude, geo.longitude, geo.error])

  // Fetch restaurants with their deals
  const { data: restaurants = [], isLoading } = useQuery({
    queryKey: ['map-restaurants', filters],
    queryFn: async () => {
      let query = supabase
        .from('restaurants')
        .select(`
          *,
          deals!left(*)
        `)

      // Apply cuisine filter
      if (filters.cuisines.length > 0) {
        query = query.overlaps('categories', filters.cuisines)
      }

      const { data, error } = await query

      if (error) throw error

      console.log('🗺️ Map restaurants data:', data)

      // Process data to get restaurants with their deals
      const restaurantMap = new Map<string, any>()
      
      data?.forEach((row: any) => {
        const restaurant = {
          id: row.id,
          name: row.name,
          lat: row.lat,
          lng: row.lng,
          address: row.address,
          city: row.city,
          phone: row.phone,
          categories: row.categories || [],
          image_url: row.image_url,
          description: row.description,
        }

        // Only include restaurants with coordinates
        if (!restaurant.lat || !restaurant.lng) {
          return
        }

        if (!restaurantMap.has(restaurant.id)) {
          restaurantMap.set(restaurant.id, {
            ...restaurant,
            deals: [],
            isOpen: true, // TODO: Calculate based on current time and restaurant hours
          })
        }

        // row.deals can be an array (one-to-many). Push all deals if present
        if (Array.isArray(row.deals)) {
          row.deals.forEach((d: any) => {
            if (d) restaurantMap.get(restaurant.id).deals.push(d)
          })
        }
      })

      // Convert to array and add best deal info
      return Array.from(restaurantMap.values()).map((restaurant: any) => {
        // Filter deals to only include those active today
        const todayActiveDeals = filterDealsWithinActiveDateRange(
          (restaurant.deals as any[]).filter((deal: any) => deal && deal.is_active),
          new Date()
        )
        
        // Find the best deal (highest discount percentage) from today's active deals
        const activeDeal = todayActiveDeals
          .sort((a: any, b: any) => (b.discount_percentage || 0) - (a.discount_percentage || 0))[0]

        return {
          id: restaurant.id,
          name: restaurant.name,
          lat: restaurant.lat,
          lng: restaurant.lng,
          address: restaurant.address,
          city: restaurant.city,
          phone: restaurant.phone,
          categories: restaurant.categories,
          image_url: restaurant.image_url,
          description: restaurant.description,
          isOpen: restaurant.isOpen,
          dealCount: todayActiveDeals.length,
          bestDeal: activeDeal ? 
            `${activeDeal.title} - ${activeDeal.discount_percentage}% rabatt` :
            null,
          activeDeal: activeDeal || undefined, // Only include if there's an active deal today
        }
      })
    },
  })

  // Get filter options
  const { data: filterOptions = { cuisines: [], dietary: [] } } = useQuery({
    queryKey: ['filter-options'],
    queryFn: async () => {
      const { data: restaurants } = await supabase
        .from('restaurants')
        .select('categories')

      const cuisines = [...new Set(restaurants?.flatMap(r => r.categories) || [])]
      const dietary = [
        'Vegetarisk', 'Vegansk', 'Glutenfri', 'Laktosefri', 'Nøttefri', 
        'Skalldyrfri', 'Halal', 'Kosher'
      ]

      return { cuisines, dietary }
    },
  })

  const handleLocateUser = () => {
    if (geo.latitude != null && geo.longitude != null) {
      setUserLocation([geo.latitude, geo.longitude])
    }
  }

  return (
    <div className="min-h-screen bg-bg pb-20">
      <Header showSearch={false} />

      <main className="relative h-[calc(100vh-4rem-5rem)]">
        {/* Map Container */}
        <div className="h-full relative">
          {userLocation ? (
            <RestaurantMap
              restaurants={restaurants}
              onRestaurantClick={handleRestaurantClick}
              center={userLocation}
              zoom={13}
              className="h-full"
              userLocation={userLocation}
            />
          ) : (
            <div className="h-full flex items-center justify-center bg-muted">
              {isLoading ? (
                <div className="text-center">
                  <div className="animate-spin rounded-full h-8 w-8 border-2 border-primary border-t-transparent mx-auto mb-4" />
                  <p className="text-muted-fg">Laster kart...</p>
                </div>
              ) : (
                <div className="text-center">
                  <div className="text-4xl mb-4">🗺️</div>
                  <p className="text-muted-fg mb-4">
                    {locationError || 'Henter din posisjon...'}
                  </p>
                  <button onClick={handleLocateUser} className="btn-primary">
                    Prøv igjen
                  </button>
                </div>
              )}
            </div>
          )}

          {/* Map Controls */}
          <div className="absolute top-4 right-4 flex flex-col gap-2">
            {/* Filter Button */}
            <button
              onClick={() => setShowFilters(true)}
              className={cn(
                'btn-secondary p-3 rounded-full shadow-soft',
                (filters.cuisines.length > 0) && 'ring-2 ring-primary'
              )}
              aria-label="Filtrer restauranter"
            >
              <Filter className="h-5 w-5" />
            </button>

            {/* Locate Button */}
            <button
              onClick={handleLocateUser}
              className="btn-primary p-3 rounded-full shadow-soft"
              aria-label="Finn min posisjon"
            >
              <Locate className="h-5 w-5" />
            </button>
          </div>

          {/* Map Legend */}
          <div className="absolute bottom-20 left-4 z-[1000] bg-white rounded-2xl p-3 shadow-soft border border-border">
            <h4 className="text-sm font-semibold mb-2">Kartforklaring</h4>
            <div className="space-y-2 text-xs">
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 rounded-full bg-red-500 flex items-center justify-center relative">
                  <span className="text-white text-[6px]">✓</span>
                  <div className="absolute -top-1 -right-1 w-2 h-2 bg-amber-500 rounded-full flex items-center justify-center">
                    <span className="text-white text-[6px] font-bold">%</span>
                  </div>
                </div>
                <span>Med tilbud</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 rounded-full bg-green-500 flex items-center justify-center">
                  <span className="text-white text-[6px]">✓</span>
                </div>
                <span>Åpen</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 rounded-full bg-red-600 flex items-center justify-center">
                  <span className="text-white text-[6px]">✕</span>
                </div>
                <span>Stengt</span>
              </div>
            </div>
          </div>

          {/* Stats Overlay */}
          <div className="absolute bottom-4 left-4 right-4">
            <div className="bg-card/90 backdrop-blur-sm rounded-2xl p-4 shadow-soft">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-fg">Restauranter med tilbud</p>
                  <p className="text-xl font-bold">{restaurants.length}</p>
                </div>
                <div className="flex gap-2">
                  <div className="w-3 h-3 bg-success rounded-full" />
                  <span className="text-sm">Åpent</span>
                  <div className="w-3 h-3 bg-danger rounded-full ml-4" />
                  <span className="text-sm">Stengt</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>

      {/* Filter Sheet */}
      <FilterSheet
        isOpen={showFilters}
        onClose={() => setShowFilters(false)}
        cuisines={filterOptions.cuisines}
        dietary={filterOptions.dietary}
        selectedCuisines={filters.cuisines}
        selectedDietary={filters.dietary}
        onFiltersChange={(newFilters) => {
          setFilters({
            cuisines: newFilters.cuisines,
            dietary: newFilters.dietary,
            distance: newFilters.distance,
          })
        }}
      />
    </div>
  )
}

