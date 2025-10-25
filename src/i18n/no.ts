export const norwegianText = {
  // Navigation
  nav: {
    home: 'Hjem',
    map: 'Kart',
    favorites: 'Favoritter',
    claims: 'Mine tilbud',
    profile: 'Profil',
  },

  // Actions
  actions: {
    claimDeal: 'Hent tilbud',
    save: 'Lagre',
    cancel: 'Avbryt',
    login: 'Logg inn',
    register: 'Opprett konto',
    logout: 'Logg ut',
    search: 'Søk',
    filter: 'Filtrer',
    sort: 'Sorter',
    confirm: 'Bekreft',
    close: 'Lukk',
  },

  // Deal related
  deal: {
    dineIn: 'Spise på stedet',
    takeaway: 'Takeaway',
    quantity: 'Antall personer',
    timeWindow: 'Tilgjengelig tidsrom',
    phone: 'Telefonnummer',
    specialRequests: 'Spesielle ønsker',
    totalSavings: 'Total besparelse',
    userLimit: 'Begrensning per bruker',
    serviceType: 'Tjenestetype',
    available: 'Tilgjengelig',
    unavailable: 'Ikke tilgjengelig nå',
    expires: 'Utløper',
  },

  // Filters
  filters: {
    cuisine: 'Kjøkken',
    dietary: 'Kost/Allergier',
    distance: 'Avstand',
    priceRange: 'Prisklasse',
    sortBy: 'Sorter etter',
    nearest: 'Nærmest',
    highestDiscount: 'Høyeste rabatt',
    lowestPrice: 'Laveste pris',
  },

  // Empty states
  empty: {
    noDeals: 'Ingen tilbud funnet',
    noFavorites: 'Du har ingen favoritter enda',
    noClaims: 'Du har ikke hentet noen tilbud enda',
    loading: 'Laster…',
  },

  // Errors
  errors: {
    dailyLimitReached: 'Du har nådd maks antall for dette tilbudet i dag.',
    dealNotAvailable: 'Dette tilbudet er ikke tilgjengelig nå.',
    phoneRequired: 'Telefonnummer er påkrevd for takeaway.',
    loginRequired: 'Du må logge inn for å hente tilbud.',
    networkError: 'Nettverksfeil. Prøv igjen.',
    unknownError: 'Noe gikk galt. Prøv igjen.',
  },

  // Success messages
  success: {
    dealClaimed: 'Tilbud hentet! Vis i "Mine tilbud"',
    profileUpdated: 'Profil oppdatert',
    favoriteAdded: 'Lagt til i favoritter',
    favoriteRemoved: 'Fjernet fra favoritter',
  },

  // Profile
  profile: {
    displayName: 'Navn',
    phone: 'Telefonnummer',
    cuisinePreferences: 'Kjøkkenpreferanser',
    dietaryRestrictions: 'Kost/Allergier',
    notifications: 'Varsler',
    editProfile: 'Rediger profil',
  },

  // Auth
  auth: {
    email: 'E-post',
    password: 'Passord',
    confirmPassword: 'Bekreft passord',
    forgotPassword: 'Glemt passord?',
    noAccount: 'Har du ikke konto?',
    hasAccount: 'Har du allerede konto?',
    signUp: 'Registrer deg',
    signIn: 'Logg inn',
  },

  // Business
  business: {
    title: 'Eierportal',
    description: 'Administrer dine restauranttilbud',
    comingSoon: 'Kommer snart',
  },
} as const


























