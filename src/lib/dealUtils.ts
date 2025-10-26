import type { DealWithRestaurant } from '@/lib/database.types'

/**
 * Check if a deal is currently available based on time and day
 */
export function isDealCurrentlyAvailable(deal: DealWithRestaurant): boolean {
  const now = new Date()
  const currentTime = now.toTimeString().slice(0, 5) // HH:MM format
  const currentDay = now.getDay() // 0 = Sunday, 1 = Monday, etc.

  // For now, let's just check time and active status - skip day check temporarily
  const startTime = deal.start_time.slice(0, 5)
  const endTime = deal.end_time.slice(0, 5)
  const isTimeAvailable = currentTime >= startTime && currentTime <= endTime
  const isActive = deal.is_active

  // Simplified logic - just check time and active status
  return isTimeAvailable && isActive
}

/**
 * Get the number of available deals
 */
export function getAvailableDealsCount(deals: DealWithRestaurant[]): number {
  return deals.filter(isDealCurrentlyAvailable).length
}

/**
 * Sort deals by availability first, then by highest discount
 */
export function sortDealsByAvailabilityAndDiscount(deals: DealWithRestaurant[]): DealWithRestaurant[] {
  return [...deals].sort((a, b) => {
    const aAvailable = isDealCurrentlyAvailable(a)
    const bAvailable = isDealCurrentlyAvailable(b)

    // First sort by availability (available deals first)
    if (aAvailable && !bAvailable) return -1
    if (!aAvailable && bAvailable) return 1

    // If both are available or both are not available, sort by discount percentage (highest first)
    if (aAvailable && bAvailable) {
      return b.discount_percentage - a.discount_percentage
    }

    // For non-available deals, also sort by discount percentage
    return b.discount_percentage - a.discount_percentage
  })
}

/**
 * Simple sorting: Available deals first, then by highest discount
 * Expired deals (utløpt) go to the bottom
 */
export function sortDealsByRestaurantAvailability(deals: DealWithRestaurant[]): DealWithRestaurant[] {
  return [...deals].sort((a, b) => {
    const aAvailable = isDealCurrentlyAvailable(a)
    const bAvailable = isDealCurrentlyAvailable(b)

    // Available deals (tilgjengelig) come first
    if (aAvailable && !bAvailable) return -1
    if (!aAvailable && bAvailable) return 1

    // If both are available or both are expired, sort by highest discount
    return b.discount_percentage - a.discount_percentage
  })
}

/**
 * Get deals that are currently available
 */
export function getAvailableDeals(deals: DealWithRestaurant[]): DealWithRestaurant[] {
  return deals.filter(isDealCurrentlyAvailable)
}

/**
 * Get deals that are not currently available
 */
export function getUnavailableDeals(deals: DealWithRestaurant[]): DealWithRestaurant[] {
  return deals.filter(deal => !isDealCurrentlyAvailable(deal))
}

/**
 * Format time for display
 */
export function formatTime(time: string): string {
  return time.slice(0, 5) // HH:MM format
}

/**
 * Get time until deal starts (if not yet available)
 */
export function getTimeUntilStart(deal: DealWithRestaurant): string | null {
  if (isDealCurrentlyAvailable(deal)) return null

  const now = new Date()
  const currentTime = now.toTimeString().slice(0, 5)
  
  if (currentTime < deal.start_time.slice(0, 5)) {
    return `Starter ${deal.start_time.slice(0, 5)}`
  }
  
  return null
}

/**
 * Get time until deal ends (if currently available)
 */
export function getTimeUntilEnd(deal: DealWithRestaurant): string | null {
  if (!isDealCurrentlyAvailable(deal)) return null

  const now = new Date()
  const currentTime = now.toTimeString().slice(0, 5)
  
  if (currentTime < deal.end_time.slice(0, 5)) {
    return `Slutter ${deal.end_time.slice(0, 5)}`
  }
  
  return null
}

/**
 * Calculate popularity score based on discount percentage and number of claims
 * Higher discount + more claims = more popular
 */
export function calculatePopularityScore(deal: DealWithRestaurant): number {
  const discountScore = deal.discount_percentage * 2 // Weight discount heavily
  const claimsScore = deal.claimed_count * 1.5 // Weight claims moderately
  
  // Bonus points for being currently available
  const availabilityBonus = isDealCurrentlyAvailable(deal) ? 50 : 0
  
  return discountScore + claimsScore + availabilityBonus
}

/**
 * Get the most popular deals (top 3)
 */
export function getPopularDeals(deals: DealWithRestaurant[], count: number = 3): DealWithRestaurant[] {
  return [...deals]
    .sort((a, b) => calculatePopularityScore(b) - calculatePopularityScore(a))
    .slice(0, count)
}
