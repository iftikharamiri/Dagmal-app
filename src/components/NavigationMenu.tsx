import { useState, useRef, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { User, Building2, ChevronDown, Settings, LogOut, HelpCircle, Filter } from 'lucide-react'
import { cn } from '@/lib/utils'
import { norwegianText } from '@/i18n/no'

interface NavigationMenuProps {
  className?: string
  onShowFilters?: () => void
  hasActiveFilters?: boolean
}

export function NavigationMenu({ className, onShowFilters, hasActiveFilters }: NavigationMenuProps) {
  const navigate = useNavigate()
  const [isOpen, setIsOpen] = useState(false)
  const menuRef = useRef<HTMLDivElement>(null)

  // Close menu when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setIsOpen(false)
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [])

  const menuItems = [
    ...(onShowFilters ? [{
      label: 'Filtrer tilbud',
      icon: Filter,
      onClick: () => {
        onShowFilters()
        setIsOpen(false)
      },
      description: 'Filtrer restauranter og tilbud',
      hasActive: hasActiveFilters
    }] : []),
    {
      label: 'Profil',
      icon: User,
      onClick: () => {
        navigate('/profile')
        setIsOpen(false)
      },
      description: 'Se og rediger profil'
    },
    {
      label: 'For bedrifter',
      icon: Building2,
      onClick: () => {
        navigate('/business')
        setIsOpen(false)
      },
      description: 'Registrer restaurant'
    },
    {
      label: 'Innstillinger',
      icon: Settings,
      onClick: () => {
        // TODO: Add settings page
        setIsOpen(false)
      },
      description: 'App-innstillinger'
    },
    {
      label: 'Hjelp',
      icon: HelpCircle,
      onClick: () => {
        // TODO: Add help page
        setIsOpen(false)
      },
      description: 'Hjelp og support'
    }
  ]

  return (
    <div className={cn('relative', className)} ref={menuRef}>
      {/* Menu Trigger Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 px-3 py-2 rounded-lg hover:bg-muted/50 transition-colors text-sm font-medium text-fg"
        aria-label="Åpne meny"
      >
        <User className="h-4 w-4" />
        <span>Meny</span>
        <ChevronDown className={cn(
          'h-3 w-3 transition-transform',
          isOpen && 'rotate-180'
        )} />
      </button>

      {/* Dropdown Menu */}
      {isOpen && (
        <div className="absolute right-0 top-full mt-2 w-64 bg-card border border-border rounded-xl shadow-lg z-50 overflow-hidden">
          {/* Menu Header */}
          <div className="px-4 py-3 border-b border-border bg-muted/30">
            <h3 className="font-semibold text-fg">Navigasjon</h3>
            <p className="text-xs text-muted-fg">Velg en handling</p>
          </div>

          {/* Menu Items */}
          <div className="py-2">
            {menuItems.map((item, index) => (
              <button
                key={item.label}
                onClick={item.onClick}
                className="w-full flex items-center gap-3 px-4 py-3 text-left hover:bg-muted/50 transition-colors group"
              >
                <div className={cn(
                  "flex-shrink-0 w-8 h-8 rounded-lg flex items-center justify-center transition-colors",
                  item.hasActive 
                    ? "bg-primary text-primary-fg" 
                    : "bg-primary/10 group-hover:bg-primary/20"
                )}>
                  <item.icon className="h-4 w-4" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="font-medium text-fg flex items-center gap-2">
                    {item.label}
                    {item.hasActive && (
                      <div className="w-2 h-2 bg-primary rounded-full"></div>
                    )}
                  </div>
                  <div className="text-xs text-muted-fg truncate">{item.description}</div>
                </div>
              </button>
            ))}
          </div>

          {/* Menu Footer */}
          <div className="px-4 py-3 border-t border-border bg-muted/20">
            <div className="text-xs text-muted-fg">
              Dagmål v1.0
            </div>
          </div>
        </div>
      )}

      {/* Backdrop for mobile */}
      {isOpen && (
        <div 
          className="fixed inset-0 z-40 bg-black/20 backdrop-blur-sm"
          onClick={() => setIsOpen(false)}
        />
      )}
    </div>
  )
}

// Alternative: Horizontal Navigation Bar
export function NavigationBar({ className }: NavigationMenuProps) {
  const navigate = useNavigate()

  const navItems = [
    {
      label: 'Profil',
      icon: User,
      onClick: () => navigate('/profile'),
      path: '/profile'
    },
    {
      label: 'For bedrifter',
      icon: Building2,
      onClick: () => navigate('/business'),
      path: '/business'
    }
  ]

  return (
    <div className={cn('flex items-center gap-1 bg-muted/30 rounded-xl p-1', className)}>
      {navItems.map((item) => (
        <button
          key={item.label}
          onClick={item.onClick}
          className="flex items-center gap-2 px-4 py-2 rounded-lg hover:bg-card hover:shadow-sm transition-all text-sm font-medium text-fg hover:text-primary"
        >
          <item.icon className="h-4 w-4" />
          <span>{item.label}</span>
        </button>
      ))}
    </div>
  )
}

// Simple Icon-based Navigation
export function IconNavigation({ className }: NavigationMenuProps) {
  const navigate = useNavigate()

  return (
    <div className={cn('flex items-center gap-2', className)}>
      <button
        onClick={() => navigate('/business')}
        className="p-2 rounded-lg hover:bg-muted/50 transition-colors"
        title="For bedrifter"
      >
        <Building2 className="h-4 w-4 text-muted-fg hover:text-primary" />
      </button>
      <button
        onClick={() => navigate('/profile')}
        className="p-2 rounded-lg hover:bg-muted/50 transition-colors"
        title="Profil"
      >
        <User className="h-4 w-4 text-muted-fg hover:text-primary" />
      </button>
    </div>
  )
}





