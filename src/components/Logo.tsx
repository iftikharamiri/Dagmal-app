import { cn } from '@/lib/utils'

interface LogoProps {
  className?: string
  size?: 'sm' | 'md' | 'lg'
  showText?: boolean
}

export function Logo({ className, size = 'md', showText = true }: LogoProps) {
  const sizeClasses = {
    sm: 'h-6 w-6',
    md: 'h-8 w-8', 
    lg: 'h-12 w-12'
  }

  const textSizes = {
    sm: 'text-sm',
    md: 'text-lg',
    lg: 'text-2xl'
  }

  return (
    <div className={cn('flex items-center gap-2', className)}>
      {/* Logo Icon */}
      <div className={cn(
        'relative flex items-center justify-center rounded-xl bg-gradient-to-br from-slate-50 to-slate-100 shadow-sm border border-slate-200',
        sizeClasses[size]
      )}>
        {/* Professional Logo */}
        <svg 
          viewBox="0 0 24 24" 
          className="h-5/6 w-5/6"
        >
          {/* Main Circle */}
          <circle 
            cx="12" 
            cy="12" 
            r="10" 
            fill="none" 
            stroke="url(#mainGradient)" 
            strokeWidth="1.5"
          />
          
          {/* Inner Circle */}
          <circle 
            cx="12" 
            cy="12" 
            r="7" 
            fill="none" 
            stroke="url(#innerGradient)" 
            strokeWidth="1"
            opacity="0.6"
          />
          
          {/* Central Dot */}
          <circle 
            cx="12" 
            cy="12" 
            r="2" 
            fill="url(#centerGradient)"
          />
          
          {/* Corner Accents */}
          <circle cx="6" cy="6" r="1.5" fill="url(#accentGradient)" opacity="0.7"/>
          <circle cx="18" cy="6" r="1.5" fill="url(#accentGradient)" opacity="0.7"/>
          <circle cx="6" cy="18" r="1.5" fill="url(#accentGradient)" opacity="0.7"/>
          <circle cx="18" cy="18" r="1.5" fill="url(#accentGradient)" opacity="0.7"/>
          
          {/* Subtle Lines */}
          <line x1="8" y1="12" x2="16" y2="12" stroke="url(#lineGradient)" strokeWidth="0.8" opacity="0.4"/>
          <line x1="12" y1="8" x2="12" y2="16" stroke="url(#lineGradient)" strokeWidth="0.8" opacity="0.4"/>
          
          {/* Gradients */}
          <defs>
            <linearGradient id="mainGradient" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#3b82f6"/>
              <stop offset="100%" stopColor="#1e40af"/>
            </linearGradient>
            <linearGradient id="innerGradient" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#6366f1"/>
              <stop offset="100%" stopColor="#4f46e5"/>
            </linearGradient>
            <linearGradient id="centerGradient" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#1e40af"/>
              <stop offset="100%" stopColor="#1e3a8a"/>
            </linearGradient>
            <linearGradient id="accentGradient" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#8b5cf6"/>
              <stop offset="100%" stopColor="#7c3aed"/>
            </linearGradient>
            <linearGradient id="lineGradient" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#3b82f6"/>
              <stop offset="100%" stopColor="#6366f1"/>
            </linearGradient>
          </defs>
        </svg>
        
        {/* Subtle highlight */}
        <div className="absolute top-1 left-1 w-1.5 h-1.5 bg-white/40 rounded-full"></div>
      </div>
      
      {/* Logo Text */}
      {showText && (
        <span className={cn(
          'font-bold text-fg tracking-tight',
          textSizes[size]
        )}>
          Dagmål
        </span>
      )}
    </div>
  )
}

// Alternative logo with plate and utensils
export function LogoWithPlate({ className, size = 'md', showText = true }: LogoProps) {
  const sizeClasses = {
    sm: 'h-6 w-6',
    md: 'h-8 w-8',
    lg: 'h-12 w-12'
  }

  const textSizes = {
    sm: 'text-sm',
    md: 'text-lg', 
    lg: 'text-2xl'
  }

  return (
    <div className={cn('flex items-center gap-2', className)}>
      {/* Plate with utensils */}
      <div className={cn(
        'relative flex items-center justify-center rounded-full bg-gradient-to-br from-primary to-primary/80 text-primary-fg shadow-sm',
        sizeClasses[size]
      )}>
        {/* Plate circle */}
        <div className="absolute inset-1 rounded-full border-2 border-primary-fg/20"></div>
        
        {/* Fork and Knife crossed */}
        <svg 
          viewBox="0 0 24 24" 
          fill="currentColor" 
          className="h-4/6 w-4/6"
        >
          {/* Fork (left side) */}
          <path d="M8 2v20l-1-1-1-1V4l1-1 1-1z" opacity="0.8"/>
          <path d="M8 6v12l-1-1V7l1-1z" opacity="0.6"/>
          
          {/* Knife (right side) */}
          <path d="M16 2l4 4-8 8-4-4 8-8z" opacity="0.8"/>
          <path d="M18 4l-6 6 2 2 6-6-2-2z" opacity="0.6"/>
        </svg>
        
        {/* Subtle shine */}
        <div className="absolute top-1 right-1 w-1 h-1 bg-white/30 rounded-full"></div>
      </div>
      
      {/* Logo Text */}
      {showText && (
        <span className={cn(
          'font-bold text-fg tracking-tight',
          textSizes[size]
        )}>
          Dagmål
        </span>
      )}
    </div>
  )
}

// Simple text-only logo with custom styling
export function LogoText({ className, size = 'md' }: Omit<LogoProps, 'showText'>) {
  const textSizes = {
    sm: 'text-sm',
    md: 'text-lg',
    lg: 'text-2xl'
  }

  return (
    <div className={cn('flex items-center', className)}>
      <span className={cn(
        'font-bold text-transparent bg-clip-text bg-gradient-to-r from-primary to-primary/70 tracking-tight',
        textSizes[size]
      )}>
        Dagmål
      </span>
    </div>
  )
}





