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
  const [backgroundImages, setBackgroundImages] = useState<string[]>([])
  const [currentImageIndex, setCurrentImageIndex] = useState(0)
  const [showMenuModal, setShowMenuModal] = useState(false)
  const [selectedDishImage, setSelectedDishImage] = useState<{ dish: string; day: string; imageUrl: string } | null>(null)

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

  // Load background images from database when restaurant is loaded
  React.useEffect(() => {
    if (!restaurant) {
      setBackgroundImages([])
      setCurrentImageIndex(0)
      return
    }

    // Check restaurant name first for hardcoded backgrounds
    const restaurantName = restaurant.name?.trim().toLowerCase() || ''
    const isBikkuben = restaurantName.includes('bikkuben') || restaurantName.includes('bikuben')
    const isSorhellinga = restaurantName.includes('sør hellinga') || restaurantName.includes('sørhellinga') || restaurantName.includes('sorhellinga')

    // Define carousel images for each restaurant
    const restaurantCarousels: Record<string, string[]> = {
      'bikkuben': [
        '/images/bikkuben-background.jpg',
        '/images/bikkuben-background1.jpg',
        '/images/bikkuben-background2.jpg',
        '/images/bikkuben-background3.jpg',
        // Add more images here: '/images/bikkuben-background-2.jpg', etc.
      ],
      'sørhellinga': [
        '/images/sørhellinga-background.jpg',
        '/images/sørhellinga-background1.jpg',
        '/images/sørhellinga-background2.jpg',
        // Add more images here: '/images/sørhellinga-background-2.jpg', etc.
      ],
    }

    // Priority 1: Database background_image_url (if exists and not empty)
    if (restaurant.background_image_url && restaurant.background_image_url.trim() !== '') {
      // If database has single image, use it as array
      setBackgroundImages([restaurant.background_image_url])
      setCurrentImageIndex(0)
      return
    }

    // Priority 2: Hardcoded carousel for specific restaurants
    if (isBikkuben) {
      const images = restaurantCarousels['bikkuben'].filter(img => img) // Filter out empty strings
      if (images.length > 0) {
        setBackgroundImages(images)
        setCurrentImageIndex(0)
        return
      }
    }
    
    if (isSorhellinga) {
      const images = restaurantCarousels['sørhellinga'].filter(img => img) // Filter out empty strings
      if (images.length > 0) {
        setBackgroundImages(images)
        setCurrentImageIndex(0)
        return
      }
    }

    // Priority 3: localStorage fallback
    if (restaurant.id) {
      const savedBackground = localStorage.getItem(`restaurant-background-${restaurant.id}`)
      if (savedBackground && savedBackground.trim() !== '') {
        setBackgroundImages([savedBackground])
        setCurrentImageIndex(0)
        return
      }
    }

    // No background found, reset to empty
    setBackgroundImages([])
    setCurrentImageIndex(0)
  }, [restaurant?.id, restaurant?.background_image_url, restaurant?.name])

  // Auto-rotate carousel images every 5 seconds
  React.useEffect(() => {
    if (backgroundImages.length <= 1) return // Don't rotate if only one image

    const interval = setInterval(() => {
      setCurrentImageIndex((prevIndex) => (prevIndex + 1) % backgroundImages.length)
    }, 5000) // Change image every 5 seconds

    return () => clearInterval(interval)
  }, [backgroundImages.length])

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

  // Helper function to get current day name in Norwegian
  const getCurrentDayName = (): string => {
    const days = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday']
    return days[new Date().getDay()]
  }

  // Helper function to format time (HH:mm to HH:MM AM/PM format)
  const formatTime12Hour = (time24: string): string => {
    if (!time24) return ''
    const [hours, minutes] = time24.split(':')
    const hour = parseInt(hours, 10)
    const ampm = hour >= 12 ? 'pm' : 'am'
    const hour12 = hour % 12 || 12
    return `${hour12}:${minutes}${ampm}`
  }

  // Get today's opening hours
  const getTodayOpeningHours = () => {
    if (!restaurant?.opening_hours) return null
    
    const currentDay = getCurrentDayName()
    const todayHours = restaurant.opening_hours[currentDay]
    
    if (!todayHours || todayHours.closed) {
      return { closed: true }
    }
    
    return {
      closed: false,
      open: todayHours.open || '09:00',
      close: todayHours.close || '21:00',
    }
  }

  // Check if restaurant is currently open
  const isRestaurantOpen = (): boolean => {
    const todayHours = getTodayOpeningHours()
    if (!todayHours || todayHours.closed) return false
    
    const now = new Date()
    const currentTime = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`
    
    return currentTime >= todayHours.open && currentTime <= todayHours.close
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

      {/* Background Image Carousel */}
      <div className="relative">
        {/* Background image or fallback */}
        <div className="w-full h-64 flex items-center justify-center relative overflow-hidden">
          {backgroundImages.length > 0 ? (
            <>
              {backgroundImages.map((imageUrl, index) => (
                <img
                  key={imageUrl}
                  src={imageUrl}
                  alt={`Restaurant background ${index + 1}`}
                  className={`absolute inset-0 w-full h-full object-cover transition-opacity duration-500 ${
                    index === currentImageIndex ? 'opacity-100' : 'opacity-0'
                  }`}
                  onError={() => {
                    // Remove failed image from array
                    setBackgroundImages(prev => prev.filter((_, i) => i !== index))
                  }}
                />
              ))}
            </>
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
        
        {/* Image dots indicator - only show if more than one image */}
        {backgroundImages.length > 1 && (
          <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 flex gap-2">
            {backgroundImages.map((_, index) => (
              <button
                key={index}
                onClick={() => setCurrentImageIndex(index)}
                className={`w-2 h-2 rounded-full shadow-sm transition-all ${
                  index === currentImageIndex 
                    ? 'bg-white w-6' 
                    : 'bg-white/50 hover:bg-white/75'
                }`}
                aria-label={`Go to image ${index + 1}`}
              />
            ))}
          </div>
        )}
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
            {(() => {
              if (!restaurant?.opening_hours) {
                return (
                  <>
                    <div className="flex items-center gap-2 mb-2">
                      <span className="text-gray-500 font-medium text-sm">Åpningstider</span>
                    </div>
                    <p className="text-gray-600 text-sm">Ikke oppgitt</p>
                  </>
                )
              }
              
              // Get all opening hours
              const hours = restaurant.opening_hours
              const monday = hours.monday
              const tuesday = hours.tuesday
              const wednesday = hours.wednesday
              const thursday = hours.thursday
              const friday = hours.friday
              const saturday = hours.saturday
              const sunday = hours.sunday
              
              // Check if restaurant is open today
              const todayHours = getTodayOpeningHours()
              const isOpen = todayHours && !todayHours.closed ? isRestaurantOpen() : false
              
              // Format time: "09:00" -> "09"
              const formatHour = (time: string) => {
                if (!time) return ''
                return time.substring(0, 2) // Returns "09" from "09:00"
              }
              
              // Show simple format based on opening hours pattern
              let hoursText = ''
              
              // Check if all days have same closing time (22:00)
              const allCloseAt22 = [monday, tuesday, wednesday, thursday, friday, saturday, sunday]
                .every(day => day && !day.closed && day.close === '22:00')
              
              if (allCloseAt22) {
                // Group days by opening time
                const daysByOpenTime: Record<string, string[]> = {}
                
                const dayNames = [
                  { key: 'monday', label: 'Mandag' },
                  { key: 'tuesday', label: 'Tirsdag' },
                  { key: 'wednesday', label: 'Onsdag' },
                  { key: 'thursday', label: 'Torsdag' },
                  { key: 'friday', label: 'Fredag' },
                  { key: 'saturday', label: 'Lørdag' },
                  { key: 'sunday', label: 'Søndag' }
                ]
                
                dayNames.forEach(({ key, label }) => {
                  const dayHours = hours[key]
                  if (dayHours && !dayHours.closed) {
                    const openTime = formatHour(dayHours.open)
                    if (!daysByOpenTime[openTime]) {
                      daysByOpenTime[openTime] = []
                    }
                    daysByOpenTime[openTime].push(label)
                  }
                })
                
                // Format grouped days
                const groups = Object.entries(daysByOpenTime)
                  .map(([openTime, days]) => {
                    if (days.length === 1) {
                      return `${days[0]}: ${openTime}-22`
                    } else if (days.length === 2) {
                      return `${days[0]} og ${days[1]}: ${openTime}-22`
                    } else {
                      return `${days[0]} - ${days[days.length - 1]}: ${openTime}-22`
                    }
                  })
                  .join('\n')
                
                hoursText = groups
              } else if (monday && !monday.closed && friday && !friday.closed) {
                const monThuOpen = formatHour(monday.open)
                const monThuClose = formatHour(monday.close)
                const friOpen = formatHour(friday.open)
                const friClose = formatHour(friday.close)
                
                // Check if Saturday has same hours as Friday
                if (saturday && !saturday.closed && 
                    friday.open === saturday.open && friday.close === saturday.close) {
                  // Check if Sunday has same hours as Mon-Thu
                  if (sunday && !sunday.closed && 
                      monday.open === sunday.open && monday.close === sunday.close) {
                    // Format: Søndag - torsdag: 13-21, Fredag - lørdag: 13-22
                    hoursText = `Søndag - torsdag: ${monThuOpen}-${monThuClose}\nFredag - lørdag: ${friOpen}-${friClose}`
                  } else {
                    hoursText = `Mandag-torsdag: ${monThuOpen}-${monThuClose}, Fredag-lørdag: ${friOpen}-${friClose}`
                  }
                } else {
                  hoursText = `Mandag-torsdag: ${monThuOpen}-${monThuClose}, Fredag: ${friOpen}-${friClose}`
                }
              } else if (todayHours) {
                if (todayHours.closed) {
                  return (
                    <>
                      <div className="flex items-center gap-2 mb-2">
                        <span className="text-red-600 font-medium text-sm">Stengt</span>
                      </div>
                      <p className="text-gray-600 text-sm">Stengt i dag</p>
                    </>
                  )
                }
                const open = formatHour(todayHours.open)
                const close = formatHour(todayHours.close)
                hoursText = `${open}-${close}`
              }
              
              return (
                <>
                  <div className="flex items-center gap-2 mb-2">
                    <span className={`font-medium text-sm ${isOpen ? 'text-green-600' : 'text-gray-600'}`}>
                      {isOpen ? 'Åpen' : 'Åpningstider'}
                    </span>
                  </div>
                  <div className="text-gray-600 text-sm whitespace-pre-line">{hoursText || 'Ikke oppgitt'}</div>
                </>
              )
            })()}
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
          
          {/* Weekplan Section - Only for Bikkuben and Sørhellinga */}
          {(() => {
            if (!restaurant?.name) return null

            // Dish images mapping - Update these URLs with your actual image URLs
            // You can use:
            // 1. Supabase Storage URLs: https://[project-id].supabase.co/storage/v1/object/public/dish-images/vektmat.jpg
            // 2. Public folder URLs: /images/dishes/vektmat.jpg (put images in public/images/dishes/)
            // 3. External URLs: https://example.com/images/vektmat.jpg
            const dishImages: Record<string, string> = {
              'vektmat': '', // Ingen bilde ennå
              'ribbe': '/images/dishes/ribbe.jpg.jpg', // Note: file has double extension
              'pizza': '/images/dishes/pizza.jpg',
            }

            // Helper function to get image URL for a dish
            const getDishImageUrl = (dish: string): string | null => {
              const lowerDish = dish.toLowerCase()
              const url = dishImages[lowerDish]
              // Return null if URL is empty or undefined
              return url && url.trim() !== '' ? url : null
            }

            // Define weekplans for each restaurant
            const bikkubenWeekplan = [
              { day: 'Mandag', dish: 'vektmat' },
              { day: 'Tirsdag', dish: 'ribbe' },
              { day: 'Onsdag', dish: 'vektmat' },
              { day: 'Torsdag', dish: 'ribbe' },
              { day: 'Fredag', dish: 'pizza' },
            ]

            const weekplans: Record<string, { day: string; dish: string }[]> = {
              'Bikkuben': bikkubenWeekplan,
              'Bikuben': bikkubenWeekplan, // Handle variation with one 'k'
              'Sør Hellinga': [
                { day: 'Mandag', dish: 'vektmat' },
                { day: 'Tirsdag', dish: 'vektmat' },
                { day: 'Onsdag', dish: 'vektmat' },
                { day: 'Torsdag', dish: 'ribbe' },
                { day: 'Fredag', dish: 'pizza' },
              ],
              'Sørhellinga': [
                { day: 'Mandag', dish: 'vektmat' },
                { day: 'Tirsdag', dish: 'vektmat' },
                { day: 'Onsdag', dish: 'vektmat' },
                { day: 'Torsdag', dish: 'ribbe' },
                { day: 'Fredag', dish: 'pizza' },
              ],
            }

            // Normalize restaurant name for matching (trim and handle variations)
            const normalizedName = restaurant.name.trim()
            
            // Try exact match first
            let weekplan = weekplans[normalizedName]
            
            // If no exact match, try case-insensitive match
            if (!weekplan) {
              const lowerName = normalizedName.toLowerCase()
              for (const [key, value] of Object.entries(weekplans)) {
                if (key.toLowerCase() === lowerName) {
                  weekplan = value
                  break
                }
              }
            }
            
            // If still no match, try partial match (e.g., "Bikkuben" matches "Bikkuben Restaurant")
            if (!weekplan) {
              for (const [key, value] of Object.entries(weekplans)) {
                if (normalizedName.toLowerCase().includes(key.toLowerCase()) || 
                    key.toLowerCase().includes(normalizedName.toLowerCase())) {
                  weekplan = value
                  break
                }
              }
            }
            
            // Final fallback: check if name contains key words
            if (!weekplan) {
              const lowerName = normalizedName.toLowerCase()
              if (lowerName.includes('bikkuben') || lowerName.includes('bikuben')) {
                weekplan = bikkubenWeekplan
              } else if (lowerName.includes('sør') && (lowerName.includes('hellinga') || lowerName.includes('helling'))) {
                weekplan = weekplans['Sør Hellinga']
              }
            }
            
            if (!weekplan) {
              // Debug: log restaurant name to help identify the issue
              console.log('Restaurant name:', normalizedName, 'Available weekplans:', Object.keys(weekplans))
              return null
            }

            return (
              <>
                <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100 mb-6">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">Ukeplan</h3>
                  <div className="space-y-3">
                    {weekplan.map((item, index) => {
                      const imageUrl = getDishImageUrl(item.dish)
                      return (
                        <div 
                          key={item.day}
                          className={`flex items-center justify-between py-2 ${
                            index < weekplan.length - 1 ? 'border-b border-gray-100' : ''
                          }`}
                        >
                          <span className="text-gray-700 font-medium">{item.day}</span>
                          <div className="flex items-center gap-3">
                            <span className="text-gray-900 capitalize">{item.dish}</span>
                            {imageUrl ? (
                              <button
                                onClick={() => setSelectedDishImage({ dish: item.dish, day: item.day, imageUrl })}
                                className="flex-shrink-0 hover:opacity-80 transition-opacity"
                              >
                                <img
                                  src={imageUrl}
                                  alt={item.dish}
                                  className="w-12 h-12 rounded-lg object-cover border border-gray-200 cursor-pointer"
                                  onError={(e) => {
                                    // Hide image if it fails to load
                                    e.currentTarget.style.display = 'none'
                                  }}
                                />
                              </button>
                            ) : null}
                          </div>
                        </div>
                      )
                    })}
                  </div>
                </div>

                {/* Dish Image Modal */}
                {selectedDishImage && (
                  <div 
                    className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4"
                    onClick={() => setSelectedDishImage(null)}
                  >
                    <div 
                      className="bg-white rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-hidden"
                      onClick={(e) => e.stopPropagation()}
                    >
                      {/* Header */}
                      <div className="flex items-center justify-between p-4 border-b border-gray-200">
                        <div>
                          <h3 className="text-lg font-semibold text-gray-900 capitalize">{selectedDishImage.dish}</h3>
                          <p className="text-sm text-gray-500">{selectedDishImage.day}</p>
                        </div>
                        <button
                          onClick={() => setSelectedDishImage(null)}
                          className="p-2 hover:bg-gray-100 rounded-full transition-colors"
                        >
                          <X className="h-5 w-5 text-gray-600" />
                        </button>
                      </div>
                      
                      {/* Image */}
                      <div className="relative w-full aspect-video bg-gray-100">
                        <img
                          src={selectedDishImage.imageUrl}
                          alt={selectedDishImage.dish}
                          className="w-full h-full object-cover"
                          onError={(e) => {
                            e.currentTarget.src = 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" width="400" height="300"%3E%3Crect fill="%23ddd" width="400" height="300"/%3E%3Ctext fill="%23999" font-family="sans-serif" font-size="20" dy="10.5" font-weight="bold" x="50%25" y="50%25" text-anchor="middle"%3EImage not found%3C/text%3E%3C/svg%3E'
                          }}
                        />
                      </div>
                    </div>
                  </div>
                )}
              </>
            )
          })()}
          
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


