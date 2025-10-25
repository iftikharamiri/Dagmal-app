import { useQuery, useQueryClient } from '@tanstack/react-query'
import { Heart, MapPin } from 'lucide-react'
import { toast } from 'sonner'
import { useNavigate } from 'react-router-dom'
import { Header } from '@/components/Header'
import { useAuthGuard } from '@/hooks/useAuthGuard'
import { supabase } from '@/lib/supabase'
import { norwegianText } from '@/i18n/no'
import { cn } from '@/lib/utils'
import type { Restaurant } from '@/lib/database.types'

export function FavoritesPage() {
  const { user, isLoading: authLoading } = useAuthGuard()
  const navigate = useNavigate()
  const queryClient = useQueryClient()

  const { data: profile } = useQuery({
    queryKey: ['profile'],
    queryFn: async () => {
      if (!user) return null

      // Force real Supabase mode
      const isDemoMode = false
      
      if (isDemoMode) {
        // Return demo profile from localStorage
        const demoProfile = localStorage.getItem('demo_profile')
        if (demoProfile) {
          return JSON.parse(demoProfile)
        }
        // Create default demo profile
        const defaultProfile = {
          id: user.id,
          display_name: user.email?.split('@')[0] || 'Demo User',
          phone: null,
          cuisines: [],
          dietary: [],
          favorites: [],
          favorite_deals: [],
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        }
        localStorage.setItem('demo_profile', JSON.stringify(defaultProfile))
        return defaultProfile
      }

      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .single()

      if (error && error.code !== 'PGRST116') throw error
      return data
    },
    enabled: !!user,
  })

  const { data: favoriteRestaurants = [], isLoading: restaurantsLoading } = useQuery({
    queryKey: ['favorite-restaurants', profile?.favorites],
    queryFn: async () => {
      if (!profile?.favorites?.length) return []

      // Force real Supabase mode
      const isDemoMode = false
      
      if (isDemoMode) {
        // Return demo restaurants that match favorites
        const demoRestaurants = [
          {
            id: 'rest-1',
            name: 'Fjord & Furu',
            description: 'Sesongbasert norsk mat',
            image_url: 'https://picsum.photos/seed/fjord/800/600',
            phone: '+47 40000000',
            address: 'Karl Johans gate 10',
            city: 'Oslo',
            lat: 59.9139,
            lng: 10.7522,
            categories: ['Norsk', 'Moderne'],
            dine_in: true,
            takeaway: true,
            created_at: new Date().toISOString()
          },
          {
            id: 'rest-2',
            name: 'Bella Vista',
            description: 'Autentisk italiensk pizza',
            image_url: 'https://picsum.photos/seed/pizza/800/600',
            phone: '+47 45000000',
            address: 'Aker Brygge 5',
            city: 'Oslo',
            lat: 59.9107,
            lng: 10.7327,
            categories: ['Italiensk', 'Pizza'],
            dine_in: true,
            takeaway: true,
            created_at: new Date().toISOString()
          },
          {
            id: 'rest-3',
            name: 'Green Garden',
            description: 'Vegetarisk og vegansk mat',
            image_url: 'https://picsum.photos/seed/vegan/800/600',
            phone: '+47 46000000',
            address: 'Grünerløkka 12',
            city: 'Oslo',
            lat: 59.9236,
            lng: 10.7579,
            categories: ['Vegetarisk', 'Vegansk', 'Sunt'],
            dine_in: true,
            takeaway: true,
            created_at: new Date().toISOString()
          }
        ]
        
        return demoRestaurants.filter(restaurant => 
          profile.favorites.includes(restaurant.id)
        )
      }

      const { data, error } = await supabase
        .from('restaurants')
        .select('*')
        .in('id', profile.favorites)

      if (error) throw error
      return data as Restaurant[]
    },
    enabled: !!profile?.favorites?.length,
  })

  // Get active deals for each favorite restaurant
  const { data: restaurantDeals = {} } = useQuery({
    queryKey: ['favorite-deals', favoriteRestaurants.map(r => r.id)],
    queryFn: async () => {
      if (!favoriteRestaurants.length) return {}

      const { data, error } = await supabase
        .from('deals')
        .select('restaurant_id, title, discount_percentage')
        .in('restaurant_id', favoriteRestaurants.map(r => r.id))
        .eq('is_active', true)
        .order('discount_percentage', { ascending: false })

      if (error) throw error

      // Group deals by restaurant
      const dealsMap: Record<string, any[]> = {}
      data.forEach(deal => {
        if (!dealsMap[deal.restaurant_id]) {
          dealsMap[deal.restaurant_id] = []
        }
        dealsMap[deal.restaurant_id].push(deal)
      })

      return dealsMap
    },
    enabled: favoriteRestaurants.length > 0,
  })

  // Get user's favorited deals
  const { data: favoriteDeals = [], isLoading: dealsLoading } = useQuery({
    queryKey: ['favorite-deals-list', profile?.favorite_deals],
    queryFn: async () => {
      if (!profile?.favorite_deals?.length) return []

      const { data, error } = await supabase
        .from('deals')
        .select(`
          *,
          restaurant:restaurants(*)
        `)
        .in('id', profile.favorite_deals)
        .eq('is_active', true)
        .order('discount_percentage', { ascending: false })

      if (error) throw error
      return data as any[]
    },
    enabled: !!profile?.favorite_deals?.length,
  })

  const handleRemoveFavorite = async (restaurantId: string) => {
    if (!profile) return

    const newFavorites = profile.favorites.filter(id => id !== restaurantId)

    try {
      // Force real Supabase mode
      const isDemoMode = false
      
      if (isDemoMode) {
        // Update demo profile in localStorage
        const updatedProfile = {
          ...profile,
          favorites: newFavorites,
          updated_at: new Date().toISOString(),
        }
        localStorage.setItem('demo_profile', JSON.stringify(updatedProfile))
        
        // Update React Query cache
        queryClient.setQueryData(['profile'], updatedProfile)
      } else {
        // Real Supabase mode
        const { error } = await supabase
          .from('profiles')
          .update({ favorites: newFavorites })
          .eq('id', profile.id)

        if (error) throw error

        // Update cache
        queryClient.setQueryData(['profile'], {
          ...profile,
          favorites: newFavorites,
        })
      }

      toast.success(norwegianText.success.favoriteRemoved)
    } catch (error) {
      console.error('Error removing favorite:', error)
      toast.error(norwegianText.errors.unknownError)
    }
  }

  const handleRemoveDealFavorite = async (dealId: string) => {
    if (!profile) return

    const newFavoriteDeals = profile.favorite_deals?.filter(id => id !== dealId) || []

    try {
      // Force real Supabase mode
      const isDemoMode = false
      
      if (isDemoMode) {
        // Update demo profile in localStorage
        const updatedProfile = {
          ...profile,
          favorite_deals: newFavoriteDeals,
          updated_at: new Date().toISOString(),
        }
        localStorage.setItem('demo_profile', JSON.stringify(updatedProfile))
        
        // Update React Query cache
        queryClient.setQueryData(['profile'], updatedProfile)
      } else {
        // Real Supabase mode
        const { error } = await supabase
          .from('profiles')
          .update({ favorite_deals: newFavoriteDeals })
          .eq('id', profile.id)

        if (error) throw error

        // Update cache
        queryClient.setQueryData(['profile'], {
          ...profile,
          favorite_deals: newFavoriteDeals,
        })
      }

      toast.success(norwegianText.success.favoriteRemoved)
    } catch (error) {
      console.error('Error removing deal favorite:', error)
      toast.error(norwegianText.errors.unknownError)
    }
  }

  const handleRestaurantClick = (restaurantId: string) => {
    navigate(`/restaurant/${restaurantId}`)
  }

  if (authLoading || !user) {
    return (
      <div className="min-h-screen bg-bg">
        <Header showSearch={false} />
        <div className="flex items-center justify-center py-20">
          <div className="animate-spin rounded-full h-8 w-8 border-2 border-primary border-t-transparent" />
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-bg pb-20">
      <Header showSearch={false} showMenu={false} />

      <main className="px-4 py-6">
        <div className="max-w-2xl mx-auto">
          {/* Header */}
          <div className="mb-6">
            <h1 className="text-2xl font-bold mb-2">{norwegianText.nav.favorites}</h1>
            <p className="text-muted-fg">
              {favoriteRestaurants.length > 0 || favoriteDeals.length > 0
                ? `${favoriteRestaurants.length} restaurant${favoriteRestaurants.length === 1 ? '' : 'er'}, ${favoriteDeals.length} tilbud${favoriteDeals.length === 1 ? '' : ''}`
                : 'Ingen favoritter enda'
              }
            </p>
          </div>

          {/* Empty State */}
          {favoriteRestaurants.length === 0 && favoriteDeals.length === 0 && !restaurantsLoading && !dealsLoading && (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <div className="text-6xl mb-4">💝</div>
              <h3 className="text-lg font-semibold mb-2">{norwegianText.empty.noFavorites}</h3>
              <p className="text-muted-fg mb-6">
                Trykk på hjertet på tilbudskort for å legge til favoritter
              </p>
              <button
                onClick={() => navigate('/')}
                className="btn-primary"
              >
                Utforsk tilbud
              </button>
            </div>
          )}

          {/* Deal Favorites Section */}
          {favoriteDeals.length > 0 && (
            <div className="mb-8">
              <h2 className="text-lg font-semibold mb-4">Favoritttilbud</h2>
              <div className="space-y-3">
                {favoriteDeals.map((deal) => (
                  <div key={deal.id} className="card p-4">
                    <div className="flex gap-4">
                      {/* Deal Image */}
                      <div className="relative">
                        {deal.image_url ? (
                          <img
                            src={deal.image_url}
                            alt={deal.title}
                            className="w-16 h-16 object-cover rounded-2xl"
                          />
                        ) : (
                          <div className="w-16 h-16 bg-muted rounded-2xl flex items-center justify-center">
                            <span className="text-2xl">🍽️</span>
                          </div>
                        )}
                        
                        {/* Remove favorite button */}
                        <button
                          onClick={(e) => {
                            e.stopPropagation()
                            handleRemoveDealFavorite(deal.id)
                          }}
                          className="absolute -top-2 -right-2 w-6 h-6 bg-danger text-white rounded-full flex items-center justify-center text-xs hover:bg-danger/90 transition-colors"
                          aria-label="Fjern fra favoritter"
                        >
                          ×
                        </button>
                      </div>

                      {/* Deal Info */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between">
                          <div className="min-w-0">
                            <h3 className="font-semibold text-lg leading-tight">{deal.title}</h3>
                            
                            {deal.restaurant && (
                              <div className="flex items-center gap-1 text-sm text-muted-fg mt-1">
                                <MapPin className="h-3 w-3 flex-shrink-0" />
                                <span className="truncate">{deal.restaurant.name}</span>
                              </div>
                            )}

                            {/* Deal Details */}
                            <div className="flex items-center gap-2 mt-2">
                              <span className="text-sm font-medium text-success">
                                {deal.discount_percentage}% rabatt
                              </span>
                              {deal.original_price && (
                                <span className="text-sm text-muted-fg line-through">
                                  {Math.round(deal.original_price / 100)} kr
                                </span>
                              )}
                              {deal.final_price && (
                                <span className="text-sm font-medium">
                                  {Math.round(deal.final_price / 100)} kr
                                </span>
                              )}
                            </div>
                          </div>

                          {/* Heart indicator */}
                          <Heart className="h-5 w-5 text-danger fill-current flex-shrink-0" />
                        </div>

                        {/* Action Button */}
                        <button
                          onClick={() => navigate(`/restaurant/${deal.restaurant_id}`)}
                          className="mt-3 w-full btn-primary text-sm py-2"
                        >
                          Se restaurant
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Loading State */}
          {restaurantsLoading && (
            <div className="space-y-4">
              {Array.from({ length: 3 }).map((_, i) => (
                <div key={i} className="card p-4">
                  <div className="flex gap-4">
                    <div className="skeleton h-16 w-16 rounded-2xl" />
                    <div className="flex-1 space-y-2">
                      <div className="skeleton h-4 w-3/4" />
                      <div className="skeleton h-3 w-1/2" />
                      <div className="skeleton h-3 w-2/3" />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Favorites List */}
          {favoriteRestaurants.length > 0 && (
            <div className="space-y-4">
              {favoriteRestaurants.map((restaurant) => {
                const deals = restaurantDeals[restaurant.id] || []
                const bestDeal = deals[0]

                return (
                  <div key={restaurant.id} className="card p-4">
                    <div className="flex gap-4">
                      {/* Restaurant Image */}
                      <div className="relative">
                        {restaurant.image_url ? (
                          <img
                            src={restaurant.image_url}
                            alt={restaurant.name}
                            className="w-16 h-16 object-cover rounded-2xl"
                          />
                        ) : (
                          <div className="w-16 h-16 bg-muted rounded-2xl flex items-center justify-center">
                            <span className="text-2xl">🍽️</span>
                          </div>
                        )}
                        
                        {/* Remove favorite button */}
                        <button
                          onClick={(e) => {
                            e.stopPropagation()
                            handleRemoveFavorite(restaurant.id)
                          }}
                          className="absolute -top-2 -right-2 w-6 h-6 bg-danger text-white rounded-full flex items-center justify-center text-xs hover:bg-danger/90 transition-colors"
                          aria-label="Fjern fra favoritter"
                        >
                          ×
                        </button>
                      </div>

                      {/* Restaurant Info */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between">
                          <div className="min-w-0">
                            <h3 className="font-semibold text-lg leading-tight">{restaurant.name}</h3>
                            
                            {restaurant.address && (
                              <div className="flex items-center gap-1 text-sm text-muted-fg mt-1">
                                <MapPin className="h-3 w-3 flex-shrink-0" />
                                <span className="truncate">{restaurant.address}</span>
                              </div>
                            )}

                            {/* Categories */}
                            {restaurant.categories.length > 0 && (
                              <div className="flex flex-wrap gap-1 mt-2">
                                {restaurant.categories.slice(0, 2).map((category) => (
                                  <span key={category} className="text-xs bg-muted text-muted-fg px-2 py-1 rounded-full">
                                    {category}
                                  </span>
                                ))}
                                {restaurant.categories.length > 2 && (
                                  <span className="text-xs text-muted-fg">+{restaurant.categories.length - 2} mer</span>
                                )}
                              </div>
                            )}
                          </div>

                          {/* Heart indicator */}
                          <Heart className="h-5 w-5 text-danger fill-current flex-shrink-0" />
                        </div>

                        {/* Best Deal */}
                        {bestDeal && (
                          <div className="mt-3 p-2 bg-success/10 border border-success/20 rounded-lg">
                            <p className="text-sm font-medium text-success">
                              {bestDeal.discount_percentage}% • {bestDeal.title}
                            </p>
                          </div>
                        )}

                        {/* Action Button */}
                        <button
                          onClick={() => handleRestaurantClick(restaurant.id)}
                          className="mt-3 w-full btn-primary text-sm py-2"
                        >
                          {deals.length > 0 
                            ? `Se ${deals.length} tilbud${deals.length === 1 ? '' : ''}` 
                            : 'Se restaurant'
                          }
                        </button>
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </div>
      </main>
    </div>
  )
}

