import { useState, useMemo, useEffect } from 'react'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { useNavigate } from 'react-router-dom'
import { MapPin, TrendingUp, Search, AlertCircle, Building2 } from 'lucide-react'
import { toast } from 'sonner'
import { DealsList } from '@/components/DealsList'
import { PopularDeals } from '@/components/PopularDeals'
import { FilterSheet } from '@/components/FilterSheet'
import { ClaimFlowModal } from '@/components/ClaimFlowModal'
import { NavigationMenu } from '@/components/NavigationMenu'
import { useGeolocation, useReverseGeocoding } from '@/hooks/useGeolocation'
// import { useAuthGuard } from '@/hooks/useAuthGuard'
import { supabase } from '@/lib/supabase'
import { norwegianText } from '@/i18n/no'
import { debounce } from '@/lib/utils'
import {
  sortDealsByRestaurantAvailability,
  getAvailableDealsCount,
  getPopularDeals,
  filterDealsWithinActiveDateRange,
  filterDealsWithinNextWeek,
  isDealCurrentlyAvailable,
  isDealUpcomingToday,
  isDealUpcomingWithinWeek,
} from '@/lib/dealUtils'
import type { DealWithRestaurant } from '@/lib/database.types'

interface FilterState {
  cuisines: string[]
  dietary: string[]
  priceRange?: [number, number]
  distance?: number
  sort?: 'nearest' | 'highest_discount' | 'lowest_price'
}

