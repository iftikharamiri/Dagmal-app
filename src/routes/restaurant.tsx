import { useParams, useNavigate } from 'react-router-dom'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { ArrowLeft, MapPin, Phone, Heart, Clock, X } from 'lucide-react'
import { toast } from 'sonner'
import React, { useState } from 'react'
import { DealsList } from '@/components/DealsList'
import { ClaimFlowModal } from '@/components/ClaimFlowModal'
import { supabase } from '@/lib/supabase'
import { norwegianText } from '@/i18n/no'
import { cn, isTimeInRange, isDealActiveToday, formatTime, formatPrice } from '@/lib/utils'
import type { DealWithRestaurant } from '@/lib/database.types'

export function RestaurantPage() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const [selectedDeal, setSelectedDeal] = useState<DealWithRestaurant | null>(null)
  const [backgroundImageUrl, setBackgroundImageUrl] = useState('')
  const [showMenuModal, setShowMenuModal] = useState(false)

  // Fetch restaurant details
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
      return data as any
    },
    enabled: !!id,
  })

  // Fetch restaurant deals
  const { data: deals = [], isLoading: dealsLoading } = useQuery({
    queryKey: ['restaurant-deals', id],
    queryFn: async () => {
      if (!id) return []

      const { data, error } = await supabase
        .from('deals')
        .select(`
          *,
          restaurant:restaurants(*)
        `)
        .eq('restaurant_id', id)
        .eq('is_active', true)
        .order('discount_percentage', { ascending: false })

      if (error) throw error
      return data as any[]
    },
    enabled: !!id,
  })

  // Fetch user profile for favorites
  const { data: profile } = useQuery({
    queryKey: ['profile'],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return null

      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .single()

      if (error && error.code !== 'PGRST116') throw error
      return data as any
    },
  })

  // Get user's daily claims for deal limits
  const { data: dailyClaims = [] } = useQuery({
    queryKey: ['daily-claims'],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return []

      const today = new Date().toISOString().split('T')[0]
      const { data, error } = await supabase
        .from('claims')
        .select('deal_id, quantity')
        .eq('user_id', user.id)
        .gte('created_at', `${today}T00:00:00.000Z`)
        .lt('created_at', `${today}T23:59:59.999Z`)

      if (error) throw error
      return data as any[]
    },
    enabled: !!profile,
  })

  // Load background image from localStorage when restaurant is loaded
  React.useEffect(() => {
    if (restaurant?.id) {
      const savedBackground = localStorage.getItem(`restaurant-background-${restaurant.id}`)
      if (savedBackground) {
        setBackgroundImageUrl(savedBackground)
      }
    }
  }, [restaurant?.id])

  const handleFavoriteToggle = async () => {
    if (!profile || !restaurant) {
      toast.error(norwegianText.errors.loginRequired)
      return
    }

    const currentFavorites = profile.favorites || []
    const isFavorite = currentFavorites.includes(restaurant.id)
    const newFavorites = isFavorite
      ? currentFavorites.filter(favId => favId !== restaurant.id)
      : [...currentFavorites, restaurant.id]

    try {
      const { error } = await supabase
        .from('profiles')
        .update({ favorites: newFavorites })
        .eq('id', profile.id)

      if (error) throw error

      queryClient.setQueryData(['profile'], {
        ...profile,
        favorites: newFavorites,
      })

      toast.success(
        isFavorite 
          ? norwegianText.success.favoriteRemoved 
          : norwegianText.success.favoriteAdded
      )
    } catch (error) {
      console.error('Error updating favorites:', error)
      toast.error(norwegianText.errors.unknownError)
    }
  }

  const handleClaimDeal = async (claimData: {
    quantity: number
    serviceType: 'dine_in' | 'takeaway'
    firstName: string
    lastName: string
    claimDate: string
    phone?: string
    notes?: string
  }) => {
    if (!selectedDeal || !profile) return

    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error('Not authenticated')

      const { data, error } = await supabase
        .from('claims')
        .insert({
          deal_id: selectedDeal.id,
          user_id: user.id,
          quantity: claimData.quantity,
          service_type: claimData.serviceType,
          first_name: claimData.firstName,
          last_name: claimData.lastName,
          claim_date: claimData.claimDate,
          phone: claimData.phone,
          special_requests: claimData.notes,
        })
        .select()

      if (error) throw error

      // Create notification for restaurant owner
      try {
        const notificationPayload = {
          restaurant_id: selectedDeal.restaurant_id,
          deal_id: selectedDeal.id,
          claim_id: data[0].id,
          customer_name: `${claimData.firstName} ${claimData.lastName}`,
          customer_phone: claimData.phone || null,
          deal_title: selectedDeal.title,
          quantity: claimData.quantity,
          service_type: claimData.serviceType,
          claim_date: claimData.claimDate,
          special_requests: claimData.notes || null,
        }

        const { error: notificationError } = await supabase
          .from('notifications')
          .insert(notificationPayload)

        if (notificationError) {
          console.warn('⚠️ Could not create notification:', notificationError)
        } else {
          console.log('✅ Notification created for restaurant owner')
        }
      } catch (notificationErr) {
        console.warn('⚠️ Notification creation failed:', notificationErr)
      }

      // Fallback: manually bump claimed_count in case trigger isn't present
      try {
        await supabase
          .from('deals')
          .update({ claimed_count: (selectedDeal as any).claimed_count + claimData.quantity })
          .eq('id', selectedDeal.id)
      } catch {}

      // Refresh daily claims and user claims
      queryClient.invalidateQueries({ queryKey: ['daily-claims'] })
      queryClient.invalidateQueries({ queryKey: ['user-claims'] })
      // Also refresh deals on home and this restaurant's deals list
      queryClient.invalidateQueries({ queryKey: ['deals'] })
      queryClient.invalidateQueries({ queryKey: ['restaurant-deals', id] })
      
      toast.success(norwegianText.success.dealClaimed, {
        action: {
          label: 'Se tilbud',
          onClick: () => navigate('/claims'),
        },
      })
    } catch (error) {
      console.error('Error claiming deal:', error)
      toast.error(norwegianText.errors.unknownError)
    }
  }

  const getUserLimits = (dealId: string, perUserLimit: number) => {
    const claimedToday = dailyClaims
      .filter(claim => claim.deal_id === dealId)
      .reduce((sum, claim) => sum + claim.quantity, 0)
    
    return {
      maxPerUser: perUserLimit,
      remainingToday: Math.max(0, perUserLimit - claimedToday),
    }
  }

  const isRestaurantOpen = () => {
    // TODO: Implement actual opening hours logic
    return true
  }

  const handleMenuClick = () => {
    if (restaurant?.id) {
      navigate(`/restaurant/${restaurant.id}/menu`)
    } else {
      toast.error('Ingen meny tilgjengelig for denne restauranten')
    }
  }

  if (restaurantLoading) {
    return (
      <div className="min-h-screen bg-bg">
        <div className="animate-pulse space-y-4 p-4">
          <div className="skeleton h-8 w-8 rounded-full" />
          <div className="skeleton h-64 w-full rounded-2xl" />
          <div className="skeleton h-6 w-3/4" />
          <div className="skeleton h-4 w-1/2" />
          <div className="flex gap-2">
            <div className="skeleton h-6 w-20" />
            <div className="skeleton h-6 w-16" />
          </div>
        </div>
      </div>
    )
  }

  if (!restaurant) {
    return (
      <div className="min-h-screen bg-bg flex items-center justify-center">
        <div className="text-center">
          <div className="text-6xl mb-4">🔍</div>
          <h2 className="text-xl font-semibold mb-2">Restaurant ikke funnet</h2>
          <button onClick={() => navigate('/')} className="btn-primary">
            Tilbake til hjem
          </button>
        </div>
      </div>
    )
  }

  const isFavorite = profile?.favorites?.includes(restaurant.id) || false

  return (
    <div className="min-h-screen bg-gray-50 pb-20">
      {/* Header with Back Button */}
      <div className="bg-white border-b border-gray-200 px-4 py-4 flex items-center justify-between">
        <button
          onClick={() => navigate(-1)}
          className="p-2 hover:bg-gray-100 rounded-full transition-colors"
          aria-label="Tilbake"
        >
          <ArrowLeft className="h-5 w-5" />
        </button>
        <button className="text-gray-600 hover:text-gray-800 font-medium">
          Del
        </button>
      </div>

      {/* Background Image */}
      <div className="relative">
        {/* Background image or fallback */}
        <div className="w-full h-64 flex items-center justify-center relative overflow-hidden">
          {backgroundImageUrl ? (
            <img
              src={backgroundImageUrl}
              alt="Restaurant background"
              className="w-full h-full object-cover"
              onError={() => setBackgroundImageUrl('')}
            />
          ) : (
            <div className="w-full h-full bg-gradient-to-br from-amber-100 via-orange-100 to-red-100 flex items-center justify-center relative overflow-hidden">
              {/* Food illustration/pattern */}
              <div className="absolute inset-0 opacity-20">
                <div className="absolute top-4 left-4 text-4xl">🍕</div>
                <div className="absolute top-8 right-8 text-3xl">🍔</div>
                <div className="absolute bottom-8 left-8 text-3xl">🍝</div>
                <div className="absolute bottom-4 right-4 text-4xl">🥗</div>
                <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 text-6xl">🍽️</div>
              </div>
            </div>
          )}
        </div>
        
        {/* Image dots indicator */}
        <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 flex gap-2">
          <div className="w-2 h-2 bg-white rounded-full shadow-sm"></div>
          <div className="w-2 h-2 bg-white/50 rounded-full"></div>
          <div className="w-2 h-2 bg-white/50 rounded-full"></div>
          <div className="w-2 h-2 bg-white/50 rounded-full"></div>
          <div className="w-2 h-2 bg-white/50 rounded-full"></div>
        </div>
      </div>

      <main className="px-4 py-6">
        {/* Restaurant Header */}
        <div className="mb-8">
          <div className="flex items-start justify-between mb-4">
            <div className="flex items-center gap-3">
              <div>
                <h1 className="text-3xl font-bold text-gray-900">{restaurant.name}</h1>
              </div>
            </div>
            <button
              onClick={handleFavoriteToggle}
              className={`p-2 rounded-full transition-colors ${
                isFavorite 
                  ? 'text-red-500 bg-red-50' 
                  : 'text-gray-400 hover:text-red-500 hover:bg-red-50'
              }`}
            >
              <Heart className={`h-6 w-6 ${isFavorite ? 'fill-current' : ''}`} />
            </button>
          </div>
          
          {/* Categories */}
          {Array.isArray(restaurant.categories) && restaurant.categories.length > 0 && (
            <p className="text-gray-600 text-base mb-4">
              {restaurant.categories.join(', ')}
            </p>
          )}

          {/* Action Buttons */}
          <div className="flex gap-3 mb-6">
            <button 
              onClick={handleMenuClick}
              className="flex-1 border border-gray-300 rounded-xl px-4 py-3 flex items-center justify-center gap-2 text-gray-700 hover:bg-gray-50 transition-colors"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
              Meny
            </button>
            <button
              onClick={() => restaurant.phone && window.open(`tel:${restaurant.phone}`)}
              className="flex-1 border border-gray-300 rounded-xl px-4 py-3 flex items-center justify-center gap-2 text-gray-700 hover:bg-gray-50 transition-colors"
            >
              <Phone className="w-5 h-5" />
              Ring
            </button>
          </div>
        </div>

        {/* Restaurant Details */}
        <div className="grid grid-cols-2 gap-6 mb-8">
          {/* Opening Hours */}
          <div>
            <div className="flex items-center gap-2 mb-2">
              <span className="text-green-600 font-medium text-sm">Åpen</span>
              <span className="text-gray-500 text-sm">stenger 9:00pm</span>
            </div>
            <p className="text-gray-600 text-sm">9:00am - 9:00pm</p>
          </div>

          {/* Address */}
          <div>
            <div className="flex items-center gap-2 mb-2">
              <MapPin className="h-4 w-4 text-gray-500" />
              <span className="text-gray-900 font-medium text-sm">Adresse</span>
            </div>
            <p className="text-gray-600 text-sm">
              {restaurant.address}
              {restaurant.city && (
                <>
                  <br />
                  {restaurant.city}
                </>
              )}
            </p>
          </div>
        </div>

        {/* Menu Section */}
        <div className="mb-8">
          <h2 className="text-2xl font-bold text-gray-900 mb-6">Meny</h2>
          
          {deals.length > 0 ? (
            <div className="space-y-4">
              {deals.map((deal) => (
                <div key={deal.id} className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex items-center gap-3">
                      <h3 className="text-lg font-semibold text-gray-900">{deal.title}</h3>
                      <span className="bg-red-500 text-white text-xs px-2 py-1 rounded-full font-medium">
                        {deal.discount_percentage}%
                      </span>
                    </div>
                  </div>
                  
                  <p className="text-gray-600 text-sm mb-4 leading-relaxed">
                    {deal.description || "Beskrivelse av retten kommer her. Dette er en deilig og smakfull rett som vil glede ganen din."}
                  </p>

                  <div className="flex items-center gap-4 text-sm text-gray-500 mb-4">
                    <span className="flex items-center gap-1">
                      <Clock className="h-4 w-4" />
                      {formatTime(deal.start_time)}–{formatTime(deal.end_time)} {deal.dine_in && deal.takeaway ? 'Begge' : deal.takeaway ? 'Takeaway' : 'Spise på stedet'}
                    </span>
                  </div>

                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      {deal.original_price && deal.final_price && (
                        <>
                          <span className="line-through text-gray-400 text-sm">
                            {formatPrice(deal.original_price)}
                          </span>
                          <span className="font-bold text-gray-900 text-lg">
                            {formatPrice(deal.final_price)}
                          </span>
                        </>
                      )}
                    </div>
                    
                    <div className="flex items-center gap-3">
                      {/* Availability counter */}
                      <div className="text-sm text-gray-500">
                        {typeof deal.total_limit === 'number' && deal.total_limit !== null ? (
                          <span className="bg-gray-100 text-gray-700 px-2 py-1 rounded-full text-xs">
                            {Math.max(0, (deal.total_limit || 0) - (deal.claimed_count || 0))}/{deal.total_limit} tilgjengelig
                          </span>
                        ) : (
                          <span className="bg-gray-100 text-gray-700 px-2 py-1 rounded-full text-xs">Ubegrenset</span>
                        )}
                      </div>

                      <button
                        onClick={() => setSelectedDeal(deal)}
                        className="bg-red-500 text-white px-6 py-2 rounded-xl text-sm font-medium hover:bg-red-600 transition-colors"
                      >
                        Hent tilbud
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-12">
              <div className="text-6xl mb-4">📋</div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Menyinformasjon kommer snart!</h3>
              <p className="text-gray-600">Restauranten jobber med å legge til menyen sin.</p>
            </div>
          )}
        </div>
      </main>


      {/* Claim Flow Modal */}
      {selectedDeal && (
        <ClaimFlowModal
          deal={selectedDeal}
          userLimits={getUserLimits(selectedDeal.id, selectedDeal.per_user_limit)}
          hasDineIn={selectedDeal.available_for?.includes('dine_in') || false}
          hasTakeaway={selectedDeal.available_for?.includes('takeaway') || false}
          timeWindow={{
            start: selectedDeal.start_time,
            end: selectedDeal.end_time,
          }}
          onConfirm={handleClaimDeal}
          onClose={() => setSelectedDeal(null)}
        />
      )}

      {/* Menu PDF Modal */}
      {showMenuModal && restaurant?.menu_pdf_url && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl w-full max-w-4xl h-[90vh] flex flex-col">
            {/* Header */}
            <div className="flex items-center justify-between p-4 border-b border-gray-200">
              <h2 className="text-xl font-semibold text-gray-900">Meny - {restaurant.name}</h2>
              <button
                onClick={() => setShowMenuModal(false)}
                className="p-2 hover:bg-gray-100 rounded-full transition-colors"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            
            {/* PDF Viewer */}
            <div className="flex-1 p-4">
              <iframe
                src={`${restaurant.menu_pdf_url}#toolbar=0&navpanes=0&scrollbar=1&view=FitH`}
                className="w-full h-full border-0 rounded-lg"
                title={`Meny for ${restaurant.name}`}
                style={{ 
                  pointerEvents: 'auto',
                  userSelect: 'none'
                }}
                onContextMenu={(e) => e.preventDefault()}
                onDragStart={(e) => e.preventDefault()}
              />
            </div>
            
            {/* Footer */}
            <div className="p-4 border-t border-gray-200 bg-gray-50 rounded-b-2xl">
              <div className="flex items-center justify-center">
                <p className="text-sm text-gray-600 text-center">
                  Bla gjennom menyen for å se alle retter og priser
                </p>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}


