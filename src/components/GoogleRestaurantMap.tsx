import React, { useMemo, useRef, useEffect } from 'react'
import { GoogleMap, Marker, useLoadScript } from '@react-google-maps/api'
import { cn } from '@/lib/utils'

type Restaurant = {
  id: string
  name: string
  lat: number
  lng: number
  isOpen?: boolean
  activeDeal?: { discount_percentage: number }
}

interface Props {
  restaurants: Restaurant[]
  onRestaurantClick?: (r: Restaurant) => void
  center?: { lat: number; lng: number }
  zoom?: number
  className?: string
  userLocation?: { lat: number; lng: number } | null
}

export function GoogleRestaurantMap({
  restaurants,
  onRestaurantClick,
  center,
  zoom = 13,
  className = '',
  userLocation,
}: Props) {
  const apiKey = import.meta.env.VITE_GOOGLE_MAPS_API_KEY as string | undefined
  const { isLoaded } = useLoadScript({ googleMapsApiKey: apiKey || '' })
  const mapRef = useRef<google.maps.Map>()

  const mapCenter = useMemo(() => center || { lat: 59.9139, lng: 10.7522 }, [center])

  useEffect(() => {
    if (!mapRef.current || restaurants.length === 0) return
    const bounds = new google.maps.LatLngBounds()
    restaurants.forEach(r => bounds.extend(new google.maps.LatLng(r.lat, r.lng)))
    if (userLocation) bounds.extend(new google.maps.LatLng(userLocation.lat, userLocation.lng))
    mapRef.current.fitBounds(bounds)
  }, [restaurants, userLocation])

  if (!isLoaded) {
    return <div className={cn('h-full w-full rounded-2xl bg-muted flex items-center justify-center', className)}>Laster Google-kart…</div>
  }

  return (
    <div className={cn('relative h-full w-full', className)}>
      <GoogleMap
        onLoad={(map) => (mapRef.current = map)}
        center={mapCenter}
        zoom={zoom}
        mapContainerStyle={{ width: '100%', height: '100%', borderRadius: '1rem' }}
        options={{ streetViewControl: false, fullscreenControl: false, mapTypeControl: false }}
      >
        {userLocation && (
          <Marker position={userLocation} icon={{ path: google.maps.SymbolPath.CIRCLE, scale: 6, fillColor: '#3b82f6', fillOpacity: 1, strokeColor: 'white', strokeWeight: 2 }} />
        )}

        {restaurants.map((r) => (
          <Marker
            key={r.id}
            position={{ lat: r.lat, lng: r.lng }}
            label={r.activeDeal ? { text: `-${Math.round(r.activeDeal.discount_percentage)}%`, color: '#fff', fontWeight: '700' } : undefined}
            onClick={() => onRestaurantClick?.(r)}
          />
        ))}
      </GoogleMap>
    </div>
  )
}


