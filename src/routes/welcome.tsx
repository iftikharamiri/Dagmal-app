import React from 'react'
import { useNavigate } from 'react-router-dom'
import { setWelcomeSeen } from '@/lib/storage'

export function WelcomePage() {
  const navigate = useNavigate()

  return (
    <div className="min-h-screen bg-bg flex items-center justify-center p-6">
      <div className="w-full max-w-3xl text-center">
        <h1 className="text-4xl sm:text-5xl md:text-6xl font-extrabold tracking-tight mb-4">
          <span className="text-fg">Velkommen til </span>
          <span className="text-primary">Spisly</span>
        </h1>
        <p className="text-lg sm:text-xl text-muted-fg mb-8">
          Finn de beste mattilbudene nær deg
        </p>
        <div className="flex items-center justify-center gap-4">
          <button
            className="btn-primary px-6 py-3 text-base"
            aria-label="Kom i gang"
            onClick={() => {
              setWelcomeSeen()
              navigate('/')
            }}
          >
            Kom i gang
          </button>
        </div>
      </div>
    </div>
  )
}
