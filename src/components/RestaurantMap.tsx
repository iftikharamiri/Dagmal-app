import { useEffect, useRef } from 'react'
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet'
import { Icon, LatLngBounds, DivIcon } from 'leaflet'
import { MapPin, Clock, Star, Tag, Navigation } from 'lucide-react'
import { norwegianText } from '@/i18n/no'
import { cn } from '@/lib/utils'
import 'leaflet/dist/leaflet.css'

// Fix for default markers in React Leaflet
const defaultIcon = new Icon({
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41],
})

const openIcon = new Icon({
  iconUrl: 'data:image/svg+xml;base64,' + btoa(`
    <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
      <circle cx="12" cy="12" r="10" fill="#16a34a"/>
      <path d="M8 12l2 2 4-4" stroke="white" stroke-width="2" stroke-linecap="round"/>
    </svg>
  `),
  iconSize: [30, 30],
  iconAnchor: [15, 15],
  popupAnchor: [0, -15],
})

// Create a dynamic discount icon that renders the percentage on the marker
function createDiscountIcon(discount: number, name?: string, id?: string): DivIcon {
  const safe = Math.max(0, Math.min(99, Math.round(discount || 0)))
  const label = (name || '').toString().slice(0, 24)
  const html = `
    <div style="display:flex;flex-direction:column;align-items:center;gap:6px;">
      <div style="
        display:flex;align-items:center;justify-content:center;
        width:36px;height:36px;border-radius:9999px;background:#dc2626;color:#fff;
        font-weight:800;font-size:12px;box-shadow:0 6px 16px rgba(0,0,0,0.25);border:2px solid #fff;">
        -${safe}%
      </div>
      <a href="/restaurant/${id || ''}" style="
        max-width:180px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;
        background:#111827;color:#fff;padding:4px 8px;border-radius:9999px;
        font-size:11px;font-weight:600;box-shadow:0 3px 8px rgba(0,0,0,.2);">
        ${label}
      </a>
    </div>
  `
  return new DivIcon({
    className: 'discount-marker',
    html,
    iconSize: [180, 60],
    iconAnchor: [18, 18],
    popupAnchor: [0, -30],
  })
}

const closedIcon = new Icon({
  iconUrl: 'data:image/svg+xml;base64,' + btoa(`
    <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
      <circle cx="12" cy="12" r="10" fill="#dc2626"/>
      <path d="M8 8l8 8M16 8l-8 8" stroke="white" stroke-width="2" stroke-linecap="round"/>
    </svg>
  `),
  iconSize: [30, 30],
  iconAnchor: [15, 15],
  popupAnchor: [0, -15],
})

const userLocationIcon = new Icon({
  iconUrl: 'data:image/svg+xml;base64,' + btoa(`
    <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
      <circle cx="12" cy="12" r="8" fill="#3b82f6" stroke="white" stroke-width="3"/>
      <circle cx="12" cy="12" r="3" fill="white"/>
    </svg>
  `),
  iconSize: [24, 24],
  iconAnchor: [12, 12],
  popupAnchor: [0, -12],
})

interface Restaurant {
  id: string
  name: string
  lat: number
  lng: number
  address?: string
  city?: string
  phone?: string
  categories?: string[]
  image_url?: string
  description?: string
  isOpen: boolean
  dealCount?: number
  bestDeal?: string
  activeDeal?: {
    id: string
    title: string
    description: string
    original_price: number
    final_price: number
    discount_percentage: number
    start_time: string
    end_time: string
  }
}

interface RestaurantMapProps {
  restaurants: Restaurant[]
  onRestaurantClick?: (restaurant: Restaurant) => void
  center?: [number, number]
  zoom?: number
  className?: string
  userLocation?: [number, number]
}

function FitBounds({ restaurants, userLocation }: { restaurants: Restaurant[]; userLocation?: [number, number] | null }) {
  const map = useMap()

  useEffect(() => {
    if (restaurants.length > 0) {
      const points: [number, number][] = restaurants.map(r => [r.lat, r.lng])
      if (userLocation) points.push(userLocation)
      const bounds = new LatLngBounds(points)
      map.fitBounds(bounds, { padding: [20, 20] })
    }
  }, [map, restaurants, userLocation])

  return null
}

export function RestaurantMap({
  restaurants,
  onRestaurantClick,
  center = [59.9139, 10.7522], // Oslo
  zoom = 13,
  className = '',
  userLocation,
}: RestaurantMapProps) {
  const mapRef = useRef(null)

  return (
    <div className={cn('relative h-full w-full', className)}>
      <MapContainer
        center={center}
        zoom={zoom}
        className="h-full w-full rounded-2xl"
        ref={mapRef}
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        
        {restaurants.length > 0 && <FitBounds restaurants={restaurants} userLocation={userLocation || null} />}
        
        {/* User Location Marker */}
        {userLocation && (
          <Marker
            position={userLocation}
            icon={userLocationIcon}
          >
            <Popup>
              <div className="text-center">
                <div className="font-semibold text-blue-600">Din posisjon</div>
                <div className="text-sm text-gray-600">
                  {userLocation[0].toFixed(6)}, {userLocation[1].toFixed(6)}
                </div>
              </div>
            </Popup>
          </Marker>
        )}
        
        {restaurants.map((restaurant) => (
          <Marker
            key={restaurant.id}
            position={[restaurant.lat, restaurant.lng]}
            icon={(restaurant as any).dealCount && restaurant.activeDeal
              ? createDiscountIcon(restaurant.activeDeal.discount_percentage, restaurant.name, restaurant.id)
              : ((restaurant as any).dealCount && (restaurant as any).bestDeal
                  ? createDiscountIcon((restaurant as any).activeDeal?.discount_percentage || 0, restaurant.name, restaurant.id)
                  : (restaurant.isOpen ? openIcon : closedIcon))}
            eventHandlers={{
              click: () => onRestaurantClick?.(restaurant),
            }}
          />
        ))}
      </MapContainer>
    </div>
  )
}

