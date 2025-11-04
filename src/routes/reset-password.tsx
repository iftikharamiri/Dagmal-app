import { useState, useEffect } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { Eye, EyeOff, Lock, ArrowLeft } from 'lucide-react'
import { supabase } from '@/lib/supabase'
import { toast } from 'sonner'
import { cn } from '@/lib/utils'

export function ResetPasswordPage() {
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [isValidating, setIsValidating] = useState(true)
  const [errors, setErrors] = useState<Record<string, string>>({})
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()

  useEffect(() => {
    let mounted = true

    // Check URL for hash fragment (Supabase puts tokens in hash)
    const hashParams = new URLSearchParams(window.location.hash.substring(1))
    const accessToken = hashParams.get('access_token') || searchParams.get('access_token')
    const type = hashParams.get('type') || searchParams.get('type')
    const refreshToken = hashParams.get('refresh_token') || searchParams.get('refresh_token')

    // Listen for auth state changes (Supabase processes hash automatically)
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (!mounted) return

      // Check if this is a password recovery event
      const currentHash = new URLSearchParams(window.location.hash.substring(1))
      const currentType = currentHash.get('type') || searchParams.get('type')

      if (event === 'PASSWORD_RECOVERY' || (session && currentType === 'recovery')) {
        setIsValidating(false)
        // Clear the hash from URL for cleaner experience
        window.history.replaceState(null, '', '/reset-password')
      } else if (event === 'SIGNED_OUT' || (!session && !accessToken && !currentHash.get('access_token'))) {
        setIsValidating(false)
        // Only show error if we're sure there's no valid session
        if (!accessToken && !currentHash.get('access_token')) {
          toast.error('Ugyldig eller utløpt tilbakestillingslenke')
          setTimeout(() => navigate('/auth'), 2000)
        }
      }
    })

    if (accessToken && type === 'recovery') {
      // Set the session from the token
      setIsValidating(true)
      supabase.auth.setSession({
        access_token: accessToken,
        refresh_token: refreshToken || '',
      }).then(({ data: { session }, error }) => {
        if (!mounted) return
        setIsValidating(false)
        if (error || !session) {
          console.error('Error setting session:', error)
          toast.error('Kunne ikke validere lenken')
          setTimeout(() => navigate('/auth'), 2000)
        } else {
          // Clear the hash from URL for cleaner experience
          window.history.replaceState(null, '', '/reset-password')
        }
      })
    } else {
      // Check if user already has a valid recovery session
      supabase.auth.getSession().then(({ data: { session } }) => {
        if (!mounted) return
        setIsValidating(false)
        if (!session) {
          // Give a moment for Supabase to process the hash if it exists
          setTimeout(() => {
            if (!mounted) return
            supabase.auth.getSession().then(({ data: { session: retrySession } }) => {
              if (!mounted) return
              if (!retrySession) {
                toast.error('Ugyldig eller utløpt tilbakestillingslenke')
                setTimeout(() => navigate('/auth'), 2000)
              }
            })
          }, 1000)
        }
      })
    }

    return () => {
      mounted = false
      subscription.unsubscribe()
    }
  }, [searchParams, navigate])

  const validateForm = () => {
    const newErrors: Record<string, string> = {}

    if (!password) {
      newErrors.password = 'Passord er påkrevd'
    } else if (password.length < 6) {
      newErrors.password = 'Passord må være minst 6 tegn'
    }

    if (!confirmPassword) {
      newErrors.confirmPassword = 'Bekreft passord er påkrevd'
    } else if (password !== confirmPassword) {
      newErrors.confirmPassword = 'Passordene må være like'
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!validateForm()) return

    setIsLoading(true)
    setErrors({})

    try {
      const { error } = await supabase.auth.updateUser({
        password: password,
      })

      if (error) throw error

      toast.success('Passordet ditt er oppdatert! Du kan nå logge inn.')
      navigate('/auth')
    } catch (error: any) {
      console.error('Password reset error:', error)
      setErrors({ submit: error.message || 'Kunne ikke oppdatere passord' })
    } finally {
      setIsLoading(false)
    }
  }

  if (isValidating) {
    return (
      <div className="min-h-screen bg-bg flex items-center justify-center p-4">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-2 border-primary border-t-transparent mx-auto mb-4" />
          <p className="text-muted-fg">Validerer lenke...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-bg flex items-center justify-center p-4 relative">
      <button
        onClick={() => navigate('/auth')}
        className="absolute top-4 left-4 inline-flex items-center text-muted-fg hover:text-primary"
        aria-label="Tilbake til innlogging"
      >
        <ArrowLeft className="h-5 w-5" />
      </button>

      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-fg mb-1">Spisly</h1>
          <p className="text-muted-fg">Tilbakestill passord</p>
        </div>

        <div className="card p-6">
          <form onSubmit={handleSubmit} className="space-y-4">
            {/* New Password */}
            <div>
              <label className="block font-medium mb-2">
                <Lock className="inline h-4 w-4 mr-2" />
                Nytt passord
              </label>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => {
                    setPassword(e.target.value)
                    if (errors.password) {
                      setErrors(prev => ({ ...prev, password: '' }))
                    }
                  }}
                  placeholder="••••••••"
                  className={cn('input w-full pr-12', errors.password && 'border-danger')}
                  autoComplete="new-password"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 text-muted-fg hover:text-fg"
                >
                  {showPassword ? (
                    <EyeOff className="h-4 w-4" />
                  ) : (
                    <Eye className="h-4 w-4" />
                  )}
                </button>
              </div>
              {errors.password && (
                <p className="text-danger text-sm mt-1">{errors.password}</p>
              )}
            </div>

            {/* Confirm Password */}
            <div>
              <label className="block font-medium mb-2">
                <Lock className="inline h-4 w-4 mr-2" />
                Bekreft passord
              </label>
              <div className="relative">
                <input
                  type={showConfirmPassword ? 'text' : 'password'}
                  value={confirmPassword}
                  onChange={(e) => {
                    setConfirmPassword(e.target.value)
                    if (errors.confirmPassword) {
                      setErrors(prev => ({ ...prev, confirmPassword: '' }))
                    }
                  }}
                  placeholder="••••••••"
                  className={cn('input w-full pr-12', errors.confirmPassword && 'border-danger')}
                  autoComplete="new-password"
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 text-muted-fg hover:text-fg"
                >
                  {showConfirmPassword ? (
                    <EyeOff className="h-4 w-4" />
                  ) : (
                    <Eye className="h-4 w-4" />
                  )}
                </button>
              </div>
              {errors.confirmPassword && (
                <p className="text-danger text-sm mt-1">{errors.confirmPassword}</p>
              )}
            </div>

            {/* Submit Error */}
            {errors.submit && (
              <div className="bg-danger/10 border border-danger/20 rounded-2xl p-3">
                <p className="text-danger text-sm">{errors.submit}</p>
              </div>
            )}

            {/* Submit Button */}
            <button
              type="submit"
              disabled={isLoading}
              className="btn-primary w-full"
            >
              {isLoading ? (
                <div className="flex items-center gap-2">
                  <div className="animate-spin rounded-full h-4 w-4 border-2 border-primary-fg border-t-transparent" />
                  <span>Oppdaterer...</span>
                </div>
              ) : (
                'Oppdater passord'
              )}
            </button>
          </form>
        </div>
      </div>
    </div>
  )
}

