import { useEffect, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '@/lib/supabase'

export function useAuthGuard() {
  const navigate = useNavigate()
  const hasNavigated = useRef(false)
  const [isLoading, setIsLoading] = useState(true)
  const [user, setUser] = useState<any>(null)

  useEffect(() => {
    let isMounted = true

    const loadSession = async () => {
      setIsLoading(true)
      try {
        const { data: { session } } = await supabase.auth.getSession()

        if (!isMounted) return

        if (!session) {
          setUser(null)
          return
        }

        setUser(session.user)
      } catch (error) {
        if (!isMounted) return
        setUser(null)
      } finally {
        if (isMounted) {
          setIsLoading(false)
        }
      }
    }

    loadSession()

    const { data: authListener } = supabase.auth.onAuthStateChange((_event, session) => {
      if (!isMounted) return
      setUser(session?.user ?? null)
      setIsLoading(false)
    })

    return () => {
      isMounted = false
      authListener.subscription.unsubscribe()
    }
  }, [])

  useEffect(() => {
    if (!isLoading && !user && !hasNavigated.current) {
      // Only navigate if not already on auth page and haven't navigated yet
      if (window.location.pathname !== '/auth') {
        hasNavigated.current = true
        navigate('/auth?reason=protected', { replace: true })
      }
    }
  }, [user, isLoading, navigate])

  // Reset navigation flag when user logs in
  useEffect(() => {
    if (user) {
      hasNavigated.current = false
    }
  }, [user])

  return { user, isLoading }
}

