import { Home, MapPin, FileText } from 'lucide-react'
import { useLocation, useNavigate } from 'react-router-dom'
import { norwegianText } from '@/i18n/no'
import { cn } from '@/lib/utils'

// Custom AI Icon: simplified chip outline (no inner square) with readable AI text
const AIIcon = ({ className }: { className?: string }) => (
  <div className={cn('relative inline-block', className)}>
    <svg
      viewBox="0 0 24 24"
      xmlns="http://www.w3.org/2000/svg"
      className="h-6 w-6"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      {/* Outer chip body */}
      <rect x="6" y="6" width="12" height="12" rx="2" ry="2" />
      {/* Pins - top */}
      <line x1="9" y1="3" x2="9" y2="6" />
      <line x1="15" y1="3" x2="15" y2="6" />
      {/* Pins - bottom */}
      <line x1="9" y1="18" x2="9" y2="21" />
      <line x1="15" y1="18" x2="15" y2="21" />
      {/* Pins - left */}
      <line x1="3" y1="9" x2="6" y2="9" />
      <line x1="3" y1="15" x2="6" y2="15" />
      {/* Pins - right */}
      <line x1="18" y1="9" x2="21" y2="9" />
      <line x1="18" y1="15" x2="21" y2="15" />
    </svg>
    <span className="absolute left-[62%] top-[57%] -translate-x-1/2 -translate-y-1/2 text-[8px] font-extrabold leading-none pointer-events-none tracking-tight">
      AI
    </span>
  </div>
)

const tabs = [
  { id: 'home', label: norwegianText.nav.home, icon: Home, path: '/' },
  { id: 'map', label: norwegianText.nav.map, icon: MapPin, path: '/map' },
  { id: 'ai', label: norwegianText.nav.ai, icon: AIIcon, path: '/ai' },
  { id: 'claims', label: norwegianText.nav.claims, icon: FileText, path: '/claims' },
]

export function BottomNavigation() {
  const navigate = useNavigate()
  const location = useLocation()

  const isActive = (path: string) => {
    if (path === '/') {
      return location.pathname === '/'
    }
    return location.pathname.startsWith(path)
  }

  return (
    <nav className="bottom-nav fixed bottom-0 left-0 right-0 bg-card border-t border-border z-50">
      <div className="flex items-center justify-around px-2 py-2">
        {tabs.map(({ id, label, icon: Icon, path }) => (
          <button
            key={id}
            onClick={() => navigate(path)}
            className={cn(
              'flex flex-col items-center gap-1 p-2 rounded-2xl transition-colors min-w-0 flex-1',
              'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring',
              isActive(path) 
                ? 'text-primary bg-primary/10' 
                : 'text-muted-fg hover:text-fg'
            )}
            aria-label={label}
          >
            <Icon className="h-5 w-5 flex-shrink-0" />
            <span className="text-xs font-medium truncate">{label}</span>
          </button>
        ))}
      </div>
    </nav>
  )
}

