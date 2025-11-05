import React, { useState } from 'react'
import { X, MapPin, Phone, Clock, Building2 } from 'lucide-react'
import { supabase } from '@/lib/supabase'
import { toast } from 'sonner'
import { MapContainer, TileLayer, Marker, useMapEvents } from 'react-leaflet'
import L from 'leaflet'
import 'leaflet/dist/leaflet.css'

interface AddLocationModalProps {
  isOpen: boolean
  onClose: () => void
  onSuccess: () => void
}

const cuisineOptions = [
  'Norsk', 'Italiensk', 'Kinesisk', 'Indisk', 'Fransk', 'Amerikansk',
  'Japansk', 'Thailandsk', 'Meksikansk', 'Gresk', 'Tyrkisk', 'Vegetarisk',
  'Vegansk', 'Pizza', 'Burger', 'Sushi', 'Seafood', 'Grill', 'Bakeri'
]


// Geocoding function
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

export function AddLocationModal({ isOpen, onClose, onSuccess }: AddLocationModalProps) {
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [formData, setFormData] = useState({
    restaurantName: '',
    phone: '',
    description: '',
    address: '',
    city: '',
    categories: [] as string[],
    lat: null as number | null,
    lng: null as number | null
  })

  if (!isOpen) return null

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!formData.restaurantName || !formData.address || !formData.city || !formData.phone) {
      toast.error('Vennligst fyll ut alle obligatoriske felt')
      return
    }

    setIsSubmitting(true)

    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) {
        toast.error('Du må være logget inn')
        return
      }

      // Get user profile for email and owner name
      const { data: profile } = await supabase
        .from('profiles')
        .select('display_name')
        .eq('id', user.id)
        .single()

      // Geocode address if not manually set
      let coordinates = { lat: formData.lat, lng: formData.lng }
      if (!coordinates.lat || !coordinates.lng) {
        const geocoded = await geocodeAddress(formData.address, formData.city)
        if (geocoded) {
          coordinates = geocoded
        } else {
          // Fallback to Oslo city center if geocoding fails
          toast.warning('Kunne ikke finne nøyaktig posisjon. Bruker sentrum av byen. Du kan sette posisjonen manuelt på kartet.')
          coordinates = { lat: 59.9139, lng: 10.7522 }
        }
      }

      // Create restaurant directly (since owner is already approved)
      const restaurantData = {
        name: formData.restaurantName,
        description: formData.description || null,
        phone: formData.phone,
        address: formData.address,
        city: formData.city,
        lat: coordinates.lat,
        lng: coordinates.lng,
        categories: formData.categories,
        owner_id: user.id,
        dine_in: true,
        takeaway: true
      }

      const { data, error } = await supabase
        .from('restaurants')
        .insert(restaurantData)
        .select()
        .single()

      if (error) {
        console.error('Error creating restaurant:', error)
        throw error
      }

      toast.success('Ny lokasjon lagt til!')
      setFormData({
        restaurantName: '',
        phone: '',
        description: '',
        address: '',
        city: '',
        categories: [],
        lat: null,
        lng: null
      })
      onSuccess()
      onClose()
      
    } catch (error: any) {
      console.error('Error adding location:', error)
      toast.error(`Kunne ikke legge til lokasjon: ${error?.message || 'Ukjent feil'}`)
    } finally {
      setIsSubmitting(false)
    }
  }

  const toggleCategory = (category: string) => {
    setFormData(prev => ({
      ...prev,
      categories: prev.categories.includes(category)
        ? prev.categories.filter(c => c !== category)
        : [...prev.categories, category]
    }))
  }

  const setPosition = (pos: { lat: number; lng: number }) => {
    setFormData(prev => ({ ...prev, lat: pos.lat, lng: pos.lng }))
  }

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="sticky top-0 bg-white border-b px-6 py-4 flex items-center justify-between">
          <h2 className="text-xl font-bold">Legg til ny lokasjon</h2>
          <button
            onClick={onClose}
            className="p-2 hover:bg-muted rounded-full transition-colors"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {/* Restaurant Name */}
          <div>
            <label className="block text-sm font-medium mb-2">
              Lokasjonsnavn *
            </label>
            <input
              type="text"
              value={formData.restaurantName}
              onChange={(e) => setFormData(prev => ({ ...prev, restaurantName: e.target.value }))}
              className="w-full px-4 py-3 border border-border rounded-xl focus:ring-2 focus:ring-primary focus:border-transparent"
              placeholder="f.eks. Sør Hellinga - Ås"
              required
            />
          </div>

          {/* Phone */}
          <div>
            <label className="block text-sm font-medium mb-2">
              Telefon *
            </label>
            <input
              type="tel"
              value={formData.phone}
              onChange={(e) => setFormData(prev => ({ ...prev, phone: e.target.value }))}
              className="w-full px-4 py-3 border border-border rounded-xl focus:ring-2 focus:ring-primary focus:border-transparent"
              placeholder="+47 123 45 678"
              required
            />
          </div>

          {/* Description */}
          <div>
            <label className="block text-sm font-medium mb-2">
              Beskrivelse
            </label>
            <textarea
              value={formData.description}
              onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
              rows={3}
              className="w-full px-4 py-3 border border-border rounded-xl focus:ring-2 focus:ring-primary focus:border-transparent resize-none"
              placeholder="Beskriv denne lokasjonen..."
            />
          </div>

          {/* Address */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-2">
                Adresse *
              </label>
              <input
                type="text"
                value={formData.address}
                onChange={(e) => setFormData(prev => ({ ...prev, address: e.target.value }))}
                className="w-full px-4 py-3 border border-border rounded-xl focus:ring-2 focus:ring-primary focus:border-transparent"
                placeholder="Gateadresse"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-2">
                By *
              </label>
              <input
                type="text"
                value={formData.city}
                onChange={(e) => setFormData(prev => ({ ...prev, city: e.target.value }))}
                className="w-full px-4 py-3 border border-border rounded-xl focus:ring-2 focus:ring-primary focus:border-transparent"
                placeholder="By"
                required
              />
            </div>
          </div>

          {/* Set position on map */}
          <div>
            <label className="block text-sm font-medium mb-2">Sett posisjon på kartet</label>
            <div className="rounded-xl overflow-hidden border border-border">
              <PinPickerMap
                position={formData.lat && formData.lng ? { lat: formData.lat, lng: formData.lng } : { lat: 59.9139, lng: 10.7522 }}
                onPick={setPosition}
              />
            </div>
            {formData.lat && formData.lng && (
              <p className="text-xs text-muted-fg mt-2">Valgt: {formData.lat.toFixed(6)}, {formData.lng.toFixed(6)}</p>
            )}
          </div>

          {/* Categories */}
          <div>
            <label className="block text-sm font-medium mb-2">
              Kategorier
            </label>
            <div className="flex flex-wrap gap-2">
              {cuisineOptions.map((category) => (
                <button
                  key={category}
                  type="button"
                  onClick={() => toggleCategory(category)}
                  className={`px-4 py-2 rounded-xl border transition-all ${
                    formData.categories.includes(category)
                      ? 'bg-primary text-primary-fg border-primary'
                      : 'bg-white border-border hover:border-primary'
                  }`}
                >
                  {category}
                </button>
              ))}
            </div>
          </div>

          {/* Submit Buttons */}
          <div className="flex gap-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-3 border border-border rounded-xl hover:bg-muted transition-colors"
            >
              Avbryt
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="flex-1 px-4 py-3 bg-primary text-primary-fg rounded-xl hover:bg-primary/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isSubmitting ? 'Legger til...' : 'Legg til lokasjon'}
            </button>
          </div>
        </form>
      </div>
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

