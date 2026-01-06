import React from 'react'
import { useNavigate } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { Building2, ArrowLeft } from 'lucide-react'
import { supabase } from '@/lib/supabase'
import { setActiveRestaurantId } from '@/lib/storage'

export function SelectRestaurantPage() {
  const navigate = useNavigate()

  const { data: restaurants = [], isLoading } = useQuery({
    queryKey: ['owned-restaurants-list'],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return []
      const { data, error } = await supabase
        .from('restaurants')
        .select('id,name,city,address')
        .eq('owner_id', user.id)
        .order('name', { ascending: true })
      if (error) throw error
      return data || []
    }
  })

  const choose = (id: string) => {
    setActiveRestaurantId(id)
    // Dispatch event so dashboard can react immediately
    window.dispatchEvent(new Event('restaurant-selected'))
    navigate('/business/dashboard')
  }

  return (
    <div className="min-h-screen bg-bg">
      <div className="bg-white border-b px-4 py-4">
        <div className="flex items-center gap-3">
          <button onClick={() => navigate('/')} className="p-2 hover:bg-muted rounded-lg">
            <ArrowLeft className="h-5 w-5" />
          </button>
          <h1 className="text-xl font-bold">Velg restaurant</h1>
        </div>
      </div>

      <div className="max-w-2xl mx-auto p-4">
        {isLoading ? (
          <div className="text-center py-16">Laster...</div>
        ) : restaurants.length === 0 ? (
          <div className="text-center py-16">
            <div className="text-6xl mb-4">🏪</div>
            <p className="mb-4">Ingen restauranter funnet på kontoen din.</p>
            <button onClick={() => navigate('/business/register-restaurant')} className="btn-primary">Registrer restaurant</button>
          </div>
        ) : (
          <div className="grid gap-3">
            {restaurants.map(r => (
              <button key={r.id} onClick={() => choose(r.id)} className="card p-4 w-full text-left hover:shadow-md transition">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
                    <Building2 className="h-5 w-5 text-primary" />
                  </div>
                  <div>
                    <div className="font-semibold">{r.name}</div>
                    <div className="text-sm text-muted-fg">{r.address}, {r.city}</div>
                  </div>
                </div>
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}


