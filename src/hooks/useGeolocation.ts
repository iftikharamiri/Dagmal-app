import { useEffect, useRef, useState } from 'react'

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

/**
 * Watches the user's geolocation.
 */
export function useGeolocation(options: GeolocationOptions = {}) {
  const [state, setState] = useState<GeolocationState>({
    latitude: null,
    longitude: null,
    accuracy: null,
    error: null,
    isLoading: false,
  })

  const mountedRef = useRef(true)
  useEffect(() => {
    mountedRef.current = true
    return () => {
      mountedRef.current = false
    }
  }, [])

  useEffect(() => {
    if (typeof navigator === 'undefined' || !navigator.geolocation) {
      setState(prev => ({
        ...prev,
        error: 'Geolocation is not supported by this browser.',
        isLoading: false,
      }))
      return
    }

    setState(prev => ({ ...prev, isLoading: true, error: null }))

    const defaultOptions: PositionOptions = {
      enableHighAccuracy: options.enableHighAccuracy ?? true,
      timeout: options.timeout ?? 10000,
      maximumAge: options.maximumAge ?? 0, // Always get fresh position
    }

    // Get initial position
    const updatePosition = () => {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          if (!mountedRef.current) return
          setState({
            latitude: position.coords.latitude,
            longitude: position.coords.longitude,
            accuracy: position.coords.accuracy,
            error: null,
            isLoading: false,
          })
        },
        (error) => {
          if (!mountedRef.current) return
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
    }

    // Get initial position
    updatePosition()

    // Set up 1-minute refresh interval
    const intervalId = setInterval(() => {
      updatePosition()
    }, 60000) // 1 minute = 60,000ms

    return () => {
      clearInterval(intervalId)
    }
  }, [options.enableHighAccuracy, options.timeout, options.maximumAge])

  return state
}

/**
 * Reverse geocodes latitude/longitude into a city name using BigDataCloud's
 * CORS-friendly endpoint (no API key needed).
 * - Handles 0 latitude/longitude correctly.
 * - Defensive JSON parsing to avoid "Unexpected token '<'".
 * - Debounced to at most 1 request/second and deduped by rounded coords.
 */
export function useReverseGeocoding(latitude: number | null, longitude: number | null) {
  const [cityName, setCityName] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const lastKeyRef = useRef<string | null>(null)
  const lastFetchTsRef = useRef<number>(0)

  useEffect(() => {
    // allow 0 values; only bail if null/undefined
    if (latitude == null || longitude == null) {
      setCityName(null)
      setError(null)
      return
    }

    const key = `${latitude.toFixed(3)},${longitude.toFixed(3)}`
    const now = Date.now()
    if (key === lastKeyRef.current && now - lastFetchTsRef.current < 1000) {
      // rate-limit: skip if same rounded coords within 1s
      return
    }
    lastKeyRef.current = key
    lastFetchTsRef.current = now

    let cancelled = false
    setIsLoading(true)
    setError(null)

    const fetchCity = async () => {
      try {
        const lang =
          (typeof navigator !== 'undefined' && navigator.language) ? navigator.language : 'en'

        const url =
          `https://api.bigdatacloud.net/data/reverse-geocode-client?` +
          `latitude=${encodeURIComponent(latitude)}&longitude=${encodeURIComponent(longitude)}` +
          `&localityLanguage=${encodeURIComponent(lang)}`

        const res = await fetch(url, { headers: { Accept: 'application/json' } })
        const text = await res.text()
        if (!res.ok) {
          throw new Error(`HTTP ${res.status} ${res.statusText}: ${text.slice(0, 200)}`)
        }
        const ct = res.headers.get('content-type') || ''
        if (!ct.includes('application/json')) {
          throw new Error(`Expected JSON, got ${ct}. Body: ${text.slice(0, 200)}`)
        }
        const data = JSON.parse(text)

        const resolvedCity =
          data.city ||
          data.locality ||
          data.localityInfo?.administrative?.[0]?.name ||
          data.principalSubdivision ||
          data.countryName ||
          'Ukjent lokasjon'

        if (!cancelled) {
          setCityName(resolvedCity)
          setIsLoading(false)
        }
      } catch (e) {
        if (!cancelled) {
          console.error('Reverse geocoding error:', e)
          setError('Kunne ikke hente lokasjon')
          setCityName('Ukjent lokasjon')
          setIsLoading(false)
        }
      }
    }

    fetchCity()
    return () => {
      cancelled = true
    }
  }, [latitude, longitude])

  return { cityName, isLoading, error }
}
