import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { ArrowLeft, MapPin, Clock, Building2, Phone, Mail, Globe, Loader } from 'lucide-react'
import { supabase } from '@/lib/supabase'
import { toast } from 'sonner'

// Geocoding function using OpenStreetMap Nominatim with optional Google fallback
const geocodeAddress = async (address: string, city: string, postalCode?: string): Promise<{lat: number, lng: number} | null> => {
  try {
    const fullAddress = `${address}, ${city}${postalCode ? `, ${postalCode}` : ''}, Norway`
    const encodedAddress = encodeURIComponent(fullAddress)
    
    console.log('🔍 Geocoding address:', fullAddress)
    
    const response = await fetch(
      `https://nominatim.openstreetmap.org/search?format=json&limit=1&q=${encodedAddress}&countrycodes=no`,
      {
        headers: {
          'User-Agent': 'Norwegian Restaurant Deals App'
        }
      }
    )
    
    if (!response.ok) {
      throw new Error('Geocoding request failed')
    }
    
    const data = await response.json()
    
    if (data && data.length > 0) {
      const location = {
        lat: parseFloat(data[0].lat),
        lng: parseFloat(data[0].lon)
      }
      console.log('✅ Geocoded location:', location)
      return location
    } else {
      console.log('❌ No geocoding results found from OSM')
      // Try Google Geocoding API if key is provided
      const googleKey = import.meta.env.VITE_GOOGLE_MAPS_API_KEY as string | undefined
      if (googleKey) {
        try {
          const gRes = await fetch(`https://maps.googleapis.com/maps/api/geocode/json?address=${encodedAddress}&key=${googleKey}`)
          const gData = await gRes.json()
          if (gData.status === 'OK' && gData.results && gData.results[0]) {
            const loc = gData.results[0].geometry.location
            console.log('✅ Google geocoded location:', loc)
            return { lat: loc.lat, lng: loc.lng }
          }
        } catch (e) {
          console.warn('Google geocoding fallback failed:', e)
        }
      }
      return null
    }
  } catch (error) {
    console.error('❌ Geocoding error:', error)
    return null
  }
}

interface RestaurantFormData {
  // Basic Info
  restaurantName: string
  ownerName: string
  email: string
  phone: string
  description: string
  
  // Location
  address: string
  city: string
  postalCode: string
  lat?: number
  lng?: number
  
  // Business Info
  cuisineTypes: string[]
  orgNumber: string
  websiteUrl: string
  
  // Opening Hours
  openingHours: {
    [key: string]: {
      open: string
      close: string
      closed: boolean
    }
  }
}

// Helpers
const defaultOpeningHours = () => ({
  monday: { open: '09:00', close: '22:00', closed: false },
  tuesday: { open: '09:00', close: '22:00', closed: false },
  wednesday: { open: '09:00', close: '22:00', closed: false },
  thursday: { open: '09:00', close: '22:00', closed: false },
  friday: { open: '09:00', close: '22:00', closed: false },
  saturday: { open: '10:00', close: '23:00', closed: false },
  sunday: { open: '10:00', close: '21:00', closed: false }
})

const createDefaultFormData = (): RestaurantFormData => ({
  restaurantName: '',
  ownerName: '',
  email: '',
  phone: '',
  description: '',
  address: '',
  city: '',
  postalCode: '',
  cuisineTypes: [],
  orgNumber: '',
  websiteUrl: '',
  openingHours: defaultOpeningHours()
})

const cuisineOptions = [
  'Norsk', 'Italiensk', 'Kinesisk', 'Indisk', 'Fransk', 'Amerikansk',
  'Japansk', 'Thailandsk', 'Meksikansk', 'Gresk', 'Tyrkisk', 'Vegetarisk',
  'Vegansk', 'Pizza', 'Burger', 'Sushi', 'Seafood', 'Grill', 'Bakeri'
]

const daysOfWeek = [
  { key: 'monday', label: 'Mandag' },
  { key: 'tuesday', label: 'Tirsdag' },
  { key: 'wednesday', label: 'Onsdag' },
  { key: 'thursday', label: 'Torsdag' },
  { key: 'friday', label: 'Fredag' },
  { key: 'saturday', label: 'Lørdag' },
  { key: 'sunday', label: 'Søndag' }
]

