import { Heart, MapPin, Users } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { norwegianText } from '@/i18n/no'
import { formatPrice, formatTime, isTimeInRange, isDealActiveToday, cn } from '@/lib/utils'

interface DealCardProps {
  id: string
  title: string
  restaurantName: string
  restaurantId: string
  imageUrl?: string
  discountValue: number
  discountType: 'percent' | 'amount'
  originalPrice?: number
  finalPrice?: number
  badges?: string[]
  timeWindow: { start: string; end: string }
  dineIn: boolean
  takeaway: boolean
  isFavorite: boolean
  onFavoriteToggle: () => void
  onClaim: () => void
  days?: number[]
  address?: string
  totalLimit?: number | null
  claimedCount?: number
}

export function DealCard({
  title,
  restaurantName,
  restaurantId,
  imageUrl,
  discountValue,
  discountType,
  originalPrice,
  finalPrice,
  timeWindow,
  dineIn,
  takeaway,
  isFavorite,
  onFavoriteToggle,
  onClaim,
  days = [1, 2, 3, 4, 5, 6, 7],
  address,
  totalLimit,
  claimedCount = 0,
}: DealCardProps) {
  const navigate = useNavigate()
  const isAvailableNow = isTimeInRange(timeWindow.start, timeWindow.end) && isDealActiveToday(days)

  // Calculate availability
  const remaining = totalLimit ? Math.max(0, totalLimit - claimedCount) : null
  const isLimitedQuantity = totalLimit !== null && totalLimit !== undefined
  const isSoldOut = isLimitedQuantity && remaining === 0

  return (
    <div className={cn(
      'bg-white rounded-3xl overflow-hidden shadow-lg hover:shadow-xl transition-all duration-300',
      !isAvailableNow && 'opacity-60'
    )}>
      {/* Large Image Section - Made bigger to match reference, responsive */}
      <div className="relative h-[300px] sm:h-[400px] overflow-hidden bg-transparent">
        {imageUrl ? (
          <img
            src={imageUrl}
            alt={title}
            className="w-full h-full object-cover object-center"
            loading="lazy"
            onError={(e) => {
              // Hide broken images and show fallback
              e.currentTarget.style.display = 'none'
              if (e.currentTarget.nextElementSibling) {
                (e.currentTarget.nextElementSibling as HTMLElement).style.display = 'flex'
              }
            }}
          />
        ) : null}
        <div 
          className="w-full h-full bg-gradient-to-br from-orange-500 to-red-500 flex items-center justify-center" 
          style={{display: imageUrl ? 'none' : 'flex'}}
        >
          <span className="text-6xl">🍕</span>
        </div>
        
        {/* Gradient overlay for better text readability - Made stronger to match reference */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/20 to-transparent" />
        
        {/* Favorite button */}
        <button
          onClick={onFavoriteToggle}
          className="absolute top-3 right-3 p-2 rounded-full bg-white/90 backdrop-blur-sm hover:bg-white transition-colors z-10"
          aria-label={isFavorite ? 'Fjern fra favoritter' : 'Legg til i favoritter'}
        >
          <Heart 
            className={`h-4 w-4 ${
              isFavorite ? 'fill-danger text-danger' : 'text-muted-fg hover:text-danger'
            }`} 
          />
        </button>

        {/* Discount badge - Styled to match reference exactly */}
        <div className="absolute top-4 left-4">
          <span className="bg-red-500 text-white px-4 py-2 rounded-full text-sm font-bold shadow-lg">
{Math.abs(discountValue)}{discountType === 'percent' ? '%' : ''} off
          </span>
        </div>

        {/* Service type badge - Styled to match reference */}
        <div className="absolute bottom-4 left-4">
          <div className="bg-black/70 text-white px-4 py-2 rounded-lg backdrop-blur-sm shadow-lg">
            <div className="text-sm font-semibold">
              {dineIn ? norwegianText.deal.dineIn : norwegianText.deal.takeaway}
            </div>
            <div className="text-xs text-gray-200 mt-0.5">
              {formatTime(timeWindow.start)} - {formatTime(timeWindow.end)}
            </div>
          </div>
        </div>
      </div>

      {/* Content Section */}
      <div className="p-6 space-y-2">
        {/* Restaurant name with claimed count */}
        <div className="flex items-center justify-between">
          <button
            onClick={() => navigate(`/restaurant/${restaurantId}`)}
            className="font-semibold text-gray-900 leading-tight hover:text-blue-600 transition-colors duration-200 text-left"
          >
            {restaurantName}
          </button>
          <div className="flex items-center gap-1 text-sm text-muted-fg">
            <Users className="h-4 w-4" />
            <span>{claimedCount} hentet</span>
          </div>
        </div>

        {/* Dish name with availability */}
        <div className="flex items-center justify-between gap-2">
          <p className="text-gray-600 text-xs leading-relaxed font-medium">{title}</p>
          {totalLimit && (
            <span className="text-green-600 text-xs font-medium whitespace-nowrap">
              {totalLimit - claimedCount}/{totalLimit} tilgjengelig
            </span>
          )}
        </div>

        {/* Location and Price on same line */}
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-2 text-gray-600">
            <MapPin className="h-4 w-4" />
            <span className="text-sm">{address || 'Oslo'}</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-sm font-bold text-gray-900">
              {finalPrice ? formatPrice(finalPrice) : 'Gratis'}
            </span>
            {originalPrice && (
              <span className="text-xs text-gray-400 line-through">
                {formatPrice(originalPrice)}
              </span>
            )}
          </div>
        </div>

        {/* Claim section */}
        <div className="flex items-center justify-end">
          <button
            onClick={() => {
              console.log('🔘 Claim button clicked', { title, isAvailableNow, isSoldOut })
              onClaim()
            }}
            disabled={!isAvailableNow || isSoldOut}
            className={cn(
              'bg-blue-600 text-white px-6 py-3 rounded-xl font-semibold text-sm',
              'hover:bg-blue-700 transition-colors duration-200 shadow-lg',
              'focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2',
              (!isAvailableNow || isSoldOut) && 'opacity-50 cursor-not-allowed bg-gray-400 hover:bg-gray-400'
            )}
          >
            {isSoldOut ? 'Utsolgt' : norwegianText.actions.claimDeal}
          </button>
        </div>
      </div>
    </div>
  )
}

