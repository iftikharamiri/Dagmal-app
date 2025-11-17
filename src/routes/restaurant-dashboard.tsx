import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { ArrowLeft, Plus, Edit3, Eye, TrendingUp, Clock, Star, Shield, Copy, Upload, Save, X, Users, DollarSign, Trash2, FileText, Bell } from 'lucide-react'
import { supabase } from '@/lib/supabase'
import { toast } from 'sonner'
import { formatTime, formatPrice } from '@/lib/utils'
import { MenuUploadModal } from '@/components/MenuUploadModal'
import { NotificationCard } from '@/components/NotificationCard'
import { AddLocationModal } from '@/components/AddLocationModal'
import { CompleteMenu, parseMenuToDatabase } from '@/lib/menuUtils'
import { MapContainer, TileLayer, Marker, useMapEvents } from 'react-leaflet'
import L from 'leaflet'
import 'leaflet/dist/leaflet.css'

interface RestaurantDeal {
  id: string
  title: string
  description: string
  original_price: number
  discount_percentage: number
  final_price: number
  available_for: string[]
  start_time: string
  end_time: string
  available_days: string[]
  per_user_limit: number
  total_limit: number
  claimed_count: number
  is_active: boolean
  verification_code: string
  created_at: string
}

interface Restaurant {
  id: string
  name: string
  description: string
  image_url: string
  phone: string
  address: string
  city: string
  categories: string[]
  created_at: string
}

