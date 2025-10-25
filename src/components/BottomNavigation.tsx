import { Home, MapPin, Heart, FileText } from 'lucide-react'
import { useLocation, useNavigate } from 'react-router-dom'
import { norwegianText } from '@/i18n/no'
import { cn } from '@/lib/utils'

const tabs = [
  { id: 'home', label: norwegianText.nav.home, icon: Home, path: '/' },
  { id: 'map', label: norwegianText.nav.map, icon: MapPin, path: '/map' },
  { id: 'favorites', label: norwegianText.nav.favorites, icon: Heart, path: '/favorites' },
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

