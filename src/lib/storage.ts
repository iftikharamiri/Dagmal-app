/**
 * Storage utilities that use cookies with localStorage as fallback
 * Provides a unified interface for storing user preferences and data
 */

import { setCookie, getCookie, deleteCookie } from './cookies'
import { hasConsentFor } from './consent'

const COOKIE_PREFIX = 'dagmal_'

/**
 * Set a preference value (uses cookies if consent given, falls back to localStorage)
 */
export function setPreference(key: string, value: string, useCookie: boolean = true): void {
  if (typeof window === 'undefined') return

  const cookieName = `${COOKIE_PREFIX}${key}`

  // Try cookie first if consent is given and useCookie is true
  if (useCookie && hasConsentFor('necessary')) {
    try {
      setCookie(cookieName, value, {
        expires: 365, // 1 year
        secure: true,
        sameSite: 'Lax',
      })
      return
    } catch (error) {
      console.warn('Failed to set cookie, falling back to localStorage:', error)
    }
  }

  // Fallback to localStorage
  try {
    localStorage.setItem(key, value)
  } catch (error) {
    console.warn('Failed to set localStorage:', error)
  }
}

/**
 * Get a preference value (checks cookies first, then localStorage)
 */
export function getPreference(key: string): string | null {
  if (typeof window === 'undefined') return null

  const cookieName = `${COOKIE_PREFIX}${key}`

  // Try cookie first
  try {
    const cookieValue = getCookie(cookieName)
    if (cookieValue !== null) {
      return cookieValue
    }
  } catch (error) {
    // Ignore cookie errors, fall through to localStorage
  }

  // Fallback to localStorage
  try {
    return localStorage.getItem(key)
  } catch (error) {
    console.warn('Failed to get localStorage:', error)
    return null
  }
}

/**
 * Remove a preference (removes from both cookies and localStorage)
 */
export function removePreference(key: string): void {
  if (typeof window === 'undefined') return

  const cookieName = `${COOKIE_PREFIX}${key}`

  // Remove from cookie
  try {
    deleteCookie(cookieName)
  } catch (error) {
    // Ignore errors
  }

  // Remove from localStorage
  try {
    localStorage.removeItem(key)
  } catch (error) {
    // Ignore errors
  }
}

/**
 * Set welcome seen flag
 */
export function setWelcomeSeen(): void {
  setPreference('welcomeSeen', '1', true)
}

/**
 * Check if welcome has been seen
 */
export function hasWelcomeSeen(): boolean {
  return getPreference('welcomeSeen') === '1'
}

/**
 * Set active restaurant ID (for restaurant owners)
 */
export function setActiveRestaurantId(restaurantId: string): void {
  setPreference('activeRestaurantId', restaurantId, true)
}

/**
 * Get active restaurant ID
 */
export function getActiveRestaurantId(): string | null {
  return getPreference('activeRestaurantId')
}

/**
 * Remove active restaurant ID
 */
export function removeActiveRestaurantId(): void {
  removePreference('activeRestaurantId')
}