export function RestaurantDashboardPage() {
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const [isEditingProfile, setIsEditingProfile] = useState(false)
  const [showNotifications, setShowNotifications] = useState(false)
  const [editFormData, setEditFormData] = useState({
    name: '',
    description: '',
    phone: '',
    address: '',
    city: '',
    image_url: '',
    categories: [] as string[]
  })
  const [editPosition, setEditPosition] = useState<{ lat: number; lng: number } | null>(null)
  const [isUploading, setIsUploading] = useState(false)
  const [isUploadingBackground, setIsUploadingBackground] = useState(false)
  const [isUploadingJsonMenu, setIsUploadingJsonMenu] = useState(false)
  const [backgroundImageUrl, setBackgroundImageUrl] = useState('')
  const [showMenuUploadModal, setShowMenuUploadModal] = useState(false)
  const [isDeletingMenu, setIsDeletingMenu] = useState(false)
  const [showAddLocationModal, setShowAddLocationModal] = useState(false)

  // Copy verification code to clipboard
  const copyToClipboard = async (code: string) => {
    try {
      await navigator.clipboard.writeText(code)
      toast.success('Verifikasjonskode kopiert!')
    } catch (error) {
      toast.error('Kunne ikke kopiere kode')
    }
  }

  // Start editing profile
  const startEditingProfile = () => {
    if (restaurant) {
      setEditFormData({
        name: restaurant.name || '',
        description: restaurant.description || '',
        phone: restaurant.phone || '',
        address: restaurant.address || '',
        city: restaurant.city || '',
        image_url: restaurant.image_url || '',
        categories: restaurant.categories || []
      })
      if (restaurant.lat && restaurant.lng) {
        setEditPosition({ lat: Number(restaurant.lat), lng: Number(restaurant.lng) })
      }
      setIsEditingProfile(true)
    }
  }

  // Handle image upload
  const handleImageUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file || !restaurant) return

    // Validate file size (5MB limit)
    if (file.size > 5 * 1024 * 1024) {
      toast.error('Bildet er for stort. Maksimal størrelse er 5MB.')
      return
    }

    // Validate file type
    if (!file.type.startsWith('image/')) {
      toast.error('Vennligst velg en gyldig bildefil (JPG, PNG, GIF).')
      return
    }

    setIsUploading(true)
    try {
      const fileExt = file.name.split('.').pop()
      const fileName = `${restaurant.id}-${Date.now()}.${fileExt}`
      
      console.log('🔄 Uploading image:', fileName)
      
      const { data: uploadData, error: uploadError } = await supabase.storage
        .from('restaurant-images')
        .upload(fileName, file, {
          cacheControl: '3600',
          upsert: false
        })

      if (uploadError) {
        console.error('❌ Upload error:', uploadError)
        
        // If bucket doesn't exist, provide helpful error message
        if (uploadError.message.includes('Bucket not found')) {
          toast.error('Lagringsbøtte ikke funnet. Kontakt support for å sette opp bildelagring.')
          return
        }
        
        throw uploadError
      }

      console.log('✅ Upload successful:', uploadData)

      const { data: { publicUrl } } = supabase.storage
        .from('restaurant-images')
        .getPublicUrl(fileName)

      console.log('🔗 Public URL:', publicUrl)

      setEditFormData(prev => ({ ...prev, image_url: publicUrl }))
      toast.success('Bilde lastet opp!')
    } catch (error: any) {
      console.error('❌ Error uploading image:', error)
      
      // Provide more specific error messages
      if (error.message?.includes('storage')) {
        toast.error('Lagringsfeil. Vennligst prøv igjen eller kontakt support.')
      } else if (error.message?.includes('network')) {
        toast.error('Nettverksfeil. Sjekk internettforbindelsen og prøv igjen.')
      } else {
        toast.error('Kunne ikke laste opp bilde. Prøv igjen eller bruk en mindre fil.')
      }
    } finally {
      setIsUploading(false)
    }
  }

  // Handle background image upload
  const handleBackgroundUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file || !restaurant) return

    // Validate file size (10MB limit for background images)
    if (file.size > 10 * 1024 * 1024) {
      toast.error('Bakgrunnsbildet er for stort. Maksimal størrelse er 10MB.')
      return
    }

    // Validate file type
    if (!file.type.startsWith('image/')) {
      toast.error('Vennligst velg en gyldig bildefil (JPG, PNG, GIF).')
      return
    }

    setIsUploadingBackground(true)
    try {
      const fileExt = file.name.split('.').pop()
      const fileName = `${restaurant.id}-background-${Date.now()}.${fileExt}`
      
      console.log('🔄 Uploading background image:', fileName)
      
      const { data: uploadData, error: uploadError } = await supabase.storage
        .from('restaurant-images')
        .upload(fileName, file, {
          cacheControl: '3600',
          upsert: false
        })

      if (uploadError) {
        console.error('❌ Upload error:', uploadError)
        
        if (uploadError.message.includes('already exists')) {
          toast.error('Et bilde med dette navnet eksisterer allerede. Vennligst endre filnavnet.')
          return
        }
        
        throw uploadError
      }

      console.log('✅ Background upload successful:', uploadData)

      const { data: { publicUrl } } = supabase.storage
        .from('restaurant-images')
        .getPublicUrl(fileName)

      console.log('🔗 Background public URL:', publicUrl)

      // Save to database
      const { error: updateError } = await supabase
        .from('restaurants')
        .update({ background_image_url: publicUrl })
        .eq('id', restaurant.id)

      if (updateError) {
        console.error('❌ Error updating restaurant background_image_url:', updateError)
        throw updateError
      }

      setBackgroundImageUrl(publicUrl)
      
      // Also save to localStorage as fallback
      if (restaurant?.id) {
        localStorage.setItem(`restaurant-background-${restaurant.id}`, publicUrl)
      }
      
      // Invalidate restaurant query to refresh data
      queryClient.invalidateQueries({ queryKey: ['restaurant', restaurant.id] })
      
      toast.success('Bakgrunnsbilde lastet opp!')
    } catch (error: any) {
      console.error('❌ Error uploading background image:', error)
      
      // Provide more specific error messages
      if (error.message?.includes('storage')) {
        toast.error('Lagringsfeil. Vennligst prøv igjen eller kontakt support.')
      } else if (error.message?.includes('network')) {
        toast.error('Nettverksfeil. Sjekk internettforbindelsen og prøv igjen.')
      } else {
        toast.error('Kunne ikke laste opp bakgrunnsbilde. Prøv igjen eller bruk en mindre fil.')
      }
    } finally {
      setIsUploadingBackground(false)
    }
  }

  // Handle complete menu upload from modal
  const handleCompleteMenuUpload = async (menu: CompleteMenu) => {
    if (!restaurant) return

    try {
      console.log('Starting menu upload for restaurant:', restaurant.id)
      const { menuItems, categories } = parseMenuToDatabase(menu, restaurant.id)
      console.log('Parsed menu items:', menuItems.length, 'Categories:', categories)

      // Ensure unique names per restaurant to avoid unique constraint (restaurant_id, name)
      const nameCount = new Map<string, number>()
      const dedupedMenuItems = menuItems.map((it) => {
        const base = (it.name || '').trim()
        const count = (nameCount.get(base) || 0) + 1
        nameCount.set(base, count)
        const finalName = count === 1 ? base : `${base} (${count})`
        return { ...it, name: finalName }
      })

      // Update restaurant categories if provided
      if (categories.length > 0) {
        console.log('Updating restaurant categories:', categories)
        const { error: updateError } = await supabase
          .from('restaurants')
          .update({ categories })
          .eq('id', restaurant.id)

        if (updateError) {
          console.warn('Could not update restaurant categories:', updateError)
        } else {
          console.log('Restaurant categories updated successfully')
        }
      }

      // Check if menu_items table exists by trying to select from it
      console.log('Checking menu_items table...')
      const { error: tableCheckError } = await supabase
        .from('menu_items')
        .select('id')
        .limit(1)

      if (tableCheckError) {
        console.error('menu_items table error:', tableCheckError)
        console.log('Menu items table not available. This feature requires the menu_items table to be created.')
        console.log('Please run the SQL script create_menu_items_table.sql in your Supabase dashboard.')
        toast.error('Menu items table not available. Please contact support to enable this feature.')
        return
      }

      // Insert menu items in batches
      console.log('Inserting menu items in batches...')
      const batchSize = 10
      for (let i = 0; i < dedupedMenuItems.length; i += batchSize) {
        const batch = dedupedMenuItems.slice(i, i + batchSize)
        console.log(`Inserting batch ${Math.floor(i/batchSize) + 1}/${Math.ceil(menuItems.length/batchSize)}:`, batch.length, 'items')
        
        const { error } = await supabase
          .from('menu_items')
          .upsert(batch, { onConflict: 'id' })

        if (error) {
          console.error('Batch insert error:', error)
          throw error
        }
      }

      console.log('Menu upload completed successfully!')
      toast.success(`${dedupedMenuItems.length} menu items uploaded successfully!`)
      
      // Refresh restaurant data
      queryClient.invalidateQueries({ queryKey: ['owned-restaurant'] })
      
    } catch (error: any) {
      console.error('Error uploading complete menu:', error)
      console.error('Error details:', JSON.stringify(error, null, 2))
      toast.error(`Failed to upload menu: ${error.message || 'Unknown error'}`)
    }
  }

  // Handle menu deletion
  const handleDeleteMenu = async () => {
    if (!restaurant) return

    // Confirm deletion
    const confirmed = window.confirm(
      'Er du sikker på at du vil slette hele menyen? Denne handlingen kan ikke angres, og alle menyretter vil bli permanent slettet.'
    )

    if (!confirmed) return

    setIsDeletingMenu(true)
    try {
      // Delete all menu items for this restaurant
      const { error } = await supabase
        .from('menu_items')
        .delete()
        .eq('restaurant_id', restaurant.id)

      if (error) {
        console.error('Error deleting menu:', error)
        throw error
      }

      toast.success('Menyen er slettet!')
      
      // Refresh restaurant data
      queryClient.invalidateQueries({ queryKey: ['owned-restaurant'] })
      
    } catch (error: any) {
      console.error('Error deleting menu:', error)
      toast.error(`Kunne ikke slette meny: ${error.message || 'Unknown error'}`)
    } finally {
      setIsDeletingMenu(false)
    }
  }

  // Handle JSON menu upload
  const handleJsonMenuUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file || !restaurant) return

    // Validate file type
    if (file.type !== 'application/json') {
      toast.error('Kun JSON-filer er tillatt for menyen')
      return
    }

    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      toast.error('JSON-filen er for stor. Maksimal størrelse er 5MB')
      return
    }

    setIsUploadingJsonMenu(true)
    try {
      const text = await file.text()
      const menuData = JSON.parse(text)

      let menuItems: any[] = []

      // Handle different JSON structures
      if (Array.isArray(menuData)) {
        // Simple array format
        menuItems = menuData
      } else if (menuData.categories && Array.isArray(menuData.categories)) {
        // Categories format (like your Babylon Burger menu)
        menuItems = []
        for (const category of menuData.categories) {
          if (category.items && Array.isArray(category.items)) {
            for (const item of category.items) {
              // Handle multiple prices (burger/tallerken)
              const prices = item.prices || {}
              const mainPrice = prices.burger || prices.tallerken || prices.price || 0
              
              // Convert allergens to dietary info
              const allergensKey = menuData.allergens_key || {}
              const dietaryInfo = (item.allergens || []).map((id: number) => {
                const allergen = allergensKey[id.toString()]
                // Map common allergens to dietary tags
                if (allergen === 'Gluten') return 'gluten-free'
                if (allergen === 'Melk') return 'dairy-free'
                if (allergen === 'Soya') return 'soy-free'
                return allergen?.toLowerCase() || ''
              }).filter(Boolean)

              menuItems.push({
                name: item.name,
                description: item.description || null,
                price: Math.round(mainPrice * 100), // Convert to øre
                category: category.name || null,
                dietary_info: dietaryInfo,
                image_url: item.image_url || null
              })
            }
          }
        }
      } else {
        throw new Error('JSON må inneholde en array av retter eller en categories struktur')
      }

      if (menuItems.length === 0) {
        throw new Error('Ingen retter funnet i JSON-filen')
      }

      // Process and insert menu items
      // Build items and ensure unique names per restaurant
      const processedRaw = menuItems.map((item, index) => ({
        restaurant_id: restaurant.id,
        name: item.name || `Rett ${index + 1}`,
        description: item.description || null,
        price: Math.round((item.price || 0) * 100), // Convert to øre
        category: item.category || null,
        dietary_info: item.dietary_info || [],
        image_url: item.image_url || null,
        is_available: true
      }))

      const nameCount2 = new Map<string, number>()
      const processedItems = processedRaw.map((it) => {
        const base = (it.name || '').trim()
        const count = (nameCount2.get(base) || 0) + 1
        nameCount2.set(base, count)
        const finalName = count === 1 ? base : `${base} (${count})`
        return { ...it, name: finalName }
      })

      // Insert menu items in batches
      const batchSize = 10
      for (let i = 0; i < processedItems.length; i += batchSize) {
        const batch = processedItems.slice(i, i + batchSize)
        const { error } = await supabase
          .from('menu_items')
          .upsert(batch, { onConflict: 'id' })

        if (error) throw error
      }

      toast.success(`${processedItems.length} retter lastet opp til menyen!`)
      
      // Refresh restaurant data
      refetchRestaurant()
      
    } catch (error: any) {
      console.error('Error uploading JSON menu:', error)
      if (error.message?.includes('JSON')) {
        toast.error('Ugyldig JSON-fil. Sjekk formatet og prøv igjen.')
      } else {
        toast.error('Kunne ikke laste opp menyen. Prøv igjen.')
      }
    } finally {
      setIsUploadingJsonMenu(false)
    }
  }

  // Geocode address function
  const geocodeAddress = async (address: string, city: string): Promise<{lat: number, lng: number} | null> => {
    try {
      const fullAddress = `${address}, ${city}, Norway`
      const encodedAddress = encodeURIComponent(fullAddress)
      
      const response = await fetch(
        `https://nominatim.openstreetmap.org/search?format=json&limit=1&q=${encodedAddress}&countrycodes=no`,
        {
          headers: {
            'User-Agent': 'Norwegian Restaurant Deals App'
          }
        }
      )
      
      if (!response.ok) return null
      
      const data = await response.json()
      
      if (data && data.length > 0) {
        return {
          lat: parseFloat(data[0].lat),
          lng: parseFloat(data[0].lon)
        }
      }
      return null
    } catch (error) {
      console.error('Geocoding error:', error)
      return null
    }
  }

  // Save profile changes
  const saveProfile = async () => {
    if (!restaurant) return

    try {
      let updateData: any = {
        name: editFormData.name,
        description: editFormData.description,
        phone: editFormData.phone,
        address: editFormData.address,
        city: editFormData.city,
        image_url: editFormData.image_url,
        categories: editFormData.categories
      }

      // If address changed, try to geocode it (unless user set pin)
      if (!editPosition && (editFormData.address !== restaurant.address || editFormData.city !== restaurant.city)) {
        const coordinates = await geocodeAddress(editFormData.address, editFormData.city)
        if (coordinates) {
          updateData = { ...updateData, lat: coordinates.lat, lng: coordinates.lng }
          toast.success('Adresse oppdatert og funnet på kart!')
        } else {
          toast.warning('Adresse oppdatert, men kunne ikke finne nøyaktig plassering på kart.')
        }
      }

      // If user chose a pin position, prefer that
      if (editPosition) {
        updateData = { ...updateData, lat: editPosition.lat, lng: editPosition.lng }
      }

      const { error } = await supabase
        .from('restaurants')
        .update(updateData)
        .eq('id', restaurant.id)

      if (error) throw error

      queryClient.invalidateQueries({ queryKey: ['owned-restaurant'] })
      setIsEditingProfile(false)
      setEditPosition(null)
      toast.success('Profil oppdatert!')
    } catch (error) {
      console.error('Error updating profile:', error)
      toast.error('Kunne ikke oppdatere profil')
    }
  }

  // Cancel editing
  const cancelEditing = () => {
    setIsEditingProfile(false)
    setEditFormData({
      name: '',
      description: '',
      phone: '',
      address: '',
      city: '',
      image_url: '',
      categories: []
    })
  }

  // Sync activeRestaurantId from localStorage to state so queryKey updates
  const [activeId, setActiveId] = React.useState<string | null>(null)
  React.useEffect(() => {
    const id = typeof window !== 'undefined' ? localStorage.getItem('activeRestaurantId') : null
    setActiveId(id)
    const handleStorage = () => {
      const newId = typeof window !== 'undefined' ? localStorage.getItem('activeRestaurantId') : null
      setActiveId(newId)
    }
    window.addEventListener('storage', handleStorage)
    // Also listen for same-tab updates via custom event
    window.addEventListener('restaurant-selected', handleStorage)
    return () => {
      window.removeEventListener('storage', handleStorage)
      window.removeEventListener('restaurant-selected', handleStorage)
    }
  }, [])

  // Fetch restaurant owned by current user (supports explicit selection)
  const { data: restaurant, isLoading: restaurantLoading, refetch: refetchRestaurant } = useQuery({
    queryKey: ['owned-restaurant', activeId],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error('Not authenticated')

      // If an active restaurant is chosen, fetch that one
      if (activeId) {
        const { data, error } = await supabase
          .from('restaurants')
          .select('*')
          .eq('id', activeId)
          .eq('owner_id', user.id) // Security: ensure user owns it
          .single()
        if (error) {
          // If not found or not owned, clear selection and fall through
          if (typeof window !== 'undefined') {
            localStorage.removeItem('activeRestaurantId')
            setActiveId(null)
          }
          throw error
        }
        return data as any
      }

      // Otherwise, try to find by owner_id
      const { data, error } = await supabase
        .from('restaurants')
        .select('*')
        .eq('owner_id', user.id)
        .limit(1)
        .maybeSingle()

      if (error) throw error
      return data as any // Temporary fix for type issues
    },
  })

  // Fetch deals for the restaurant
  const { data: deals = [], isLoading: dealsLoading } = useQuery({
    queryKey: ['restaurant-deals', restaurant?.id],
    queryFn: async () => {
      if (!restaurant?.id) return []

      const { data, error } = await supabase
        .from('deals')
        .select('*, verification_code')
        .eq('restaurant_id', restaurant.id)
        .order('created_at', { ascending: false })

      if (error) throw error
      return data as RestaurantDeal[]
    },
    enabled: !!restaurant?.id,
  })

  // Fetch notifications for the restaurant
  const { data: notifications = [], isLoading: notificationsLoading } = useQuery({
    queryKey: ['restaurant-notifications', restaurant?.id],
    queryFn: async () => {
      if (!restaurant?.id) return []

      const { data, error } = await supabase
        .from('notifications')
        .select('*')
        .eq('restaurant_id', restaurant.id)
        .order('created_at', { ascending: false })

      if (error) throw error
      return data
    },
    enabled: !!restaurant?.id,
  })

  // Load background image from database when restaurant is loaded
  React.useEffect(() => {
    if (restaurant?.background_image_url) {
      setBackgroundImageUrl(restaurant.background_image_url)
    } else if (restaurant?.id) {
      // Fallback to localStorage if database doesn't have it yet
      const savedBackground = localStorage.getItem(`restaurant-background-${restaurant.id}`)
      if (savedBackground) {
        setBackgroundImageUrl(savedBackground)
      }
    }
  }, [restaurant?.id, restaurant?.background_image_url])

  // Calculate stats
  const stats = {
    totalDeals: deals.length,
    activeDeals: deals.filter(d => d.is_active).length
  }

  const toggleDealStatus = async (dealId: string, newStatus: boolean) => {
    try {
      const { error } = await supabase
        .from('deals')
        .update({ is_active: newStatus })
        .eq('id', dealId)

      if (error) throw error

      queryClient.invalidateQueries({ queryKey: ['restaurant-deals'] })
      toast.success(newStatus ? 'Tilbud aktivert' : 'Tilbud deaktivert')
    } catch (error) {
      console.error('Error toggling deal status:', error)
      toast.error('Kunne ikke oppdatere tilbud')
    }
  }

  const deleteDeal = async (dealId: string, dealTitle: string) => {
    if (!confirm(`Er du sikker på at du vil slette tilbudet "${dealTitle}"? Denne handlingen kan ikke angres.`)) {
      return
    }

    try {
      const { error } = await supabase
        .from('deals')
        .delete()
        .eq('id', dealId)

      if (error) throw error

      queryClient.invalidateQueries({ queryKey: ['restaurant-deals'] })
      toast.success('Tilbud slettet')
    } catch (error) {
      console.error('Error deleting deal:', error)
      toast.error('Kunne ikke slette tilbud')
    }
  }

  // Mark notification as read
  const markNotificationAsRead = async (notificationId: string) => {
    try {
      const { error } = await supabase
        .from('notifications')
        .update({ is_read: true })
        .eq('id', notificationId)

      if (error) throw error

      queryClient.invalidateQueries({ queryKey: ['restaurant-notifications'] })
    } catch (error) {
      console.error('Error marking notification as read:', error)
      toast.error('Kunne ikke markere notifikasjon som lest')
    }
  }

  if (restaurantLoading) {
    return (
      <div className="min-h-screen bg-bg flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p>Laster restaurant...</p>
        </div>
      </div>
    )
  }

  if (!restaurant) {
    return (
      <div className="min-h-screen bg-bg flex items-center justify-center">
        <div className="text-center max-w-md">
          <div className="text-6xl mb-4">🏪</div>
          <h2 className="text-xl font-bold mb-2">Ingen restaurant funnet</h2>
          <p className="text-muted-fg mb-6">Du har ikke registrert en restaurant ennå.</p>
          <button
            onClick={() => navigate('/business/register-restaurant')}
            className="bg-primary text-primary-fg px-6 py-3 rounded-xl hover:bg-primary/90 transition-colors"
          >
            Registrer restaurant
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-bg">
      {/* Header */}
      <div className="bg-white border-b px-4 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <button 
              onClick={() => navigate('/')}
              className="p-2 hover:bg-muted rounded-full transition-colors"
              title="Tilbake til hjem"
            >
              <ArrowLeft className="h-5 w-5" />
            </button>
            <h1 className="text-xl font-bold">Restaurant Dashboard</h1>
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={() => setShowNotifications(!showNotifications)}
              className="relative text-muted-fg hover:text-primary px-3 py-2 rounded-lg transition-colors"
              title="Notifikasjoner"
            >
              <Bell className="h-5 w-5" />
              {notifications.filter(n => !n.is_read).length > 0 && (
                <div className="absolute -top-1 -right-1 w-3 h-3 bg-danger rounded-full"></div>
              )}
            </button>
          </div>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-4 py-6">
        {/* Notifications Section */}
        {showNotifications && (
          <div className="bg-white rounded-2xl p-6 mb-6 shadow-soft">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-bold flex items-center gap-2">
                <Bell className="h-5 w-5" />
                Notifikasjoner
                {notifications.filter(n => !n.is_read).length > 0 && (
                  <span className="bg-danger text-white text-xs px-2 py-1 rounded-full">
                    {notifications.filter(n => !n.is_read).length}
                  </span>
                )}
              </h2>
              <button
                onClick={() => setShowNotifications(false)}
                className="text-muted-fg hover:text-primary p-1"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
            
            {notifications.length === 0 ? (
              <div className="text-center py-8 text-muted-fg">
                <Bell className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p>Ingen notifikasjoner ennå</p>
                <p className="text-sm">Du vil få beskjed når kunder hevder dine tilbud</p>
              </div>
            ) : (
              <div className="space-y-3 max-h-96 overflow-y-auto">
                {notifications.map((notification) => (
                  <NotificationCard
                    key={notification.id}
                    notification={notification}
                    onMarkAsRead={markNotificationAsRead}
                  />
                ))}
              </div>
            )}
          </div>
        )}

        {/* Restaurant Info Card */}
        <div className="bg-white rounded-2xl p-6 mb-6 shadow-soft">
          {!isEditingProfile ? (
            // View Mode
            <div className="flex items-start gap-4">
              <div className="w-32 h-32 bg-white rounded-2xl flex items-center justify-center text-2xl overflow-hidden border border-border">
                {restaurant.image_url ? (
                  <img 
                    src={restaurant.image_url} 
                    alt={restaurant.name} 
                    className="w-full h-full object-contain rounded-2xl" 
                    onError={(e) => {
                      (e.currentTarget as HTMLElement).style.display = 'none';
                      ((e.currentTarget as HTMLElement).nextElementSibling as HTMLElement)!.style.display = 'flex';
                    }}
                  />
                ) : null}
                <div className="w-full h-full flex items-center justify-center text-2xl bg-white rounded-2xl" style={{display: restaurant.image_url ? 'none' : 'flex'}}>
                  🏪
                </div>
              </div>
              <div className="flex-1">
                <div className="flex items-center justify-between mb-2">
                  <h2 className="text-xl font-bold">{restaurant.name}</h2>
                  <div className="flex items-center gap-2">
                    <button 
                      onClick={() => setShowAddLocationModal(true)}
                      className="text-primary hover:bg-primary/10 px-3 py-2 rounded-lg transition-colors flex items-center gap-2 text-sm"
                    >
                      <Plus className="h-4 w-4" />
                      <span>Legg til lokasjon</span>
                    </button>
                    <button 
                      onClick={startEditingProfile}
                      className="text-primary hover:bg-primary/10 p-2 rounded-lg transition-colors"
                    >
                      <Edit3 className="h-4 w-4" />
                    </button>
                  </div>
                </div>
                <p className="text-muted-fg mb-2">{restaurant.description}</p>
                <div className="flex flex-wrap gap-2 mb-3">
                  {restaurant.categories.map((category) => (
                    <span key={category} className="bg-muted px-2 py-1 rounded-full text-xs">
                      {category}
                    </span>
                  ))}
                </div>
                <div className="flex items-center gap-4 text-sm text-muted-fg">
                  {restaurant.phone && <span>📞 {restaurant.phone}</span>}
                  <span>📍 {restaurant.address}, {restaurant.city}</span>
                </div>
              </div>
            </div>
          ) : (
            // Edit Mode
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold">Rediger restaurantprofil</h3>
                <div className="flex items-center gap-2">
                  <button
                    onClick={saveProfile}
                    className="bg-primary text-primary-fg px-4 py-2 rounded-lg hover:bg-primary/90 transition-colors flex items-center gap-2"
                  >
                    <Save className="h-4 w-4" />
                    Lagre
                  </button>
                  <button
                    onClick={cancelEditing}
                    className="bg-muted text-muted-fg px-4 py-2 rounded-lg hover:bg-muted/80 transition-colors flex items-center gap-2"
                  >
                    <X className="h-4 w-4" />
                    Avbryt
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Restaurant Image */}
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium mb-2">Restaurantbilde</label>
                  <div className="space-y-3">
                    <div className="flex items-center gap-4">
                      <div className="w-32 h-32 bg-white rounded-2xl flex items-center justify-center overflow-hidden border border-border">
                        {editFormData.image_url ? (
                          <img 
                            src={editFormData.image_url} 
                            alt="Restaurant" 
                            className="w-full h-full object-contain rounded-2xl"
                            onError={(e) => {
                              (e.currentTarget as HTMLElement).style.display = 'none';
                              ((e.currentTarget as HTMLElement).nextElementSibling as HTMLElement)!.style.display = 'flex';
                            }}
                          />
                        ) : null}
                        <div className="w-full h-full flex items-center justify-center text-2xl bg-white rounded-2xl" style={{display: editFormData.image_url ? 'none' : 'flex'}}>
                          🏪
                        </div>
                      </div>
                      <div>
                        <label className="bg-primary text-primary-fg px-4 py-2 rounded-lg hover:bg-primary/90 transition-colors cursor-pointer flex items-center gap-2">
                          <Upload className="h-4 w-4" />
                          {isUploading ? 'Laster opp...' : 'Last opp bilde'}
                          <input
                            type="file"
                            accept="image/*"
                            onChange={handleImageUpload}
                            className="hidden"
                            disabled={isUploading}
                          />
                        </label>
                        <p className="text-xs text-muted-fg mt-1">JPG, PNG eller GIF (maks 5MB)</p>
                      </div>
                    </div>
                    
                    {/* Alternative: URL input */}
                    <div>
                      <label className="block text-xs font-medium mb-1 text-muted-fg">Eller lim inn bilde-URL:</label>
                      <input
                        type="url"
                        value={editFormData.image_url}
                        onChange={(e) => setEditFormData(prev => ({ ...prev, image_url: e.target.value }))}
                        className="w-full px-3 py-2 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/20 text-sm"
                        placeholder="https://example.com/bilde.jpg"
                      />
                    </div>
                  </div>
                </div>

                {/* Background Image */}
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium mb-2">Bakgrunnsbilde</label>
                  <div className="space-y-3">
                    <div className="flex items-center gap-4">
                      <div className="w-32 h-20 bg-white rounded-2xl flex items-center justify-center overflow-hidden border border-border">
                        {backgroundImageUrl ? (
                          <img 
                            src={backgroundImageUrl} 
                            alt="Background" 
                            className="w-full h-full object-cover rounded-2xl"
                            onError={(e) => {
                              (e.currentTarget as HTMLElement).style.display = 'none';
                              ((e.currentTarget as HTMLElement).nextElementSibling as HTMLElement)!.style.display = 'flex';
                            }}
                          />
                        ) : null}
                        <div className="w-full h-full flex items-center justify-center text-xl bg-white rounded-2xl" style={{display: backgroundImageUrl ? 'none' : 'flex'}}>
                          🖼️
                        </div>
                      </div>
                      <div>
                        <label className="bg-primary text-primary-fg px-4 py-2 rounded-lg hover:bg-primary/90 transition-colors cursor-pointer flex items-center gap-2">
                          <Upload className="h-4 w-4" />
                          {isUploadingBackground ? 'Laster opp...' : 'Last opp bakgrunnsbilde'}
                          <input
                            type="file"
                            accept="image/*"
                            onChange={handleBackgroundUpload}
                            className="hidden"
                            disabled={isUploadingBackground}
                          />
                        </label>
                        <p className="text-xs text-muted-fg mt-1">JPG, PNG eller GIF (maks 10MB)</p>
                      </div>
                    </div>
                    
                    {/* Alternative: URL input */}
                    <div>
                      <label className="block text-xs font-medium mb-1 text-muted-fg">Eller lim inn bakgrunnsbilde-URL:</label>
                      <input
                        type="url"
                        value={backgroundImageUrl}
                        onChange={(e) => {
                          setBackgroundImageUrl(e.target.value)
                        }}
                        onBlur={async (e) => {
                          const url = e.target.value.trim()
                          if (url && restaurant?.id) {
                            try {
                              const { error } = await supabase
                                .from('restaurants')
                                .update({ background_image_url: url })
                                .eq('id', restaurant.id)

                              if (error) {
                                console.error('Error updating background_image_url:', error)
                                toast.error('Kunne ikke lagre URL-en')
                              } else {
                                // Also save to localStorage as fallback
                                localStorage.setItem(`restaurant-background-${restaurant.id}`, url)
                                // Invalidate restaurant query to refresh data
                                queryClient.invalidateQueries({ queryKey: ['restaurant', restaurant.id] })
                              }
                            } catch (error) {
                              console.error('Error saving background URL:', error)
                            }
                          }
                        }}
                        className="w-full px-3 py-2 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/20 text-sm"
                        placeholder="https://example.com/bakgrunnsbilde.jpg"
                      />
                    </div>
                  </div>
                </div>

                {/* Complete Menu Upload */}
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium mb-2">Complete Menu (JSON)</label>
                  <div className="space-y-3">
                    <div className="flex items-center gap-4">
                      <div className="w-32 h-20 bg-white rounded-2xl flex items-center justify-center overflow-hidden border border-border">
                        <div className="text-center">
                          <div className="w-8 h-8 bg-primary/10 rounded-lg flex items-center justify-center mx-auto mb-2">
                            <FileText className="h-4 w-4 text-primary" />
                          </div>
                          <p className="text-xs text-muted-fg">JSON</p>
                        </div>
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => setShowMenuUploadModal(true)}
                            className="inline-flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors"
                          >
                            <Upload className="h-4 w-4" />
                            Upload Complete Menu
                          </button>
                          <button
                            onClick={handleDeleteMenu}
                            disabled={isDeletingMenu}
                            className="inline-flex items-center gap-2 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                          >
                            <Trash2 className="h-4 w-4" />
                            {isDeletingMenu ? 'Sletter...' : 'Slett meny'}
                          </button>
                        </div>
                        <p className="text-xs text-muted-fg mt-1">Upload a structured JSON menu with categories and items</p>
                      </div>
                    </div>
                    
                    <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                      <h4 className="text-sm font-medium text-blue-900 mb-2">Complete Menu Format</h4>
                      <p className="text-xs text-blue-800 mb-2">
                        Upload a comprehensive JSON menu that includes restaurant info, categories, and detailed item information.
                      </p>
                      <div className="text-xs text-blue-700">
                        <p>✅ Restaurant information and metadata</p>
                        <p>✅ Organized categories with items</p>
                        <p>✅ Detailed item descriptions and pricing</p>
                        <p>✅ Dietary information and allergens</p>
                        <p>✅ Item variants and special sections</p>
                      </div>
                    </div>
                  </div>
                </div>

                {/* JSON Menu Upload - Legacy format */}
                <div className="md:col-span-2" style={{display: 'none'}}>
                  <label className="block text-sm font-medium mb-2">Meny (JSON)</label>
                  <div className="space-y-3">
                    <div className="flex items-center gap-4">
                      <div className="w-32 h-20 bg-white rounded-2xl flex items-center justify-center overflow-hidden border border-border">
                        <div className="text-center">
                          <div className="w-8 h-8 bg-primary/10 rounded-lg flex items-center justify-center mx-auto mb-2">
                            <Upload className="h-4 w-4 text-primary" />
                          </div>
                          <p className="text-xs text-muted-fg">JSON</p>
                        </div>
                      </div>
                      <div className="flex-1">
                        <label className="inline-flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors cursor-pointer">
                          <Upload className="h-4 w-4" />
                          {isUploadingJsonMenu ? 'Laster opp...' : 'Last opp meny (JSON)'}
                          <input
                            type="file"
                            accept=".json,application/json"
                            onChange={handleJsonMenuUpload}
                            className="hidden"
                            disabled={isUploadingJsonMenu}
                          />
                        </label>
                        <p className="text-xs text-muted-fg mt-1">JSON (maks 5MB)</p>
                      </div>
                    </div>
                    
                    <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                      <h4 className="text-sm font-medium text-blue-900 mb-2">JSON Format Eksempler:</h4>
                      <div className="space-y-3">
                        <div>
                          <p className="text-xs font-medium text-blue-800 mb-1">Enkel array format:</p>
                          <pre className="text-xs text-blue-800 bg-blue-100 p-2 rounded overflow-x-auto">
{`[
  {
    "name": "Bruschetta",
    "description": "Fersk bruschetta med tomat og basilikum",
    "price": 129,
    "category": "Forretter",
    "dietary_info": ["vegetarian"],
    "image_url": "https://example.com/image.jpg"
  }
]`}
                          </pre>
                        </div>
                        <div>
                          <p className="text-xs font-medium text-blue-800 mb-1">Kategorier format (støttes også):</p>
                          <pre className="text-xs text-blue-800 bg-blue-100 p-2 rounded overflow-x-auto">
{`{
  "categories": [
    {
      "name": "BURGERS",
      "items": [
        {
          "name": "Classic Burger",
          "description": "Hamburger med ost og grønnsaker",
          "prices": { "burger": 169, "tallerken": 189 },
          "allergens": [1, 2, 3]
        }
      ]
    }
  ]
}`}
                          </pre>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Restaurant Name */}
                <div>
                  <label className="block text-sm font-medium mb-2">Restaurantnavn</label>
                  <input
                    type="text"
                    value={editFormData.name}
                    onChange={(e) => setEditFormData(prev => ({ ...prev, name: e.target.value }))}
                    className="w-full px-3 py-2 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/20"
                    placeholder="Navn på restaurant"
                  />
                </div>

                {/* Phone */}
                <div>
                  <label className="block text-sm font-medium mb-2">Telefon</label>
                  <input
                    type="tel"
                    value={editFormData.phone}
                    onChange={(e) => setEditFormData(prev => ({ ...prev, phone: e.target.value }))}
                    className="w-full px-3 py-2 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/20"
                    placeholder="Telefonnummer"
                  />
                </div>

                {/* Address */}
                <div>
                  <label className="block text-sm font-medium mb-2">Adresse</label>
                  <input
                    type="text"
                    value={editFormData.address}
                    onChange={(e) => setEditFormData(prev => ({ ...prev, address: e.target.value }))}
                    className="w-full px-3 py-2 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/20"
                    placeholder="Gateadresse"
                  />
                </div>

                {/* City */}
                <div>
                  <label className="block text-sm font-medium mb-2">By</label>
                  <input
                    type="text"
                    value={editFormData.city}
                    onChange={(e) => setEditFormData(prev => ({ ...prev, city: e.target.value }))}
                    className="w-full px-3 py-2 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/20"
                    placeholder="By"
                  />
                </div>

              {/* Set position on map */}
              <div className="md:col-span-2">
                <label className="block text-sm font-medium mb-2">Sett posisjon på kartet</label>
                <div className="rounded-xl overflow-hidden border border-border">
                  <PinPickerMap
                    position={editPosition || (restaurant?.lat && restaurant?.lng ? { lat: Number(restaurant.lat), lng: Number(restaurant.lng) } : { lat: 59.663, lng: 10.792 })}
                    onPick={(pos) => setEditPosition(pos)}
                  />
                </div>
                {editPosition && (
                  <p className="text-xs text-muted-fg mt-2">Valgt: {editPosition.lat.toFixed(6)}, {editPosition.lng.toFixed(6)}</p>
                )}
              </div>

                {/* Description */}
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium mb-2">Beskrivelse</label>
                  <textarea
                    value={editFormData.description}
                    onChange={(e) => setEditFormData(prev => ({ ...prev, description: e.target.value }))}
                    rows={3}
                    className="w-full px-3 py-2 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/20"
                    placeholder="Beskriv restauranten din..."
                  />
                </div>

                {/* Categories */}
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium mb-2">Kategorier</label>
                  <input
                    type="text"
                    value={editFormData.categories.join(', ')}
                    onChange={(e) => setEditFormData(prev => ({ ...prev, categories: e.target.value.split(',').map(cat => cat.trim()).filter(Boolean) }))}
                    className="w-full px-3 py-2 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/20"
                    placeholder="Pizza, Italiensk, Takeaway (skill med komma)"
                  />
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-2 gap-4 mb-6">
          <div className="bg-white rounded-2xl p-4 shadow-soft">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-blue-100 rounded-xl flex items-center justify-center">
                <TrendingUp className="h-5 w-5 text-blue-600" />
              </div>
              <div>
                <p className="text-2xl font-bold">{stats.activeDeals}</p>
                <p className="text-sm text-muted-fg">Aktive tilbud</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-2xl p-4 shadow-soft">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-orange-100 rounded-xl flex items-center justify-center">
                <Star className="h-5 w-5 text-orange-600" />
              </div>
              <div>
                <p className="text-2xl font-bold">{stats.totalDeals}</p>
                <p className="text-sm text-muted-fg">Totale tilbud</p>
              </div>
            </div>
          </div>
        </div>

        {/* Deals Section */}
        <div className="bg-white rounded-2xl shadow-soft">
          <div className="p-6 border-b border-border">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold">Mine tilbud</h3>
              <button
                onClick={() => navigate('/business/create-deal')}
                className="bg-primary text-primary-fg px-4 py-2 rounded-xl hover:bg-primary/90 transition-colors flex items-center gap-2"
              >
                <Plus className="h-4 w-4" />
                Opprett tilbud
              </button>
            </div>
          </div>

          <div className="p-6">
            {dealsLoading ? (
              <div className="space-y-4">
                {Array.from({ length: 3 }).map((_, i) => (
                  <div key={i} className="animate-pulse">
                    <div className="h-4 bg-muted rounded w-3/4 mb-2"></div>
                    <div className="h-3 bg-muted rounded w-1/2"></div>
                  </div>
                ))}
              </div>
            ) : deals.length === 0 ? (
              <div className="text-center py-12">
                <div className="text-6xl mb-4">🎯</div>
                <h4 className="text-lg font-semibold mb-2">Ingen tilbud ennå</h4>
                <p className="text-muted-fg mb-6">Opprett ditt første tilbud for å tiltrekke kunder</p>
                <button
                  onClick={() => navigate('/business/create-deal')}
                  className="bg-primary text-primary-fg px-6 py-3 rounded-xl hover:bg-primary/90 transition-colors"
                >
                  Opprett tilbud
                </button>
              </div>
            ) : (
              <div className="space-y-4">
                {deals.map((deal) => (
                  <div key={deal.id} className="bg-white border-2 border-gray-300 rounded-2xl shadow-lg p-6 hover:shadow-xl transition-shadow">
                    {/* First Row: Title and Status */}
                    <div className="mb-3">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                        <h4 className="text-lg font-bold text-gray-900">{deal.title}</h4>
                        <span className={`px-3 py-1 rounded-full text-xs font-semibold ${
                          deal.is_active 
                            ? 'bg-green-100 text-green-700 ring-2 ring-green-200' 
                            : 'bg-gray-100 text-gray-600 ring-2 ring-gray-200'
                        }`}>
                            {deal.is_active ? 'Aktiv' : 'Inaktiv'}
                        </span>
                        </div>
                        <button
                          onClick={() => deleteDeal(deal.id, deal.title)}
                          className="p-2 hover:bg-red-50 rounded-lg transition-colors text-red-600 hover:text-red-700"
                          title="Slett tilbud"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    </div>

                    {/* Second Row: Discount and Deaktiver */}
                    <div className="flex items-center justify-between mb-4">
                      <span className="inline-flex items-center px-3 py-1.5 bg-red-50 text-red-700 rounded-lg text-sm font-semibold border-2 border-red-200">
                        🎉 {deal.discount_percentage}% rabatt
                      </span>
                      <button
                        onClick={() => toggleDealStatus(deal.id, !deal.is_active)}
                        className={`px-3 py-1 rounded-lg text-sm transition-colors ${
                          deal.is_active
                            ? 'bg-red-100 text-red-700 hover:bg-red-200'
                            : 'bg-green-100 text-green-700 hover:bg-green-200'
                        }`}
                      >
                        {deal.is_active ? 'Deaktiver' : 'Aktiver'}
                      </button>
                    </div>

                    {/* Content Section */}
                    <div>
                        <p className="text-gray-600 text-sm mb-3">{deal.description}</p>
                        
                        <div className="flex items-center gap-4 text-sm text-muted-fg">
                          <div className="flex items-center gap-1">
                            <Clock className="h-4 w-4" />
                            {formatTime(deal.start_time)} - {formatTime(deal.end_time)}
                          </div>
                        </div>

                        {/* Verification Code */}
                        {deal.verification_code && (
                          <div className="mt-4 p-4 bg-gradient-to-r from-primary/5 to-primary/10 rounded-xl border-2 border-primary/20">
                            <div className="flex items-center justify-between">
                              <div className="flex items-center gap-2">
                                <Shield className="h-4 w-4 text-primary" />
                                <span className="text-sm font-semibold text-gray-900">Verifikasjonskode</span>
                              </div>
                              <button
                                onClick={() => copyToClipboard(deal.verification_code)}
                                className="flex items-center gap-2 px-3 py-1.5 bg-white border-2 border-primary/30 text-primary rounded-lg hover:bg-primary hover:text-white transition-colors text-sm font-medium"
                              >
                                <Copy className="h-3 w-3" />
                                Kopier
                              </button>
                            </div>
                            <div className="mt-2">
                              <div className="bg-white rounded-lg p-4 border-2 border-primary/20">
                                <div className="text-2xl font-mono font-bold tracking-wider text-primary text-center">
                                  {deal.verification_code}
                                </div>
                                <p className="text-xs text-gray-500 text-center mt-2">
                                  Kunder viser denne koden når de henter tilbudet
                                </p>
                              </div>
                            </div>
                          </div>
                        )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Menu Upload Modal */}
      {restaurant && (
        <MenuUploadModal
          isOpen={showMenuUploadModal}
          onClose={() => setShowMenuUploadModal(false)}
          onMenuUploaded={handleCompleteMenuUpload}
          restaurantId={restaurant.id}
        />
      )}

      {/* Add Location Modal */}
      <AddLocationModal
        isOpen={showAddLocationModal}
        onClose={() => setShowAddLocationModal(false)}
        onSuccess={() => {
          // Redirect to restaurant selection page after adding location
          navigate('/business/select')
        }}
      />
    </div>
  )
}

// Small Leaflet map that lets user click to choose a coordinate
function PinPickerMap({ position, onPick }: { position: { lat: number; lng: number }; onPick: (pos: { lat: number; lng: number }) => void }) {
  const markerIcon = L.icon({
    iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
    shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
    iconSize: [25, 41],
    iconAnchor: [12, 41],
  })

  function ClickHandler() {
    useMapEvents({
      click(e) {
        onPick({ lat: e.latlng.lat, lng: e.latlng.lng })
      },
    })
    return null
  }

  return (
    <MapContainer center={[position.lat, position.lng]} zoom={16} style={{ height: 260, width: '100%' }} scrollWheelZoom={false}>
      <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" attribution="&copy; OpenStreetMap contributors" />
      <Marker position={[position.lat, position.lng]} icon={markerIcon} />
      <ClickHandler />
    </MapContainer>
  )
}
