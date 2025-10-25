import { useState, useEffect } from 'react'

interface GeolocationState {
  latitude: number | null
  longitude: number | null
  accuracy: number | null
  error: string | null
  isLoading: boolean
}

interface GeolocationOptions {
  enableHighAccuracy?: boolean
  timeout?: number
  maximumAge?: number
}

export function useGeolocation(options: GeolocationOptions = {}) {
  const [state, setState] = useState<GeolocationState>({
    latitude: null,
    longitude: null,
    accuracy: null,
    error: null,
    isLoading: false,
  })

  useEffect(() => {
    if (!navigator.geolocation) {
      setState(prev => ({
        ...prev,
        error: 'Geolocation is not supported by this browser.',
        isLoading: false,
      }))
      return
    }

    setState(prev => ({ ...prev, isLoading: true, error: null }))

    const defaultOptions: PositionOptions = {
      enableHighAccuracy: true,
      timeout: 10000,
      maximumAge: 300000, // 5 minutes
      ...options,
    }

    const watchId = navigator.geolocation.watchPosition(
      (position) => {
        setState({
          latitude: position.coords.latitude,
          longitude: position.coords.longitude,
          accuracy: position.coords.accuracy,
          error: null,
          isLoading: false,
        })
      },
      (error) => {
        let errorMessage = 'An unknown error occurred.'
        
        switch (error.code) {
          case error.PERMISSION_DENIED:
            errorMessage = 'Location access denied by user.'
            break
          case error.POSITION_UNAVAILABLE:
            errorMessage = 'Location information is unavailable.'
            break
          case error.TIMEOUT:
            errorMessage = 'Location request timed out.'
            break
        }

        setState(prev => ({
          ...prev,
          error: errorMessage,
          isLoading: false,
        }))
      },
      defaultOptions
    )

    return () => {
      navigator.geolocation.clearWatch(watchId)
    }
  }, [options.enableHighAccuracy, options.timeout, options.maximumAge])

  return state
}

export function useReverseGeocoding(latitude: number | null, longitude: number | null) {
  const [cityName, setCityName] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!latitude || !longitude) {
      setCityName(null)
      return
    }

    setIsLoading(true)
    setError(null)

    // Using Nominatim (OpenStreetMap) for reverse geocoding
    const fetchCityName = async () => {
      try {
        const response = await fetch(
          `https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}&addressdetails=1&accept-language=nb,no,en`
        )
        
        if (!response.ok) {
          throw new Error('Failed to fetch location data')
        }

        const data = await response.json()
        
        // Extract city name from address components
        const address = data.address
        let city = address?.city || 
                  address?.town || 
                  address?.village || 
                  address?.municipality ||
                  address?.county ||
                  'Ukjent lokasjon'

        // Add country for context
        const country = address?.country || 'Norge'
        setCityName(`${city}, ${country}`)
      } catch (err) {
        console.error('Reverse geocoding error:', err)
        setError('Kunne ikke hente lokasjon')
        setCityName('Ukjent lokasjon')
      } finally {
        setIsLoading(false)
      }
    }

    fetchCityName()
  }, [latitude, longitude])

  return { cityName, isLoading, error }
}









