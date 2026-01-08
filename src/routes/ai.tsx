import React from 'react'
import { useState, useEffect, useRef } from 'react'
import { ChevronDown, Mic, ArrowLeft, Check, ArrowUp, MoreHorizontal, MapPin, Clock, ExternalLink } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'
import { useGeolocation, useReverseGeocoding } from '@/hooks/useGeolocation'
import { toast } from 'sonner'
import { ClaimFlowModal } from '@/components/ClaimFlowModal'
import { LoginRequiredModal } from '@/components/LoginRequiredModal'
import { formatPrice, formatTime, isTimeInRange, isDealActiveToday } from '@/lib/utils'
import type { DealWithRestaurant } from '@/lib/database.types'

interface Message {
  role: 'user' | 'sofie'
  text: string
  deals?: DealWithRestaurant[]
  searchQuery?: string
}

// Helper function to check if deal is currently available
function isDealCurrentlyAvailable(deal: any): boolean {
  const days = deal.available_days?.map((d: string) => {
    const dayMap: { [key: string]: number } = {
      'sunday': 0, 'monday': 1, 'tuesday': 2, 'wednesday': 3,
      'thursday': 4, 'friday': 5, 'saturday': 6
    }
    return dayMap[d.toLowerCase()] ?? -1
  }) || [0, 1, 2, 3, 4, 5, 6]
  
  return isTimeInRange(deal.start_time, deal.end_time) && isDealActiveToday(days)
}

