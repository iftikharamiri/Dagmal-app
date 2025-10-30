import React from 'react'
import { useNavigate } from 'react-router-dom'
import { Coins, Flame, Calendar, Clock, Sparkles, Coffee, Pizza, Star, Trophy, Gift, ArrowLeft } from 'lucide-react'
import { supabase } from '@/lib/supabase'
import { toast } from 'sonner'

interface ClaimHistoryItem {
  date: string
  coins: number
}

export function RewardsPage() {
  const navigate = useNavigate()
  const [user, setUser] = React.useState<any>(null)
  const [totalCoins, setTotalCoins] = React.useState(0)
  const [visitStreak, setVisitStreak] = React.useState(0)
  const [lastClaim, setLastClaim] = React.useState<string | null>(null)
  const [canClaim, setCanClaim] = React.useState(true)
  const [isAnimating, setIsAnimating] = React.useState(false)
  const [claimHistory, setClaimHistory] = React.useState<ClaimHistoryItem[]>([])
  const [showConfetti, setShowConfetti] = React.useState(false)

  React.useEffect(() => {
    // Check auth
    supabase.auth.getUser().then(({ data: { user } }) => {
      setUser(user)
      if (!user) {
        setCanClaim(false)
      }
    })

    // Load saved data
    const savedCoins = localStorage.getItem('rewards_totalCoins')
    const savedStreak = localStorage.getItem('rewards_visitStreak')
    const savedLastClaim = localStorage.getItem('rewards_lastClaim')
    const savedHistory = localStorage.getItem('rewards_claimHistory')

    if (savedCoins) setTotalCoins(parseInt(savedCoins))
    if (savedStreak) setVisitStreak(parseInt(savedStreak))
    if (savedLastClaim) setLastClaim(savedLastClaim)
    if (savedHistory) setClaimHistory(JSON.parse(savedHistory))

    // Check daily claim (UTC date to avoid TZ issues)
    const todayUTC = new Date().toISOString().slice(0, 10)
    const lastUTC = savedLastClaim ? new Date(savedLastClaim).toISOString().slice(0, 10) : null
    if (lastUTC === todayUTC) {
      setCanClaim(false)
    }
  }, [])

  const handleClaim = () => {
    if (!user) {
      toast.info('Logg inn for å hente mynter')
      navigate('/auth?reason=rewards')
      return
    }
    if (!canClaim || isAnimating) return

    setIsAnimating(true)
    setShowConfetti(true)

    // Always 1 coin per day
    const coinsEarned = 1
    const newTotal = totalCoins + coinsEarned

    // Streak logic (UTC day comparison)
    const now = new Date()
    const todayUTC = now.toISOString().slice(0, 10)
    let newStreak = visitStreak
    if (!lastClaim) {
      newStreak = 1
    } else {
      const last = new Date(lastClaim)
      const lastUTC = new Date(Date.UTC(last.getUTCFullYear(), last.getUTCMonth(), last.getUTCDate()))
      const prevDayUTC = new Date(lastUTC)
      prevDayUTC.setUTCDate(prevDayUTC.getUTCDate() + 1)
      const prevDayStr = prevDayUTC.toISOString().slice(0, 10)
      if (prevDayStr === todayUTC) newStreak = visitStreak + 1
      else if (lastUTC.toISOString().slice(0,10) === todayUTC) newStreak = visitStreak
      else newStreak = 1
    }

    setTotalCoins(newTotal)
    setVisitStreak(newStreak)
    setLastClaim(now.toISOString())
    setCanClaim(false)

    const newHistory: ClaimHistoryItem[] = [
      { date: now.toISOString(), coins: coinsEarned },
      ...claimHistory.slice(0, 9),
    ]
    setClaimHistory(newHistory)

    localStorage.setItem('rewards_totalCoins', newTotal.toString())
    localStorage.setItem('rewards_visitStreak', newStreak.toString())
    localStorage.setItem('rewards_lastClaim', now.toISOString())
    localStorage.setItem('rewards_claimHistory', JSON.stringify(newHistory))

    toast.success('+1 mynt! Kom tilbake i morgen for flere.')

    setTimeout(() => {
      setIsAnimating(false)
      setShowConfetti(false)
    }, 900)
  }

  const formatDate = (iso: string) => {
    const d = new Date(iso)
    return d.toLocaleString('no-NO', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })
  }

  const formatLastClaim = () => {
    if (!lastClaim) return 'Aldri'
    const d = new Date(lastClaim)
    const diffMin = Math.floor((Date.now() - d.getTime()) / 60000)
    if (diffMin < 60) return `${diffMin} min siden`
    const diffH = Math.floor(diffMin / 60)
    if (diffH < 24) return `${diffH} t siden`
    return formatDate(lastClaim)
  }

  return (
    <div className="min-h-screen bg-bg relative overflow-hidden">
      {showConfetti && (
        <div className="absolute inset-0 pointer-events-none z-40">
          {Array.from({ length: 24 }).map((_, i) => (
            <div
              key={i}
              className="absolute w-2 h-2 bg-primary rounded-full animate-bounce"
              style={{ left: `${Math.random() * 100}%`, top: `${Math.random() * 100}%`, animationDelay: `${Math.random()}s` }}
            />
          ))}
        </div>
      )}

      <main className="relative z-10 max-w-4xl mx-auto px-4 py-10">
        <button
          onClick={() => navigate('/')}
          className="absolute top-4 left-4 inline-flex items-center text-muted-fg hover:text-primary p-2 rounded-lg"
          aria-label="Tilbake"
          title="Tilbake"
        >
          <ArrowLeft className="h-5 w-5" />
        </button>
        <div className="text-center mb-8">
          <h1 className="text-4xl md:text-5xl font-bold mb-2">Mynt</h1>
          <p className="text-muted-fg">Hent 1 mynt per dag – bruk på kaffe eller mat</p>
        </div>

        <div className="mb-6 p-6 text-center bg-card border border-border rounded-2xl shadow-sm relative">
          {/* Streak badge in top-right */}
          <div className="absolute top-3 right-3 inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 text-primary text-sm">
            <Flame className="w-4 h-4" />
            <span className="font-semibold">{visitStreak}</span>
          </div>
          <div className="inline-flex items-center justify-center w-16 h-16 mb-3 rounded-full bg-primary/15">
            <Coins className="w-8 h-8 text-primary" />
          </div>
          <div className="text-5xl font-bold mb-1">{totalCoins}</div>
          <p className="text-muted-fg">Totale mynter</p>
          <div className="mt-3 flex justify-center">
            <button
              onClick={handleClaim}
              disabled={!user || !canClaim || isAnimating}
              className="px-6 py-2 rounded-lg bg-primary text-primary-fg hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed inline-flex items-center gap-2 text-sm"
            >
              {!user ? 'Logg inn for å hente' : canClaim ? (<><Sparkles className="w-4 h-4" />Hent dagens mynt</>) : 'Allerede hentet'}
            </button>
          </div>
        </div>

        {/* Streak moved into totals card */}

        {/* Siste krav section removed per request */}

        {/* Redeem Section */}
        <div className="mt-6 p-6 bg-card border border-border rounded-2xl">
          <h3 className="text-xl font-semibold mb-4 flex items-center gap-2">
            <Gift className="w-5 h-5 text-primary" /> Løs inn mynter
          </h3>
          <div className="grid md:grid-cols-4 gap-4">
            {[
              { label: 'Kaffe', cost: 7, Icon: Coffee },
              { label: 'Snack', cost: 15, Icon: Pizza },
              { label: 'Lunsj', cost: 30, Icon: Star },
              { label: 'Premium', cost: 100, Icon: Trophy },
            ].map(({ label, cost, Icon }) => (
              <button
                key={label}
                onClick={() => {
                  if (totalCoins < cost) {
                    toast.error('Ikke nok mynter')
                    return
                  }
                  const newTotal = totalCoins - cost
                  setTotalCoins(newTotal)
                  localStorage.setItem('rewards_totalCoins', newTotal.toString())
                  toast.success(`${label} innløst! -${cost} mynter`)
                }}
                className="text-left p-5 rounded-2xl bg-card/80 hover:bg-muted/40 border border-border transition-colors group"
              >
                <div className="flex flex-col items-center justify-center py-4">
                  <div className="w-14 h-14 rounded-full bg-primary/15 flex items-center justify-center mb-3">
                    <Icon className="w-6 h-6 text-primary" />
                  </div>
                  <div className="text-lg font-semibold mb-1">{label}</div>
                  <div className="text-sm text-muted-fg inline-flex items-center gap-1">
                    <Coins className="w-4 h-4" /> {cost} mynter
                  </div>
                </div>
              </button>
            ))}
          </div>
        </div>

        {/* Claim button now lives in the Totale mynter card above */}
      </main>
    </div>
  )
}

export default RewardsPage