export function RegisterRestaurantPage() {
  const navigate = useNavigate()
  const [currentStep, setCurrentStep] = useState(1)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isGeocoding, setIsGeocoding] = useState(false)
  const [formData, setFormData] = useState<RestaurantFormData>(createDefaultFormData())
  const [multiMode, setMultiMode] = useState(false)
  const [queuedRestaurants, setQueuedRestaurants] = useState<RestaurantFormData[]>([])

  const updateFormData = (field: keyof RestaurantFormData, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }))
  }

  const toggleCuisineType = (cuisine: string) => {
    setFormData(prev => ({
      ...prev,
      cuisineTypes: prev.cuisineTypes.includes(cuisine)
        ? prev.cuisineTypes.filter(c => c !== cuisine)
        : [...prev.cuisineTypes, cuisine]
    }))
  }

  const updateOpeningHours = (day: string, field: string, value: string | boolean) => {
    setFormData(prev => ({
      ...prev,
      openingHours: {
        ...prev.openingHours,
        [day]: {
          ...prev.openingHours[day],
          [field]: value
        }
      }
    }))
  }

  const validateStep = (step: number): boolean => {
    switch (step) {
      case 1:
        return !!(formData.restaurantName && formData.ownerName && formData.email && formData.phone)
      case 2:
        return !!(formData.address && formData.city)
      case 3:
        return formData.cuisineTypes.length > 0
      case 4:
        return true // Opening hours have default values
      case 5:
        return !!(formData.orgNumber && formData.orgNumber.trim().length > 0)
      default:
        return true
    }
  }

  const queueCurrentAndReset = () => {
    // Validate all steps before queueing
    for (let step = 1; step <= 5; step++) {
      if (!validateStep(step)) {
        toast.error('Fullfør alle steg før du legger til en ny lokasjon')
        return
      }
    }
    setQueuedRestaurants(prev => ([...prev, formData]))
    setFormData(createDefaultFormData())
    setCurrentStep(1)
    toast.success('Lagt til i kø. Fortsett med neste lokasjon.')
  }

  const nextStep = () => {
    if (validateStep(currentStep)) {
      setCurrentStep(prev => Math.min(prev + 1, 5))
    } else {
      toast.error('Vennligst fyll ut alle obligatoriske felt')
    }
  }

  const prevStep = () => {
    setCurrentStep(prev => Math.max(prev - 1, 1))
  }

  const submitApplication = async () => {
    if (!validateStep(5)) {
      toast.error('Vennligst fyll ut alle obligatoriske felt')
      return
    }

    setIsSubmitting(true)
    
    try {
      console.log('🔄 Starting restaurant application submission...')
      
      // Build list of restaurants to submit (queued + current)
      const allRestaurants: RestaurantFormData[] = [...queuedRestaurants, formData]

      const { data: { user } } = await supabase.auth.getUser()
      if (!user) {
        toast.error('Du må være logget inn for å registrere en restaurant')
        return
      }

      console.log('👤 User authenticated:', user.id)

      setIsGeocoding(true)
      for (const [i, r] of allRestaurants.entries()) {
        let coordinates = null
        if (r.address && r.city) {
          coordinates = await geocodeAddress(r.address, r.city, r.postalCode)
        }

        const applicationData = {
          user_id: user.id,
          restaurant_name: r.restaurantName,
          owner_name: r.ownerName,
          email: r.email,
          phone: r.phone,
          address: r.address,
          city: r.city,
          postal_code: r.postalCode,
          lat: coordinates?.lat || null,
          lng: coordinates?.lng || null,
          description: r.description,
          cuisine_types: r.cuisineTypes,
          org_number: r.orgNumber,
          website_url: r.websiteUrl,
          opening_hours: r.openingHours
        }

        console.log('📝 Application data:', applicationData)

        const { error } = await supabase
          .from('restaurant_applications')
          .insert(applicationData)

        if (error) {
          console.error('❌ Supabase error details:', error)
          throw error
        }
        console.log(`✅ Application submitted for restaurant #${i + 1}`)
      }
      setIsGeocoding(false)

      console.log('✅ Application submitted successfully!')
      toast.success('Søknad sendt! Vi vil kontakte deg innen 2-3 virkedager.')
      setQueuedRestaurants([])
      navigate('/business')
      
    } catch (error: any) {
      console.error('❌ Error submitting application:', error)
      
      // More detailed error messages
      if (error?.code === 'PGRST116') {
        toast.error('Tabellen restaurant_applications finnes ikke. Kontakt administrator.')
      } else if (error?.code === '42P01') {
        toast.error('Database tabeller mangler. Kjør database schema først.')
      } else if (error?.message?.includes('permission')) {
        toast.error('Ikke tilgang til å opprette søknad. Sjekk database permissions.')
      } else {
        toast.error(`Kunne ikke sende søknad: ${error?.message || 'Ukjent feil'}`)
      }
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="min-h-screen bg-bg">
      {/* Header */}
      <div className="bg-white border-b px-4 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <button 
              onClick={() => navigate('/business')}
              className="p-2 hover:bg-muted rounded-full transition-colors"
            >
              <ArrowLeft className="h-5 w-5" />
            </button>
            <div>
              <h1 className="text-xl font-bold">Registrer restaurant</h1>
              <p className="text-sm text-muted-fg">Steg {currentStep} av 5</p>
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

      {/* Progress Bar */}
      <div className="bg-white px-4 py-2">
        <div className="w-full bg-muted rounded-full h-2">
          <div 
            className="bg-primary h-2 rounded-full transition-all duration-300"
            style={{ width: `${(currentStep / 5) * 100}%` }}
          />
        </div>
      </div>

      <div className="max-w-2xl mx-auto px-4 py-6">
        {/* Step 1: Basic Information */}
        {currentStep === 1 && (
          <div className="space-y-6">
            <div className="flex items-start justify-between gap-3">
              <div>
                <h2 className="text-2xl font-bold mb-1">Grunnleggende informasjon</h2>
                <p className="text-muted-fg">Fortell oss om deg og restauranten din</p>
              </div>
              <div className="text-right">
                <button
                  type="button"
                  onClick={() => setMultiMode((v) => !v)}
                  className={`px-3 py-2 rounded-lg text-sm ${multiMode ? 'bg-primary text-primary-fg' : 'bg-muted text-muted-fg hover:bg-muted/80'}`}
                  title="Registrer flere restauranter"
                >
                  {multiMode ? 'Flermodus på' : 'Legg til lokasjoner'}
                </button>
                {queuedRestaurants.length > 0 && (
                  <div className="text-xs text-muted-fg mt-1">I kø: {queuedRestaurants.length}</div>
                )}
              </div>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-2">Restaurantnavn *</label>
                <input
                  type="text"
                  value={formData.restaurantName}
                  onChange={(e) => updateFormData('restaurantName', e.target.value)}
                  placeholder="f.eks. Bistro Nordlys"
                  className="w-full px-4 py-3 border border-border rounded-xl focus:ring-2 focus:ring-primary focus:border-transparent"
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">Eier/kontaktperson *</label>
                <input
                  type="text"
                  value={formData.ownerName}
                  onChange={(e) => updateFormData('ownerName', e.target.value)}
                  placeholder="Ditt fulle navn"
                  className="w-full px-4 py-3 border border-border rounded-xl focus:ring-2 focus:ring-primary focus:border-transparent"
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-2">E-post *</label>
                  <input
                    type="email"
                    value={formData.email}
                    onChange={(e) => updateFormData('email', e.target.value)}
                    placeholder="din@email.no"
                    className="w-full px-4 py-3 border border-border rounded-xl focus:ring-2 focus:ring-primary focus:border-transparent"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2">Telefon *</label>
                  <input
                    type="tel"
                    value={formData.phone}
                    onChange={(e) => updateFormData('phone', e.target.value)}
                    placeholder="+47 123 45 678"
                    className="w-full px-4 py-3 border border-border rounded-xl focus:ring-2 focus:ring-primary focus:border-transparent"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">Beskrivelse</label>
                <textarea
                  value={formData.description}
                  onChange={(e) => updateFormData('description', e.target.value)}
                  placeholder="Beskriv restauranten din, atmosfæren, og hva som gjør dere unike..."
                  rows={4}
                  className="w-full px-4 py-3 border border-border rounded-xl focus:ring-2 focus:ring-primary focus:border-transparent resize-none"
                />
              </div>
            </div>
          </div>
        )}

        {/* Step 2: Location */}
        {currentStep === 2 && (
          <div className="space-y-6">
            <div>
              <h2 className="text-2xl font-bold mb-2">Plassering</h2>
              <p className="text-muted-fg">Hvor finner kundene dere?</p>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-2">Adresse *</label>
                <input
                  type="text"
                  value={formData.address}
                  onChange={(e) => updateFormData('address', e.target.value)}
                  placeholder="f.eks. Storgata 15"
                  className="w-full px-4 py-3 border border-border rounded-xl focus:ring-2 focus:ring-primary focus:border-transparent"
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-2">By *</label>
                  <input
                    type="text"
                    value={formData.city}
                    onChange={(e) => updateFormData('city', e.target.value)}
                    placeholder="f.eks. Oslo"
                    className="w-full px-4 py-3 border border-border rounded-xl focus:ring-2 focus:ring-primary focus:border-transparent"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2">Postnummer</label>
                  <input
                    type="text"
                    value={formData.postalCode}
                    onChange={(e) => updateFormData('postalCode', e.target.value)}
                    placeholder="0001"
                    className="w-full px-4 py-3 border border-border rounded-xl focus:ring-2 focus:ring-primary focus:border-transparent"
                  />
                </div>
              </div>

              <div className="bg-muted/50 rounded-xl p-4">
                <div className="flex items-center gap-2 mb-2">
                  <MapPin className="h-5 w-5 text-primary" />
                  <span className="font-medium">GPS-koordinater</span>
                </div>
                <p className="text-sm text-muted-fg mb-3">
                  Vi henter koordinater automatisk basert på adressen din
                </p>
              </div>

            </div>
          </div>
        )}

        {/* Step 3: Cuisine Types */}
        {currentStep === 3 && (
          <div className="space-y-6">
            <div>
              <h2 className="text-2xl font-bold mb-2">Kjøkkentype</h2>
              <p className="text-muted-fg">Velg alle som passer for restauranten din</p>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
              {cuisineOptions.map((cuisine) => (
                <button
                  key={cuisine}
                  onClick={() => toggleCuisineType(cuisine)}
                  className={`p-3 rounded-xl border transition-all ${
                    formData.cuisineTypes.includes(cuisine)
                      ? 'bg-primary text-primary-fg border-primary'
                      : 'bg-white border-border hover:border-primary'
                  }`}
                >
                  {cuisine}
                </button>
              ))}
            </div>

            {formData.cuisineTypes.length > 0 && (
              <div className="bg-success/10 border border-success/20 rounded-xl p-4">
                <p className="text-sm font-medium text-success">
                  Valgt: {formData.cuisineTypes.join(', ')}
                </p>
              </div>
            )}
          </div>
        )}

        {/* Step 4: Opening Hours */}
        {currentStep === 4 && (
          <div className="space-y-6">
            <div>
              <h2 className="text-2xl font-bold mb-2">Åpningstider</h2>
              <p className="text-muted-fg">Når er dere åpne for kunder?</p>
            </div>

            <div className="space-y-4">
              {daysOfWeek.map(({ key, label }) => (
                <div key={key} className="bg-white rounded-xl p-4 border border-border">
                  <div className="flex items-center justify-between mb-3">
                    <span className="font-medium">{label}</span>
                    <label className="flex items-center gap-2">
                      <input
                        type="checkbox"
                        checked={formData.openingHours[key].closed}
                        onChange={(e) => updateOpeningHours(key, 'closed', e.target.checked)}
                        className="rounded"
                      />
                      <span className="text-sm text-muted-fg">Stengt</span>
                    </label>
                  </div>

                  {!formData.openingHours[key].closed && (
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm text-muted-fg mb-1">Åpner</label>
                        <input
                          type="time"
                          value={formData.openingHours[key].open}
                          onChange={(e) => updateOpeningHours(key, 'open', e.target.value)}
                          className="w-full px-3 py-2 border border-border rounded-lg"
                        />
                      </div>
                      <div>
                        <label className="block text-sm text-muted-fg mb-1">Stenger</label>
                        <input
                          type="time"
                          value={formData.openingHours[key].close}
                          onChange={(e) => updateOpeningHours(key, 'close', e.target.value)}
                          className="w-full px-3 py-2 border border-border rounded-lg"
                        />
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Step 5: Business Info & Review */}
        {currentStep === 5 && (
          <div className="space-y-6">
            <div>
              <h2 className="text-2xl font-bold mb-2">Bedriftsinformasjon</h2>
              <p className="text-muted-fg">Tilleggsinformasjon og oppsummering</p>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-2">
                  Organisasjonsnummer <span className="text-danger">*</span>
                </label>
                <input
                  type="text"
                  value={formData.orgNumber}
                  onChange={(e) => updateFormData('orgNumber', e.target.value)}
                  placeholder="123 456 789"
                  required
                  className="w-full px-4 py-3 border border-border rounded-xl focus:ring-2 focus:ring-primary focus:border-transparent"
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">Nettside</label>
                <input
                  type="url"
                  value={formData.websiteUrl}
                  onChange={(e) => updateFormData('websiteUrl', e.target.value)}
                  placeholder="https://dinrestaurant.no"
                  className="w-full px-4 py-3 border border-border rounded-xl focus:ring-2 focus:ring-primary focus:border-transparent"
                />
              </div>
            </div>

            {/* Summary */}
            <div className="bg-muted/50 rounded-xl p-6">
              <h3 className="font-semibold mb-4">Oppsummering</h3>
              <div className="space-y-2 text-sm">
                <p><span className="font-medium">Kjede/Restaurantnavn:</span> {formData.restaurantName || (queuedRestaurants[0]?.restaurantName || '')}</p>
                <p><span className="font-medium">Eier:</span> {formData.ownerName || (queuedRestaurants[0]?.ownerName || '')}</p>
                <p><span className="font-medium">Kjøkken:</span> {formData.cuisineTypes.length > 0 ? formData.cuisineTypes.join(', ') : (queuedRestaurants[0]?.cuisineTypes?.join(', ') || '')}</p>
              </div>

              {/* Locations List */}
              <div className="mt-4">
                <h4 className="font-medium mb-2">Lokasjoner som sendes</h4>
                <div className="space-y-2">
                  {[...queuedRestaurants, formData].map((r, idx) => (
                    <div key={idx} className="bg-white border border-border rounded-xl p-3">
                      <div className="flex items-center justify-between">
                        <div>
                          <div className="font-medium">{r.restaurantName || `Lokasjon ${idx + 1}`}</div>
                          <div className="text-sm text-muted-fg">{r.address}, {r.city}{r.postalCode ? `, ${r.postalCode}` : ''}</div>
                        </div>
                        <div className="text-xs text-muted-fg">
                          {Object.values(r.openingHours).every((d: any) => d.closed) ? 'Stengt hele uken' : 'Åpningstider lagt til'}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            <div className="bg-blue-50 border border-blue-200 rounded-xl p-4">
              <h4 className="font-medium text-blue-900 mb-2">Hva skjer nå?</h4>
              <ul className="text-sm text-blue-800 space-y-1">
                <li>• Vi gjennomgår søknaden din innen 2-3 virkedager</li>
                <li>• Du får beskjed på e-post når restauranten er godkjent</li>
                <li>• Deretter kan du logge inn og begynne å lage tilbud</li>
                <li>• Kundene vil kunne se restauranten din på markedsplassen</li>
              </ul>
            </div>
          </div>
        )}

        {/* Navigation Buttons */}
        <div className="flex justify-between pt-8">
          <button
            onClick={prevStep}
            disabled={currentStep === 1}
            className="px-6 py-3 border border-border rounded-xl hover:bg-muted transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Tilbake
          </button>

          {currentStep < 5 ? (
            <button
              onClick={nextStep}
              disabled={!validateStep(currentStep)}
              className="px-6 py-3 bg-primary text-primary-fg rounded-xl hover:bg-primary/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Neste
            </button>
          ) : (
            <div className="flex items-center gap-3">
              {multiMode && (
                <button
                  onClick={queueCurrentAndReset}
                  disabled={isSubmitting || isGeocoding}
                  className="px-6 py-3 bg-muted text-fg rounded-xl hover:bg-muted/80 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Lagre og legg til ny
                </button>
              )}
              <button
                onClick={submitApplication}
                disabled={isSubmitting || isGeocoding}
                className="px-6 py-3 bg-success text-white rounded-xl hover:bg-success/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
              >
                {isGeocoding && <Loader className="h-4 w-4 animate-spin" />}
                {isGeocoding ? 'Finner plassering...' : isSubmitting ? 'Sender søknad...' : (multiMode && queuedRestaurants.length > 0 ? 'Send alle' : 'Send søknad')}
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
