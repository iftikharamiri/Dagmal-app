import { useEffect, useRef, useCallback } from 'react'
import { DealCard } from './DealCard'
import { norwegianText } from '@/i18n/no'
import type { DealWithRestaurant } from '@/lib/database.types'

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
              timeWindow={{
                start: deal.start_time,
                end: deal.end_time,
              }}
              dineIn={deal.available_for?.includes('dine_in') || false}
              takeaway={deal.available_for?.includes('takeaway') || false}
              isFavorite={favoriteDeals.includes(deal.id)}
              onFavoriteToggle={() => onFavoriteDealToggle(deal.id)}
              onClaim={() => onClaimDeal(deal)}
              days={[1, 2, 3, 4, 5, 6, 7]} // Temporarily use all days for all deals
              address={deal.restaurant.address || undefined}
              badges={deal.restaurant.categories}
              totalLimit={deal.total_limit}
              claimedCount={deal.claimed_count}
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

