import { useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'

export function useAuthGuard() {
  const navigate = useNavigate()

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
    if (!isLoading && !user) {
      navigate('/auth')
    }
  }, [user, isLoading, navigate])

  return { user, isLoading }
}

