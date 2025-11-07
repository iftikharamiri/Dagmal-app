import type { DealWithRestaurant } from '@/lib/database.types'

const DAY_MAP = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday']

const toHHMM = (time: string) => time.slice(0, 5)

const getCurrentHHMM = (now: Date) => now.toTimeString().slice(0, 5)

const resolveNow = (input?: unknown): Date => {
  if (input instanceof Date) {
    return input
  }

  return new Date()
}

const isDealActiveOnDay = (deal: DealWithRestaurant, nowInput?: unknown) => {
  const now = resolveNow(nowInput)
  if (!deal.available_days || deal.available_days.length === 0) {
    return true
  }

  const todayName = DAY_MAP[now.getDay()]
  const normalizedDays = deal.available_days.map(day => day.toLowerCase())

  return normalizedDays.includes(todayName)
}

/**
 * Check if a deal can be claimed at any point today (until end time)
 */
export function isDealClaimableToday(deal: DealWithRestaurant, nowInput?: unknown): boolean {
  const now = resolveNow(nowInput)
  if (!deal.is_active) return false
  if (!isDealActiveOnDay(deal, now)) return false

  const currentTime = getCurrentHHMM(now)
  const endTime = toHHMM(deal.end_time)

  return currentTime <= endTime
}

/**
 * Check if a deal is currently redeemable (within the active window right now)
 */
export function isDealRedeemableNow(deal: DealWithRestaurant, nowInput?: unknown): boolean {
  const now = resolveNow(nowInput)
  if (!isDealClaimableToday(deal, now)) return false

  const currentTime = getCurrentHHMM(now)
  const startTime = toHHMM(deal.start_time)
  const endTime = toHHMM(deal.end_time)

  return currentTime >= startTime && currentTime <= endTime
}

/**
 * Check if a deal is currently available based on time and day (redeemable right now)
 */
export function isDealCurrentlyAvailable(deal: DealWithRestaurant, nowInput?: unknown): boolean {
  return isDealRedeemableNow(deal, nowInput)
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
