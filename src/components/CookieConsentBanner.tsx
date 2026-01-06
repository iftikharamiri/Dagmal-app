import { useState, useEffect } from 'react'
import { Cookie, X, Settings, Check } from 'lucide-react'
import { hasConsent, acceptAllCookies, rejectOptionalCookies, saveConsentPreferences, getConsentPreferences, type ConsentCategory } from '@/lib/consent'
import { cn } from '@/lib/utils'

export function CookieConsentBanner() {
  const [showBanner, setShowBanner] = useState(false)
  const [showSettings, setShowSettings] = useState(false)
  const [preferences, setPreferences] = useState(getConsentPreferences())

  useEffect(() => {
    // Show banner if user hasn't given consent yet
    if (!hasConsent()) {
      // Small delay to avoid flash
      const timer = setTimeout(() => setShowBanner(true), 500)
      return () => clearTimeout(timer)
    }
  }, [])

  const handleAcceptAll = () => {
    acceptAllCookies()
    setShowBanner(false)
    setShowSettings(false)
  }

  const handleRejectOptional = () => {
    rejectOptionalCookies()
    setShowBanner(false)
    setShowSettings(false)
  }

  const handleSavePreferences = () => {
    saveConsentPreferences(preferences)
    setShowBanner(false)
    setShowSettings(false)
  }

  const togglePreference = (category: ConsentCategory) => {
    if (category === 'necessary') return // Cannot disable necessary
    
    setPreferences(prev => ({
      ...prev,
      [category]: !prev[category],
    }))
  }

  if (!showBanner) return null

  return (
    <div className="fixed bottom-0 left-0 right-0 z-50 p-4 pointer-events-none">
      <div className="max-w-4xl mx-auto pointer-events-auto">
        <div className="bg-card border border-border rounded-2xl shadow-2xl p-6">
          {!showSettings ? (
            // Main consent banner
            <div className="space-y-4">
              <div className="flex items-start gap-4">
                <div className="p-2 bg-primary/10 rounded-xl">
                  <Cookie className="h-6 w-6 text-primary" />
                </div>
                <div className="flex-1">
                  <h3 className="text-lg font-semibold text-fg mb-2">
                    Cookies
                  </h3>
                  <p className="text-sm text-muted-fg leading-relaxed">
                    Vi bruker cookies for at appen skal fungere og for å forbedre tjenesten. Du kan endre innstillingene dine.
                  </p>
                </div>
                <button
                  onClick={() => setShowBanner(false)}
                  className="p-1 text-muted-fg hover:text-fg transition-colors"
                  aria-label="Lukk"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>

              <div className="flex flex-col sm:flex-row gap-3">
                <button
                  onClick={handleAcceptAll}
                  className="btn-primary flex-1"
                >
                  Godta alle
                </button>
                <button
                  onClick={handleRejectOptional}
                  className="btn-ghost flex-1"
                >
                  Avslå alt unødvendig
                </button>
                <button
                  onClick={() => setShowSettings(true)}
                  className="btn-ghost flex-1 flex items-center justify-center gap-2"
                >
                  <Settings className="h-4 w-4" />
                  Innstillinger
                </button>
              </div>
            </div>
          ) : (
            // Settings view
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold text-fg">
                  Cookies-innstillinger
                </h3>
                <button
                  onClick={() => setShowSettings(false)}
                  className="p-1 text-muted-fg hover:text-fg transition-colors"
                  aria-label="Tilbake"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>

              <p className="text-sm text-muted-fg leading-relaxed">
                Vi bruker cookies for å få appen til å fungere, og for å forbedre tjenesten vår. 
                Du kan når som helst velge om vi bare skal bruke nødvendige cookies, eller også bruke data 
                til analyse og tilpasset innhold.
              </p>

              <div className="space-y-4">
                {/* Necessary cookies */}
                <div className="p-4 bg-muted/50 rounded-xl">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-3">
                      <div className={cn(
                        "w-5 h-5 rounded border-2 flex items-center justify-center",
                        "bg-primary border-primary"
                      )}>
                        <Check className="h-3 w-3 text-primary-fg" />
                      </div>
                      <div>
                        <h4 className="font-medium text-fg">Nødvendige informasjonskapsler</h4>
                        <p className="text-xs text-muted-fg mt-0.5">
                          Alltid aktivert
                        </p>
                      </div>
                    </div>
                  </div>
                  <p className="text-sm text-muted-fg ml-8">
                    Disse informasjonskapslene er nødvendige for at appen skal fungere. 
                    De inkluderer autentisering, sikkerhet og grunnleggende funksjonalitet.
                  </p>
                </div>

                {/* Analytics cookies */}
                <div className="p-4 bg-muted/50 rounded-xl">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-3">
                      <button
                        onClick={() => togglePreference('analytics')}
                        className={cn(
                          "w-5 h-5 rounded border-2 flex items-center justify-center transition-colors",
                          preferences.analytics
                            ? "bg-primary border-primary"
                            : "border-border hover:border-primary/50"
                        )}
                        aria-label="Aktiver/deaktiver analyse"
                      >
                        {preferences.analytics && (
                          <Check className="h-3 w-3 text-primary-fg" />
                        )}
                      </button>
                      <div>
                        <h4 className="font-medium text-fg">Analyseinformasjonskapsler</h4>
                        <p className="text-xs text-muted-fg mt-0.5">
                          Hjelper oss forstå hvordan du bruker appen
                        </p>
                      </div>
                    </div>
                  </div>
                  <p className="text-sm text-muted-fg ml-8">
                    Disse informasjonskapslene samler inn anonymisert informasjon om hvordan du bruker appen, 
                    slik at vi kan forbedre funksjonaliteten og brukeropplevelsen.
                  </p>
                </div>

                {/* Marketing cookies */}
                <div className="p-4 bg-muted/50 rounded-xl">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-3">
                      <button
                        onClick={() => togglePreference('marketing')}
                        className={cn(
                          "w-5 h-5 rounded border-2 flex items-center justify-center transition-colors",
                          preferences.marketing
                            ? "bg-primary border-primary"
                            : "border-border hover:border-primary/50"
                        )}
                        aria-label="Aktiver/deaktiver markedsføring"
                      >
                        {preferences.marketing && (
                          <Check className="h-3 w-3 text-primary-fg" />
                        )}
                      </button>
                      <div>
                        <h4 className="font-medium text-fg">Markedsføringsinformasjonskapsler</h4>
                        <p className="text-xs text-muted-fg mt-0.5">
                          Personlig tilpasset innhold og tilbud
                        </p>
                      </div>
                    </div>
                  </div>
                  <p className="text-sm text-muted-fg ml-8">
                    Disse informasjonskapslene brukes til å vise deg relevante tilbud og personlig tilpasset innhold 
                    basert på dine preferanser og tidligere aktivitet.
                  </p>
                </div>
              </div>

              <div className="flex gap-3 pt-2">
                <button
                  onClick={handleSavePreferences}
                  className="btn-primary flex-1"
                >
                  Lagre innstillinger
                </button>
                <button
                  onClick={handleRejectOptional}
                  className="btn-ghost flex-1"
                >
                  Avslå alt unødvendig (kun nødvendige)
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

