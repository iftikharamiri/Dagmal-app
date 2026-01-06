/**
 * Cookie consent management system
 * Handles user consent for different types of cookies (necessary, analytics, marketing)
 */

import { setCookie, getCookie, deleteCookie } from './cookies'

export type ConsentCategory = 'necessary' | 'analytics' | 'marketing'

export interface ConsentPreferences {
  necessary: boolean // Always true, cannot be disabled
  analytics: boolean
  marketing: boolean
  timestamp: number // When consent was given
}

const CONSENT_COOKIE_NAME = 'dagmal_consent'
const CONSENT_EXPIRY_DAYS = 365

/**
 * Default consent preferences (necessary is always true)
 */
const DEFAULT_CONSENT: ConsentPreferences = {
  necessary: true,
  analytics: false,
  marketing: false,
  timestamp: Date.now(),
}

/**
 * Get current consent preferences from cookie
 */
export function getConsentPreferences(): ConsentPreferences {
  try {
    const consentCookie = getCookie(CONSENT_COOKIE_NAME)
    if (!consentCookie) {
      return DEFAULT_CONSENT
    }

    const parsed = JSON.parse(consentCookie) as Partial<ConsentPreferences>
    return {
      necessary: true, // Always true
      analytics: parsed.analytics ?? false,
      marketing: parsed.marketing ?? false,
      timestamp: parsed.timestamp ?? Date.now(),
    }
  } catch {
    return DEFAULT_CONSENT
  }
}

/**
 * Check if user has given consent (consent cookie exists)
 */
export function hasConsent(): boolean {
  return getCookie(CONSENT_COOKIE_NAME) !== null
}

/**
 * Check if consent is given for a specific category
 */
export function hasConsentFor(category: ConsentCategory): boolean {
  const preferences = getConsentPreferences()
  
  // Necessary cookies are always allowed
  if (category === 'necessary') {
    return true
  }

  return preferences[category] ?? false
}

/**
 * Save consent preferences to cookie
 */
export function saveConsentPreferences(preferences: Partial<ConsentPreferences>): void {
  const current = getConsentPreferences()
  const updated: ConsentPreferences = {
    necessary: true, // Always true
    analytics: preferences.analytics ?? current.analytics,
    marketing: preferences.marketing ?? current.marketing,
    timestamp: Date.now(),
  }

  setCookie(CONSENT_COOKIE_NAME, JSON.stringify(updated), {
    expires: CONSENT_EXPIRY_DAYS,
    secure: true,
    sameSite: 'Lax',
  })
}

/**
 * Accept all cookies (analytics + marketing)
 */
export function acceptAllCookies(): void {
  saveConsentPreferences({
    analytics: true,
    marketing: true,
  })
}

/**
 * Reject optional cookies (only necessary)
 */
export function rejectOptionalCookies(): void {
  saveConsentPreferences({
    analytics: false,
    marketing: false,
  })
}

/**
 * Revoke consent (delete consent cookie and optional cookies)
 */
export function revokeConsent(): void {
  deleteCookie(CONSENT_COOKIE_NAME)
  
  // Delete analytics cookies if they exist
  const analyticsCookies = ['_ga', '_gid', '_gat', '_ga_*'] // Common Google Analytics cookies
  analyticsCookies.forEach(cookie => {
    // Note: We can't delete wildcard cookies, but we can try common patterns
    deleteCookie(cookie)
  })
}

/**
 * Check if we should track analytics based on consent
 */
export function shouldTrackAnalytics(): boolean {
  return hasConsentFor('analytics')
}

/**
 * Check if we should track marketing based on consent
 */
export function shouldTrackMarketing(): boolean {
  return hasConsentFor('marketing')
}