export function HomePage() {
  const navigate = useNavigate()
  const [searchQuery, setSearchQuery] = useState('')
  const [filters, setFilters] = useState<FilterState>({
    cuisines: [],
    dietary: [],
  })
  const [showFilters, setShowFilters] = useState(false)
  const [selectedDeal, setSelectedDeal] = useState<DealWithRestaurant | null>(null)
  const queryClient = useQueryClient()

  // Get user's current location
  const { latitude, longitude, error: locationError, isLoading: locationLoading } = useGeolocation({
    enableHighAccuracy: true,
    timeout: 10000,
    maximumAge: 300000, // 5 minutes
  })

  // Convert coordinates to city name
  const { cityName, isLoading: cityLoading } = useReverseGeocoding(latitude, longitude)

  // Fetch deals with restaurants
  const { data: deals = [], isLoading: dealsLoading } = useQuery({
    queryKey: ['deals', searchQuery, filters],
    queryFn: async () => {
      
      // Always use real Supabase data in production
      const isDemoMode = false
      
      if (isDemoMode) {
        // Return demo data
        await new Promise(resolve => setTimeout(resolve, 500)) // Simulate loading

        const todayISO = new Date().toISOString().split('T')[0]
        const nextWeekISO = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
        
        const demoDeals: DealWithRestaurant[] = [
          {
            id: 'deal-1',
            restaurant_id: 'rest-1',
            title: 'Dagens fisk −30%',
            description: 'Fersk fisk med sesongens grønnsaker',
            discount_percentage: 30,
            original_price: 29900,
            final_price: 20930,
            start_date: todayISO,
            end_date: nextWeekISO,
            start_time: '12:00',
            end_time: '22:00',
            available_days: ['1','2','3','4','5','6','7'],
            per_user_limit: 2,
            total_limit: 8,
            claimed_count: 3,
            available_for: ['dine_in', 'takeaway'],
            dietary_info: ['Fisk'],
            image_url: 'https://picsum.photos/seed/fish/800/600',
            is_active: true,
            verification_code: 'ABC123',
            menu_item_id: null,
            selected_price_tiers: null,
            created_at: new Date().toISOString(),
            restaurant: {
              id: 'rest-1',
              name: 'Fjord & Furu',
              description: 'Sesongbasert norsk mat',
              image_url: 'https://picsum.photos/seed/fjord/800/600',
              background_image_url: null,
              phone: '+47 40000000',
              address: 'Karl Johans gate 10',
              city: 'Oslo',
              lat: 59.9139,
              lng: 10.7522,
              categories: ['Norsk', 'Moderne'],
              dine_in: true,
              takeaway: true,
              menu_pdf_url: null,
              owner_id: null,
              opening_hours: null,
              created_at: new Date().toISOString()
            }
          },
          {
            id: 'deal-2',
            restaurant_id: 'rest-2',
            title: 'Pizza Margherita −40 kr',
            description: 'Klassisk italiensk pizza med ferske ingredienser',
            discount_percentage: 40,
            original_price: 18000,
            final_price: 10800,
            start_date: todayISO,
            end_date: nextWeekISO,
            start_time: '11:00',
            end_time: '21:00',
            available_days: ['1','2','3','4','5','6','7'],
            per_user_limit: 1,
            total_limit: 12,
            claimed_count: 7,
            available_for: ['dine_in', 'takeaway'],
            dietary_info: ['Vegetarisk'],
            image_url: 'https://picsum.photos/seed/pizza/800/600',
            is_active: true,
            verification_code: 'DEF456',
            menu_item_id: null,
            selected_price_tiers: null,
            created_at: new Date().toISOString(),
            restaurant: {
              id: 'rest-2',
              name: 'Bella Vista',
              description: 'Autentisk italiensk pizza',
              image_url: 'https://picsum.photos/seed/pizza/800/600',
              background_image_url: null,
              phone: '+47 45000000',
              address: 'Aker Brygge 5',
              city: 'Oslo',
              lat: 59.9107,
              lng: 10.7327,
              categories: ['Italiensk', 'Pizza'],
              dine_in: true,
              takeaway: true,
              menu_pdf_url: null,
              owner_id: null,
              opening_hours: null,
              created_at: new Date().toISOString()
            }
          },
          {
            id: 'deal-3',
            restaurant_id: 'rest-3',
            title: 'Vegetarburger −25%',
            description: 'Sunn vegetarburger med ferske grønnsaker',
            discount_percentage: 25,
            original_price: 16000,
            final_price: 12000,
            start_date: todayISO,
            end_date: nextWeekISO,
            start_time: '12:00',
            end_time: '14:00',
            available_days: ['1','2','3','4','5','6','7'],
            per_user_limit: 3,
            total_limit: null, // Unlimited
            claimed_count: 15,
            available_for: ['dine_in', 'takeaway'],
            dietary_info: ['Vegetarisk', 'Vegansk'],
            image_url: 'https://picsum.photos/seed/vegan/800/600',
            is_active: true,
            verification_code: 'GHI789',
            menu_item_id: null,
            selected_price_tiers: null,
            created_at: new Date().toISOString(),
            restaurant: {
              id: 'rest-3',
              name: 'Green Garden',
              description: 'Vegetarisk og vegansk mat',
              image_url: 'https://picsum.photos/seed/vegan/800/600',
              background_image_url: null,
              phone: '+47 46000000',
              address: 'Grünerløkka 12',
              city: 'Oslo',
              lat: 59.9236,
              lng: 10.7579,
              categories: ['Vegetarisk', 'Vegansk', 'Sunt'],
              dine_in: true,
              takeaway: true,
              menu_pdf_url: null,
              owner_id: null,
              opening_hours: null,
              created_at: new Date().toISOString()
            }
          },
          {
            id: 'deal-4',
            restaurant_id: 'rest-4',
            title: 'Sushi sett −20%',
            description: 'Fersk sushi med japanske spesialiteter',
            discount_percentage: 20,
            original_price: 25000,
            final_price: 20000,
            start_date: todayISO,
            end_date: nextWeekISO,
            start_time: '16:00',
            end_time: '23:00',
            available_days: ['1','2','3','4','5','6','7'],
            per_user_limit: 1,
            total_limit: 6,
            claimed_count: 6, // Sold out
            available_for: ['dine_in', 'takeaway'],
            dietary_info: ['Fisk'],
            image_url: 'https://picsum.photos/seed/sushi/800/600',
            is_active: true,
            verification_code: 'JKL012',
            menu_item_id: null,
            selected_price_tiers: null,
            created_at: new Date().toISOString(),
            restaurant: {
              id: 'rest-4',
              name: 'Sushi Zen',
              description: 'Fersk sushi og japanske spesialiteter',
              image_url: 'https://picsum.photos/seed/sushi/800/600',
              background_image_url: null,
              phone: '+47 47000000',
              address: 'Bogstadveien 20',
              city: 'Oslo',
              lat: 59.9311,
              lng: 10.7217,
              categories: ['Japansk', 'Sushi', 'Asiatisk'],
              dine_in: true,
              takeaway: true,
              menu_pdf_url: null,
              owner_id: null,
              opening_hours: null,
              created_at: new Date().toISOString()
            }
          }
        ]
        
        // Apply search filter
        let filteredDeals = demoDeals
        if (searchQuery.trim()) {
          const query = searchQuery.toLowerCase()
          filteredDeals = demoDeals.filter(deal => 
            deal.title.toLowerCase().includes(query) ||
            deal.restaurant.name.toLowerCase().includes(query)
          )
        }
        
        // Apply cuisine filter
        if (filters.cuisines.length > 0) {
          filteredDeals = filteredDeals.filter(deal =>
            deal.restaurant.categories.some((cat: string) => filters.cuisines.includes(cat))
          )
        }
        
        // Sort deals by restaurant availability first, then by highest discount
        const sortedDeals = sortDealsByRestaurantAvailability(filteredDeals)
        const activeDeals = filterDealsWithinNextWeek(sortedDeals)
        
        return activeDeals
      }

      // Real Supabase mode
      
      let query = supabase
        .from('deals')
        .select(`
          *,
          restaurants (
            id,
            name,
            description,
            image_url,
            phone,
            address,
            city,
            categories
          )
        `)
        .eq('is_active', true)

      console.log('📡 Executing Supabase query...')
      const { data, error } = await query

      console.log('📊 Supabase response:', { 
        dataCount: data?.length, 
        error: error?.message,
        firstItem: data?.[0]
      })
      
      if (error) {
        console.error('❌ Supabase error:', error)
        throw error
      }
      console.log('✅ Successfully fetched deals:', data?.length || 0)
      
      // Transform data to match expected structure
      let transformedData = data?.map((deal: any) => ({
        ...deal,
        restaurant: deal.restaurants // Supabase returns 'restaurants', we need 'restaurant'
      })) || []
      
      // Apply search filter
      if (searchQuery.trim()) {
        const query = searchQuery.toLowerCase()
        console.log('🔍 Applying search filter:', query)
        transformedData = transformedData.filter(deal => 
          deal.title.toLowerCase().includes(query) ||
          deal.restaurant.name.toLowerCase().includes(query) ||
          deal.restaurant.description?.toLowerCase().includes(query) ||
          deal.restaurant.categories.some(cat => cat.toLowerCase().includes(query))
        )
        console.log('🔍 Filtered results:', transformedData.length)
      }
      
      // Apply cuisine filter
      if (filters.cuisines.length > 0) {
        console.log('🍽️ Applying cuisine filter:', filters.cuisines)
        transformedData = transformedData.filter(deal =>
          deal.restaurant.categories.some((cat: string) => filters.cuisines.includes(cat))
        )
        console.log('🍽️ Filtered results:', transformedData.length)
      }
      
      // Apply dietary filter
      if (filters.dietary.length > 0) {
        console.log('🥗 Applying dietary filter:', filters.dietary)
        transformedData = transformedData.filter(deal =>
          deal.dietary_info.some((diet: string) => filters.dietary.includes(diet))
        )
        console.log('🥗 Filtered results:', transformedData.length)
      }
      
      console.log('🔄 Final transformed data:', transformedData.length, 'deals')
      
      // Fetch menu items for deals with menu_item_id to get price_tiers
      const dealsWithMenuItems = transformedData.filter((deal: any) => deal.menu_item_id)
      const menuItemIds = dealsWithMenuItems.map((deal: any) => deal.menu_item_id)
      
      let menuItemsMap: { [key: string]: any } = {}
      if (menuItemIds.length > 0) {
        console.log('📋 Fetching menu items for dual pricing:', menuItemIds.length)
        const { data: menuItems, error: menuItemsError } = await supabase
          .from('menu_items')
          .select('id, price_tiers')
          .in('id', menuItemIds)
        
        if (menuItemsError) {
          console.warn('⚠️ Could not fetch menu items:', menuItemsError)
        } else {
          menuItemsMap = (menuItems || []).reduce((acc, item) => {
            acc[item.id] = item
            return acc
          }, {} as { [key: string]: any })
          console.log('✅ Fetched menu items:', Object.keys(menuItemsMap).length)
        }
      }
      
      // Calculate dual pricing for deals with menu_item_id
      const dealsWithPricing = transformedData.map((deal: any) => {
        if (deal.menu_item_id && menuItemsMap[deal.menu_item_id]) {
          const menuItem = menuItemsMap[deal.menu_item_id]
          // Handle price_tiers as JSONB or string
          let priceTiers = menuItem.price_tiers || []
          if (typeof priceTiers === 'string') {
            try {
              priceTiers = JSON.parse(priceTiers)
            } catch (e) {
              console.warn('Could not parse price_tiers:', e)
              priceTiers = []
            }
          }
          
          const selectedTiers = deal.selected_price_tiers || ['student', 'ansatt'] // Default to both if not specified
          const studentTier = priceTiers.find((t: any) => t.type === 'student')
          const ansattTier = priceTiers.find((t: any) => t.type === 'ansatt')
          
          console.log(`💰 Deal ${deal.id}: menu_item_id=${deal.menu_item_id}, price_tiers=${priceTiers.length}, student=${!!studentTier}, ansatt=${!!ansattTier}, selected=${selectedTiers.join(',')}`)
          
          if (studentTier || ansattTier) {
            const discountPercent = deal.discount_percentage / 100
            const pricing: any = {}
            
            // Only calculate prices for selected tiers, and only if amount_ore > 0
            if (selectedTiers.includes('student') && studentTier && studentTier.amount_ore > 0) {
              const studentOriginal = studentTier.amount_ore
              const studentFinal = Math.round(studentOriginal * (1 - discountPercent))
              if (studentFinal > 0) {
                pricing.studentPrice = { original: studentOriginal, final: studentFinal }
              }
            }
            
            if (selectedTiers.includes('ansatt') && ansattTier && ansattTier.amount_ore > 0) {
              const ansattOriginal = ansattTier.amount_ore
              const ansattFinal = Math.round(ansattOriginal * (1 - discountPercent))
              if (ansattFinal > 0) {
                pricing.ansattPrice = { original: ansattOriginal, final: ansattFinal }
              }
            }
            
            // Only add pricing if at least one tier is selected and has valid prices
            if (Object.keys(pricing).length > 0) {
              console.log(`✅ Added dual pricing for deal ${deal.id}:`, pricing)
              return {
                ...deal,
                ...pricing
              }
            } else {
              console.log(`⚠️ Deal ${deal.id} has price_tiers but all prices are 0, using regular pricing`)
            }
          } else {
            console.log(`⚠️ Deal ${deal.id} has menu_item_id but no price_tiers found`)
          }
        } else {
          if (deal.menu_item_id) {
            console.log(`⚠️ Deal ${deal.id} has menu_item_id=${deal.menu_item_id} but menu item not found in map`)
          }
        }
        // Ensure final_price is set correctly if not already set
        if (!deal.final_price && deal.original_price && deal.discount_percentage) {
          deal.final_price = Math.round(deal.original_price * (1 - deal.discount_percentage / 100))
        }
        return deal
      })
      
      // Sort deals by restaurant availability first, then by highest discount
      const sortedDeals = sortDealsByRestaurantAvailability(dealsWithPricing)
      const activeDeals = filterDealsWithinNextWeek(sortedDeals)
      console.log('📊 Sorted deals:', sortedDeals.length, 'deals')
      console.log('🗓️ Active within next week:', activeDeals.length)
      
      return activeDeals as DealWithRestaurant[]
    },
  })

  // Get user (optional) without redirecting
  const [user, setUser] = useState<any>(null)
  useEffect(() => {
    const fetchUser = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      setUser(user)
    }
    fetchUser()
  }, [])

  // Fetch user profile for favorites
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

  // Get available filter options
  const { data: filterOptions = { cuisines: [], dietary: [] } } = useQuery({
    queryKey: ['filter-options'],
    queryFn: async () => {
      const { data: restaurants } = await supabase
        .from('restaurants')
        .select('categories')

      const cuisines = [...new Set(restaurants?.flatMap((r: any) => r.categories) || [])]
      const dietary = [
        'Vegetarisk', 'Vegansk', 'Glutenfri', 'Laktosefri', 'Nøttefri', 
        'Skalldyrfri', 'Halal', 'Kosher'
      ]

      return { cuisines, dietary }
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
      return data
    },
    enabled: !!profile,
  })

  const debouncedSearch = useMemo(
    () => debounce((query: string) => setSearchQuery(query), 300),
    []
  )

  const { popularDeals, regularDeals } = useMemo(() => {
    const basePopular = getPopularDeals(deals, 3)
    
    // Sort popular deals: available/upcoming first, then by highest discount + most claimed
    const popularSorted = sortDealsByRestaurantAvailability(basePopular)
    
    const popularIds = new Set(popularSorted.map((deal) => deal.id))
    const regular = deals.filter((deal) => !popularIds.has(deal.id))
    
    // Sort regular deals by availability, then by highest discount + most claimed
    const regularSorted = sortDealsByRestaurantAvailability(regular)

    return {
      popularDeals: popularSorted,
      regularDeals: regularSorted,
    }
  }, [deals])

  const totalActiveDeals = popularDeals.length + regularDeals.length

  const handleFavoriteToggle = async (restaurantId: string) => {
    if (!profile) {
      toast.error(norwegianText.errors.loginRequired)
      return
    }

    const currentFavorites = profile.favorites || []
    const isFavorite = currentFavorites.includes(restaurantId)
    const newFavorites = isFavorite
      ? currentFavorites.filter((id: string) => id !== restaurantId)
      : [...currentFavorites, restaurantId]

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

        queryClient.setQueryData(['profile'], {
          ...profile,
          favorites: newFavorites,
        })
      }

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

  const handleFavoriteDealToggle = async (dealId: string) => {
    if (!profile) {
      toast.error(norwegianText.errors.loginRequired)
      return
    }

    const currentFavoriteDeals = profile.favorite_deals || []
    const isFavorite = currentFavoriteDeals.includes(dealId)
    const newFavoriteDeals = isFavorite
      ? currentFavoriteDeals.filter((id: string) => id !== dealId)
      : [...currentFavoriteDeals, dealId]

    try {
      const { error } = await supabase
        .from('profiles')
        .update({ favorite_deals: newFavoriteDeals })
        .eq('id', profile.id)

      if (error) throw error

      queryClient.setQueryData(['profile'], {
        ...profile,
        favorite_deals: newFavoriteDeals,
      })

      toast.success(
        isFavorite 
          ? norwegianText.success.favoriteRemoved 
          : norwegianText.success.favoriteAdded
      )
    } catch (error) {
      console.error('Error updating deal favorites:', error)
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
    if (!selectedDeal) {
      console.error('❌ No deal selected')
      toast.error('Ingen tilbud valgt')
      return
    }
    
    if (!user) {
      console.error('❌ User not logged in')
      toast.error('Du må logge inn for å hente tilbud')
      navigate('/auth?reason=claim')
      return
    }

    try {
      console.log('🎯 Starting claim process...', { selectedDeal: selectedDeal.id, claimData })

      console.log('👤 User authenticated:', user.id)

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

      console.log('📝 Claim payload:', claimPayload)

      const { data, error } = await supabase
        .from('claims')
        .insert(claimPayload as any)
        .select()

      console.log('📊 Claim response:', { data, error })

      if (error) {
        console.error('❌ Supabase claim error:', error)
        throw error
      }

      console.log('✅ Claim created successfully!')

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

      // Manually update claimed_count if trigger doesn't work
      try {
        const { error: updateError } = await supabase
          .from('deals')
          .update({
            claimed_count: (selectedDeal as any).claimed_count + claimData.quantity  
          } as any)
          .eq('id', selectedDeal.id)
        
        if (updateError) {
          console.warn('⚠️ Could not update claimed_count manually:', updateError)
        } else {
          console.log('✅ Manually updated claimed_count')
        }
      } catch (updateErr) {
        console.warn('⚠️ Manual claimed_count update failed:', updateErr)
      }

      // Close the modal
      setSelectedDeal(null)

      // Refresh daily claims, user claims, and deals list to update availability
      queryClient.invalidateQueries({ queryKey: ['daily-claims'] })
      queryClient.invalidateQueries({ queryKey: ['user-claims'] })
      queryClient.invalidateQueries({ queryKey: ['deals'] })
      
      toast.success('Tilbud hentet! Du kan se det under "Mine tilbud".', {
        action: {
          label: 'Se mine tilbud',
          onClick: () => navigate('/claims'),
        },
      })
    } catch (error: any) {
      console.error('❌ Error claiming deal:', error)
      
      // More detailed error messages
      if (error?.code === 'PGRST116') {
        toast.error('Tabellen claims finnes ikke. Kontakt administrator.')
      } else if (error?.code === '42P01') {
        toast.error('Database tabeller mangler. Kjør database schema først.')
      } else if (error?.code === '23503') {
        toast.error('Ugyldig deal ID. Prøv å oppdatere siden.')
      } else if (error?.message?.includes('permission')) {
        toast.error('Ikke tilgang til å hente tilbud. Sjekk database permissions.')
      } else if (error?.message?.includes('RLS')) {
        toast.error('Row Level Security blokkerer krav. Sjekk RLS-regler.')
      } else {
        toast.error(`Kunne ikke hente tilbud: ${error?.message || 'Ukjent feil'}`)
      }
    }
  }

  const getUserLimits = (dealId: string, perUserLimit: number) => {
    const claimedToday = dailyClaims
      .filter((claim: any) => claim.deal_id === dealId)
      .reduce((sum: number, claim: any) => sum + claim.quantity, 0)
    
    return {
      maxPerUser: perUserLimit,
      remainingToday: Math.max(0, perUserLimit - claimedToday),
    }
  }

  return (
    <div className="min-h-screen bg-bg">
      {/* Header */}
      <div className="bg-white px-4 py-4 shadow-sm">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3 text-muted-fg">
            <MapPin className="h-4 w-4" />
            {locationLoading || cityLoading ? (
              <div className="flex items-center gap-2">
                <div className="animate-spin rounded-full h-3 w-3 border border-muted-fg border-t-transparent" />
                <span className="text-sm">Henter lokasjon...</span>
              </div>
            ) : locationError ? (
              <div className="flex items-center gap-1 text-warning">
                <AlertCircle className="h-3 w-3" />
                <span className="text-sm">Lokasjon utilgjengelig</span>
              </div>
            ) : (
              <span className="text-sm">{cityName || 'Ukjent lokasjon'}</span>
            )}
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => navigate('/business')}
              className="flex items-center gap-2 px-3 py-2 rounded-lg hover:bg-muted/50 transition-colors text-sm font-medium text-fg"
              aria-label="For bedrifter"
              title="For bedrifter"
            >
              <Building2 className="h-4 w-4" />
              For bedrifter
            </button>
            <button
              onClick={() => navigate('/rewards')}
              className="p-2 rounded-lg hover:bg-muted/50 transition-colors"
              aria-label="Belønninger"
              title="Belønninger"
            >
              <svg width="20" height="20" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
                {/* Gift body - a bit taller */}
                <rect x="3" y="7" width="18" height="14" rx="2" fill="#F4C042" />
                {/* Lid shading */}
                <rect x="3" y="7" width="18" height="6" rx="2" fill="#E6B237" />
                {/* Vertical ribbon */}
                <rect x="10.5" y="7" width="3" height="14" fill="#D22E6A" />
                {/* Horizontal ribbon */}
                <rect x="3" y="12" width="18" height="2.2" fill="#D22E6A" />
                {/* Bigger bow (two circles) */}
                <circle cx="8.2" cy="5.2" r="2.4" fill="#E04B5A" />
                <circle cx="15.8" cy="5.2" r="2.4" fill="#E04B5A" />
              </svg>
            </button>
            <NavigationMenu 
              onShowFilters={() => setShowFilters(true)}
              hasActiveFilters={filters.cuisines.length > 0 || filters.dietary.length > 0 || !!filters.priceRange || !!filters.distance || !!filters.sort}
            />
          </div>
        </div>

        {/* Search Bar */}
        <div className="relative mb-2">
          <div className="flex items-center gap-3">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-fg h-4 w-4" />
              <input
                type="text"
                placeholder="Søk restauranter, kjøkken..."
                onChange={(e) => debouncedSearch(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 rounded-2xl border border-border bg-muted/30 focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary"
              />
            </div>
          </div>
        </div>

      </div>

      <main className="pb-20">
        {/* Popular Deals Section */}
        <PopularDeals
          deals={popularDeals}
          favorites={profile?.favorites || []}
          favoriteDeals={profile?.favorite_deals || []}
          onFavoriteToggle={handleFavoriteToggle}
          onFavoriteDealToggle={handleFavoriteDealToggle}
          onClaimDeal={setSelectedDeal}
        />

        {/* Deals Section */}
        <div className="px-4 py-4">
          <div className="flex items-center gap-2 mb-4">
            <TrendingUp className="h-4 w-4 text-primary" />
            <span className="text-sm font-medium">{totalActiveDeals} aktive tilbud</span>
          </div>

          {/* Deals List */}
          <DealsList
            deals={regularDeals}
            favorites={profile?.favorites || []}
            favoriteDeals={profile?.favorite_deals || []}
            onFavoriteToggle={handleFavoriteToggle}
            onFavoriteDealToggle={handleFavoriteDealToggle}
            onClaimDeal={setSelectedDeal}
            isLoading={dealsLoading}
          />

          {/* Upcoming Partners */}
          <div className="mt-10">
            <p className="text-xs font-semibold tracking-[0.3em] text-muted-fg uppercase text-center mb-4">
              Kommende restauranter
            </p>

            <div className="overflow-hidden">
              <div className="flex items-center gap-3 animate-marquee whitespace-nowrap">
                {[
                  "Jojo's Pizza & Bar",
                  "Aas Bistro",
                  "Andedammen café og restaurant",
                ].map((partner) => (
                  <div
                    key={partner}
                    className="rounded-2xl border border-border bg-white shadow-sm px-6 py-4 text-base font-semibold text-gray-800"
                  >
                    {partner}
                  </div>
                ))}
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
        priceRange={filters.priceRange}
        distance={filters.distance}
        sort={filters.sort}
        onFiltersChange={setFilters}
      />

      {/* Claim Flow Modal */}
      {selectedDeal && (
        <ClaimFlowModal
          deal={selectedDeal}
          userLimits={getUserLimits(selectedDeal.id, selectedDeal.per_user_limit)}
          hasDineIn={(selectedDeal as any).dine_in}
          hasTakeaway={(selectedDeal as any).takeaway}
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


