import React from 'react'
import { useState, useEffect, useRef } from 'react'
import { ChevronDown, Mic, ArrowLeft, Check, ArrowUp, MoreHorizontal } from 'lucide-react'
import { useNavigate } from 'react-router-dom'

export function AIPage() {
  const navigate = useNavigate()
  const [inputText, setInputText] = useState('')
  const [messages, setMessages] = useState<Array<{ role: 'user' | 'sofie'; text: string }>>([])
  const [showSofieDropdown, setShowSofieDropdown] = useState(false)
  const endRef = useRef<HTMLDivElement | null>(null)
  const dropdownRef = useRef<HTMLDivElement | null>(null)
  const jokesRef = useRef<string[]>([
    'Jeg prøvde å spise en klokke. Veldig tidskrevende.',
    'Hva sa den ene veggen til den andre veggen? vi ses på hjørnet!',
    'hvorfor har elgen horn? Fordi det ville sett dumt ut med rundstykker.'
  ])

  const sofieDisabledText = 'Jeg er under oppgradering, kommer straks tilbake. Vil du ha en vits? Skriv 1.'

  function handleSubmit(e?: React.FormEvent) {
    if (e) e.preventDefault()
    const trimmed = inputText.trim()
    if (!trimmed) return
    if (trimmed === '1') {
      const jokes = jokesRef.current
      const randomJoke = jokes[Math.floor(Math.random() * jokes.length)]
      setMessages(prev => [...prev, { role: 'user', text: trimmed }, { role: 'sofie', text: randomJoke }])
    } else {
      setMessages(prev => [...prev, { role: 'user', text: trimmed }, { role: 'sofie', text: sofieDisabledText }])
    }
    setInputText('')
  }

  function handleMicClick() {
    // For now, simulate the same behavior as submit
    handleSubmit()
  }

  // Auto scroll to the latest message
  useEffect(() => {
    if (endRef.current) {
      endRef.current.scrollIntoView({ behavior: 'smooth', block: 'end' })
    }
  }, [messages])

  // Close dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setShowSofieDropdown(false)
      }
    }

    if (showSofieDropdown) {
      document.addEventListener('mousedown', handleClickOutside)
      return () => document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [showSofieDropdown])

  const hasConversation = messages.length > 0

  return (
    <div className="min-h-screen bg-bg flex flex-col">
      {/* Sticky Header */}
      <div className="fixed top-0 left-0 right-0 px-3 py-2 border-b border-border/60 bg-bg/90 backdrop-blur z-40">
        <div className="max-w-4xl mx-auto">
          <div className="flex items-center justify-between gap-3">
            {/* Back button */}
            <div className="flex items-center gap-2">
              <button
                onClick={() => navigate(-1)}
                className="inline-flex items-center justify-center rounded-full border border-border bg-card h-8 w-8 hover:bg-muted transition-colors"
                aria-label="Tilbake"
              >
                <ArrowLeft className="h-3 w-3 text-fg" />
              </button>
            </div>

            {/* Center group: Sofie 0 selector */}
            <div className="flex-1 flex items-center justify-center">
              <div className="relative" ref={dropdownRef}>
                <button
                  onClick={() => setShowSofieDropdown(!showSofieDropdown)}
                  className="inline-flex items-center gap-1.5 text-sm sm:text-base font-semibold text-fg px-0 py-0 hover:text-fg transition-colors"
                >
                  <span>Sofie 0</span>
                  <ChevronDown className={`h-3 w-3 transition-transform ${showSofieDropdown ? 'rotate-180' : ''}`} />
                </button>
                
                {/* Dropdown Menu */}
                {showSofieDropdown && (
                  <div className="absolute top-full right-0 mt-2 w-60 bg-bg rounded-xl shadow-xl border border-border z-50 overflow-hidden">
                    {/* Sofie 0 - Selected (no special background) */}
                    <div className="px-4 py-3 border-b border-border">
                      <div className="flex items-center justify-between">
                        <div>
                          <div className="text-sm font-medium text-fg">Sofie 0</div>
                          <div className="text-xs text-muted-fg mt-0.5">Nåværende versjon</div>
                        </div>
                        <Check className="h-4 w-4 text-primary" />
                      </div>
                    </div>
                    
                    {/* Sofie 1 - Coming Soon (keeps background) */}
                    <div className="px-4 py-3 bg-card/70">
                      <div className="flex items-center justify-between">
                        <div>
                          <div className="text-sm font-medium text-muted-fg">Sofie 1</div>
                          <div className="text-xs text-muted-fg mt-0.5">Kommer snart</div>
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Right-side menu (three dots) */}
            <div className="flex items-center justify-end w-8">
              <button
                type="button"
                className="inline-flex items-center justify-center h-7 w-7 rounded-full hover:bg-muted transition-colors text-muted-fg"
                aria-label="Meny"
              >
                <MoreHorizontal className="h-4 w-4" />
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Content Area (scrolls under header) */}
      <div className="flex-1 pt-16">
        {!hasConversation ? (
          // Initial state: Centered input
          <div className="w-full px-4 pt-4">
            <div className="max-w-3xl mx-auto text-center">
              <h1 className="text-2xl sm:text-3xl md:text-4xl font-semibold tracking-tight mb-6">
                Hva har du lyst på i dag?
              </h1>
              <div className="bg-card/70 backdrop-blur supports-[backdrop-filter]:bg-card/50 border border-border rounded-2xl shadow-sm overflow-hidden">
                <form className="flex items-center gap-2 pr-2" onSubmit={handleSubmit}>
                  <input
                    type="text"
                    value={inputText}
                    onChange={(e) => setInputText(e.target.value)}
                    placeholder="Skriv hva som helst"
                    className="w-full bg-transparent px-4 sm:px-6 py-4 text-left outline-none placeholder:text-muted-fg/70 text-sm sm:text-base"
                    aria-label="Sofie AI søk"
                  />
                  <div className="flex items-center gap-1 sm:gap-2">
                    <button
                      type="button"
                      onClick={handleMicClick}
                      className="p-2 rounded-full hover:bg-muted transition-colors text-muted-fg"
                      aria-label="Snakk"
                    >
                      <Mic className="h-5 w-5" />
                    </button>
                    <button
                      type="submit"
                      className="inline-flex items-center justify-center rounded-full bg-primary text-primary-fg px-3 py-2 hover:bg-primary/90 transition-colors"
                      aria-label="Send"
                    >
                      <ArrowUp className="h-4 w-4" />
                    </button>
                  </div>
                </form>
              </div>
              <p className="mt-3 text-xs text-muted-fg">
               Sofie hjelper deg med restauranter, tilbud og allergihensyn.
              </p>
            </div>
          </div>
        ) : (
          // Conversation state: Scrollable messages
          <div className="h-full overflow-y-auto px-4 pb-28">
            <div className="max-w-3xl mx-auto">
              <div className="space-y-4 py-4">
                {messages.map((m, i) => (
                  <div key={i} className={m.role === 'user' ? 'text-right' : 'text-left'}>
                    {m.role === 'sofie' ? (
                      <div className="inline-flex items-start gap-3">
                        <div className="w-7 h-7 rounded-full bg-blue-500 flex items-center justify-center text-white text-[11px] font-semibold flex-shrink-0">S</div>
                        <div className="inline-block bg-muted px-4 py-3 rounded-2xl rounded-tl-sm text-base leading-relaxed text-left max-w-[85%]">
                          {m.text}
                        </div>
                      </div>
                    ) : (
                      <div className="inline-block bg-primary text-primary-fg px-4 py-3 rounded-2xl rounded-tr-sm text-base leading-relaxed max-w-[85%]">
                        {m.text}
                      </div>
                    )}
                  </div>
                ))}
                <div ref={endRef} />
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Sticky Footer Input - Only shown when conversation has started */}
      {hasConversation && (
        <div className="fixed bottom-0 left-0 right-0 bg-bg border-t border-border px-4 py-3 safe-area-inset-bottom z-50">
          <div className="max-w-3xl mx-auto">
            <form className="flex items-center gap-2" onSubmit={handleSubmit}>
              <div className="flex-1 bg-card/70 backdrop-blur supports-[backdrop-filter]:bg-card/50 border border-border rounded-2xl overflow-hidden">
                <input
                  type="text"
                  value={inputText}
                  onChange={(e) => setInputText(e.target.value)}
                  placeholder="Skriv hva som helst"
                  className="w-full bg-transparent px-4 sm:px-6 py-3 text-left outline-none placeholder:text-muted-fg/70 text-sm sm:text-base"
                  aria-label="Sofie AI søk"
                />
              </div>
              <button
                type="button"
                onClick={handleMicClick}
                className="p-2.5 rounded-full border border-border bg-card hover:bg-muted transition-colors flex-shrink-0 text-muted-fg"
                aria-label="Snakk"
              >
                <Mic className="h-5 w-5" />
              </button>
              <button
                type="submit"
                className="p-3 rounded-full bg-primary text-primary-fg hover:bg-primary/90 transition-colors flex-shrink-0"
                aria-label="Send"
              >
                <ArrowUp className="h-5 w-5" />
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}


