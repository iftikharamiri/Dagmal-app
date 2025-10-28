import React from 'react'
import { useState } from 'react'
import { ChevronDown, Mic } from 'lucide-react'

export function AIPage() {
  const [inputText, setInputText] = useState('')
  const [messages, setMessages] = useState<Array<{ role: 'user' | 'sofie'; text: string }>>([])

  const sofieDisabledText = 'Utviklerne mine har ikke aktivert meg ennå. Håper vi ses i neste versjon av appen. Skriv 1 for en kort vits i mellomtiden.'
  const jokeText = 'Jeg prøvde å spise en klokke. Veldig tidkrevende.'

  function handleSubmit(e?: React.FormEvent) {
    if (e) e.preventDefault()
    const trimmed = inputText.trim()
    if (!trimmed) return
    if (trimmed === '1') {
      setMessages(prev => [...prev, { role: 'user', text: trimmed }, { role: 'sofie', text: jokeText }])
    } else {
      setMessages(prev => [...prev, { role: 'user', text: trimmed }, { role: 'sofie', text: sofieDisabledText }])
    }
    setInputText('')
  }

  function handleMicClick() {
    // For now, simulate the same behavior as submit
    handleSubmit()
  }
  return (
    <div className="min-h-screen bg-bg pb-24 flex flex-col">
      <div className="px-4 pt-6">
        <div className="max-w-4xl mx-auto">
          <div className="flex items-center justify-between">
            <button className="inline-flex items-center gap-2 text-sm text-muted-fg hover:text-fg transition-colors">
              <span className="font-semibold">Sofie 1</span>
              <ChevronDown className="h-4 w-4" />
            </button>
          </div>
          <div className="mt-3 flex items-start gap-3">
            <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-primary text-xs flex-shrink-0">🤖</div>
            <div className="inline-block bg-muted px-4 py-3 rounded-2xl rounded-tl-sm text-sm leading-relaxed text-left">
              Hei, jeg er Sofie. Jeg finner tilbud, reserverer bord og hjelper med allergier.
            </div>
          </div>
        </div>
      </div>

      <div className="flex-1 flex items-start">
        <div className="w-full px-4 pt-8">
          <div className="max-w-3xl mx-auto text-center">
            <h1 className="text-2xl sm:text-3xl md:text-4xl font-semibold tracking-tight mb-6">
              Hva har du lyst på i dag?
            </h1>
            <div className="bg-card/70 backdrop-blur supports-[backdrop-filter]:bg-card/50 border border-border rounded-2xl shadow-sm overflow-hidden">
              <form className="flex items-center" onSubmit={handleSubmit}>
                <input
                  type="text"
                  value={inputText}
                  onChange={(e) => setInputText(e.target.value)}
                  placeholder="Skriv hva som helst"
                  className="w-full bg-transparent px-4 sm:px-6 py-4 text-left outline-none placeholder:text-muted-fg/70"
                  aria-label="Sofie AI søk"
                />
                <div className="flex items-center gap-2 pr-2 sm:pr-3">
                  <button
                    type="button"
                    onClick={handleMicClick}
                    className="p-2 rounded-full hover:bg-muted transition-colors text-muted-fg"
                    aria-label="Snakk"
                  >
                    <Mic className="h-5 w-5" />
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      </div>

      {/* Conversation */}
      {messages.length > 0 && (
        <div className="px-4 pb-10">
          <div className="max-w-3xl mx-auto">
            <div className="space-y-3">
              {messages.map((m, i) => (
                <div key={i} className={m.role === 'user' ? 'text-right' : 'text-left'}>
                  {m.role === 'sofie' ? (
                    <div className="inline-flex items-start gap-3">
                      <div className="w-7 h-7 rounded-full bg-primary/10 flex items-center justify-center text-primary text-[10px] flex-shrink-0">🤖</div>
                      <div className="inline-block bg-muted px-4 py-3 rounded-2xl rounded-tl-sm text-sm leading-relaxed text-left max-w-[85%]">
                        {m.text}
                      </div>
                    </div>
                  ) : (
                    <div className="inline-block bg-primary text-primary-fg px-4 py-2 rounded-2xl rounded-tr-sm text-sm leading-relaxed max-w-[85%]">
                      {m.text}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}


