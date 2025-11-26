import type { DealWithRestaurant } from '@/lib/database.types'

const DAY_KEYS = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'] as const

const DAY_ALIAS_MAP: Record<string, typeof DAY_KEYS[number]> = {
  '0': 'sunday',
  '1': 'monday',
  '2': 'tuesday',
  '3': 'wednesday',
  '4': 'thursday',
  '5': 'friday',
  '6': 'saturday',
  '7': 'sunday',
  sun: 'sunday',
  sunday: 'sunday',
  mon: 'monday',
  monday: 'monday',
  tue: 'tuesday',
  tuesday: 'tuesday',
  wed: 'wednesday',
  wednesday: 'wednesday',
  thu: 'thursday',
  thursday: 'thursday',
  fri: 'friday',
  friday: 'friday',
  sat: 'saturday',
  saturday: 'saturday',
}

function normalizeDayValue(value: string): typeof DAY_KEYS[number] | null {
  const normalized = value?.toString().trim().toLowerCase()
  if (!normalized) return null
  return DAY_ALIAS_MAP[normalized] ?? null
}

function parseTimeToMinutes(time: string | null | undefined): number | null {
  if (!time) return null
  const trimmed = time.trim()
  if (!trimmed) return null
  const [hours, minutes] = trimmed.split(':')
  const h = parseInt(hours ?? '', 10)
  const m = parseInt(minutes ?? '0', 10)
  if (Number.isNaN(h) || Number.isNaN(m)) return null
  return h * 60 + m
}

function getCurrentMinutes(now: Date): number {
  return now.getHours() * 60 + now.getMinutes()
}

export function isDealWithinActiveDateRange(deal: DealWithRestaurant, referenceDate: Date = new Date()): boolean {
  const today = referenceDate.toISOString().split('T')[0]

  if (deal.start_date && today < deal.start_date) {
    return false
  }

  if (deal.end_date && today > deal.end_date) {
    return false
  }

  return true
}

export function isDealActiveOnReferenceDay(deal: DealWithRestaurant, referenceDate: Date = new Date()): boolean {
  const availableDays = deal.available_days || []
  if (availableDays.length === 0) return true

  const currentDayKey = DAY_KEYS[referenceDate.getDay()]
  const normalizedDays = availableDays
    .map(normalizeDayValue)
    .filter((value): value is typeof DAY_KEYS[number] => value !== null)

  if (normalizedDays.length === 0) return true

  return normalizedDays.includes(currentDayKey)
}

function isCurrentTimeWithinDealWindow(deal: DealWithRestaurant, referenceDate: Date = new Date()): boolean {
  const startMinutes = parseTimeToMinutes(deal.start_time)
  const endMinutes = parseTimeToMinutes(deal.end_time)

  if (startMinutes == null || endMinutes == null) return false

  const currentMinutes = getCurrentMinutes(referenceDate)

  if (startMinutes === endMinutes) {
    // Treat identical start/end as full-day availability
    return true
  }

  if (startMinutes < endMinutes) {
    return currentMinutes >= startMinutes && currentMinutes <= endMinutes
  }

  // Handle overnight deals (e.g., 22:00 - 02:00)
  return currentMinutes >= startMinutes || currentMinutes <= endMinutes
}

/**
 * Check if a deal is currently available based on time, day, and date range
 */
export function isDealCurrentlyAvailable(deal: DealWithRestaurant, referenceDate: Date = new Date()): boolean {
  if (!deal.is_active) return false
  if (!isDealWithinActiveDateRange(deal, referenceDate)) return false
  if (!isDealActiveOnReferenceDay(deal, referenceDate)) return false

  return isCurrentTimeWithinDealWindow(deal, referenceDate)
}

export function filterDealsWithinActiveDateRange(
  deals: DealWithRestaurant[],
  referenceDate: Date = new Date()
): DealWithRestaurant[] {
  return deals.filter(
    (deal) =>
      deal.is_active &&
      isDealWithinActiveDateRange(deal, referenceDate) &&
      isDealActiveOnReferenceDay(deal, referenceDate)
  )
}

