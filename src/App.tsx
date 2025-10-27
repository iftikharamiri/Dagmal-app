import { BrowserRouter, Routes, Route, useLocation } from 'react-router-dom'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { Toaster } from 'sonner'
import { BottomNavigation } from '@/components/BottomNavigation'

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
import { CreateDealPage } from '@/routes/create-deal'
import { AdminPage } from '@/routes/admin'
import { PhoneAuthTest } from '@/components/PhoneAuthTest'

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
  
  // Hide bottom navigation on auth, business, and admin pages
  const showBottomNav = !location.pathname.startsWith('/auth') && !location.pathname.startsWith('/business') && !location.pathname.startsWith('/admin')

  return (
    <div className="min-h-screen bg-bg">
      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route path="/auth" element={<AuthPage />} />
        <Route path="/profile" element={<ProfilePage />} />
        <Route path="/favorites" element={<FavoritesPage />} />
        <Route path="/claims" element={<ClaimsPage />} />
        <Route path="/map" element={<MapPage />} />
        <Route path="/restaurant/:id" element={<RestaurantPage />} />
        <Route path="/restaurant/:id/menu" element={<MenuPage />} />
        <Route path="/business" element={<BusinessPage />} />
        <Route path="/business/register-restaurant" element={<RegisterRestaurantPage />} />
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

