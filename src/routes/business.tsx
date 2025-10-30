import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { 
  Building2, Plus, BarChart3, Settings, Clock, Users, TrendingUp, 
  Calendar, MapPin, Phone, Mail, ArrowLeft, Menu, PieChart, 
  Target, DollarSign, Award, ChefHat
} from 'lucide-react'
import { norwegianText } from '@/i18n/no'
import { cn } from '@/lib/utils'
import { supabase } from '@/lib/supabase'

export function BusinessPage() {
  const navigate = useNavigate()
  const [currentView, setCurrentView] = useState<'landing' | 'dashboard' | 'restaurant-setup' | 'menu' | 'offers'>('landing')

  // Check if user has a restaurant
  const { data: restaurant, isLoading } = useQuery({
    queryKey: ['owned-restaurant'],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return null

      const { data, error } = await supabase
        .from('restaurants')
        .select('*')
        .eq('owner_id', user.id)
        .single()

      if (error && error.code !== 'PGRST116') throw error
      return data
    },
  })

  // Check if user has pending application
  const { data: application } = useQuery({
    queryKey: ['restaurant-application'],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return null

      const { data, error } = await supabase
        .from('restaurant_applications')
        .select('*')
        .eq('user_id', user.id)
        .eq('status', 'pending')
        .single()

      if (error && error.code !== 'PGRST116') throw error
      return data
    },
  })

  // If user has approved restaurant, redirect to dashboard (but not immediately to avoid white page)
  React.useEffect(() => {
    if (restaurant) {
      navigate('/business/dashboard')
    }
  }, [restaurant, navigate])

  // Handle loading state
  if (isLoading) {
    return (
      <div className="min-h-screen bg-bg flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p>Laster...</p>
        </div>
      </div>
    )
  }

  // Show redirect loading if they have a restaurant (while redirect is happening)
  if (restaurant) {
    return (
      <div className="min-h-screen bg-bg flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p>Omdirigerer til dashboard...</p>
        </div>
      </div>
    )
  }

  if (currentView === 'landing') {
    return (
      <div className="min-h-screen bg-bg">
        {/* Hero Section */}
        <div className="bg-gradient-to-br from-primary to-accent text-white">
          <div className="px-4 py-6">
            <button
              onClick={() => navigate('/')}
              className="flex items-center gap-2 text-white/80 hover:text-white mb-6"
            >
              <ArrowLeft className="h-4 w-4" />
              <span>Tilbake til appen</span>
            </button>

            <div className="max-w-4xl mx-auto text-center py-12">
              <div className="mb-6">
                <Building2 className="h-16 w-16 mx-auto mb-4 text-white/90" />
              </div>
              <h1 className="text-3xl md:text-4xl font-bold mb-4">
                Spisly for Bedrifter
              </h1>
              {/* Removed marketing subtitle per request */}
              
              {application ? (
                // Show pending application status
                <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-6 max-w-md mx-auto">
                  <div className="text-6xl mb-4">⏳</div>
                  <h3 className="text-xl font-semibold mb-2">Søknad under behandling</h3>
                  <p className="text-white/90 mb-4">
                    Vi gjennomgår søknaden din. Du vil få beskjed på e-post innen 2-3 virkedager.
                  </p>
                  <p className="text-sm text-white/70">
                    Restaurant: {application.restaurant_name}
                  </p>
                </div>
              ) : (
                // Show registration CTA
                <div className="flex flex-col sm:flex-row gap-4 justify-center">
                  <button
                    onClick={() => navigate('/business/register-restaurant')}
                    className="bg-white text-primary px-8 py-4 rounded-2xl font-semibold hover:bg-white/90 transition-colors shadow-lg"
                  >
                    Registrer restaurant
                  </button>
                  <button
                    onClick={() => { /* deaktivert */ }}
                    className="border-2 border-white text-white px-8 py-4 rounded-2xl font-semibold opacity-90 hover:opacity-90 cursor-default"
                    aria-disabled="true"
                    title="Kommer snart"
                  >
                    Lær mer
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Features Grid */}
        <div className="px-4 py-12">
          <div className="max-w-6xl mx-auto">
            <h2 className="text-2xl font-bold text-center mb-8">Alt du trenger for å lykkes</h2>
            
            <div className="grid md:grid-cols-2 gap-6 mb-12">
              <div className="card p-6 text-center">
                <Target className="h-12 w-12 mx-auto mb-4 text-primary" />
                <h3 className="font-semibold mb-2">Målrettede tilbud</h3>
                <p className="text-sm text-muted-fg">Lag smarte rabatter for spesifikke tidspunkt og måltider</p>
              </div>
              
              <div className="card p-6 text-center">
                <Award className="h-12 w-12 mx-auto mb-4 text-secondary" />
                <h3 className="font-semibold mb-2">Økt synlighet</h3>
                <p className="text-sm text-muted-fg">SEO- og AI optimalisering slik at restauranten dukker opp når folk bestiller via AI-plattformer.</p>
              </div>
            </div>

            {/* Contact */}
            <div className="card p-8 max-w-2xl mx-auto text-center">
              <h3 className="text-xl font-semibold mb-4">Klar til å komme i gang?</h3>
              <p className="text-muted-fg mb-6">
                Kontakt vårt salgsteam for en personlig demo og spesialtilbud for nye partnere.
              </p>
              
              <div className="flex flex-col sm:flex-row gap-3">
                <button className="btn-primary flex-1">
                  <Mail className="h-4 w-4 mr-2" />
                  Kontakt salg
                </button>
                <button className="btn-ghost flex-1">
                  <Phone className="h-4 w-4 mr-2" />
                  Ring oss
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    )
  }

  if (currentView === 'dashboard') {
    return (
      <div className="min-h-screen bg-bg">
        {/* Dashboard Header */}
        <div className="bg-white border-b px-4 py-4">
          <div className="flex items-center justify-between max-w-6xl mx-auto">
            <div className="flex items-center gap-4">
              <button
                onClick={() => setCurrentView('landing')}
                className="btn-ghost p-2"
              >
                <ArrowLeft className="h-4 w-4" />
              </button>
              <h1 className="text-xl font-bold">Restaurant Dashboard</h1>
            </div>
            
            <div className="flex items-center gap-3">
              <span className="text-sm text-muted-fg">Fjord & Furu</span>
              <div className="w-8 h-8 bg-primary/10 rounded-full flex items-center justify-center">
                <Building2 className="h-4 w-4 text-primary" />
              </div>
            </div>
          </div>
        </div>

        <div className="max-w-6xl mx-auto px-4 py-6">
          {/* Quick Actions */}
          <div className="grid md:grid-cols-4 gap-4 mb-8">
            <button
              onClick={() => setCurrentView('menu')}
              className="card p-4 hover:shadow-md transition-shadow text-left"
            >
              <Menu className="h-8 w-8 mb-2 text-success" />
              <h3 className="font-semibold mb-1">Rediger meny</h3>
              <p className="text-sm text-muted-fg">Legg til nye retter og kategorier</p>
            </button>

            <button className="card p-4 hover:shadow-md transition-shadow text-left">
              <BarChart3 className="h-8 w-8 mb-2 text-secondary" />
              <h3 className="font-semibold mb-1">Statistikk</h3>
              <p className="text-sm text-muted-fg">Se salg og kundedata</p>
            </button>

            <button className="card p-4 hover:shadow-md transition-shadow text-left">
              <Settings className="h-8 w-8 mb-2 text-muted-fg" />
              <h3 className="font-semibold mb-1">Innstillinger</h3>
              <p className="text-sm text-muted-fg">Restaurant og brukerkonto</p>
            </button>
          </div>

          {/* Stats Cards */}
          <div className="grid md:grid-cols-3 gap-6 mb-8">
            <div className="card p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-semibold">Dagens inntekt</h3>
                <DollarSign className="h-5 w-5 text-success" />
              </div>
              <div className="text-2xl font-bold text-success mb-2">4,250 kr</div>
              <p className="text-sm text-muted-fg">+12% fra i går</p>
            </div>

            <div className="card p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-semibold">Aktive tilbud</h3>
                <Target className="h-5 w-5 text-primary" />
              </div>
              <div className="text-2xl font-bold text-primary mb-2">3</div>
              <p className="text-sm text-muted-fg">2 takeaway, 1 dine-in</p>
            </div>

            <div className="card p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-semibold">Nye kunder</h3>
                <Users className="h-5 w-5 text-secondary" />
              </div>
              <div className="text-2xl font-bold text-secondary mb-2">28</div>
              <p className="text-sm text-muted-fg">Denne uken</p>
            </div>
          </div>

          {/* Recent Offers */}
          <div className="card p-6">
            <h3 className="font-semibold mb-4">Aktive og planlagte tilbud</h3>
            <div className="space-y-4">
              {[
                { name: 'Dagens fisk', discount: '30%', mode: 'Spise på stedet', time: '14:00-15:00', status: 'Aktiv', customers: 12 },
                { name: 'Pizza Margherita', discount: '40 kr', mode: 'Takeaway', time: '16:00-18:00', status: 'Planlagt', customers: 8 },
                { name: 'Vegetarburger', discount: '25%', mode: 'Begge', time: '12:00-14:00', status: 'Planlagt', customers: 15 }
              ].map((offer, index) => (
                <div key={index} className="flex items-center justify-between p-4 bg-muted/30 rounded-xl">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <h4 className="font-medium">{offer.name}</h4>
                      <span className="bg-danger text-white text-xs px-2 py-1 rounded-full">
                        {offer.discount}
                      </span>
                      <span className={cn(
                        'text-xs px-2 py-1 rounded-full',
                        offer.status === 'Aktiv' ? 'bg-success/10 text-success' : 'bg-warning/10 text-warning'
                      )}>
                        {offer.status}
                      </span>
                    </div>
                    <div className="flex items-center gap-4 text-sm text-muted-fg">
                      <span className="flex items-center gap-1">
                        <Clock className="h-3 w-3" />
                        {offer.time}
                      </span>
                      <span>{offer.mode}</span>
                      <span className="flex items-center gap-1">
                        <Users className="h-3 w-3" />
                        {offer.customers} forventede kunder
                      </span>
                    </div>
                  </div>
                  <button className="btn-ghost text-sm">Rediger</button>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    )
  }

  // Other views would go here (restaurant-setup, menu, offers)
  return (
    <div className="min-h-screen bg-bg flex items-center justify-center">
      <div className="card p-8 text-center max-w-md mx-4">
        <ChefHat className="h-12 w-12 mx-auto mb-4 text-primary" />
        <h2 className="text-xl font-semibold mb-2">Under utvikling</h2>
        <p className="text-muted-fg mb-6">
          {currentView === 'restaurant-setup' && 'Restaurant registrering kommer snart'}
          {currentView === 'menu' && 'Meny-editor kommer snart'}
          {currentView === 'offers' && 'Tilbud-builder kommer snart'}
        </p>
        <button
          onClick={() => setCurrentView('dashboard')}
          className="btn-primary w-full"
        >
          Tilbake til dashboard
        </button>
      </div>
    </div>
  )
}

