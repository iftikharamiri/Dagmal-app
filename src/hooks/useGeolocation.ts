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
  const [lastKey, setLastKey] = useState<string | null>(null)
  const [lastFetchTs, setLastFetchTs] = useState<number>(0)

  useEffect(() => {
    if (!latitude || !longitude) {
      setCityName(null)
      return
    }

    setIsLoading(true)
    setError(null)

    // Debounce/rate limit: avoid more than one call per second and skip same rounded coords
    const now = Date.now()
    const key = `${latitude.toFixed(3)},${longitude.toFixed(3)}`
    if (key === lastKey && now - lastFetchTs < 1000) {
      setIsLoading(false)
      return
    }
    setLastKey(key)
    setLastFetchTs(now)

    // Call our server proxy to avoid CORS and add caching
    const fetchCityName = async () => {
      try {
        const response = await fetch(
          `/api/reverse-geocode?lat=${latitude}&lon=${longitude}&lang=nb`
        )
        
        if (!response.ok) {
          throw new Error('Failed to fetch location data')
        }

        const data = await response.json()
        setCityName(data.cityName || 'Ukjent lokasjon')
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










