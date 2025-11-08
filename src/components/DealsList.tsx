import { useEffect, useRef, useCallback } from 'react'
import { DealCard } from './DealCard'
import { norwegianText } from '@/i18n/no'
import type { DealWithRestaurant } from '@/lib/database.types'
import { isDealCurrentlyAvailable, isDealUpcomingToday } from '@/lib/dealUtils'

const DEFAULT_DAY_NUMBERS = [1, 2, 3, 4, 5, 6, 7] as const

const DAY_TO_NUMBER_MAP: Record<string, number> = {
  sunday: 7,
  0: 7,
  monday: 1,
  1: 1,
  tuesday: 2,
  2: 2,
  wednesday: 3,
  3: 3,
  thursday: 4,
  4: 4,
  friday: 5,
  5: 5,
  saturday: 6,
  6: 6,
  7: 7,
}

function getDayNumbers(days: string[] | null | undefined): number[] {
  if (!days || days.length === 0) return [...DEFAULT_DAY_NUMBERS]

  const mapped = days
    .map((day) => {
      const normalized = day?.toString().trim().toLowerCase()
      return normalized ? DAY_TO_NUMBER_MAP[normalized] : undefined
    })
    .filter((value): value is number => typeof value === 'number')

  return mapped.length > 0 ? mapped : [...DEFAULT_DAY_NUMBERS]
}

interface DealsListProps {
  deals: DealWithRestaurant[]
  favorites: string[]
  favoriteDeals: string[]
  onFavoriteToggle: (restaurantId: string) => void
  onFavoriteDealToggle: (dealId: string) => void
  onClaimDeal: (deal: DealWithRestaurant) => void
  onLoadMore?: () => void
  hasMore?: boolean
  isLoading?: boolean
}

export function DealsList({
  deals,
  favorites,
  favoriteDeals,
  onFavoriteToggle,
  onFavoriteDealToggle,
  onClaimDeal,
  onLoadMore,
  hasMore = false,
  isLoading = false,
}: DealsListProps) {
  const observerRef = useRef<IntersectionObserver>()
  const lastDealRef = useRef<HTMLDivElement>(null)

  const lastDealCallbackRef = useCallback(
    (node: HTMLDivElement) => {
      if (isLoading) return
      if (observerRef.current) observerRef.current.disconnect()
      
      observerRef.current = new IntersectionObserver((entries) => {
        if (entries[0].isIntersecting && hasMore && onLoadMore) {
          onLoadMore()
        }
      })
      
      if (node) observerRef.current.observe(node)
    },
    [isLoading, hasMore, onLoadMore]
  )

  useEffect(() => {
    return () => {
      if (observerRef.current) {
        observerRef.current.disconnect()
      }
    }
  }, [])

  if (deals.length === 0 && !isLoading) {
    return (
      <div className="flex flex-col items-center justify-center py-12 px-4 text-center">
        <div className="text-6xl mb-4">🔍</div>
        <h3 className="text-lg font-semibold mb-2">{norwegianText.empty.noDeals}</h3>
        <p className="text-muted-fg">Prøv å justere søket eller filtrene dine</p>
      </div>
    )
  }

  return (
    <div className="space-y-2">
      {deals.map((deal, index) => {
        const isLast = index === deals.length - 1
        const dayNumbers = getDayNumbers(deal.available_days)
        const isCurrentlyAvailable = isDealCurrentlyAvailable(deal)
        const isUpcomingToday = isDealUpcomingToday(deal)
        const ctaLabel = isUpcomingToday ? 'Planlegg henting' : norwegianText.actions.claimDeal
        const isActionDisabled = isUpcomingToday ? false : !isCurrentlyAvailable
        
        return (
          <div
            key={deal.id}
            ref={isLast ? lastDealCallbackRef : undefined}
          >
            <DealCard
              id={deal.id}
              title={deal.title}
              restaurantName={deal.restaurant.name}
              restaurantId={deal.restaurant.id}
              imageUrl={deal.image_url || deal.restaurant.image_url || undefined}
              discountValue={deal.discount_percentage}
              discountType="percent"
              originalPrice={deal.original_price || undefined}
              finalPrice={deal.final_price || undefined}
              studentPrice={(deal as any).studentPrice || null}
              ansattPrice={(deal as any).ansattPrice || null}
              timeWindow={{
                start: deal.start_time,
                end: deal.end_time,
              }}
              dineIn={deal.available_for?.includes('dine_in') || false}
              takeaway={deal.available_for?.includes('takeaway') || false}
              isFavorite={favoriteDeals.includes(deal.id)}
              onFavoriteToggle={() => onFavoriteDealToggle(deal.id)}
              onClaim={() => onClaimDeal(deal)}
              days={dayNumbers}
              address={deal.restaurant.address || undefined}
              badges={deal.restaurant.categories}
              totalLimit={deal.total_limit}
              claimedCount={deal.claimed_count}
              isAvailableNowOverride={isCurrentlyAvailable}
              ctaLabel={ctaLabel}
              isActionDisabled={isActionDisabled}
            />
          </div>
        )
      })}

      {/* Loading indicator */}
      {isLoading && (
        <div className="flex justify-center py-8">
          <div className="flex items-center gap-2 text-muted-fg">
            <div className="animate-spin rounded-full h-4 w-4 border-2 border-primary border-t-transparent" />
            <span>{norwegianText.empty.loading}</span>
          </div>
        </div>
      )}
    </div>
  )
}

