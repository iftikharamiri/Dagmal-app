# Cookie Implementation Guide

This document explains the cookie system implemented in the Spisly/Dagmal application.

## Overview

The application now includes a comprehensive cookie management system that:
- **Respects user privacy** with GDPR-compliant consent management
- **Uses cookies for preferences** (with localStorage fallback)
- **Provides a consent banner** for users to choose their cookie preferences
- **Stores user preferences securely** with proper cookie settings

## Cookie Types

### 1. Necessary Cookies (Always Active)
- **Purpose**: Required for the app to function
- **Examples**: Authentication, session management, security
- **Consent**: Always enabled, cannot be disabled
- **Storage**: Cookies with HttpOnly, Secure, SameSite=Lax flags

### 2. Analytics Cookies (Optional)
- **Purpose**: Help understand how users interact with the app
- **Examples**: Page views, feature usage, performance metrics
- **Consent**: User can enable/disable via consent banner
- **Storage**: Cookies with Secure, SameSite=Lax flags

### 3. Marketing Cookies (Optional)
- **Purpose**: Personalize content and offers based on user preferences
- **Examples**: Personalized deals, targeted promotions
- **Consent**: User can enable/disable via consent banner
- **Storage**: Cookies with Secure, SameSite=Lax flags

## Files Created

### Core Utilities
- **`src/lib/cookies.ts`**: Basic cookie operations (set, get, delete)
- **`src/lib/consent.ts`**: Consent management system
- **`src/lib/storage.ts`**: Unified storage (cookies + localStorage fallback)

### Components
- **`src/components/CookieConsentBanner.tsx`**: Consent banner UI component

## Usage Examples

### Setting a Cookie
```typescript
import { setCookie } from '@/lib/cookies'

setCookie('user_preference', 'value', {
  expires: 365, // days
  secure: true,
  sameSite: 'Lax'
})
```

### Getting a Cookie
```typescript
import { getCookie } from '@/lib/cookies'

const value = getCookie('user_preference')
```

### Checking Consent
```typescript
import { hasConsentFor, shouldTrackAnalytics } from '@/lib/consent'

if (hasConsentFor('analytics')) {
  // Track analytics
}

// Or use helper
if (shouldTrackAnalytics()) {
  // Track analytics
}
```

### Using Storage Utilities
```typescript
import { setPreference, getPreference, setWelcomeSeen, hasWelcomeSeen } from '@/lib/storage'

// Set a preference (uses cookies if consent given, falls back to localStorage)
setPreference('theme', 'dark')

// Get a preference
const theme = getPreference('theme')

// Welcome screen utilities
setWelcomeSeen()
if (hasWelcomeSeen()) {
  // User has seen welcome screen
}
```

## Cookie Names

All application cookies use the `dagmal_` prefix:
- `dagmal_consent` - User's cookie consent preferences
- `dagmal_welcomeSeen` - Whether user has seen welcome screen
- `dagmal_activeRestaurantId` - Active restaurant ID for business owners
- `dagmal_*` - Other user preferences

## Consent Banner

The consent banner appears automatically when:
- User visits the app for the first time
- User hasn't given consent yet

Users can:
- **Accept all**: Enable all cookie types
- **Reject optional**: Only enable necessary cookies
- **Customize**: Choose specific cookie types via settings

## Security Settings

All cookies are set with:
- **Secure**: Only sent over HTTPS (in production)
- **SameSite=Lax**: Protection against CSRF attacks
- **HttpOnly**: For sensitive cookies (when needed for server-side)
- **Path=/**: Available across the entire app

## Migration from localStorage

The following localStorage items have been migrated to use cookies:
- `welcomeSeen` → `dagmal_welcomeSeen` (cookie)
- `activeRestaurantId` → `dagmal_activeRestaurantId` (cookie)

The storage utilities automatically fall back to localStorage if:
- Cookies are disabled in the browser
- Consent hasn't been given yet
- Cookie operations fail

## Future Enhancements

### Server-Side Cookie Support
If you need server-side cookie tracking in `server.js`:
1. Install cookie parser: `npm install cookie-parser`
2. Use the consent cookie to check user preferences
3. Only track analytics/marketing if consent is given

Example:
```javascript
import cookieParser from 'cookie-parser'
app.use(cookieParser())

app.get('/api/track', (req, res) => {
  const consentCookie = req.cookies.dagmal_consent
  if (consentCookie) {
    const consent = JSON.parse(consentCookie)
    if (consent.analytics) {
      // Track analytics
    }
  }
})
```

## GDPR Compliance

This implementation follows GDPR best practices:
- ✅ Users can see what cookies are used
- ✅ Users can choose which cookies to accept
- ✅ Consent is stored and can be revoked
- ✅ Only necessary cookies are set before consent
- ✅ Clear information about cookie purposes

## Testing

To test the cookie system:
1. Clear your browser cookies
2. Visit the app - consent banner should appear
3. Test different consent options
4. Check browser DevTools → Application → Cookies to verify cookies are set correctly

## Notes

- Cookies expire after 365 days by default
- Consent preferences are stored in a single cookie (`dagmal_consent`)
- The system gracefully falls back to localStorage if cookies are unavailable
- All cookie operations are safe for SSR (server-side rendering)

