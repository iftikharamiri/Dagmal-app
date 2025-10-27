import { useEffect, useRef, startTransition } from 'react'
import { useNavigate } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'

export function useAuthGuard() {
  const navigate = useNavigate()
  const hasNavigated = useRef(false)

  const { data: user, isLoading } = useQuery({
    queryKey: ['auth-user'],
    queryFn: async () => {
    // Force real Supabase mode
    const isDemoMode = false

    if (isDemoMode) {
        // Return demo user from localStorage
        const demoUser = localStorage.getItem('demo_user')
        if (demoUser) {
          return JSON.parse(demoUser)
        }
        return null
      }
      
      // Real Supabase mode
      const { data: { user } } = await supabase.auth.getUser()
      return user
    },
  })

  useEffect(() => {
    if (!isLoading && !user && !hasNavigated.current) {
      // Only navigate if not already on auth page and haven't navigated yet
      if (window.location.pathname !== '/auth') {
        hasNavigated.current = true
        // Wrap navigation in startTransition to prevent throttling
        startTransition(() => {
          navigate('/auth', { replace: true })
        })
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