export function isDealUpcomingToday(deal: DealWithRestaurant, referenceDate: Date = new Date()): boolean {
  if (!deal.is_active) return false
  if (!isDealWithinActiveDateRange(deal, referenceDate)) return false
  if (!isDealActiveOnReferenceDay(deal, referenceDate)) return false

  const startMinutes = parseTimeToMinutes(deal.start_time)
  const endMinutes = parseTimeToMinutes(deal.end_time)

  if (startMinutes == null || endMinutes == null) return false

  const currentMinutes = getCurrentMinutes(referenceDate)

  if (startMinutes === endMinutes) return false

  if (startMinutes < endMinutes) {
    return currentMinutes < startMinutes
  }

  // Overnight window: treat as upcoming if current time is before start and before midnight
  return currentMinutes < startMinutes && currentMinutes > endMinutes
}

/**
 * Check if a deal is active on any day within the next 7 days (including today)
 */
export function isDealActiveWithinNextWeek(deal: DealWithRestaurant, referenceDate: Date = new Date()): boolean {
  if (!deal.is_active) return false

  const availableDays = deal.available_days || []
  
  // Check if deal is active on any day in the next 7 days
  for (let i = 0; i < 7; i++) {
    const checkDate = new Date(referenceDate)
    checkDate.setDate(checkDate.getDate() + i)
    
    // Check if this future day is within the deal's date range
    if (!isDealWithinActiveDateRange(deal, checkDate)) continue
    
    // If no specific days are set, assume available all days (within date range)
    if (availableDays.length === 0) return true
    
    // Check if deal is active on this specific day
    if (isDealActiveOnReferenceDay(deal, checkDate)) {
      return true
    }
  }

  return false
}

/**
 * Check if a deal is upcoming within the next 7 days (for "Planlegg henting")
 * Returns true if the deal starts on any day within the next 7 days but hasn't started yet
 */
export function isDealUpcomingWithinWeek(deal: DealWithRestaurant, referenceDate: Date = new Date()): boolean {
  if (!deal.is_active) return false

  // If deal is currently available, it's not upcoming
  if (isDealCurrentlyAvailable(deal, referenceDate)) return false

  // Check if deal is upcoming on any day in the next 7 days
  for (let i = 0; i < 7; i++) {
    const checkDate = new Date(referenceDate)
    checkDate.setDate(checkDate.getDate() + i)
    
    // Check if deal is within date range for this future day
    if (!isDealWithinActiveDateRange(deal, checkDate)) continue
    
    // Check if deal is active on this day
    const availableDays = deal.available_days || []
    if (availableDays.length > 0 && !isDealActiveOnReferenceDay(deal, checkDate)) continue

    // If checking today, use the existing upcoming logic
    if (i === 0) {
      if (isDealUpcomingToday(deal, referenceDate)) {
        return true
      }
    } else {
      // For future days, if the deal is active on that day and within date range, it's upcoming
      // We consider it upcoming if it's not currently available and will be available in the future
      return true
    }
  }

  return false
}

/**
 * Filter deals that are active within the next 7 days (including today)
 */
export function filterDealsWithinNextWeek(
  deals: DealWithRestaurant[],
  referenceDate: Date = new Date()
): DealWithRestaurant[] {
  return deals.filter(
    (deal) =>
      deal.is_active &&
      isDealActiveWithinNextWeek(deal, referenceDate)
  )
}

/**
 * Get the number of available deals
 */
export function getAvailableDealsCount(deals: DealWithRestaurant[]): number {
  return deals.filter((deal) => isDealCurrentlyAvailable(deal)).length
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
  return deals.filter((deal) => isDealCurrentlyAvailable(deal))
}

/**
 * Get deals that are not currently available
 */
export function getUnavailableDeals(deals: DealWithRestaurant[]): DealWithRestaurant[] {
  return deals.filter((deal) => !isDealCurrentlyAvailable(deal))
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
