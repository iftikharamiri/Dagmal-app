import { Heart, Clock, TrendingUp, Users } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { DealCard } from '@/components/DealCard'
import { isDealCurrentlyAvailable, calculatePopularityScore } from '@/lib/dealUtils'
import type { DealWithRestaurant } from '@/lib/database.types'

interface PopularDealsProps {
  deals: DealWithRestaurant[]
  favorites: string[]
  favoriteDeals: string[]
  onFavoriteToggle: (restaurantId: string) => void
  onFavoriteDealToggle: (dealId: string) => void
  onClaimDeal: (deal: DealWithRestaurant) => void
}

export function PopularDeals({ deals, favorites, favoriteDeals, onFavoriteToggle, onFavoriteDealToggle, onClaimDeal }: PopularDealsProps) {
  const navigate = useNavigate()
  
  if (deals.length === 0) return null

  return (
    <div className="px-4 py-2">
      {/* Section Header */}
      <div className="flex items-center gap-2 mb-4">
        <TrendingUp className="h-5 w-5 text-primary" />
        <span className="text-lg font-bold text-fg">Populære</span>
      </div>

      {/* Horizontal Scrollable Deals */}
      <div className="relative">
        <div className="flex gap-4 overflow-x-auto scrollbar-hide pb-2" style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}>
          {deals.map((deal) => {
            const isAvailable = isDealCurrentlyAvailable(deal)
            const popularityScore = calculatePopularityScore(deal)
            const isFavorite = favoriteDeals.includes(deal.id)

            return (
              <div key={deal.id} className="flex-shrink-0 w-80">
                <div className="relative">
                  {/* Discount Badge */}
                  <div className="absolute top-3 left-3 z-10">
                    <div className="bg-gradient-to-r from-danger to-danger/80 text-white px-3 py-1 rounded-full text-xs font-bold">
{deal.discount_percentage}%
                    </div>
                  </div>

                  {/* Availability Badge */}
                  {isAvailable && (
                    <div className="absolute top-3 right-3 z-10">
                      <div className="bg-success text-white px-2 py-1 rounded-full text-xs font-medium flex items-center gap-1">
                        <Clock className="h-3 w-3" />
                        Tilgjengelig
                      </div>
                    </div>
                  )}

                  {/* Deal Card */}
                  <div className="bg-white rounded-2xl shadow-sm border border-border overflow-hidden hover:shadow-md transition-shadow">
                    {/* Image */}
                    <div className="relative h-48 bg-muted">
                      {deal.image_url ? (
                        <img
                          src={deal.image_url}
                          alt={deal.title}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center">
                          <span className="text-muted-fg text-sm">Ingen bilde</span>
                        </div>
                      )}

                      {/* Service Type Overlay - Bottom Left */}
                      <div className="absolute bottom-0 left-0 bg-black/70 text-white px-2 py-1 text-xs">
                        {deal.available_for?.includes('dine_in') && deal.available_for?.includes('takeaway') ? (
                          <span>Spise på stedet • Takeaway</span>
                        ) : deal.available_for?.includes('dine_in') ? (
                          <span>Spise på stedet</span>
                        ) : deal.available_for?.includes('takeaway') ? (
                          <span>Takeaway</span>
                        ) : null}
                      </div>

                      {/* Time Overlay - Bottom Right */}
                      <div className="absolute bottom-0 right-0 bg-black/70 text-white px-2 py-1 text-xs font-medium">
                        {deal.start_time.slice(0, 5)} - {deal.end_time.slice(0, 5)}
                      </div>

                      {/* Favorite Button */}
                      <button
                        onClick={() => onFavoriteDealToggle(deal.id)}
                        className="absolute bottom-3 right-3 p-2 rounded-full bg-white/90 backdrop-blur-sm hover:bg-white transition-colors"
                      >
                        <Heart 
                          className={`h-4 w-4 ${
                            isFavorite ? 'fill-danger text-danger' : 'text-muted-fg hover:text-danger'
                          }`} 
                        />
                      </button>
                    </div>

                    {/* Content */}
                    <div className="p-4">
                      {/* Restaurant Name */}
                      <div className="flex items-center justify-between mb-2">
                        <button
                          onClick={() => navigate(`/restaurant/${deal.restaurant_id}`)}
                          className="font-semibold text-fg truncate hover:text-primary transition-colors duration-200 text-left"
                        >
                          {deal.restaurant.name}
                        </button>
                        <div className="flex items-center gap-1 text-xs text-muted-fg">
                          <Users className="h-3 w-3" />
                          <span>{deal.claimed_count} hentet</span>
                        </div>
                      </div>

                      {/* Deal Title */}
                      <h4 className="font-medium text-fg mb-2 line-clamp-2 text-sm">{deal.title}</h4>

                      {/* Price */}
                      <div className="flex items-center gap-2 mb-3">
                        <span className="text-lg font-bold text-fg">
                          {(deal.final_price / 100).toFixed(0)} kr
                        </span>
                        <span className="text-sm text-muted-fg line-through">
                          {(deal.original_price / 100).toFixed(0)} kr
                        </span>
                      </div>

                      {/* Time Info */}
                      <div className="flex items-center justify-between text-xs text-muted-fg mb-3">
                        <span>{deal.start_time.slice(0, 5)} - {deal.end_time.slice(0, 5)}</span>
                        {isAvailable ? (
                          deal.total_limit ? (
                            <span className="text-success font-medium">
                              {deal.total_limit - deal.claimed_count}/{deal.total_limit} tilgjengelig
                            </span>
                          ) : (
                            <span className="text-success font-medium">Tilgjengelig nå</span>
                          )
                        ) : (
                          <span className="text-warning">Utløpt</span>
                        )}
                      </div>

                      {/* Claim Button */}
                      <button
                        onClick={() => onClaimDeal(deal)}
                        disabled={!isAvailable}
                        className={`w-full py-2 px-4 rounded-xl font-medium transition-colors ${
                          isAvailable
                            ? 'bg-primary text-primary-fg hover:bg-primary/90'
                            : 'bg-muted text-muted-fg cursor-not-allowed'
                        }`}
                      >
                        {isAvailable ? 'Hent tilbud' : 'Utløpt'}
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            )
          })}
        </div>

        {/* Scroll Indicator */}
        {deals.length > 1 && (
          <div className="flex justify-center mt-3">
            <div className="flex gap-1">
              {deals.map((_, index) => (
                <div key={index} className="w-2 h-2 rounded-full bg-primary/30"></div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
