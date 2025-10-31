import { useQuery, useQueryClient } from '@tanstack/react-query'
import { Calendar, Users, Phone, MapPin, Clock, Shield, QrCode } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { useState, useEffect } from 'react'
import QRCode from 'qrcode'
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

export function ClaimsPage() {
  const { user, isLoading: authLoading } = useAuthGuard()
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const [selectedQRCode, setSelectedQRCode] = useState<string | null>(null)
  const [view, setView] = useState<'active' | 'history'>('active')

  const { data: claims = [], isLoading: claimsLoading } = useQuery({
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
        throw error
      }

      console.log('✅ Claims fetched successfully:', data?.length || 0, 'claims')
      return data as ClaimWithDealAndRestaurant[]
    },
    enabled: !!user,
  })

  // Derived: active, non-expired claims only
  const activeClaims = (claims || []).filter((claim) => {
    const now = new Date()
    if (claim.status === 'completed' || claim.status === 'cancelled' || (claim as any).redeemed_at) return false
    // keep only allowed statuses (query already filtered) and time window is valid if deal present
    if (!claim.deal) return false
    try {
      const start = claim.deal.start_time ? new Date(`1970-01-01T${claim.deal.start_time}Z`) : null
      const end = claim.deal.end_time ? new Date(`1970-01-01T${claim.deal.end_time}Z`) : null
      // If times are provided as HH:mm, we treat validity as within same day; UI-level guard: just ensure end is in the future relative to local time window
      if (end) {
        const nowTime = now.getUTCHours() * 60 + now.getUTCMinutes()
        const endTime = end.getUTCHours() * 60 + end.getUTCMinutes()
        return nowTime <= endTime
      }
      return true
    } catch {
      return true
    }
  })

  // Derived: history claims (completed/cancelled)
  const historyClaims = (claims || []).filter((claim) => 
    claim.status === 'completed' || claim.status === 'cancelled' || (claim as any).redeemed_at
  )

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

          {/* Empty State */}
          {view==='active' && activeClaims.length === 0 && !claimsLoading && (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <div className="text-6xl mb-4">🎫</div>
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
                const claimDate = new Date(claim.created_at)
                const isRecent = Date.now() - claimDate.getTime() < 24 * 60 * 60 * 1000 // 24 hours

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
                        <span>{claimDate.toLocaleDateString('no-NO')}</span>
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

                    {/* Verification Code */}
                    {deal.verification_code && (
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
                      <button
                        onClick={async () => {
                          try {
                            await completeClaim(claim.id)
                            await queryClient.invalidateQueries({ queryKey: ['user-claims'] })
                          } catch (e) {
                            console.error(e)
                            alert('Kunne ikke markere som brukt')
                          }
                        }}
                        className="btn-primary flex-1 text-sm"
                      >
                        Marker som brukt
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
                      {(claim as any).redeemed_at && (
                        <div className="flex items-center gap-1">
                          <Clock className="h-4 w-4" />
                          <span>Brukt {new Date((claim as any).redeemed_at).toLocaleString('no-NO')}</span>
                        </div>
                      )}
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

