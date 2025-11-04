import { BrowserRouter, Routes, Route, useLocation } from 'react-router-dom'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { Toaster } from 'sonner'
import { BottomNavigation } from '@/components/BottomNavigation'
import React from 'react'

// Pages
import { HomePage } from '@/routes/home'
import { AuthPage } from '@/routes/auth'
import { ProfilePage } from '@/routes/profile'
import { FavoritesPage } from '@/routes/favorites'
import { ClaimsPage } from '@/routes/claims'
import { MapPage } from '@/routes/map'
import { RestaurantPage } from '@/routes/restaurant'
import { MenuPage } from '@/routes/menu'
import { BusinessPage } from '@/routes/business'
import { RegisterRestaurantPage } from '@/routes/register-restaurant'
import { RestaurantDashboardPage } from '@/routes/restaurant-dashboard'
import { SelectRestaurantPage } from '@/routes/select-restaurant'
import { CreateDealPage } from '@/routes/create-deal'
import { AdminPage } from '@/routes/admin'
import { PhoneAuthTest } from '@/components/PhoneAuthTest'
import { AIPage } from '@/routes/ai'
import RewardsPage from '@/routes/rewards'
import { WelcomePage } from '@/routes/welcome'

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 5 * 60 * 1000, // 5 minutes
      refetchOnWindowFocus: false,
    },
  },
})

function AppContent() {
  const location = useLocation()

  // First-visit redirect to welcome page
  React.useEffect(() => {
    if (location.pathname === '/') {
      try {
        const seen = localStorage.getItem('welcomeSeen')
        if (!seen) {
          window.history.replaceState(null, '', '/welcome')
        }
      } catch {
        // If localStorage blocked, still show welcome
        window.history.replaceState(null, '', '/welcome')
      }
    }
  }, [location.pathname])

  // Hide bottom navigation on auth, welcome, business, admin, and AI pages
  const showBottomNav = !location.pathname.startsWith('/auth') && !location.pathname.startsWith('/welcome') && !location.pathname.startsWith('/business') && !location.pathname.startsWith('/admin') && !location.pathname.startsWith('/ai')

  return (
    <div className="min-h-screen bg-bg">
      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route path="/welcome" element={<WelcomePage />} />
        <Route path="/auth" element={<AuthPage />} />
        <Route path="/profile" element={<ProfilePage />} />
        <Route path="/favorites" element={<FavoritesPage />} />
        <Route path="/claims" element={<ClaimsPage />} />
        <Route path="/map" element={<MapPage />} />
        <Route path="/ai" element={<AIPage />} />
        <Route path="/rewards" element={<RewardsPage />} />
        <Route path="/restaurant/:id" element={<RestaurantPage />} />
        <Route path="/restaurant/:id/menu" element={<MenuPage />} />
        <Route path="/business" element={<BusinessPage />} />
        <Route path="/business/register-restaurant" element={<RegisterRestaurantPage />} />
        <Route path="/business/select" element={<SelectRestaurantPage />} />
        <Route path="/business/dashboard" element={<RestaurantDashboardPage />} />
        <Route path="/business/create-deal" element={<CreateDealPage />} />
        <Route path="/admin" element={<AdminPage />} />
        <Route path="/test-phone-auth" element={<PhoneAuthTest />} />
      </Routes>

      {showBottomNav && <BottomNavigation />}
      
      <Toaster 
        position="top-center"
        toastOptions={{
          duration: 4000,
          style: {
            background: 'hsl(var(--card))',
            color: 'hsl(var(--card-fg))',
            border: '1px solid hsl(var(--border))',
          },
        }}
      />
    </div>
  )
}

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <AppContent />
      </BrowserRouter>
    </QueryClientProvider>
  )
}

