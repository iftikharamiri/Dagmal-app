/**
 * Cookie utility functions for managing cookies in the application
 * Handles setting, getting, and deleting cookies with proper security settings
 */

export interface CookieOptions {
  /** Cookie expiration in days (default: 365) */
  expires?: number
  /** Cookie path (default: '/') */
  path?: string
  /** Cookie domain (default: current domain) */
  domain?: string
  /** Secure flag - only send over HTTPS (default: true in production) */
  secure?: boolean
  /** SameSite attribute (default: 'Lax') */
  sameSite?: 'Strict' | 'Lax' | 'None'
  /** HttpOnly flag - prevents JavaScript access (default: false for client-side cookies) */
  httpOnly?: boolean
}

/**
 * Set a cookie with the given name and value
 */
export function setCookie(name: string, value: string, options: CookieOptions = {}): void {
  if (typeof document === 'undefined') return // SSR safety

  const {
    expires = 365,
    path = '/',
    domain,
    secure = window.location.protocol === 'https:',
    sameSite = 'Lax',
  } = options

  let cookieString = `${encodeURIComponent(name)}=${encodeURIComponent(value)}`

  // Add expiration
  if (expires) {
    const date = new Date()
    date.setTime(date.getTime() + expires * 24 * 60 * 60 * 1000)
    cookieString += `; expires=${date.toUTCString()}`
  }

  // Add path
  cookieString += `; path=${path}`

  // Add domain if specified
  if (domain) {
    cookieString += `; domain=${domain}`
  }

  // Add secure flag
  if (secure) {
    cookieString += '; secure'
  }

  // Add SameSite
  cookieString += `; SameSite=${sameSite}`

  document.cookie = cookieString
}

/**
 * Get a cookie value by name
 */
export function getCookie(name: string): string | null {
  if (typeof document === 'undefined') return null // SSR safety

  const nameEQ = `${encodeURIComponent(name)}=`
  const cookies = document.cookie.split(';')

  for (let i = 0; i < cookies.length; i++) {
    let cookie = cookies[i]
    while (cookie.charAt(0) === ' ') {
      cookie = cookie.substring(1, cookie.length)
    }
    if (cookie.indexOf(nameEQ) === 0) {
      return decodeURIComponent(cookie.substring(nameEQ.length, cookie.length))
    }
  }

  return null
}

/**
 * Delete a cookie by setting it to expire in the past
 */
export function deleteCookie(name: string, options: Pick<CookieOptions, 'path' | 'domain'> = {}): void {
  if (typeof document === 'undefined') return // SSR safety

  const { path = '/', domain } = options

  let cookieString = `${encodeURIComponent(name)}=; expires=Thu, 01 Jan 1970 00:00:00 UTC`

  cookieString += `; path=${path}`

  if (domain) {
    cookieString += `; domain=${domain}`
  }

  document.cookie = cookieString
}

/**
 * Check if cookies are enabled in the browser
 */
export function areCookiesEnabled(): boolean {
  if (typeof document === 'undefined') return false

  try {
    const testCookie = 'dagmal_cookie_test'
    setCookie(testCookie, '1', { expires: 0.001 }) // Expires in ~1.4 minutes
    const enabled = getCookie(testCookie) !== null
    deleteCookie(testCookie)
    return enabled
  } catch {
    return false
  }
}

/**
 * Get all cookies as an object
 */
export function getAllCookies(): Record<string, string> {
  if (typeof document === 'undefined') return {}

  const cookies: Record<string, string> = {}
  const cookieStrings = document.cookie.split(';')

  for (const cookieString of cookieStrings) {
    const [name, value] = cookieString.trim().split('=')
    if (name && value) {
      cookies[decodeURIComponent(name)] = decodeURIComponent(value)
    }
  }

  return cookies
}

