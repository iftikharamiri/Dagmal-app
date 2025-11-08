import { useQuery, useQueryClient } from '@tanstack/react-query'
import { Calendar, Users, Phone, MapPin, Clock, Shield, QrCode, Ticket, ChevronRight } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { useState, useEffect, useRef } from 'react'
import QRCode from 'qrcode'
import { toast } from 'sonner'
import { Header } from '@/components/Header'
import { useAuthGuard } from '@/hooks/useAuthGuard'
import { supabase } from '@/lib/supabase'
import { norwegianText } from '@/i18n/no'
import { formatPrice, formatTime, cn, completeClaim } from '@/lib/utils'
import type { ClaimWithDealAndRestaurant } from '@/lib/database.types'

// QR Code Modal Component
function QRCodeModal({ code, onClose }: { code: string; onClose: () => void }) {
  const [qrCodeUrl, setQrCodeUrl] = useState<string>('')

  useEffect(() => {
    QRCode.toDataURL(code, {
      width: 256,
      margin: 2,
      color: {
        dark: '#000000',
        light: '#FFFFFF'
      }
    }).then(setQrCodeUrl)
  }, [code])

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl p-6 max-w-sm w-full">
        <h3 className="text-lg font-semibold text-center mb-4">QR-kode for verifikasjon</h3>
        
        {qrCodeUrl && (
          <div className="text-center mb-4">
            <img src={qrCodeUrl} alt="QR Code" className="mx-auto" />
          </div>
        )}
        
        <div className="text-center mb-4">
          <div className="text-xl font-bold tracking-widest text-primary mb-2">
            {code}
          </div>
          <p className="text-sm text-muted-fg">
            Skann QR-koden eller vis koden til restauranten
          </p>
        </div>
        
        <button
          onClick={onClose}
          className="w-full btn-primary"
        >
          Lukk
        </button>
      </div>
    </div>
  )
}

