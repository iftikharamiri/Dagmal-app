import { useState, useEffect } from 'react'
import { User, Phone, Save, Bell } from 'lucide-react'
import { norwegianText } from '@/i18n/no'
import { cn } from '@/lib/utils'
import type { Profile } from '@/lib/database.types'

interface ProfileFormProps {
  profile: Profile | null
  onSave: (profile: Partial<Profile>) => Promise<void>
  isLoading?: boolean
}

const cuisineOptions = [
  'Norsk', 'Italiensk', 'Fransk', 'Indisk', 'Kinesisk', 'Japansk', 
  'Thailandsk', 'Meksikansk', 'Amerikansk', 'Middelhavet', 'Vegetarisk', 'Vegansk'
]

const dietaryOptions = [
  'Vegetarisk', 'Vegansk', 'Glutenfri', 'Laktosefri', 'Nøttefri', 
  'Skalldyrfri', 'Halal', 'Kosher', 'Diabetikervennlig'
]

export function ProfileForm({ profile, onSave, isLoading = false }: ProfileFormProps) {
  const [formData, setFormData] = useState({
    display_name: '',
    phone: '',
    cuisines: [] as string[],
    dietary: [] as string[],
  })
  const [notifications, setNotifications] = useState(true)
  const [isSaving, setIsSaving] = useState(false)

  useEffect(() => {
    if (profile) {
      setFormData({
        display_name: profile.display_name || '',
        phone: profile.phone || '',
        cuisines: profile.cuisines || [],
        dietary: profile.dietary || [],
      })
    }
  }, [profile])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSaving(true)
    
    try {
      await onSave({
        display_name: formData.display_name.trim() || null,
        phone: formData.phone.trim() || null,
        cuisines: formData.cuisines,
        dietary: formData.dietary,
        updated_at: new Date().toISOString(),
      })
    } catch (error) {
      console.error('Error saving profile:', error)
    } finally {
      setIsSaving(false)
    }
  }

  const toggleCuisine = (cuisine: string) => {
    setFormData(prev => ({
      ...prev,
      cuisines: prev.cuisines.includes(cuisine)
        ? prev.cuisines.filter(c => c !== cuisine)
        : [...prev.cuisines, cuisine]
    }))
  }

  const toggleDietary = (dietary: string) => {
    setFormData(prev => ({
      ...prev,
      dietary: prev.dietary.includes(dietary)
        ? prev.dietary.filter(d => d !== dietary)
        : [...prev.dietary, dietary]
    }))
  }

  if (isLoading) {
    return (
      <div className="space-y-6">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="space-y-2">
            <div className="skeleton h-4 w-20" />
            <div className="skeleton h-12 w-full" />
          </div>
        ))}
      </div>
    )
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Basic Info */}
      <div className="space-y-4">
        <h3 className="text-lg font-semibold">Grunnleggende informasjon</h3>
        
        <div>
          <label className="block font-medium mb-2">
            <User className="inline h-4 w-4 mr-2" />
            {norwegianText.profile.displayName}
          </label>
          <input
            type="text"
            value={formData.display_name}
            onChange={(e) => setFormData(prev => ({ ...prev, display_name: e.target.value }))}
            placeholder="Ditt navn"
            className="input w-full"
          />
        </div>

        <div>
          <label className="block font-medium mb-2">
            <Phone className="inline h-4 w-4 mr-2" />
            {norwegianText.profile.phone}
          </label>
          <input
            type="tel"
            value={formData.phone}
            onChange={(e) => setFormData(prev => ({ ...prev, phone: e.target.value }))}
            placeholder="+47 123 45 678"
            className="input w-full"
          />
        </div>
      </div>

      {/* Cuisine Preferences */}
      <div>
        <h3 className="text-lg font-semibold mb-3">{norwegianText.profile.cuisinePreferences}</h3>
        <div className="flex flex-wrap gap-2">
          {cuisineOptions.map((cuisine) => (
            <button
              key={cuisine}
              type="button"
              onClick={() => toggleCuisine(cuisine)}
              className={cn(
                'px-3 py-2 rounded-full border transition-colors text-sm',
                formData.cuisines.includes(cuisine)
                  ? 'border-primary bg-primary text-primary-fg'
                  : 'border-border hover:bg-muted'
              )}
            >
              {cuisine}
            </button>
          ))}
        </div>
      </div>

      {/* Dietary Restrictions */}
      <div>
        <h3 className="text-lg font-semibold mb-3">{norwegianText.profile.dietaryRestrictions}</h3>
        <div className="flex flex-wrap gap-2">
          {dietaryOptions.map((dietary) => (
            <button
              key={dietary}
              type="button"
              onClick={() => toggleDietary(dietary)}
              className={cn(
                'px-3 py-2 rounded-full border transition-colors text-sm',
                formData.dietary.includes(dietary)
                  ? 'border-primary bg-primary text-primary-fg'
                  : 'border-border hover:bg-muted'
              )}
            >
              {dietary}
            </button>
          ))}
        </div>
      </div>

      {/* Notifications */}
      <div>
        <h3 className="text-lg font-semibold mb-3">{norwegianText.profile.notifications}</h3>
        <label className="flex items-center gap-3 p-4 border border-border rounded-2xl cursor-pointer hover:bg-muted/50">
          <input
            type="checkbox"
            checked={notifications}
            onChange={(e) => setNotifications(e.target.checked)}
            className="sr-only"
          />
          <div className={cn(
            'w-5 h-5 rounded border-2 flex items-center justify-center transition-colors',
            notifications 
              ? 'border-primary bg-primary text-primary-fg' 
              : 'border-border'
          )}>
            {notifications && (
              <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
              </svg>
            )}
          </div>
          <div className="flex items-center gap-2">
            <Bell className="h-4 w-4" />
            <span>Motta varsler om nye tilbud</span>
          </div>
        </label>
      </div>

      {/* Submit Button */}
      <button
        type="submit"
        disabled={isSaving}
        className="btn-primary w-full"
      >
        {isSaving ? (
          <div className="flex items-center gap-2">
            <div className="animate-spin rounded-full h-4 w-4 border-2 border-primary-fg border-t-transparent" />
            <span>Lagrer...</span>
          </div>
        ) : (
          <div className="flex items-center gap-2">
            <Save className="h-4 w-4" />
            <span>{norwegianText.actions.save}</span>
          </div>
        )}
      </button>
    </form>
  )
}
































