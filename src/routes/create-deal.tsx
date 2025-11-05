import React, { useState, useEffect } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { ArrowLeft, Upload, Clock, Users, DollarSign, Calendar, ChefHat, TrendingUp, Target, Plus } from 'lucide-react'
import { supabase } from '@/lib/supabase'
import { toast } from 'sonner'
import { DishSelectionModal } from '@/components/DishSelectionModal'
import { MenuItem } from '@/lib/database.types'
import { formatPrice } from '@/lib/utils'

// Generate unique verification code
const generateVerificationCode = (): string => {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789'
  let code = ''
  for (let i = 0; i < 6; i++) {
    code += chars.charAt(Math.floor(Math.random() * chars.length))
  }
  return code
}

// MenuItem interface is now imported from database.types

interface DealFormData {
  selectedMenuItem: MenuItem | null
  title: string
  description: string
  imageUrl: string
  originalPrice: number
  discountPercentage: number
  selectedPriceTiers: string[] // Array of selected tiers: ['student', 'ansatt']
  availableFor: string[]
  dietaryInfo: string[]
  availableDays: string[]
  startTime: string
  endTime: string
  perUserLimit: number
  totalLimit: number | null
}

interface Prediction {
  expectedCustomers: number
  expectedRevenue: number
  breakEvenPoint: number
  profitMargin: number
}

const serviceTypes = [
  { id: 'dine_in', label: 'Spise på stedet', icon: '🍽️' },
  { id: 'takeaway', label: 'Takeaway', icon: '🥡' }
]

const dietaryOptions = [
  'Vegetarisk', 'Vegansk', 'Glutenfri', 'Laktosefri', 'Halal', 'Kosher'
]

const daysOfWeek = [
  { id: 'monday', label: 'Man' },
  { id: 'tuesday', label: 'Tir' },
  { id: 'wednesday', label: 'Ons' },
  { id: 'thursday', label: 'Tor' },
  { id: 'friday', label: 'Fre' },
  { id: 'saturday', label: 'Lør' },
  { id: 'sunday', label: 'Søn' }
]

