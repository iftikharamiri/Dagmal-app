import { Search } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { Logo } from '@/components/Logo'
import { NavigationMenu } from '@/components/NavigationMenu'
import { norwegianText } from '@/i18n/no'

interface HeaderProps {
  onSearchChange?: (query: string) => void
  searchValue?: string
  showSearch?: boolean
  showMenu?: boolean
}

export function Header({ onSearchChange, searchValue = '', showSearch = true, showMenu = true }: HeaderProps) {
  const navigate = useNavigate()

  return (
    <header className="bg-card border-b border-border px-4 py-3 safe-area-top">
      <div className="flex items-center gap-4">
        {/* Search */}
        {showSearch && (
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-fg h-4 w-4" />
            <input
              type="text"
              placeholder={norwegianText.actions.search}
              value={searchValue}
              onChange={(e) => onSearchChange?.(e.target.value)}
              className="input pl-10 w-full"
            />
          </div>
        )}

        {/* Navigation Menu */}
        {showMenu && <NavigationMenu />}
      </div>
    </header>
  )
}

















