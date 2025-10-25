import { useQuery, useQueryClient } from '@tanstack/react-query'
import { LogOut, Settings } from 'lucide-react'
import { toast } from 'sonner'
import { useNavigate } from 'react-router-dom'
import { Header } from '@/components/Header'
import { ProfileForm } from '@/components/ProfileForm'
import { useAuthGuard } from '@/hooks/useAuthGuard'
import { supabase } from '@/lib/supabase'
import { norwegianText } from '@/i18n/no'
import type { Profile } from '@/lib/database.types'

export function ProfilePage() {
  const { user, isLoading: authLoading } = useAuthGuard()
  const navigate = useNavigate()
  const queryClient = useQueryClient()

  const { data: profile, isLoading: profileLoading } = useQuery({
    queryKey: ['profile'],
    queryFn: async () => {
      if (!user) return null

      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .single()

      if (error && error.code !== 'PGRST116') throw error
      return data
    },
    enabled: !!user,
  })

  const handleSaveProfile = async (profileData: Partial<Profile>) => {
    if (!user) return

    try {
      let query = supabase.from('profiles')

      let error;
      if (profile) {
        // Update existing profile
        const result = await query
          .update(profileData)
          .eq('id', user.id)
        error = result.error;
      } else {
        // Create new profile
        const result = await query
          .insert({
            id: user.id,
            ...profileData,
          })
        error = result.error;
      }

      if (error) throw error

      // Update cache
      queryClient.setQueryData(['profile'], {
        ...profile,
        ...profileData,
        id: user.id,
      })

      toast.success(norwegianText.success.profileUpdated)
    } catch (error) {
      console.error('Error saving profile:', error)
      toast.error(norwegianText.errors.unknownError)
      throw error
    }
  }

  const handleLogout = async () => {
    try {
      // Check if we're in demo mode
      const isDemoMode = false
      
      if (isDemoMode) {
        // Demo mode - clear localStorage
        localStorage.removeItem('demo_user')
        localStorage.removeItem('demo_profile')
        localStorage.removeItem('demo_favorites')
      } else {
        // Real Supabase mode
        const { error } = await supabase.auth.signOut()
        if (error) throw error
      }

      // Clear all cached data
      queryClient.clear()
      
      toast.success('Logget ut')
      navigate('/auth')
    } catch (error) {
      console.error('Error logging out:', error)
      toast.error(norwegianText.errors.unknownError)
    }
  }

  if (authLoading || !user) {
    return (
      <div className="min-h-screen bg-bg">
        <Header showSearch={false} />
        <div className="flex items-center justify-center py-20">
          <div className="animate-spin rounded-full h-8 w-8 border-2 border-primary border-t-transparent" />
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-bg pb-20">
      <Header showSearch={false} showMenu={false} />

      <main className="px-4 py-6">
        <div className="max-w-2xl mx-auto space-y-6">
          {/* Profile Header */}
          <div className="card p-6">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h1 className="text-2xl font-bold">{norwegianText.nav.profile}</h1>
                <p className="text-muted-fg">{user.email}</p>
              </div>
              <div className="flex gap-2">
                <button
                  onClick={() => {
                    // TODO: Add settings page
                    toast.info('Innstillinger kommer snart')
                  }}
                  className="btn-ghost p-2 rounded-full"
                  aria-label="Innstillinger"
                >
                  <Settings className="h-5 w-5" />
                </button>
                <button
                  onClick={handleLogout}
                  className="btn-ghost p-2 rounded-full text-danger hover:bg-danger/10"
                  aria-label={norwegianText.actions.logout}
                >
                  <LogOut className="h-5 w-5" />
                </button>
              </div>
            </div>
          </div>

          {/* Admin Link */}
          {user?.email === (import.meta.env.VITE_ADMIN_EMAIL || 'iftikharamiri5@gmail.com') && (
            <div className="card p-6">
              <h2 className="text-lg font-semibold mb-4">Admin Panel</h2>
              <p className="text-muted-fg mb-4">Manage restaurants, deals, and users</p>
              <button
                onClick={() => navigate('/admin')}
                className="btn-primary"
              >
                Open Admin Panel
              </button>
            </div>
          )}

          {/* Profile Form */}
          <div className="card p-6">
            <h2 className="text-lg font-semibold mb-4">{norwegianText.profile.editProfile}</h2>
            <ProfileForm
              profile={profile}
              onSave={handleSaveProfile}
              isLoading={profileLoading}
            />
          </div>


          {/* Account Actions */}
          <div className="space-y-3">
            <button
              onClick={() => navigate('/favorites')}
              className="w-full btn-ghost justify-start"
            >
              Mine favoritter
            </button>
            <button
              onClick={() => navigate('/claims')}
              className="w-full btn-ghost justify-start"
            >
              Mine tilbud
            </button>
            <button
              onClick={() => {
                // TODO: Add help page
                toast.info('Hjelp kommer snart')
              }}
              className="w-full btn-ghost justify-start"
            >
              Hjelp og support
            </button>
          </div>

          {/* Logout Button */}
          <button
            onClick={handleLogout}
            className="w-full btn-destructive"
          >
            <LogOut className="h-4 w-4 mr-2" />
            {norwegianText.actions.logout}
          </button>
        </div>
      </main>
    </div>
  )
}