export function CreateDealPage() {
  const navigate = useNavigate()
  const location = useLocation()
  // If an edit id is present, we will load the deal and prefill the form
  const params = new URLSearchParams(location.search)
  const editId = params.get('edit')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isUploadingImage, setIsUploadingImage] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const [showDishSelection, setShowDishSelection] = useState(false)
  const [formData, setFormData] = useState<DealFormData>({
    selectedMenuItem: null,
    title: '',
    description: '',
    imageUrl: '',
    originalPrice: 0,
    discountPercentage: 20,
    selectedPriceTiers: [], // Will be populated when menu item is selected
    availableFor: ['dine_in'],
    dietaryInfo: [],
    availableDays: ['monday', 'tuesday', 'wednesday', 'thursday', 'friday'],
    startTime: '11:00',
    endTime: '15:00',
    perUserLimit: 1,
    totalLimit: null
  })

  // Fetch restaurant owned by current user (respect activeRestaurantId selection)
  const { data: restaurant, refetch: refetchRestaurant } = useQuery({
    queryKey: ['owned-restaurant'],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error('Not authenticated')

      // If a specific restaurant was selected earlier, use that
      const activeId = localStorage.getItem('activeRestaurantId')
      if (activeId) {
        const { data, error } = await supabase
          .from('restaurants')
          .select('*')
          .eq('id', activeId)
          .single()
        if (error) throw error
        return data
      }

      // Otherwise, find by owner_id
      let { data, error } = await supabase
        .from('restaurants')
        .select('*')
        .eq('owner_id', user.id)
        .single()

      if (error) throw error
      return data
    },
  })

  // Refresh restaurant data when component mounts
  React.useEffect(() => {
    if (refetchRestaurant) {
      refetchRestaurant()
    }
  }, [refetchRestaurant])

  // Handle dish selection from modal
  const handleDishSelect = (dish: MenuItem) => {
    const tiers: any[] = (dish as any).price_tiers || []
    const studentTier = tiers.find(t => (t.type || t.label) === 'student')
    const ansattTier = tiers.find(t => (t.type || t.label) === 'ansatt')
    const initialPrice = dish.price && dish.price > 0
      ? Math.round(dish.price / 100)
      : studentTier?.amount_ore != null
        ? Math.round(studentTier.amount_ore / 100)
        : ansattTier?.amount_ore != null
          ? Math.round(ansattTier.amount_ore / 100)
          : 0

    // Auto-select both tiers if available
    const availableTiers: string[] = []
    if (studentTier) availableTiers.push('student')
    if (ansattTier) availableTiers.push('ansatt')

    setFormData(prev => ({
      ...prev,
      selectedMenuItem: dish,
      title: dish.name,
      description: dish.description || '',
      // Prefill from item price or tiers; can still be overridden
      originalPrice: initialPrice,
      selectedPriceTiers: availableTiers, // Auto-select both if available
      dietaryInfo: dish.dietary_info || []
    }))
  }

  // Prediction state
  const [prediction, setPrediction] = useState<Prediction | null>(null)

  // Calculate prediction based on deal parameters
  const calculatePrediction = (menuItem: MenuItem, discountPercentage: number, serviceTypes: string[], timeSlot: string): Prediction => {
    // Use total limit as expected customers, or default calculation if no limit set
    const expectedCustomers = formData.totalLimit || 8 // default to 8 if no limit
    
    // Calculate revenue based on the total limit (or expected customers)
    const discountedPrice = menuItem.price * (1 - discountPercentage / 100)
    const expectedRevenue = expectedCustomers * discountedPrice
    
    // Calculate break-even (how many customers needed to cover costs)
    const breakEvenPoint = Math.ceil(menuItem.price * 0.7 / discountedPrice) // assuming 70% cost
    
    // Profit margin
    const profitMargin = ((discountedPrice - menuItem.price * 0.7) / discountedPrice) * 100
    
    return {
      expectedCustomers,
      expectedRevenue: Math.round(expectedRevenue),
      breakEvenPoint,
      profitMargin: Math.round(profitMargin)
    }
  }


  // Update prediction when relevant form data changes
  useEffect(() => {
    if (formData.selectedMenuItem && formData.discountPercentage > 0) {
      const newPrediction = calculatePrediction(
        formData.selectedMenuItem,
        formData.discountPercentage,
        formData.availableFor,
        `${formData.startTime}-${formData.endTime}`
      )
      setPrediction(newPrediction)
    } else {
      setPrediction(null)
    }
  }, [formData.selectedMenuItem, formData.discountPercentage, formData.availableFor, formData.startTime, formData.endTime, formData.totalLimit])

  const updateFormData = (field: keyof DealFormData, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }))
  }

  const toggleArrayValue = (field: keyof DealFormData, value: string) => {
    setFormData(prev => ({
      ...prev,
      [field]: (prev[field] as string[]).includes(value)
        ? (prev[field] as string[]).filter(item => item !== value)
        : [...(prev[field] as string[]), value]
    }))
  }

  const handleImageUpload = async (file: File) => {
    if (!file) return
    
    // Validate file type
    if (!file.type.startsWith('image/')) {
      toast.error('Vennligst velg en bildefil')
      return
    }
    
    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      toast.error('Bildet er for stort. Maksimal størrelse er 5MB.')
      return
    }
    
    setIsUploadingImage(true)
    
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error('Not authenticated')
      
      // Generate unique filename
      const fileExt = file.name.split('.').pop()
      const fileName = `${user.id}/${Date.now()}.${fileExt}`
      
      // Upload to Supabase Storage
      const { data, error } = await supabase.storage
        .from('restaurant-images')
        .upload(fileName, file)
      
      if (error) throw error
      
      // Get public URL
      const { data: { publicUrl } } = supabase.storage
        .from('restaurant-images')
        .getPublicUrl(fileName)
      
      // Update form data with image URL
      setFormData(prev => ({ ...prev, imageUrl: publicUrl }))
      toast.success('Bilde lastet opp!')
      
    } catch (error: any) {
      console.error('Error uploading image:', error)
      toast.error('Kunne ikke laste opp bildet. Prøv igjen.')
    } finally {
      setIsUploadingImage(false)
    }
  }

  const calculateFinalPrice = () => {
    return Math.round(formData.originalPrice * (1 - formData.discountPercentage / 100))
  }

  const calculateSavings = () => {
    return formData.originalPrice - calculateFinalPrice()
  }

  const validateForm = (): boolean => {
    if (!formData.selectedMenuItem) {
      toast.error('Velg en rett fra menyen')
      return false
    }
    if (!formData.title.trim()) {
      toast.error('Tittel er påkrevd')
      return false
    }
    if (!formData.description.trim()) {
      toast.error('Beskrivelse er påkrevd')
      return false
    }
    // If menu item has price_tiers, require at least one tier selected
    if ((formData.selectedMenuItem as any)?.price_tiers && formData.selectedPriceTiers.length === 0) {
      toast.error('Velg minst én pris (Student eller Ansatt)')
      return false
    }
    // If no price_tiers, require originalPrice
    if (!(formData.selectedMenuItem as any)?.price_tiers && formData.originalPrice <= 0) {
      toast.error('Opprinnelig pris må være større enn 0')
      return false
    }
    if (formData.discountPercentage < 1 || formData.discountPercentage > 90) {
      toast.error('Rabatt må være mellom 1% og 90%')
      return false
    }
    if (formData.availableFor.length === 0) {
      toast.error('Velg minst en servicetype')
      return false
    }
    if (formData.availableDays.length === 0) {
      toast.error('Velg minst en dag')
      return false
    }
    if (!formData.startTime || !formData.endTime) {
      toast.error('Tidspunkt er påkrevd')
      return false
    }
    if (formData.startTime >= formData.endTime) {
      toast.error('Slutttid må være etter starttid')
      return false
    }
    return true
  }

  const submitDeal = async () => {
    if (!validateForm() || !restaurant) return

    setIsSubmitting(true)
    
    try {
      console.log('🔄 Starting deal creation...')
      console.log('🏪 Restaurant:', restaurant)
      
      const finalPrice = calculateFinalPrice()
      const verificationCode = generateVerificationCode()
      
      const dealData = {
        restaurant_id: restaurant.id,
        title: formData.title,
        description: formData.description,
        image_url: formData.imageUrl || null,
        original_price: Math.round(formData.originalPrice * 100), // Convert to øre
        discount_percentage: formData.discountPercentage,
        // Don't send final_price - let database calculate it
        available_for: formData.availableFor,
        dietary_info: formData.dietaryInfo,
        available_days: formData.availableDays,
        start_time: formData.startTime,
        end_time: formData.endTime,
        per_user_limit: formData.perUserLimit,
        total_limit: formData.totalLimit,
        verification_code: verificationCode,
        menu_item_id: formData.selectedMenuItem?.id || null, // Store menu item reference for price_tiers
        selected_price_tiers: formData.selectedPriceTiers.length > 0 ? formData.selectedPriceTiers : null, // Store selected tiers
        is_active: true
      }
      
      console.log('📝 Deal data:', dealData)

      let data: any = null
      let error: any = null
      if (editId) {
        // Update existing deal
        const { error: updError } = await supabase
          .from('deals')
          .update({
            title: formData.title,
            description: formData.description,
            image_url: formData.imageUrl || null,
            original_price: Math.round(formData.originalPrice * 100),
            discount_percentage: formData.discountPercentage,
            available_for: formData.availableFor,
            dietary_info: formData.dietaryInfo,
            available_days: formData.availableDays,
            start_time: formData.startTime,
            end_time: formData.endTime,
            per_user_limit: formData.perUserLimit,
            total_limit: formData.totalLimit,
            menu_item_id: formData.selectedMenuItem?.id || null,
            selected_price_tiers: formData.selectedPriceTiers.length > 0 ? formData.selectedPriceTiers : null,
            is_active: true
          })
          .eq('id', editId)
        error = updError
      } else {
        const resp = await supabase
          .from('deals')
          .insert(dealData)
          .select()
        data = resp.data
        error = resp.error
      }

      console.log('📊 Supabase response:', { data, error })

      if (error) {
        console.error('❌ Supabase error details:', error)
        throw error
      }

      console.log('✅ Deal saved successfully!')
      toast.success(editId ? 'Tilbud oppdatert! 🎉' : `Tilbud opprettet! 🎉\nVerifikasjonskode: ${verificationCode}\nKunder vil vise denne koden når de innløser tilbudet.`, {
        duration: 8000,
      })
      navigate('/business/dashboard')
      
    } catch (error: any) {
      console.error('❌ Error creating deal:', error)
      
      // More detailed error messages
      if (error?.code === 'PGRST116') {
        toast.error('Tabellen deals finnes ikke. Kontakt administrator.')
      } else if (error?.code === '42P01') {
        toast.error('Database tabeller mangler. Kjør database schema først.')
      } else if (error?.code === '23503') {
        toast.error('Ugyldig restaurant ID. Prøv å logge ut og inn igjen.')
      } else if (error?.message?.includes('permission')) {
        toast.error('Ikke tilgang til å opprette tilbud. Sjekk database permissions.')
      } else if (error?.message?.includes('RLS')) {
        toast.error('Row Level Security blokkerer tilbudet. Sjekk RLS-regler.')
      } else {
        toast.error(`Kunne ikke opprette tilbud: ${error?.message || 'Ukjent feil'}`)
      }
    } finally {
      setIsSubmitting(false)
    }
  }

  if (!restaurant) {
    return (
      <div className="min-h-screen bg-bg flex items-center justify-center">
        <div className="text-center">
          <div className="text-6xl mb-4">🏪</div>
          <h2 className="text-xl font-bold mb-2">Restaurant ikke funnet</h2>
          <p className="text-muted-fg">Du må først registrere en restaurant.</p>
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
              onClick={() => navigate('/business/dashboard')}
              className="p-2 hover:bg-muted rounded-full transition-colors"
            >
              <ArrowLeft className="h-5 w-5" />
            </button>
            <div>
              <h1 className="text-xl font-bold">Opprett nytt tilbud</h1>
              <p className="text-sm text-muted-fg">{restaurant.name}</p>
            </div>
          </div>
          <button
            onClick={() => navigate('/')}
            className="text-muted-fg hover:text-primary px-3 py-2 rounded-lg transition-colors"
          >
            Til markedsplassen
          </button>
        </div>
      </div>

      <div className="max-w-2xl mx-auto px-4 py-6">
        <div className="space-y-8">
          {/* Menu Selection */}
          <div className="bg-white rounded-2xl p-6 shadow-soft">
            {!formData.selectedMenuItem ? (
              <div className="text-center py-8">
                <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4">
                  <ChefHat className="w-8 h-8 text-primary" />
                </div>
                <h3 className="text-lg font-medium text-gray-900 mb-2">Velg en rett fra menyen</h3>
                <p className="text-gray-600 mb-6">Klikk på knappen under for å søke og velge en rett fra din meny</p>
                <button
                  onClick={() => setShowDishSelection(true)}
                  className="inline-flex items-center gap-2 px-6 py-3 bg-primary text-white rounded-xl hover:bg-primary/90 transition-colors font-medium"
                >
                  <Plus className="w-5 h-5" />
                  Velg rett fra meny
                </button>
              </div>
            ) : (
              <div className="space-y-4">
                {/* Selected Item Preview */}
                <div className="p-4 bg-primary/5 border border-primary/20 rounded-xl">
                  <h3 className="font-medium text-primary mb-2">Valgt rett:</h3>
                  <div className="flex items-center justify-between">
                    <div>
                      <h4 className="font-medium">{formData.selectedMenuItem.name}</h4>
                      <p className="text-sm text-muted-fg">{formData.selectedMenuItem.description}</p>
                      <span className="text-sm font-semibold">
                        {formData.selectedMenuItem.price && formData.selectedMenuItem.price > 0
                          ? formatPrice(formData.selectedMenuItem.price)
                          : 'Mangler pris – sett under'}
                      </span>
                    </div>
                    <div className="flex gap-2">
                      <button
                        onClick={() => setShowDishSelection(true)}
                        className="px-3 py-1 text-sm bg-primary text-white rounded-lg hover:bg-primary/90 transition-colors"
                      >
                        Endre
                      </button>
                      <button
                        onClick={() => setFormData(prev => ({ ...prev, selectedMenuItem: null, title: '', description: '', originalPrice: 0, imageUrl: '', dietaryInfo: [], selectedPriceTiers: [] }))}
                        className="px-3 py-1 text-sm text-danger hover:text-danger/80"
                      >
                        Fjern
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Deal Customization */}
          {formData.selectedMenuItem && (
            <div className="bg-white rounded-2xl p-6 shadow-soft">
              <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
                ✏️ Tilpass tilbudet ditt
              </h2>
              
              <div className="space-y-4">
                {/* Title */}
                <div>
                  <label className="block text-sm font-medium mb-2">Tilbudstittel *</label>
                  <input
                    type="text"
                    value={formData.title}
                    onChange={(e) => updateFormData('title', e.target.value)}
                    placeholder="f.eks. Dagens spesial - 30% rabatt"
                    className="w-full px-4 py-3 border border-border rounded-xl focus:ring-2 focus:ring-primary focus:border-transparent"
                  />
                </div>

                {/* Description */}
                <div>
                  <label className="block text-sm font-medium mb-2">Beskrivelse *</label>
                  <textarea
                    value={formData.description}
                    onChange={(e) => updateFormData('description', e.target.value)}
                    placeholder="Beskriv hva som gjør dette tilbudet spesielt..."
                    rows={3}
                    className="w-full px-4 py-3 border border-border rounded-xl focus:ring-2 focus:ring-primary focus:border-transparent resize-none"
                  />
                </div>

                {/* Image Upload */}
                <div>
                  <label className="block text-sm font-medium mb-2">Bilde av retten</label>
                  
                  {formData.imageUrl ? (
                    <div className="relative">
                      <img
                        src={formData.imageUrl}
                        alt="Deal preview"
                        className="w-full h-48 object-contain bg-gray-50 rounded-xl border border-border"
                      />
                      <button
                        onClick={() => setFormData(prev => ({ ...prev, imageUrl: '' }))}
                        className="absolute top-2 right-2 bg-red-500 text-white p-1 rounded-full hover:bg-red-600 transition-colors"
                      >
                        <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                      </button>
                    </div>
                  ) : (
                    <div className="border-2 border-dashed border-border rounded-xl p-8 text-center hover:border-primary transition-colors">
                      <input
                        type="file"
                        accept="image/*"
                        onChange={(e) => {
                          const file = e.target.files?.[0]
                          if (file) handleImageUpload(file)
                        }}
                        className="hidden"
                        id="image-upload"
                      />
                      <label
                        htmlFor="image-upload"
                        className={`cursor-pointer flex flex-col items-center gap-2 ${
                          isUploadingImage ? 'pointer-events-none opacity-50' : ''
                        }`}
                      >
                        {isUploadingImage ? (
                          <div className="animate-spin rounded-full h-8 w-8 border-2 border-primary border-t-transparent" />
                        ) : (
                          <Upload className="h-8 w-8 text-muted-fg" />
                        )}
                        <div>
                          <p className="font-medium text-primary">
                            {isUploadingImage ? 'Laster opp...' : 'Klikk for å laste opp bilde'}
                          </p>
                          <p className="text-sm text-muted-fg">PNG, JPG opptil 5MB</p>
                        </div>
                      </label>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* Pricing */}
          <div className="bg-white rounded-2xl p-6 shadow-soft">
            <h2 className="text-lg font-semibold mb-4">Prissetting</h2>
            
            {/* Price tier selector (if available) - Allow selecting both */}
            {formData.selectedMenuItem && (formData.selectedMenuItem as any)?.price_tiers && (
              <div className="mb-4">
                <label className="block text-sm font-medium mb-2">Velg priser (kan velge begge)</label>
                <div className="flex gap-3">
                  {((formData.selectedMenuItem as any).price_tiers as any[]).map((tier, idx) => {
                    const tierType = tier.type === 'student' ? 'student' : tier.type === 'ansatt' ? 'ansatt' : tier.type
                    const isSelected = formData.selectedPriceTiers.includes(tierType)
                    return (
                      <label
                        key={idx}
                        className={`flex items-center gap-2 px-4 py-2 rounded-lg border-2 cursor-pointer transition-colors ${
                          isSelected
                            ? 'bg-primary text-primary-fg border-primary'
                            : 'bg-white border-border hover:border-primary'
                        }`}
                      >
                        <input
                          type="checkbox"
                          checked={isSelected}
                          onChange={(e) => {
                            const newTiers = e.target.checked
                              ? [...formData.selectedPriceTiers, tierType]
                              : formData.selectedPriceTiers.filter(t => t !== tierType)
                            updateFormData('selectedPriceTiers', newTiers)
                            // Update originalPrice to first selected tier's price
                            if (newTiers.length > 0 && e.target.checked) {
                              const firstTier = ((formData.selectedMenuItem as any).price_tiers as any[]).find(
                                t => (t.type || t.label) === newTiers[0]
                              )
                              if (firstTier) {
                                updateFormData('originalPrice', Math.round((firstTier.amount_ore || 0) / 100))
                              }
                            }
                          }}
                          className="w-4 h-4 rounded border-2 border-current"
                        />
                        <span className="font-medium">
                          {tier.type === 'student' ? 'Student' : tier.type === 'ansatt' ? 'Ansatt' : tier.type}
                        </span>
                        {tier.amount_ore != null && (
                          <span className="text-sm opacity-80">{Math.round(tier.amount_ore / 100)} kr</span>
                        )}
                      </label>
                    )
                  })}
                </div>
                {formData.selectedPriceTiers.length === 0 && (
                  <p className="text-xs text-danger mt-2">Velg minst én pris</p>
                )}
              </div>
            )}

            <div className="grid grid-cols-2 gap-4 mb-4">
              <div>
                <label className="block text-sm font-medium mb-2">Opprinnelig pris (kr) *</label>
                <input
                  type="number"
                  value={formData.originalPrice || ''}
                  onChange={(e) => updateFormData('originalPrice', parseFloat(e.target.value) || 0)}
                  placeholder={formData.selectedMenuItem && formData.selectedMenuItem.price > 0 ? `${Math.round(formData.selectedMenuItem.price/100)}` : 'Skriv inn pris'}
                  min="1"
                  className="w-full px-4 py-3 border border-border rounded-xl focus:ring-2 focus:ring-primary focus:border-transparent"
                />
                {formData.selectedMenuItem && (!formData.selectedMenuItem.price || formData.selectedMenuItem.price === 0) && (
                  <p className="text-xs text-muted-fg mt-1">Denne retten har ikke pris i menyen. Skriv inn prisen her.</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">Rabatt (%) *</label>
                <input
                  type="number"
                  value={formData.discountPercentage}
                  onChange={(e) => updateFormData('discountPercentage', parseInt(e.target.value) || 0)}
                  min="1"
                  max="90"
                  className="w-full px-4 py-3 border border-border rounded-xl focus:ring-2 focus:ring-primary focus:border-transparent"
                />
              </div>
            </div>

            {/* Price preview - show both selected tiers if available */}
            {formData.selectedMenuItem && (formData.selectedMenuItem as any)?.price_tiers && formData.selectedPriceTiers.length > 0 ? (
              <div className="bg-success/10 border border-success/20 rounded-xl p-4 space-y-3">
                <p className="font-medium text-success mb-2">Pris etter rabatt:</p>
                {formData.selectedPriceTiers.map((tierType) => {
                  const tier = ((formData.selectedMenuItem as any).price_tiers as any[]).find(
                    (t: any) => t.type === tierType
                  )
                  if (!tier) return null
                  const originalPriceKr = Math.round((tier.amount_ore || 0) / 100)
                  const finalPriceKr = Math.round(originalPriceKr * (1 - formData.discountPercentage / 100))
                  const savings = originalPriceKr - finalPriceKr
                  return (
                    <div key={tierType} className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium text-gray-700">
                          {tierType === 'student' ? 'Student' : 'Ansatt'}:
                        </p>
                        <p className="text-xl font-bold text-success">{finalPriceKr} kr</p>
                      </div>
                      <div className="text-right">
                        <p className="text-xs text-gray-500 line-through">{originalPriceKr} kr</p>
                        <p className="text-sm font-semibold text-success">Spar {savings} kr</p>
                      </div>
                    </div>
                  )
                })}
              </div>
            ) : formData.originalPrice > 0 ? (
              <div className="bg-success/10 border border-success/20 rounded-xl p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium text-success">Pris etter rabatt</p>
                    <p className="text-2xl font-bold text-success">{calculateFinalPrice()} kr</p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm text-muted-fg">Kunde sparer</p>
                    <p className="text-lg font-semibold text-success">{calculateSavings()} kr</p>
                  </div>
                </div>
              </div>
            ) : null}
          </div>

          {/* Service Types */}
          <div className="bg-white rounded-2xl p-6 shadow-soft">
            <h2 className="text-lg font-semibold mb-4">Servicetype *</h2>
            
            <div className="grid grid-cols-2 gap-3">
              {serviceTypes.map((service) => (
                <button
                  key={service.id}
                  onClick={() => toggleArrayValue('availableFor', service.id)}
                  className={`p-4 rounded-xl border transition-all ${
                    formData.availableFor.includes(service.id)
                      ? 'bg-primary text-primary-fg border-primary'
                      : 'bg-white border-border hover:border-primary'
                  }`}
                >
                  <div className="text-2xl mb-2">{service.icon}</div>
                  <div className="font-medium">{service.label}</div>
                </button>
              ))}
            </div>
          </div>

          {/* Dietary Information */}
          <div className="bg-white rounded-2xl p-6 shadow-soft">
            <h2 className="text-lg font-semibold mb-4">Kostinformasjon</h2>
            
            <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
              {dietaryOptions.map((option) => (
                <button
                  key={option}
                  onClick={() => toggleArrayValue('dietaryInfo', option)}
                  className={`p-3 rounded-xl border transition-all ${
                    formData.dietaryInfo.includes(option)
                      ? 'bg-primary text-primary-fg border-primary'
                      : 'bg-white border-border hover:border-primary'
                  }`}
                >
                  {option}
                </button>
              ))}
            </div>
          </div>

          {/* Availability */}
          <div className="bg-white rounded-2xl p-6 shadow-soft">
            <h2 className="text-lg font-semibold mb-4">Tilgjengelighet</h2>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-3">Dager *</label>
                <div className="flex flex-wrap gap-2">
                  {daysOfWeek.map((day) => (
                    <button
                      key={day.id}
                      onClick={() => toggleArrayValue('availableDays', day.id)}
                      className={`px-4 py-2 rounded-xl border transition-all ${
                        formData.availableDays.includes(day.id)
                          ? 'bg-primary text-primary-fg border-primary'
                          : 'bg-white border-border hover:border-primary'
                      }`}
                    >
                      {day.label}
                    </button>
                  ))}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-2">Fra tid *</label>
                  <input
                    type="time"
                    value={formData.startTime}
                    onChange={(e) => updateFormData('startTime', e.target.value)}
                    className="w-full px-4 py-3 border border-border rounded-xl focus:ring-2 focus:ring-primary focus:border-transparent"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2">Til tid *</label>
                  <input
                    type="time"
                    value={formData.endTime}
                    onChange={(e) => updateFormData('endTime', e.target.value)}
                    className="w-full px-4 py-3 border border-border rounded-xl focus:ring-2 focus:ring-primary focus:border-transparent"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Limits */}
          <div className="bg-white rounded-2xl p-6 shadow-soft">
            <h2 className="text-lg font-semibold mb-4">Begrensninger</h2>
            
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium mb-2">Kunde-begrensning *</label>
                <input
                  type="number"
                  value={formData.perUserLimit}
                  onChange={(e) => updateFormData('perUserLimit', parseInt(e.target.value) || 1)}
                  min="1"
                  max="10"
                  className="w-full px-4 py-3 border border-border rounded-xl focus:ring-2 focus:ring-primary focus:border-transparent"
                />
                <p className="text-xs text-muted-fg mt-1">
                  Hvor mange ganger kan en kunde bruke tilbudet?
                </p>
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">Total grense</label>
                <input
                  type="number"
                  value={formData.totalLimit || ''}
                  onChange={(e) => updateFormData('totalLimit', e.target.value ? parseInt(e.target.value) : null)}
                  placeholder="Ingen grense"
                  min="1"
                  className="w-full px-4 py-3 border border-border rounded-xl focus:ring-2 focus:ring-primary focus:border-transparent"
                />
                <p className="text-xs text-muted-fg mt-1">
                  La stå tom for ubegrenset
                </p>
              </div>
            </div>
          </div>

          {/* Prediction Panel */}
          {prediction && (
            <div className="bg-gradient-to-r from-success/5 to-primary/5 rounded-2xl p-6 border border-success/20">
              <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
                <TrendingUp className="h-5 w-5 text-success" />
                Prediksjon for tilbudet
              </h2>
              
              <div className="grid grid-cols-2 gap-4">
                <div className="bg-white/50 rounded-xl p-4">
                  <div className="flex items-center gap-2 mb-2">
                    <Users className="h-4 w-4 text-primary" />
                    <span className="text-sm font-medium">Forventede kunder</span>
                  </div>
                  <div className="text-2xl font-bold text-primary">
                    {formData.totalLimit || prediction.expectedCustomers}
                  </div>
                  <div className="text-xs text-muted-fg">
                    Basert på {formData.discountPercentage}% rabatt
                  </div>
                </div>
                
                <div className="bg-white/50 rounded-xl p-4">
                  <div className="flex items-center gap-2 mb-2">
                    <DollarSign className="h-4 w-4 text-success" />
                    <span className="text-sm font-medium">Forventet inntekt</span>
                  </div>
                  <div className="text-2xl font-bold text-success">
                    {Math.round(prediction.expectedRevenue / 100)} kr
                  </div>
                  <div className="text-xs text-muted-fg">
                    Etter {formData.discountPercentage}% rabatt
                  </div>
                </div>
              </div>
              
              <div className="mt-4 p-3 bg-info/10 rounded-lg border border-info/20">
                <p className="text-sm text-info-fg">
                  💡 <strong>Tips:</strong> Dette tilbudet ser lønnsomt ut!
                </p>
              </div>
            </div>
          )}

          {/* Submit Button */}
          <div className="flex justify-end">
            <button
              onClick={submitDeal}
              disabled={isSubmitting}
              className="bg-success text-white px-8 py-3 rounded-xl hover:bg-success/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isSubmitting ? 'Oppretter tilbud...' : 'Publiser tilbud'}
            </button>
          </div>
        </div>
      </div>

      {/* Dish Selection Modal */}
      {restaurant && (
        <DishSelectionModal
          isOpen={showDishSelection}
          onClose={() => setShowDishSelection(false)}
          onSelectDish={handleDishSelect}
          restaurantId={restaurant.id}
        />
      )}
    </div>
  )
}