export function AIPage() {
  const navigate = useNavigate()
  const [inputText, setInputText] = useState('')
  const [messages, setMessages] = useState<Message[]>([])
  const [showSofieDropdown, setShowSofieDropdown] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [selectedDeal, setSelectedDeal] = useState<DealWithRestaurant | null>(null)
  const [showLoginRequired, setShowLoginRequired] = useState(false)
  const [pendingDealForLogin, setPendingDealForLogin] = useState<DealWithRestaurant | null>(null)
  const endRef = useRef<HTMLDivElement | null>(null)
  const dropdownRef = useRef<HTMLDivElement | null>(null)

  // Get user's location
  const { latitude, longitude } = useGeolocation({
    enableHighAccuracy: true,
    timeout: 10000,
    maximumAge: 300000, // 5 minutes
  })
  const { cityName } = useReverseGeocoding(latitude, longitude)

  // Get current user
  const [userId, setUserId] = useState<string | null>(null)
  const [user, setUser] = useState<any>(null)
  const queryClient = useQueryClient()
  
  useEffect(() => {
    const fetchUser = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      setUserId(user?.id || null)
      setUser(user)
    }
    fetchUser()
  }, [])

  // Get user's daily claims for deal limits
  const { data: dailyClaims = [] } = useQuery({
    queryKey: ['daily-claims'],
    queryFn: async () => {
      if (!user) return []
      const today = new Date().toISOString().split('T')[0]
      const { data, error } = await supabase
        .from('claims')
        .select('deal_id, quantity')
        .eq('user_id', user.id)
        .gte('created_at', `${today}T00:00:00.000Z`)
        .lt('created_at', `${today}T23:59:59.999Z`)

      if (error) throw error
      return data
    },
    enabled: !!user,
  })

  const getUserLimits = (dealId: string, perUserLimit: number) => {
    const todayClaimsForDeal = dailyClaims.filter((c: any) => c.deal_id === dealId)
    const claimedToday = todayClaimsForDeal.reduce((sum: number, c: any) => sum + (c.quantity || 0), 0)
    const remainingToday = Math.max(0, perUserLimit - claimedToday)
    
    return {
      maxPerUser: perUserLimit,
      claimedToday,
      remainingToday,
    }
  }

  async function handleSubmit(e?: React.FormEvent) {
    if (e) e.preventDefault()
    const trimmed = inputText.trim()
    if (!trimmed) return

    // Add user message immediately
    setMessages(prev => [...prev, { role: 'user', text: trimmed }])
    setInputText('')
    setIsLoading(true)

    try {
      // Call Edge Function
      const { data, error } = await supabase.functions.invoke('sofie-chat', {
        body: {
          message: trimmed,
          userId: userId || undefined,
          location: latitude && longitude ? { lat: latitude, lng: longitude } : undefined,
          city: cityName || undefined,
        },
      })

      if (error) {
        throw error
      }

      // Add Sofie's response with deals
      // Transform deals to match DealWithRestaurant format (restaurants -> restaurant)
      const deals = (data.deals || []).map((deal: any) => ({
        ...deal,
        restaurant: deal.restaurants || deal.restaurant, // Handle both formats
      }))
      
      // Extract search query from intent
      const searchQuery = data.intent?.foodType || trimmed
      
      setMessages(prev => [...prev, { 
        role: 'sofie', 
        text: data.reply || 'Beklager, jeg kunne ikke generere et svar.',
        deals: deals.length > 0 ? deals : undefined,
        searchQuery: searchQuery
      }])
    } catch (error: any) {
      console.error('Error calling Sofie chat:', error)
      toast.error('Kunne ikke få svar fra Sofie. Prøv igjen.')
      setMessages(prev => [...prev, { 
        role: 'sofie', 
        text: 'Beklager, jeg opplevde en feil. Kan du prøve igjen?',
        deals: undefined
      }])
    } finally {
      setIsLoading(false)
    }
  }

  function handleMicClick() {
    // For now, simulate the same behavior as submit
    handleSubmit()
  }

  function handleClaimDealClick(deal: DealWithRestaurant) {
    if (!user) {
      setPendingDealForLogin(deal)
      setShowLoginRequired(true)
    } else {
      setSelectedDeal(deal)
    }
  }

  // Handle pending deal after login
  useEffect(() => {
    if (user && pendingDealForLogin) {
      setSelectedDeal(pendingDealForLogin)
      setPendingDealForLogin(null)
      setShowLoginRequired(false)
    }
  }, [user, pendingDealForLogin])

  const handleClaimDeal = async (claimData: {
    quantity: number
    serviceType: 'dine_in' | 'takeaway'
    firstName: string
    lastName: string
    claimDate: string
    phone?: string
    notes?: string
  }) => {
    if (!selectedDeal) {
      toast.error('Ingen tilbud valgt')
      return
    }
    
    if (!user) {
      toast.error('Du må logge inn for å hente tilbud')
      return
    }

    try {
      const claimPayload = {
        deal_id: selectedDeal.id,
        user_id: user.id,
        restaurant_id: selectedDeal.restaurant_id,
        quantity: claimData.quantity,
        service_type: claimData.serviceType,
        first_name: claimData.firstName,
        last_name: claimData.lastName,
        claim_date: claimData.claimDate,
        phone: claimData.phone || null,
        special_requests: claimData.notes || null,
        status: 'pending' as const,
      }

      const { data, error } = await supabase
        .from('claims')
        .insert(claimPayload as any)
        .select()

      if (error) throw error

      toast.success('Tilbudet er hentet! 🎉')
      setSelectedDeal(null)
      
      // Refresh daily claims
      queryClient.invalidateQueries({ queryKey: ['daily-claims'] })
    } catch (error: any) {
      console.error('Error claiming deal:', error)
      toast.error(error?.message || 'Kunne ikke hente tilbud. Prøv igjen.')
    }
  }

  // Auto scroll to the latest message
  useEffect(() => {
    if (endRef.current) {
      endRef.current.scrollIntoView({ behavior: 'smooth', block: 'end' })
    }
  }, [messages])

  // Close dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setShowSofieDropdown(false)
      }
    }

    if (showSofieDropdown) {
      document.addEventListener('mousedown', handleClickOutside)
      return () => document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [showSofieDropdown])

  const hasConversation = messages.length > 0

  return (
    <div className="min-h-screen bg-bg flex flex-col">
      {/* Sticky Header */}
      <div className="fixed top-0 left-0 right-0 px-3 py-2 border-b border-border/60 bg-bg/90 backdrop-blur z-40">
        <div className="max-w-4xl mx-auto">
          <div className="flex items-center justify-between gap-3">
            {/* Back button on the far left */}
            <button
              onClick={() => navigate(-1)}
              className="inline-flex items-center justify-center rounded-full border border-border bg-card h-9 w-9 hover:bg-muted transition-colors"
              aria-label="Tilbake"
            >
              <ArrowLeft className="h-4 w-4 text-fg" />
            </button>

            {/* Center: Sofie 1 selector */}
            <div className="flex-1 flex items-center justify-center">
              <div className="relative" ref={dropdownRef}>
                <button
                  onClick={() => setShowSofieDropdown(!showSofieDropdown)}
                  className="inline-flex items-center gap-1.5 text-sm sm:text-base font-semibold text-fg px-0 py-0 hover:text-fg transition-colors"
                >
                  <span>Sofie 1</span>
                  <ChevronDown className={`h-4 w-4 transition-transform ${showSofieDropdown ? 'rotate-180' : ''}`} />
                </button>
                
                {/* Dropdown Menu */}
                {showSofieDropdown && (
                  <div className="absolute top-full right-0 mt-2 w-60 bg-bg rounded-xl shadow-xl border border-border z-50 overflow-hidden">
                    {/* Sofie 0 - Not clickable */}
                    <div className="px-4 py-3 border-b border-border opacity-60">
                      <div className="flex items-center justify-between">
                        <div>
                          <div className="text-sm font-medium text-muted-fg">Sofie 0</div>
                          <div className="text-xs text-muted-fg mt-0.5">Ikke tilgjengelig</div>
                        </div>
                      </div>
                    </div>
                    
                    {/* Sofie 1 - Selected (current version) */}
                    <div className="px-4 py-3 border-b border-border">
                      <div className="flex items-center justify-between">
                        <div>
                          <div className="text-sm font-medium text-fg">Sofie 1</div>
                          <div className="text-xs text-muted-fg mt-0.5">Nåværende versjon</div>
                        </div>
                        <Check className="h-4 w-4 text-primary" />
                      </div>
                    </div>
                    
                    {/* Sofie 2 - Coming Soon */}
                    <div className="px-4 py-3 bg-card/70">
                      <div className="flex items-center justify-between">
                        <div>
                          <div className="text-sm font-medium text-muted-fg">Sofie 2</div>
                          <div className="text-xs text-muted-fg mt-0.5">Kommer snart</div>
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Three dots on the far right */}
            <button
              type="button"
              className="inline-flex items-center justify-center h-9 w-9 rounded-full hover:bg-muted transition-colors text-muted-fg"
              aria-label="Meny"
            >
              <MoreHorizontal className="h-4 w-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Content Area (scrolls under header) */}
      <div className="flex-1 pt-16">
        {!hasConversation ? (
          // Initial state: Centered input
          <div className="w-full px-4 pt-4">
            <div className="max-w-3xl mx-auto text-center">
              <h1 className="text-2xl sm:text-3xl md:text-4xl font-semibold tracking-tight mb-4">
                Hva har du lyst på i dag?
              </h1>
              <div className="bg-card/70 backdrop-blur supports-[backdrop-filter]:bg-card/50 border border-border rounded-2xl shadow-sm overflow-hidden">
                <form className="flex items-center gap-2 pr-2" onSubmit={handleSubmit}>
                  <input
                    type="text"
                    value={inputText}
                    onChange={(e) => setInputText(e.target.value)}
                    placeholder="Skriv hva som helst"
                    className="w-full bg-transparent px-4 sm:px-6 py-4 text-left outline-none placeholder:text-muted-fg/70 text-base sm:text-lg"
                    aria-label="Sofie AI søk"
                  />
                  <div className="flex items-center gap-1 sm:gap-2">
                    <button
                      type="button"
                      onClick={handleMicClick}
                      className="p-2 rounded-full hover:bg-muted transition-colors text-muted-fg"
                      aria-label="Snakk"
                    >
                      <Mic className="h-5 w-5" />
                    </button>
                    <button
                      type="submit"
                      className="inline-flex items-center justify-center rounded-full bg-primary text-primary-fg px-3 py-2 hover:bg-primary/90 transition-colors"
                      aria-label="Send"
                    >
                      <ArrowUp className="h-4 w-4" />
                    </button>
                  </div>
                </form>
              </div>
              <p className="mt-2 text-xs text-muted-fg">
               Sofie hjelper deg med restauranter, tilbud og allergihensyn.
              </p>
            </div>
          </div>
        ) : (
          // Conversation state: Scrollable messages
          <div className="h-full overflow-y-auto px-4 pb-28">
            <div className="max-w-3xl mx-auto">
              <div className="space-y-4 py-4">
                {messages.map((m, i) => (
                  <div key={i} className={m.role === 'user' ? 'text-right' : 'text-left'}>
                    {m.role === 'sofie' ? (
                      <div className="inline-flex items-start gap-3 max-w-[85%]">
                        <div className="w-7 h-7 rounded-full bg-muted flex items-center justify-center text-fg text-[11px] font-semibold flex-shrink-0">S</div>
                        <div className="flex-1">
                          <div className="inline-block bg-muted px-4 py-3 rounded-2xl rounded-tl-sm text-base leading-relaxed text-left whitespace-pre-wrap">
                            {m.text}
                          </div>
                          {/* Show deal cards if deals are available */}
                          {m.deals && m.deals.length > 0 && (
                            <div className="mt-4">
                              {/* Header */}
                              <div className="flex items-center gap-2 mb-3">
                                <div className="w-8 h-8 rounded-full bg-gradient-to-br from-orange-400 to-orange-500 flex items-center justify-center">
                                  <span className="text-white text-sm">✨</span>
                                </div>
                                <div>
                                  <h3 className="font-semibold text-fg text-sm">
                                    Topp {Math.min(m.deals.length, 4)} resultater for "{m.searchQuery || 'ditt søk'}"
                                  </h3>
                                  <p className="text-xs text-muted-fg">De billigste og nærmeste alternativene</p>
                                </div>
                              </div>
                              
                              {/* Deal Cards Grid */}
                              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                {m.deals.slice(0, 4).map((deal, index) => {
                                  const restaurant = deal.restaurant || deal.restaurants
                                  const isAvailable = isDealCurrentlyAvailable(deal)
                                  const distance = (deal as any).distance
                                  const distanceText = distance ? `${(distance * 1000).toFixed(0)}m` : ''
                                  
                                  return (
                                    <div
                                      key={deal.id}
                                      className="bg-white rounded-2xl overflow-hidden shadow-md hover:shadow-lg transition-all duration-300 border border-gray-100"
                                    >
                                      {/* Image Section */}
                                      <div className="relative h-36 overflow-hidden bg-gray-200">
                                        {deal.image_url ? (
                                          <img
                                            src={deal.image_url}
                                            alt={deal.title}
                                            className="w-full h-full object-cover"
                                            onError={(e) => {
                                              e.currentTarget.style.display = 'none'
                                            }}
                                          />
                                        ) : (
                                          <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-gray-100 to-gray-200">
                                            <span className="text-4xl">🍔</span>
                                          </div>
                                        )}
                                        
                                        {/* Gradient overlay */}
                                        <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-transparent" />
                                        
                                        {/* Discount badge - top left (same as homepage) */}
                                        <div className="absolute top-2 left-2">
                                          <span className="bg-red-500 text-white px-3 py-1.5 rounded-full text-sm font-bold shadow-lg">
                                            {deal.discount_percentage}%
                                          </span>
                                        </div>
                                        
                                        {/* Availability badge */}
                                        {isAvailable && (
                                          <div className="absolute top-2 right-2 bg-green-500 text-white px-2 py-0.5 rounded-full text-[10px] font-semibold shadow-lg flex items-center gap-1">
                                            <span className="w-1.5 h-1.5 bg-white rounded-full animate-pulse"></span>
                                            Åpent nå
                                          </div>
                                        )}
                                      </div>
                                      
                                      {/* Content Section */}
                                      <div className="p-3 space-y-2">
                                        {/* Restaurant name */}
                                        <h4 className="font-semibold text-gray-900 text-sm leading-tight truncate">
                                          {restaurant?.name || 'Ukjent restaurant'}
                                        </h4>
                                        
                                        {/* Deal title */}
                                        <p className="text-xs text-gray-600 leading-snug line-clamp-2">
                                          {deal.description || deal.title}
                                        </p>
                                        
                                        {/* Location */}
                                        <div className="flex items-center gap-1 text-gray-500">
                                          <MapPin className="h-3 w-3 flex-shrink-0" />
                                          <span className="text-[11px] truncate">
                                            {distanceText && `${distanceText} • `}
                                            {restaurant?.address}{restaurant?.city && `, ${restaurant.city}`}
                                          </span>
                                        </div>
                                        
                                        {/* Price Row */}
                                        <div className="flex items-center gap-2 pt-1 border-t border-gray-100">
                                          <span className="text-gray-400 line-through text-xs">
                                            {deal.original_price ? formatPrice(deal.original_price) : ''}
                                          </span>
                                          <span className="text-gray-900 font-bold text-sm">
                                            {deal.final_price ? formatPrice(deal.final_price) : 'Gratis'}
                                          </span>
                                        </div>
                                        
                                        {/* Time */}
                                        <div className="flex items-center gap-1 text-gray-500">
                                          <Clock className="h-3 w-3 flex-shrink-0" />
                                          <span className="text-[11px]">
                                            {formatTime(deal.start_time)} - {formatTime(deal.end_time)}
                                          </span>
                                        </div>
                                        
                                        {/* Claim button - green background */}
                                        <button
                                          onClick={() => handleClaimDealClick(deal)}
                                          className="w-full bg-green-600 text-white px-4 py-2.5 rounded-xl font-semibold text-sm hover:bg-green-700 transition-all duration-200 shadow-md flex items-center justify-center gap-2"
                                        >
                                          <ExternalLink className="h-4 w-4" />
                                          Hent tilbud
                                        </button>
                                      </div>
                                    </div>
                                  )
                                })}
                              </div>
                              
                              {/* Show more indicator */}
                              {m.deals.length > 4 && (
                                <div className="text-xs text-muted-fg text-center pt-3">
                                  ... og {m.deals.length - 4} flere tilbud
                                </div>
                              )}
                            </div>
                          )}
                        </div>
                      </div>
                    ) : (
                      <div className="inline-block bg-primary text-primary-fg px-4 py-3 rounded-2xl rounded-tr-sm text-base leading-relaxed max-w-[85%]">
                        {m.text}
                      </div>
                    )}
                  </div>
                ))}
                {isLoading && (
                  <div className="text-left">
                    <div className="inline-flex items-start gap-3">
                      <div className="w-7 h-7 rounded-full bg-muted flex items-center justify-center text-fg text-[11px] font-semibold flex-shrink-0">S</div>
                      <div className="inline-block bg-muted px-4 py-3 rounded-2xl rounded-tl-sm text-base leading-relaxed">
                        <div className="flex items-center gap-2">
                          <div className="animate-pulse">Sofie tenker...</div>
                          <div className="flex gap-1">
                            <div className="w-2 h-2 bg-muted-fg rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></div>
                            <div className="w-2 h-2 bg-muted-fg rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></div>
                            <div className="w-2 h-2 bg-muted-fg rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                )}
                <div ref={endRef} />
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Sticky Footer Input - Only shown when conversation has started */}
      {hasConversation && (
        <div className="fixed bottom-0 left-0 right-0 bg-bg border-t border-border px-4 py-3 safe-area-inset-bottom z-50">
          <div className="max-w-3xl mx-auto">
            <form className="flex items-center gap-2" onSubmit={handleSubmit}>
              <div className="flex-1 bg-card/70 backdrop-blur supports-[backdrop-filter]:bg-card/50 border border-border rounded-2xl overflow-hidden">
                <input
                  type="text"
                  value={inputText}
                  onChange={(e) => setInputText(e.target.value)}
                  placeholder="Skriv hva som helst"
                  className="w-full bg-transparent px-4 sm:px-6 py-3 text-left outline-none placeholder:text-muted-fg/70 text-base sm:text-lg"
                  aria-label="Sofie AI søk"
                />
              </div>
              <button
                type="button"
                onClick={handleMicClick}
                className="p-2.5 rounded-full border border-border bg-card hover:bg-muted transition-colors flex-shrink-0 text-muted-fg"
                aria-label="Snakk"
              >
                <Mic className="h-5 w-5" />
              </button>
              <button
                type="submit"
                className="p-3 rounded-full bg-primary text-primary-fg hover:bg-primary/90 transition-colors flex-shrink-0"
                aria-label="Send"
              >
                <ArrowUp className="h-5 w-5" />
              </button>
            </form>
          </div>
        </div>
      )}

      {/* Login Required Modal */}
      <LoginRequiredModal
        isOpen={showLoginRequired}
        onClose={() => {
          setShowLoginRequired(false)
          setPendingDealForLogin(null)
        }}
        onLogin={() => {
          navigate(`/auth?mode=signin&redirect=/ai&dealId=${pendingDealForLogin?.id}`)
        }}
        onRegister={() => {
          navigate(`/auth?mode=signup&redirect=/ai&dealId=${pendingDealForLogin?.id}`)
        }}
      />

      {/* Claim Flow Modal */}
      {selectedDeal && (
        <ClaimFlowModal
          deal={selectedDeal}
          userLimits={getUserLimits(selectedDeal.id, selectedDeal.per_user_limit)}
          hasDineIn={selectedDeal.restaurants?.dine_in ?? true}
          hasTakeaway={selectedDeal.restaurants?.takeaway ?? true}
          timeWindow={{
            start: selectedDeal.start_time,
            end: selectedDeal.end_time,
          }}
          onConfirm={handleClaimDeal}
          onClose={() => setSelectedDeal(null)}
        />
      )}
    </div>
  )
}


