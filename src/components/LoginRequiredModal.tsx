import { X, LogIn, UserPlus } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { cn } from '@/lib/utils'

interface LoginRequiredModalProps {
  isOpen: boolean
  onClose: () => void
  dealId?: string
}

export function LoginRequiredModal({ isOpen, onClose, dealId }: LoginRequiredModalProps) {
  const navigate = useNavigate()

  if (!isOpen) return null

  const handleLogin = () => {
    // Store deal ID so we can return to it after login
    if (dealId) {
      localStorage.setItem('pendingDealId', dealId)
    }
    navigate('/auth?mode=signin&reason=claim')
    onClose()
  }

  const handleRegister = () => {
    // Store deal ID so we can return to it after registration
    if (dealId) {
      localStorage.setItem('pendingDealId', dealId)
    }
    navigate('/auth?mode=signup&reason=claim')
    onClose()
  }

  return (
    <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4">
      <div className="bg-card w-full max-w-md rounded-2xl shadow-2xl p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-semibold text-fg">
            Logg inn for å hente tilbud
          </h2>
          <button
            onClick={onClose}
            className="p-2 rounded-lg hover:bg-muted transition-colors"
            aria-label="Lukk"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <p className="text-muted-fg mb-6">
          Du må være innlogget for å hente dette tilbudet. Velg en av alternativene nedenfor.
        </p>

        <div className="flex flex-col gap-3">
          <button
            onClick={handleLogin}
            className={cn(
              "btn-primary w-full flex items-center justify-center gap-2 py-3"
            )}
          >
            <LogIn className="h-5 w-5" />
            Logg inn
          </button>

          <button
            onClick={handleRegister}
            className={cn(
              "btn-ghost w-full flex items-center justify-center gap-2 py-3 border-2 border-primary text-primary hover:bg-primary/10"
            )}
          >
            <UserPlus className="h-5 w-5" />
            Registrer deg
          </button>

          <button
            onClick={onClose}
            className="text-sm text-muted-fg hover:text-fg text-center mt-2"
          >
            Avbryt
          </button>
        </div>
      </div>
    </div>
  )
}

