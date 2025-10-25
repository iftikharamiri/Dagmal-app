import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { Users, Store, Tag, BarChart3, Plus, Edit, Trash2, Eye, ArrowLeft } from 'lucide-react'
import { Header } from '@/components/Header'
import { useAuthGuard } from '@/hooks/useAuthGuard'
import { supabase } from '@/lib/supabase'
import { cn } from '@/lib/utils'
import { useNavigate } from 'react-router-dom'

type AdminTab = 'dashboard' | 'restaurants' | 'deals' | 'users'

export function AdminPage() {
  const { user, isLoading: authLoading } = useAuthGuard()
  const navigate = useNavigate()
  const [activeTab, setActiveTab] = useState<AdminTab>('dashboard')

  // Check if user is admin (you can modify this logic)
  const isAdmin = user?.email === 'iftikharamiri5@gmail.com' // Change this to your admin email

  // Fetch restaurants
  const { data: restaurants = [] } = useQuery({
    queryKey: ['admin-restaurants'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('restaurants')
        .select('*')
        .order('created_at', { ascending: false })

      if (error) throw error
      return data
    },
    enabled: isAdmin,
  })

  // Fetch deals
  const { data: deals = [] } = useQuery({
    queryKey: ['admin-deals'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('deals')
        .select(`
          *,
          restaurant:restaurants(name)
        `)
        .order('created_at', { ascending: false })

      if (error) throw error
      return data
    },
    enabled: isAdmin,
  })

  // Fetch users
  const { data: users = [] } = useQuery({
    queryKey: ['admin-users'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .order('created_at', { ascending: false })

      if (error) throw error
      return data
    },
    enabled: isAdmin,
  })

  // Fetch claims
  const { data: claims = [] } = useQuery({
    queryKey: ['admin-claims'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('claims')
        .select(`
          *,
          deal:deals(title),
          restaurant:restaurants(name)
        `)
        .order('created_at', { ascending: false })

      if (error) throw error
      return data
    },
    enabled: isAdmin,
  })

  if (authLoading) {
    return (
      <div className="min-h-screen bg-bg">
        <Header showSearch={false} />
        <div className="flex items-center justify-center py-20">
          <div className="animate-spin rounded-full h-8 w-8 border-2 border-primary border-t-transparent" />
        </div>
      </div>
    )
  }

  if (!isAdmin) {
    return (
      <div className="min-h-screen bg-bg">
        <Header showSearch={false} />
        <div className="flex items-center justify-center py-20">
          <div className="text-center">
            <h1 className="text-2xl font-bold mb-4">Access Denied</h1>
            <p className="text-muted-fg">You don't have permission to access this page.</p>
          </div>
        </div>
      </div>
    )
  }

  const tabs = [
    { id: 'dashboard' as const, label: 'Dashboard', icon: BarChart3 },
    { id: 'restaurants' as const, label: 'Restaurants', icon: Store },
    { id: 'deals' as const, label: 'Deals', icon: Tag },
    { id: 'users' as const, label: 'Users', icon: Users },
  ]

  const stats = [
    {
      title: 'Total Restaurants',
      value: restaurants.length,
      icon: Store,
      color: 'text-blue-600',
    },
    {
      title: 'Active Deals',
      value: deals.filter(deal => deal.is_active).length,
      icon: Tag,
      color: 'text-green-600',
    },
    {
      title: 'Total Users',
      value: users.length,
      icon: Users,
      color: 'text-purple-600',
    },
    {
      title: 'Total Claims',
      value: claims.length,
      icon: Eye,
      color: 'text-orange-600',
    },
  ]

  return (
    <div className="min-h-screen bg-bg">
      <Header showSearch={false} />
      
      <main className="px-4 py-6">
        <div className="max-w-7xl mx-auto">
          {/* Header */}
          <div className="mb-8">
            <div className="flex items-center gap-4 mb-4">
              <button
                onClick={() => navigate('/')}
                className="btn-ghost p-2 rounded-full hover:bg-muted"
                aria-label="Tilbake til hjemmesiden"
              >
                <ArrowLeft className="h-5 w-5" />
              </button>
              <div>
                <h1 className="text-3xl font-bold">Admin Dashboard</h1>
                <p className="text-muted-fg">Manage restaurants, deals, and users</p>
              </div>
            </div>
          </div>

          {/* Quick Actions */}
          <div className="mb-6">
            <div className="flex items-center gap-3 flex-wrap">
              <button
                onClick={() => navigate('/')}
                className="btn-secondary flex items-center gap-2"
              >
                <ArrowLeft className="h-4 w-4" />
                Tilbake til markedsplass
              </button>
              <button
                onClick={() => navigate('/profile')}
                className="btn-ghost flex items-center gap-2"
              >
                <Users className="h-4 w-4" />
                Profil
              </button>
              <button
                onClick={() => navigate('/business')}
                className="btn-ghost flex items-center gap-2"
              >
                <Store className="h-4 w-4" />
                Restaurant Landing
              </button>
              <button
                onClick={() => navigate('/business/register-restaurant')}
                className="btn-primary flex items-center gap-2"
              >
                <Plus className="h-4 w-4" />
                Test Restaurant Registration
              </button>
            </div>
          </div>

          {/* Tabs */}
          <div className="mb-8">
            <div className="flex space-x-1 bg-muted/30 p-1 rounded-lg w-fit">
              {tabs.map((tab) => {
                const Icon = tab.icon
                return (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={cn(
                      'flex items-center gap-2 px-4 py-2 rounded-md text-sm font-medium transition-colors',
                      activeTab === tab.id
                        ? 'bg-background text-foreground shadow-sm'
                        : 'text-muted-fg hover:text-foreground'
                    )}
                  >
                    <Icon className="h-4 w-4" />
                    {tab.label}
                  </button>
                )
              })}
            </div>
          </div>

          {/* Content */}
          <div className="space-y-6">
            {activeTab === 'dashboard' && (
              <div className="space-y-6">
                {/* Stats Cards */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                  {stats.map((stat) => {
                    const Icon = stat.icon
                    return (
                      <div key={stat.title} className="card p-6">
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="text-sm text-muted-fg">{stat.title}</p>
                            <p className="text-2xl font-bold">{stat.value}</p>
                          </div>
                          <Icon className={cn('h-8 w-8', stat.color)} />
                        </div>
                      </div>
                    )
                  })}
                </div>

                {/* Testing Tools */}
                <div className="card p-6 mb-6">
                  <h3 className="text-lg font-semibold mb-4">Testing Tools</h3>
                  <p className="text-muted-fg mb-4">Quick access to test restaurant features</p>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                    <button
                      onClick={() => navigate('/business')}
                      className="btn-ghost p-4 text-left hover:bg-muted/50"
                    >
                      <Store className="h-6 w-6 mb-2 text-blue-600" />
                      <div className="font-medium">Restaurant Landing</div>
                      <div className="text-sm text-muted-fg">Test the landing page</div>
                    </button>
                    <button
                      onClick={() => navigate('/business/register-restaurant')}
                      className="btn-ghost p-4 text-left hover:bg-muted/50"
                    >
                      <Plus className="h-6 w-6 mb-2 text-green-600" />
                      <div className="font-medium">Registration Form</div>
                      <div className="text-sm text-muted-fg">Test restaurant signup</div>
                    </button>
                    <button
                      onClick={() => navigate('/business/dashboard')}
                      className="btn-ghost p-4 text-left hover:bg-muted/50"
                    >
                      <BarChart3 className="h-6 w-6 mb-2 text-purple-600" />
                      <div className="font-medium">Restaurant Dashboard</div>
                      <div className="text-sm text-muted-fg">Test restaurant panel</div>
                    </button>
                    <button
                      onClick={() => navigate('/business/create-deal')}
                      className="btn-ghost p-4 text-left hover:bg-muted/50"
                    >
                      <Tag className="h-6 w-6 mb-2 text-orange-600" />
                      <div className="font-medium">Create Deal</div>
                      <div className="text-sm text-muted-fg">Test deal creation</div>
                    </button>
                  </div>
                </div>

                {/* Recent Activity */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  <div className="card p-6">
                    <h3 className="text-lg font-semibold mb-4">Recent Claims</h3>
                    <div className="space-y-3">
                      {claims.slice(0, 5).map((claim) => (
                        <div key={claim.id} className="flex items-center justify-between py-2 border-b border-border last:border-b-0">
                          <div>
                            <p className="font-medium">{claim.deal?.title}</p>
                            <p className="text-sm text-muted-fg">{claim.restaurant?.name}</p>
                          </div>
                          <span className="text-sm text-muted-fg">
                            {new Date(claim.created_at).toLocaleDateString()}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="card p-6">
                    <h3 className="text-lg font-semibold mb-4">Recent Restaurants</h3>
                    <div className="space-y-3">
                      {restaurants.slice(0, 5).map((restaurant) => (
                        <div key={restaurant.id} className="flex items-center justify-between py-2 border-b border-border last:border-b-0">
                          <div>
                            <p className="font-medium">{restaurant.name}</p>
                            <p className="text-sm text-muted-fg">{restaurant.city}</p>
                          </div>
                          <span className="text-sm text-muted-fg">
                            {new Date(restaurant.created_at).toLocaleDateString()}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'restaurants' && (
              <div className="space-y-6">
                <div className="flex items-center justify-between">
                  <h2 className="text-xl font-semibold">Restaurants</h2>
                  <button className="btn-primary">
                    <Plus className="h-4 w-4 mr-2" />
                    Add Restaurant
                  </button>
                </div>

                <div className="card">
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead>
                        <tr className="border-b border-border">
                          <th className="text-left p-4 font-medium">Name</th>
                          <th className="text-left p-4 font-medium">City</th>
                          <th className="text-left p-4 font-medium">Phone</th>
                          <th className="text-left p-4 font-medium">Created</th>
                          <th className="text-left p-4 font-medium">Actions</th>
                        </tr>
                      </thead>
                      <tbody>
                        {restaurants.map((restaurant) => (
                          <tr key={restaurant.id} className="border-b border-border">
                            <td className="p-4">
                              <div className="flex items-center gap-3">
                                {restaurant.image_url ? (
                                  <img
                                    src={restaurant.image_url}
                                    alt={restaurant.name}
                                    className="w-10 h-10 rounded-lg object-cover"
                                  />
                                ) : (
                                  <div className="w-10 h-10 bg-muted rounded-lg flex items-center justify-center">
                                    <Store className="h-5 w-5 text-muted-fg" />
                                  </div>
                                )}
                                <div>
                                  <p className="font-medium">{restaurant.name}</p>
                                  <p className="text-sm text-muted-fg">{restaurant.address}</p>
                                </div>
                              </div>
                            </td>
                            <td className="p-4">{restaurant.city}</td>
                            <td className="p-4">{restaurant.phone || '-'}</td>
                            <td className="p-4 text-sm text-muted-fg">
                              {new Date(restaurant.created_at).toLocaleDateString()}
                            </td>
                            <td className="p-4">
                              <div className="flex items-center gap-2">
                                <button className="btn-ghost p-2">
                                  <Edit className="h-4 w-4" />
                                </button>
                                <button className="btn-ghost p-2 text-danger">
                                  <Trash2 className="h-4 w-4" />
                                </button>
                              </div>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'deals' && (
              <div className="space-y-6">
                <div className="flex items-center justify-between">
                  <h2 className="text-xl font-semibold">Deals</h2>
                  <button className="btn-primary">
                    <Plus className="h-4 w-4 mr-2" />
                    Add Deal
                  </button>
                </div>

                <div className="card">
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead>
                        <tr className="border-b border-border">
                          <th className="text-left p-4 font-medium">Title</th>
                          <th className="text-left p-4 font-medium">Restaurant</th>
                          <th className="text-left p-4 font-medium">Discount</th>
                          <th className="text-left p-4 font-medium">Price</th>
                          <th className="text-left p-4 font-medium">Status</th>
                          <th className="text-left p-4 font-medium">Actions</th>
                        </tr>
                      </thead>
                      <tbody>
                        {deals.map((deal) => (
                          <tr key={deal.id} className="border-b border-border">
                            <td className="p-4">
                              <div className="flex items-center gap-3">
                                {deal.image_url ? (
                                  <img
                                    src={deal.image_url}
                                    alt={deal.title}
                                    className="w-10 h-10 rounded-lg object-cover"
                                  />
                                ) : (
                                  <div className="w-10 h-10 bg-muted rounded-lg flex items-center justify-center">
                                    <Tag className="h-5 w-5 text-muted-fg" />
                                  </div>
                                )}
                                <div>
                                  <p className="font-medium">{deal.title}</p>
                                  <p className="text-sm text-muted-fg">{deal.description}</p>
                                </div>
                              </div>
                            </td>
                            <td className="p-4">{deal.restaurant?.name}</td>
                            <td className="p-4">
                              <span className="text-success font-medium">{deal.discount_percentage}%</span>
                            </td>
                            <td className="p-4">
                              <div className="text-sm">
                                <p className="line-through text-muted-fg">{Math.round(deal.original_price / 100)} kr</p>
                                <p className="font-medium">{Math.round(deal.final_price / 100)} kr</p>
                              </div>
                            </td>
                            <td className="p-4">
                              <span className={cn(
                                'px-2 py-1 rounded-full text-xs font-medium',
                                deal.is_active 
                                  ? 'bg-success/10 text-success' 
                                  : 'bg-muted text-muted-fg'
                              )}>
                                {deal.is_active ? 'Active' : 'Inactive'}
                              </span>
                            </td>
                            <td className="p-4">
                              <div className="flex items-center gap-2">
                                <button className="btn-ghost p-2">
                                  <Edit className="h-4 w-4" />
                                </button>
                                <button className="btn-ghost p-2 text-danger">
                                  <Trash2 className="h-4 w-4" />
                                </button>
                              </div>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'users' && (
              <div className="space-y-6">
                <div className="flex items-center justify-between">
                  <h2 className="text-xl font-semibold">Users</h2>
                </div>

                <div className="card">
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead>
                        <tr className="border-b border-border">
                          <th className="text-left p-4 font-medium">Name</th>
                          <th className="text-left p-4 font-medium">Email</th>
                          <th className="text-left p-4 font-medium">Phone</th>
                          <th className="text-left p-4 font-medium">Joined</th>
                          <th className="text-left p-4 font-medium">Claims</th>
                        </tr>
                      </thead>
                      <tbody>
                        {users.map((user) => (
                          <tr key={user.id} className="border-b border-border">
                            <td className="p-4">
                              <div className="flex items-center gap-3">
                                <div className="w-10 h-10 bg-muted rounded-full flex items-center justify-center">
                                  <Users className="h-5 w-5 text-muted-fg" />
                                </div>
                                <div>
                                  <p className="font-medium">{user.display_name || 'No name'}</p>
                                </div>
                              </div>
                            </td>
                            <td className="p-4">{user.id}</td>
                            <td className="p-4">{user.phone || '-'}</td>
                            <td className="p-4 text-sm text-muted-fg">
                              {new Date(user.created_at).toLocaleDateString()}
                            </td>
                            <td className="p-4">
                              <span className="text-sm">
                                {claims.filter(claim => claim.user_id === user.id).length}
                              </span>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  )
}