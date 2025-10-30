
import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { Eye, EyeOff, Mail, Lock, ArrowLeft } from 'lucide-react'
import { supabase } from '@/lib/supabase'
import { norwegianText } from '@/i18n/no'
import { cn } from '@/lib/utils'
import { toast } from 'sonner'

export function AuthPage() {
  const [mode, setMode] = useState<'signin' | 'signup'>('signin')
  const isSignUp = mode === 'signup'
  const [showPassword, setShowPassword] = useState(false)
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    confirmPassword: '',
  })
  const [isLoading, setIsLoading] = useState(false)
  const [errors, setErrors] = useState<Record<string, string>>({})
  const navigate = useNavigate()

  useEffect(() => {
    // Check if user is already logged in
    const checkAuth = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (user) {
        navigate('/')
      }
    }
    checkAuth()
  }, [navigate])

  const validateForm = () => {
    const newErrors: Record<string, string> = {}

    if (!formData.email.trim()) {
      newErrors.email = 'E-post er påkrevd'
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
      newErrors.email = 'Ugyldig e-postadresse'
    }

    if (!formData.password) {
      newErrors.password = 'Passord er påkrevd'
    } else if (formData.password.length < 6) {
      newErrors.password = 'Passord må være minst 6 tegn'
    }

    if (isSignUp && formData.password !== formData.confirmPassword) {
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
      // Check if we're in demo mode (placeholder credentials)
      // Force real Supabase mode
      const isDemoMode = false
      
      if (isDemoMode) {
        // Demo mode - simulate successful auth
        await new Promise(resolve => setTimeout(resolve, 1000)) // Simulate network delay
        
        if (isSignUp) {
          toast.success('Demo konto opprettet! Du kan nå utforske appen.')
        } else {
          toast.success('Logget inn i demo modus!')
        }
        
        // Store demo user in localStorage
        localStorage.setItem('demo_user', JSON.stringify({
          id: 'demo-user-123',
          email: formData.email.trim(),
          created_at: new Date().toISOString()
        }))
        
        navigate('/')
        return
      }

      // Real Supabase mode
      if (isSignUp) {
        const { data, error } = await supabase.auth.signUp({
          email: formData.email.trim(),
          password: formData.password,
        })

        if (error) throw error

        if (data.user) {
          // Create profile
          const { error: profileError } = await supabase
            .from('profiles')
            .insert({
              id: data.user.id,
              display_name: formData.email.split('@')[0],
            })

          if (profileError) {
            console.error('Error creating profile:', profileError)
          }

          toast.success('Konto opprettet! Sjekk e-posten din for bekreftelse.')
        }
      } else {
        const { error } = await supabase.auth.signInWithPassword({
          email: formData.email.trim(),
          password: formData.password,
        })

        if (error) throw error

        toast.success('Logget inn!')
        navigate('/')
      }
    } catch (error: any) {
      console.error('Auth error:', error)
      
      if (error.message?.includes('Invalid login credentials')) {
        setErrors({ submit: 'Ugyldig e-post eller passord' })
      } else if (error.message?.includes('Email not confirmed')) {
        setErrors({ submit: 'Vennligst bekreft e-posten din først' })
      } else if (error.message?.includes('User already registered')) {
        setErrors({ submit: 'En bruker med denne e-posten eksisterer allerede' })
      } else {
        setErrors({ submit: error.message || norwegianText.errors.unknownError })
      }
    } finally {
      setIsLoading(false)
    }
  }

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }))
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }))
    }
  }

  // No landing here; welcome is handled by /welcome

  return (
    <div className="min-h-screen bg-bg flex items-center justify-center p-4 relative">
      <button
        onClick={() => navigate('/')}
        className="absolute top-4 left-4 inline-flex items-center text-muted-fg hover:text-primary"
        aria-label="Til markedsplassen"
      >
        <ArrowLeft className="h-5 w-5" />
      </button>
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <h1 className="text-2xl font-bold text-primary mb-1">Spisly</h1>
          <p className="text-muted-fg">Lag en gratis konto for å hente tilbud</p>
        </div>

        <div className="card p-6">
          <div className="mb-6">
            <h2 className="text-xl font-semibold mb-2">
              {isSignUp ? norwegianText.auth.signUp : norwegianText.auth.signIn}
            </h2>
            <p className="text-sm text-muted-fg">
              {isSignUp 
                ? 'Opprett en konto for å begynne å spare penger'
                : 'Logg inn for å se dine tilbud'
              }
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Email */}
            <div>
              <label className="block font-medium mb-2">
                <Mail className="inline h-4 w-4 mr-2" />
                {norwegianText.auth.email}
              </label>
              <input
                type="email"
                value={formData.email}
                onChange={(e) => handleInputChange('email', e.target.value)}
                placeholder="din@epost.no"
                className={cn('input w-full', errors.email && 'border-danger')}
                autoComplete="email"
              />
              {errors.email && (
                <p className="text-danger text-sm mt-1">{errors.email}</p>
              )}
            </div>

            {/* Password */}
            <div>
              <label className="block font-medium mb-2">
                <Lock className="inline h-4 w-4 mr-2" />
                {norwegianText.auth.password}
              </label>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={formData.password}
                  onChange={(e) => handleInputChange('password', e.target.value)}
                  placeholder="••••••••"
                  className={cn('input w-full pr-12', errors.password && 'border-danger')}
                  autoComplete={isSignUp ? 'new-password' : 'current-password'}
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

            {/* Confirm Password (Sign Up only) */}
            {isSignUp && (
              <div>
                <label className="block font-medium mb-2">
                  <Lock className="inline h-4 w-4 mr-2" />
                  {norwegianText.auth.confirmPassword}
                </label>
                <input
                  type="password"
                  value={formData.confirmPassword}
                  onChange={(e) => handleInputChange('confirmPassword', e.target.value)}
                  placeholder="••••••••"
                  className={cn('input w-full', errors.confirmPassword && 'border-danger')}
                  autoComplete="new-password"
                />
                {errors.confirmPassword && (
                  <p className="text-danger text-sm mt-1">{errors.confirmPassword}</p>
                )}
              </div>
            )}

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
                  <span>{isSignUp ? 'Oppretter konto...' : 'Logger inn...'}</span>
                </div>
              ) : (
                isSignUp ? norwegianText.auth.signUp : norwegianText.auth.signIn
              )}
            </button>
          </form>

          {/* Toggle Auth Mode */}
          <div className="mt-6 text-center">
            <p className="text-sm text-muted-fg">{isSignUp ? norwegianText.auth.hasAccount : norwegianText.auth.noAccount}</p>
            <button
              onClick={() => {
                setMode(isSignUp ? 'signin' : 'signup')
                setFormData({ email: '', password: '', confirmPassword: '' })
                setErrors({})
              }}
              className="text-primary font-medium hover:underline mt-1"
            >
              {isSignUp ? norwegianText.auth.signIn : norwegianText.auth.signUp}
            </button>
          </div>

          {/* Forgot Password */}
          {mode === 'signin' && (
            <div className="mt-4 text-center">
              <button
                onClick={() => {
                  // TODO: Implement forgot password
                  toast.info('Funksjon kommer snart')
                }}
                className="text-sm text-muted-fg hover:text-fg"
              >
                {norwegianText.auth.forgotPassword}
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