// Swipe to Reveal Component
function SwipeToReveal({ code, claimId, onReveal, onShowQR, onExpire, disabled = false, disabledMessage }: { 
  code: string
  claimId: string
  onReveal?: () => void
  onShowQR?: () => void
  onExpire?: () => void
  disabled?: boolean
  disabledMessage?: string
}) {
  const [dragOffset, setDragOffset] = useState(0)
  const [isRevealed, setIsRevealed] = useState(false)
  const [timeRemaining, setTimeRemaining] = useState(300) // 5 minutes in seconds
  const sliderRef = useRef<HTMLDivElement>(null)
  const startXRef = useRef<number>(0)
  const sliderWidthRef = useRef<number>(0)
  const isDraggingRef = useRef(false)
  const timerRef = useRef<NodeJS.Timeout | null>(null)
  
  const threshold = 0.65 // 65% swipe required (lowered for easier reveal)
  const STORAGE_KEY = `claim-revealed-${claimId}`
  const EXPIRY_TIME = 5 * 60 * 1000 // 5 minutes in milliseconds

  const updateSliderWidth = () => {
    if (sliderRef.current) {
      sliderWidthRef.current = sliderRef.current.offsetWidth
    }
  }

  useEffect(() => {
    updateSliderWidth()
    window.addEventListener('resize', updateSliderWidth)
    return () => window.removeEventListener('resize', updateSliderWidth)
  }, [])

  // Load revealed state from localStorage on mount and check if still valid
  useEffect(() => {
    const checkRevealedState = () => {
      try {
        const stored = localStorage.getItem(STORAGE_KEY)
        if (stored) {
          const { revealedAt } = JSON.parse(stored)
          const now = Date.now()
          const elapsed = now - revealedAt
          const remaining = Math.max(0, EXPIRY_TIME - elapsed)
          const remainingSeconds = Math.floor(remaining / 1000)

          if (remainingSeconds > 0) {
            // Still valid - restore revealed state
            setIsRevealed(true)
            setTimeRemaining(remainingSeconds)
          } else {
            // Expired - clean up storage and mark as used
            localStorage.removeItem(STORAGE_KEY)
            setIsRevealed(false)
            // Call onExpire to mark as used (idempotent, so safe to call)
            onExpire?.()
          }
        }
      } catch (error) {
        console.error('Error loading revealed state:', error)
      }
    }

    if (!disabled) {
      checkRevealedState()
    } else {
      setIsRevealed(false)
      setTimeRemaining(300)
    }

    // Also check when window regains focus (user navigates back)
    const handleFocus = () => {
      if (!disabled) {
        checkRevealedState()
      }
    }
    
    if (!disabled) {
      window.addEventListener('focus', handleFocus)
      return () => window.removeEventListener('focus', handleFocus)
    }

    return () => {}
  }, [STORAGE_KEY, EXPIRY_TIME, onExpire, disabled])

  // Save revealed state to localStorage when revealed for the first time
  useEffect(() => {
    if (isRevealed) {
      try {
        const stored = localStorage.getItem(STORAGE_KEY)
        // Only save if not already stored (first time reveal)
        if (!stored) {
          localStorage.setItem(STORAGE_KEY, JSON.stringify({
            revealedAt: Date.now()
          }))
        }
      } catch (error) {
        console.error('Error saving revealed state:', error)
      }
    } else {
      // Clean up if manually hidden (but keep if expired - onExpire handles that)
      // Don't remove here - let onExpire handle cleanup
    }
  }, [isRevealed, STORAGE_KEY])

  // Timer: countdown based on actual elapsed time (works across navigation)
  useEffect(() => {
    if (!isRevealed || disabled) {
      if (timerRef.current) {
        clearInterval(timerRef.current)
        timerRef.current = null
      }
      return
    }

    // Calculate remaining time based on stored timestamp
    const updateRemainingTime = () => {
      try {
        const stored = localStorage.getItem(STORAGE_KEY)
        if (stored) {
          const { revealedAt } = JSON.parse(stored)
          const now = Date.now()
          const elapsed = now - revealedAt
          const remaining = Math.max(0, EXPIRY_TIME - elapsed)
          const remainingSeconds = Math.floor(remaining / 1000)

          if (remainingSeconds <= 0) {
            // Timer expired - mark as used and hide code
            if (timerRef.current) {
              clearInterval(timerRef.current)
              timerRef.current = null
            }
            setIsRevealed(false)
            localStorage.removeItem(STORAGE_KEY)
            onExpire?.()
            return
          }

          setTimeRemaining(remainingSeconds)
        }
      } catch (error) {
        console.error('Error updating timer:', error)
      }
    }

    // Update immediately
    updateRemainingTime()

    // Update every second
    timerRef.current = setInterval(updateRemainingTime, 1000)

    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current)
        timerRef.current = null
      }
    }
  }, [isRevealed, onExpire, STORAGE_KEY, EXPIRY_TIME, disabled])

  const handleStart = (clientX: number) => {
    if (isRevealed || disabled) return
    updateSliderWidth() // Recalculate width
    startXRef.current = clientX
    isDraggingRef.current = true
  }

  const handleMove = (clientX: number) => {
    if (!isDraggingRef.current || isRevealed || disabled) return
    const diff = clientX - startXRef.current
    const maxOffset = sliderWidthRef.current * 0.85 // Allow drag up to 85% of width
    setDragOffset(Math.max(0, Math.min(diff, maxOffset)))
  }

  const handleEnd = () => {
    if (!isDraggingRef.current || isRevealed || disabled) {
      isDraggingRef.current = false
      return
    }
    
    isDraggingRef.current = false
    const sliderWidth = sliderWidthRef.current
    
    // Use state updater to get current offset value
    setDragOffset((currentOffset) => {
      if (sliderWidth === 0) return 0
      
      const percentage = currentOffset / sliderWidth
      
      if (percentage >= threshold) {
        setIsRevealed(true)
        onReveal?.()
        return sliderWidth * 0.85
      } else {
        return 0
      }
    })
  }

  // Setup touch event listeners with passive: false to allow preventDefault
  useEffect(() => {
    const slider = sliderRef.current
    if (!slider || isRevealed || disabled) return

    const touchStartHandler = (e: TouchEvent) => {
      e.preventDefault()
      if (isRevealed || disabled) return
      updateSliderWidth()
      startXRef.current = e.touches[0].clientX
      isDraggingRef.current = true
    }

    const touchMoveHandler = (e: TouchEvent) => {
      if (!isDraggingRef.current || isRevealed || disabled) return
      e.preventDefault()
      const diff = e.touches[0].clientX - startXRef.current
      const maxOffset = sliderWidthRef.current * 0.85
      setDragOffset(Math.max(0, Math.min(diff, maxOffset)))
    }

    const touchEndHandler = (e: TouchEvent) => {
      e.preventDefault()
      if (!isDraggingRef.current || isRevealed || disabled) {
        isDraggingRef.current = false
        return
      }
      
      isDraggingRef.current = false
      const sliderWidth = sliderWidthRef.current
      
      setDragOffset((currentOffset) => {
        if (sliderWidth === 0) return 0
        
        const percentage = currentOffset / sliderWidth
        
        if (percentage >= threshold) {
          setIsRevealed(true)
          onReveal?.()
          return sliderWidth * 0.85
        } else {
          return 0
        }
      })
    }

    // Add listeners with passive: false to allow preventDefault
    slider.addEventListener('touchstart', touchStartHandler, { passive: false })
    slider.addEventListener('touchmove', touchMoveHandler, { passive: false })
    slider.addEventListener('touchend', touchEndHandler, { passive: false })

    return () => {
      slider.removeEventListener('touchstart', touchStartHandler)
      slider.removeEventListener('touchmove', touchMoveHandler)
      slider.removeEventListener('touchend', touchEndHandler)
    }
  }, [isRevealed, onReveal, threshold, disabled])

  const handleMouseDown = (e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()
    if (disabled) return
    handleStart(e.clientX)
    const handleMouseMove = (e: MouseEvent) => {
      e.preventDefault()
      handleMove(e.clientX)
    }
    const handleMouseUp = (e: MouseEvent) => {
      e.preventDefault()
      handleEnd()
      document.removeEventListener('mousemove', handleMouseMove)
      document.removeEventListener('mouseup', handleMouseUp)
    }
    document.addEventListener('mousemove', handleMouseMove)
    document.addEventListener('mouseup', handleMouseUp)
  }

  if (disabled) {
    return (
      <div className="space-y-2">
        {disabledMessage && (
          <div className="text-sm text-warning font-medium text-center">{disabledMessage}</div>
        )}
        <div className="bg-muted border border-border rounded-xl px-4 py-3 text-sm text-muted-fg text-center">
          Verifikasjonskoden blir tilgjengelig når tidsvinduet åpner.
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-3">
      <div className="relative bg-muted rounded-xl overflow-hidden touch-none">
        <div
          ref={sliderRef}
          className="relative h-14 bg-gradient-to-r from-primary/10 to-primary/5 touch-none select-none"
          style={{ touchAction: 'none' }}
        >
          {/* Slider Track - pointer-events none so it doesn't block touches */}
          <div className="absolute inset-0 flex items-center justify-end px-4 pointer-events-none">
            {!isRevealed && (
              <div className="flex items-center gap-2">
                <span className="text-sm font-medium text-muted-fg whitespace-nowrap">
                  Sveip til høyre for å vise koden
                </span>
                <div className="flex gap-1 pointer-events-none">
                  <ChevronRight className="w-4 h-4 text-muted-fg/50" />
                  <ChevronRight className="w-4 h-4 text-muted-fg/50" />
                  <ChevronRight className="w-4 h-4 text-muted-fg/50" />
                </div>
              </div>
            )}
            {isRevealed && (
              <span className="text-sm font-medium text-muted-fg whitespace-nowrap">
                Verifikasjonskode
              </span>
            )}
          </div>

          {/* Draggable Handle */}
          <div
            className={cn(
              'absolute left-0 top-0 h-full flex items-center justify-center z-20 cursor-grab active:cursor-grabbing touch-none',
              isRevealed && 'pointer-events-none'
            )}
            style={{
              transform: `translateX(${dragOffset}px)`,
              width: '60px',
              touchAction: 'none'
            }}
            onMouseDown={handleMouseDown}
          >
            <div className="w-12 h-12 bg-primary rounded-lg flex items-center justify-center shadow-lg pointer-events-none">
              <ChevronRight className="w-6 h-6 text-white" />
            </div>
          </div>
        </div>

        {/* Revealed Code */}
        {isRevealed && (
          <div className="bg-primary/10 rounded-xl p-4 border-2 border-dashed border-primary/30 mt-2">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                <Shield className="h-4 w-4 text-primary" />
                <span className="text-sm font-medium text-primary">Verifikasjonskode</span>
              </div>
              {onShowQR && (
                <button
                  onClick={onShowQR}
                  className="flex items-center gap-1 text-xs bg-primary/20 text-primary px-2 py-1 rounded-lg hover:bg-primary/30 transition-colors"
                >
                  <QrCode className="w-3 h-3" />
                  QR-kode
                </button>
              )}
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold tracking-widest text-primary mb-1">
                {code}
              </div>
              <p className="text-xs text-muted-fg mb-2">
                Vis denne koden til restauranten når du henter tilbudet
              </p>
              {/* Countdown Timer */}
              <div className="flex items-center justify-center gap-2 mt-3 pt-3 border-t border-primary/20">
                <Clock className="w-3 h-3 text-muted-fg" />
                <span className="text-xs font-medium text-muted-fg">
                  Koden forsvinner om: {Math.floor(timeRemaining / 60)}:{(timeRemaining % 60).toString().padStart(2, '0')}
                </span>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

export function ClaimsPage() {
  const { user, isLoading: authLoading } = useAuthGuard()
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const [selectedQRCode, setSelectedQRCode] = useState<string | null>(null)
  const [view, setView] = useState<'active' | 'history'>('active')

  const { data: claims = [], isLoading: claimsLoading, error: queryError } = useQuery({
    queryKey: ['user-claims'],
    queryFn: async () => {
      if (!user) return []

      console.log('🔍 Fetching claims for user:', user.id)

      const { data, error } = await supabase
        .from('claims')
        .select(`
          *,
          deal:deals(
            *,
            restaurant:restaurants(*)
          )
        `)
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })

      console.log('📊 Claims query result:', { data, error })

      if (error) {
        console.error('❌ Error fetching claims:', error)
        // If it's a column error (like redeemed_at doesn't exist), return empty array instead of throwing
        if (error.message?.includes('column') || error.code === 'PGRST204') {
          console.warn('⚠️ Database schema may be outdated, returning empty claims')
          return []
        }
        throw error
      }

      console.log('✅ Claims fetched successfully:', data?.length || 0, 'claims')
      return data as ClaimWithDealAndRestaurant[]
    },
    enabled: !!user,
    retry: 1,
    retryOnMount: false,
  })

  const getClaimDateValue = (claim: ClaimWithDealAndRestaurant): Date | null => {
    const rawDate = (claim as any).claim_date || claim.created_at
    if (!rawDate) return null
    // If rawDate already includes time component, let Date parse handle it
    if (rawDate.includes('T')) {
      return new Date(rawDate)
    }
    // Treat as YYYY-MM-DD in local time
    return new Date(`${rawDate}T00:00:00`)
  }

  const getWindowBounds = (claim: ClaimWithDealAndRestaurant) => {
    if (!claim.deal) return null
    const baseDate = getClaimDateValue(claim)
    if (!baseDate) return null

    const [startHour = 0, startMinute = 0] = (claim.deal.start_time || '00:00').split(':').map(Number)
    const [endHour = 23, endMinute = 59] = (claim.deal.end_time || '23:59').split(':').map(Number)

    const start = new Date(baseDate)
    start.setHours(startHour, startMinute, 0, 0)

    const end = new Date(baseDate)
    end.setHours(endHour, endMinute, 0, 0)

    if (end <= start) {
      end.setDate(end.getDate() + 1)
    }

    return { start, end }
  }

  const activeClaims = (claims || []).filter((claim) => {
    const claimAny = claim as any
    if (claim.status === 'completed' || claim.status === 'cancelled' || claimAny.redeemed_at) return false
    if (!claim.deal) return false
    return true
  })

  // Derived: history claims (completed/cancelled)
  const historyClaims = (claims || []).filter((claim) => {
    const claimAny = claim as any
    return claim.status === 'completed' || claim.status === 'cancelled' || claimAny.redeemed_at
  })

  // Realtime subscription to claim changes for this user
  useEffect(() => {
    if (!user) return
    const channel = supabase
      .channel(`claims-user-${user.id}`)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'claims', filter: `user_id=eq.${user.id}` }, () => {
        queryClient.invalidateQueries({ queryKey: ['user-claims'] })
      })
      .subscribe()
    return () => { supabase.removeChannel(channel) }
  }, [user, queryClient])

  if (authLoading || !user) {
    return (
      <div className="min-h-screen bg-bg">
        <Header showSearch={false} />
        <div className="flex items-center justify-center py-20">
          <div className="animate-spin rounded-full h-8 w-8 border-2 border-primary border-t-transparent" />
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-bg pb-20">
      <Header showSearch={false} showMenu={false} />

      <main className="px-4 py-6">
        <div className="max-w-2xl mx-auto">
          {/* Header */}
          <div className="mb-6">
            <h1 className="text-2xl font-bold mb-2">{norwegianText.nav.claims}</h1>
            <div className="flex items-center justify-between">
              <p className="text-muted-fg">
                {view === 'active'
                  ? (activeClaims.length > 0
                      ? `${activeClaims.length} aktiv${activeClaims.length === 1 ? 't' : 'e'} tilbud`
                      : 'Ingen aktive tilbud')
                  : (historyClaims.length > 0
                      ? `${historyClaims.length} i historikk`
                      : 'Ingen historikk')
                }
              </p>
              <div className="bg-muted rounded-xl p-1 flex gap-1">
                <button onClick={() => setView('active')} className={cn('px-3 py-1 rounded-lg text-sm', view==='active' ? 'bg-white' : 'opacity-70')}>Aktive</button>
                <button onClick={() => setView('history')} className={cn('px-3 py-1 rounded-lg text-sm', view==='history' ? 'bg-white' : 'opacity-70')}>Historikk</button>
              </div>
            </div>
          </div>

          {/* Error State */}
          {queryError && !claimsLoading && (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <div className="text-6xl mb-4">⚠️</div>
              <h3 className="text-lg font-semibold mb-2">Kunne ikke laste tilbud</h3>
              <p className="text-muted-fg mb-6">
                {queryError instanceof Error ? queryError.message : 'Det oppstod en feil'}
              </p>
              <button
                onClick={() => queryClient.invalidateQueries({ queryKey: ['user-claims'] })}
                className="btn-primary"
              >
                Prøv igjen
              </button>
            </div>
          )}

          {/* Empty State */}
          {!queryError && view==='active' && activeClaims.length === 0 && !claimsLoading && (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <div className="mb-4">
                <Ticket className="w-24 h-24 text-muted-fg/40 mx-auto" strokeWidth={1.5} />
              </div>
              <h3 className="text-lg font-semibold mb-2">{norwegianText.empty.noClaims}</h3>
              <p className="text-muted-fg mb-6">
                Utforsk tilbud og hent dine første besparelser
              </p>
              <button
                onClick={() => navigate('/')}
                className="btn-primary"
              >
                Utforsk tilbud
              </button>
            </div>
          )}

          {/* Loading State */}
          {claimsLoading && (
            <div className="space-y-4">
              {Array.from({ length: 3 }).map((_, i) => (
                <div key={i} className="card p-4">
                  <div className="space-y-3">
                    <div className="flex justify-between items-start">
                      <div className="space-y-2">
                        <div className="skeleton h-4 w-3/4" />
                        <div className="skeleton h-3 w-1/2" />
                      </div>
                      <div className="skeleton h-6 w-16" />
                    </div>
                    <div className="skeleton h-3 w-full" />
                    <div className="flex gap-2">
                      <div className="skeleton h-6 w-20" />
                      <div className="skeleton h-6 w-16" />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Claims List */}
          {view==='active' && activeClaims.length > 0 && (
            <div className="space-y-4">
              {activeClaims.map((claim) => {
                const deal = claim.deal
                const restaurant = deal.restaurant
                const createdAt = new Date(claim.created_at)
                const claimDateValue = getClaimDateValue(claim) || createdAt
                const windowBounds = getWindowBounds(claim)
                const now = new Date()
                const isRecent = Date.now() - createdAt.getTime() < 24 * 60 * 60 * 1000 // 24 hours
                const isRedeemable = windowBounds ? now >= windowBounds.start && now <= windowBounds.end : true
                const isUpcoming = windowBounds ? now < windowBounds.start : false
                const availabilityMessage = (() => {
                  if (!windowBounds) return undefined
                  if (isUpcoming) {
                    const isSameDay = windowBounds.start.toDateString() === now.toDateString()
                    const dateLabel = isSameDay
                      ? ''
                      : `${windowBounds.start.toLocaleDateString('no-NO', {
                          weekday: 'short',
                          day: '2-digit',
                          month: 'short',
                        })} `
                    return `Tilgjengelig ${dateLabel}fra kl ${formatTime(deal.start_time)}`
                  }
                  if (!isRedeemable) {
                    return 'Tidsvinduet er utløpt'
                  }
                  return undefined
                })()

                return (
                  <div key={claim.id} className={cn(
                    'card p-4 space-y-3',
                    isRecent && 'ring-2 ring-success/20 bg-success/5'
                  )}>
                    {/* Header */}
                    <div className="flex justify-between items-start">
                      <div>
                        <h3 className="font-semibold text-lg leading-tight">{deal.title}</h3>
                        <div className="flex items-center gap-1 text-sm text-muted-fg mt-1">
                          <MapPin className="h-3 w-3" />
                          <span>{restaurant.name}</span>
                        </div>
                      </div>
                      
                      {isRecent && (
                        <span className="bg-success text-success-fg text-xs px-2 py-1 rounded-full font-medium">
                          Ny!
                        </span>
                      )}
                    </div>

                    {/* Deal Details */}
                    <div className="flex items-center gap-4 text-sm">
                      <div className="flex items-center gap-1">
                        <Calendar className="h-4 w-4" />
                        <span>{
                          claimDateValue.toLocaleDateString('no-NO', {
                            weekday: 'short',
                            year: 'numeric',
                            month: 'short',
                            day: 'numeric',
                          })
                        }</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <Clock className="h-4 w-4" />
                        <span>{formatTime(deal.start_time)}–{formatTime(deal.end_time)}</span>
                      </div>
                    </div>

                    {/* Claim Details */}
                    <div className="bg-muted/30 rounded-2xl p-3 space-y-2">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-1 text-sm">
                          <Users className="h-4 w-4" />
                          <span>{claim.quantity} person{claim.quantity === 1 ? '' : 'er'}</span>
                        </div>
                        <div className="text-sm font-medium">
                          {claim.service_type === 'dine_in' 
                            ? norwegianText.deal.dineIn 
                            : norwegianText.deal.takeaway
                          }
                        </div>
                      </div>

                      {claim.phone && (
                        <div className="flex items-center gap-1 text-sm text-muted-fg">
                          <Phone className="h-4 w-4" />
                          <span>{claim.phone}</span>
                        </div>
                      )}

                      {claim.special_requests && (
                        <div className="text-sm text-muted-fg">
                          <span className="font-medium">Spesielle ønsker:</span> {claim.special_requests}
                        </div>
                      )}

                      {/* Pricing */}
                      <div className="flex items-center justify-between pt-2 border-t border-border">
                        <div className="text-sm">
                          <span className="text-muted-fg">Rabatt: </span>
                          <span className="font-medium text-success">
                            {deal.discount_percentage}%
                          </span>
                        </div>
                        
                        {deal.original_price && deal.final_price && (
                          <div className="text-sm">
                            <span className="line-through text-muted-fg mr-2">
                              {formatPrice(deal.original_price * claim.quantity)}
                            </span>
                            <span className="font-semibold">
                              {formatPrice(deal.final_price * claim.quantity)}
                            </span>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Verification Code - Swipe to Reveal */}
                    {deal.verification_code && (
                      <SwipeToReveal 
                        code={deal.verification_code}
                        claimId={claim.id}
                        onReveal={() => setSelectedQRCode(deal.verification_code)}
                        onShowQR={() => setSelectedQRCode(deal.verification_code)}
                        onExpire={async () => {
                          try {
                            await completeClaim(claim.id)
                            toast.success('Tilbudet er automatisk markert som brukt')
                            await queryClient.invalidateQueries({ queryKey: ['user-claims'] })
                          } catch (e: any) {
                            console.error('Error auto-completing claim:', e)
                            toast.error(e?.message || 'Kunne ikke markere tilbudet som brukt')
                          }
                        }}
                        disabled={!isRedeemable}
                        disabledMessage={availabilityMessage}
                      />
                    )}

                    {/* Old verification code display - removed */}
                    {false && deal.verification_code && (
                      <div className="bg-primary/10 rounded-2xl p-4 border-2 border-dashed border-primary/30">
                        <div className="flex items-center justify-between mb-2">
                          <div className="flex items-center gap-2">
                            <Shield className="h-4 w-4 text-primary" />
                            <span className="text-sm font-medium text-primary">Verifikasjonskode</span>
                          </div>
                          <button
                            onClick={() => setSelectedQRCode(deal.verification_code)}
                            className="flex items-center gap-1 text-xs bg-primary/20 text-primary px-2 py-1 rounded-lg hover:bg-primary/30 transition-colors"
                          >
                            <QrCode className="h-3 w-3" />
                            QR-kode
                          </button>
                        </div>
                        <div className="text-center">
                          <div className="text-2xl font-bold tracking-widest text-primary mb-1">
                            {deal.verification_code}
                          </div>
                          <p className="text-xs text-muted-fg">
                            Vis denne koden til restauranten når du henter tilbudet
                          </p>
                        </div>
                      </div>
                    )}

                    {/* Actions */}
                    <div className="flex gap-3">
                      <button
                        onClick={() => navigate(`/restaurant/${restaurant.id}`)}
                        className="btn-ghost flex-1 text-sm"
                      >
                        Se restaurant
                      </button>
                      {restaurant.phone && (
                        <button
                          onClick={() => window.open(`tel:${restaurant.phone}`)}
                          className="btn-secondary flex-1 text-sm"
                        >
                          Ring restaurant
                        </button>
                      )}
                    </div>
                  </div>
                )
              })}
            </div>
          )}

          {/* History List */}
          {view==='history' && historyClaims.length > 0 && (
            <div className="space-y-4">
              {historyClaims.map((claim) => {
                const deal = claim.deal
                const restaurant = deal.restaurant
                const claimDate = new Date(claim.created_at)
                return (
                  <div key={claim.id} className="card p-4 space-y-3 opacity-80">
                    <div className="flex justify-between items-start">
                      <div>
                        <h3 className="font-semibold text-lg leading-tight">{deal.title}</h3>
                        <div className="flex items-center gap-1 text-sm text-muted-fg mt-1">
                          <MapPin className="h-3 w-3" />
                          <span>{restaurant.name}</span>
                        </div>
                      </div>
                      <span className={cn('text-xs px-2 py-1 rounded-full', claim.status==='completed' ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-700')}>
                        {claim.status==='completed' ? 'Brukt' : 'Kansellert'}
                      </span>
                    </div>
                    <div className="flex items-center gap-4 text-sm">
                      <div className="flex items-center gap-1">
                        <Calendar className="h-4 w-4" />
                        <span>{claimDate.toLocaleDateString('no-NO')}</span>
                      </div>
                      {(() => {
                        const claimAny = claim as any
                        return claimAny.redeemed_at && (
                          <div className="flex items-center gap-1">
                            <Clock className="h-4 w-4" />
                            <span>Brukt {new Date(claimAny.redeemed_at).toLocaleString('no-NO')}</span>
                          </div>
                        )
                      })()}
                    </div>
                  </div>
                )
              })}
            </div>
          )}

          {/* Summary Card */}
          {view==='active' && activeClaims.length > 0 && (
            <div className="mt-8 card p-4 bg-gradient-to-r from-success/10 to-primary/10">
              <h3 className="font-semibold mb-2">Dine besparelser</h3>
              <div className="grid grid-cols-2 gap-4 text-center">
                <div>
                  <div className="text-2xl font-bold text-success">
                    {activeClaims.reduce((sum, claim) => sum + claim.quantity, 0)}
                  </div>
                  <div className="text-sm text-muted-fg">Totalt hentet</div>
                </div>
                <div>
                  <div className="text-2xl font-bold text-primary">
                    {activeClaims.filter(claim => {
                      const claimDate = new Date(claim.created_at)
                      const now = new Date()
                      return claimDate.getMonth() === now.getMonth() && 
                             claimDate.getFullYear() === now.getFullYear()
                    }).length}
                  </div>
                  <div className="text-sm text-muted-fg">Denne måneden</div>
                </div>
              </div>
            </div>
          )}
        </div>
      </main>

      {/* QR Code Modal */}
      {selectedQRCode && (
        <QRCodeModal 
          code={selectedQRCode} 
          onClose={() => setSelectedQRCode(null)} 
        />
      )}
    </div>
  )
}

