import { useState, useEffect } from 'react'
import { X, Clock, Users, Phone, MessageSquare, Calculator } from 'lucide-react'
import { norwegianText } from '@/i18n/no'
import { formatPrice, formatTime, calcSavings, cn } from '@/lib/utils'
import type { DealWithRestaurant } from '@/lib/database.types'

const DEFAULT_DAY_NUMBERS = [1, 2, 3, 4, 5, 6, 7] as const

const DAY_TO_NUMBER_MAP: Record<string, number> = {
  sunday: 7,
  '0': 7,
  monday: 1,
  '1': 1,
  tuesday: 2,
  '2': 2,
  wednesday: 3,
  '3': 3,
  thursday: 4,
  '4': 4,
  friday: 5,
  '5': 5,
  saturday: 6,
  '6': 6,
  '7': 7,
}

const MAX_LOOKAHEAD_DAYS = 30

const toDateOnly = (date: Date) => new Date(date.getFullYear(), date.getMonth(), date.getDate())

const formatDateLocalISO = (date: Date) => {
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

const parseDateOnly = (value?: string | null) => {
  if (!value) return null
  const parsed = new Date(value)
  if (Number.isNaN(parsed.getTime())) return null
  return toDateOnly(parsed)
}

const normalizeDayNumbers = (days: string[] | null | undefined): number[] => {
  if (!days || days.length === 0) return [...DEFAULT_DAY_NUMBERS]

  const mapped = days
    .map((day) => {
      const normalizedKey = day?.toString().trim().toLowerCase()
      return normalizedKey ? DAY_TO_NUMBER_MAP[normalizedKey] : undefined
    })
    .filter((value): value is number => typeof value === 'number')

  return mapped.length > 0 ? mapped : [...DEFAULT_DAY_NUMBERS]
}

const getDayNumber = (date: Date) => {
  const jsDay = date.getDay() // 0 (Sunday) ... 6 (Saturday)
  return jsDay === 0 ? 7 : jsDay
}

const timeToMinutes = (time: string) => {
  const [hour = '0', minute = '0'] = time.split(':')
  return Number(hour) * 60 + Number(minute)
}

const getNextAvailableDateString = (
  deal: DealWithRestaurant,
  timeWindow: { start: string; end: string },
  referenceDate: Date = new Date()
): string => {
  const startDate = parseDateOnly(deal.start_date)
  const endDate = parseDateOnly(deal.end_date)
  const allowedDays = new Set(normalizeDayNumbers(deal.available_days))
  const now = referenceDate
  const startOfToday = toDateOnly(now)
  const startMinutes = timeToMinutes(timeWindow.start)
  const endMinutes = timeToMinutes(timeWindow.end)
  const currentMinutes = now.getHours() * 60 + now.getMinutes()

  for (let offset = 0; offset < MAX_LOOKAHEAD_DAYS; offset++) {
    const candidate = new Date(startOfToday)
    candidate.setDate(candidate.getDate() + offset)

    if (startDate && candidate < startDate) continue
    if (endDate && candidate > endDate) continue

    const dayNumber = getDayNumber(candidate)
    if (!allowedDays.has(dayNumber)) continue

    if (offset === 0 && currentMinutes > endMinutes) {
      continue
    }

    return formatDateLocalISO(candidate)
  }

  // Fallback to today's date if no future slot is found
  return formatDateLocalISO(now)
}

interface ClaimFlowModalProps {
  deal: DealWithRestaurant
  userLimits: {
    maxPerUser: number
    remainingToday: number
  }
  hasDineIn: boolean
  hasTakeaway: boolean
  timeWindow: { start: string; end: string }
  onConfirm: (payload: {
    quantity: number
    serviceType: 'dine_in' | 'takeaway'
    firstName: string
    lastName: string
    claimDate: string
    phone?: string
    notes?: string
  }) => Promise<void>
  onClose: () => void
}

export function ClaimFlowModal({
  deal,
  userLimits,
  hasDineIn,
  hasTakeaway,
  timeWindow,
  onConfirm,
  onClose,
}: ClaimFlowModalProps) {
  const [quantity, setQuantity] = useState(1)
  const [serviceType, setServiceType] = useState<'dine_in' | 'takeaway'>(
    hasDineIn ? 'dine_in' : 'takeaway'
  )
  const [firstName, setFirstName] = useState('')
  const [lastName, setLastName] = useState('')
  const [phone, setPhone] = useState('')
  const [notes, setNotes] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [errors, setErrors] = useState<Record<string, string>>({})

  const needsServiceTypeSelection = hasDineIn && hasTakeaway
  const needsPhone = serviceType === 'takeaway'
  const maxQuantity = Math.min(userLimits.remainingToday, userLimits.maxPerUser)
  const claimDate = getNextAvailableDateString(deal, timeWindow)

  useEffect(() => {
    // Clear phone when switching to dine_in
    if (serviceType === 'dine_in') {
      setPhone('')
    }
  }, [serviceType])

  const validateForm = () => {
    const newErrors: Record<string, string> = {}

    if (quantity < 1 || quantity > maxQuantity) {
      newErrors.quantity = `Antall må være mellom 1 og ${maxQuantity}`
    }

    if (!firstName.trim()) {
      newErrors.firstName = 'Fornavn er påkrevd'
    }

    if (!lastName.trim()) {
      newErrors.lastName = 'Etternavn er påkrevd'
    }

    if (needsPhone && !phone.trim()) {
      newErrors.phone = norwegianText.errors.phoneRequired
    }

    if (needsPhone && phone.trim() && !/^\+?[\d\s-]+$/.test(phone.trim())) {
      newErrors.phone = 'Ugyldig telefonnummer'
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = async () => {
    if (!validateForm()) return

    setIsSubmitting(true)
    try {
      await onConfirm({
        quantity,
        serviceType,
        firstName: firstName.trim(),
        lastName: lastName.trim(),
        claimDate: claimDate,
        phone: needsPhone ? phone.trim() : undefined,
        notes: notes.trim() || undefined,
      })
      onClose()
    } catch (error) {
      console.error('Error claiming deal:', error)
      setErrors({ submit: norwegianText.errors.unknownError })
    } finally {
      setIsSubmitting(false)
    }
  }

  const totalSavings = calcSavings(
    deal.original_price,
    deal.final_price,
    quantity
  )

  return (
    <div className="fixed inset-0 z-50 bg-black/50 flex items-start sm:items-center justify-center p-4 pt-8">
      <div className="bg-card w-full max-w-md h-[75vh] sm:h-auto sm:max-h-[75vh] flex flex-col rounded-2xl shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-border">
          <h2 className="text-lg font-semibold">{norwegianText.actions.claimDeal}</h2>
          <button
            onClick={onClose}
            className="btn-ghost p-2 rounded-full"
            aria-label={norwegianText.actions.close}
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Content */}
        <div className="overflow-y-auto flex-1">
          <div className="p-4 space-y-6">
            {/* Deal Summary */}
            <div className="bg-muted/30 rounded-2xl p-4 space-y-3">
              <h3 className="font-semibold">{deal.title}</h3>
              <p className="text-sm text-muted-fg">{deal.restaurant.name}</p>
              
              <div className="flex items-center gap-4 text-sm">
                <div className="flex items-center gap-1">
                  <Clock className="h-4 w-4" />
                  <span>{formatTime(timeWindow.start)}–{formatTime(timeWindow.end)}</span>
                </div>
                <div className="text-success font-medium">
{deal.discount_percentage}%
                </div>
              </div>

              {/* Claim Date Display */}
              <div className="text-sm text-muted-fg">
                {new Date(claimDate).toLocaleDateString('no-NO', { 
                  weekday: 'long', 
                  year: 'numeric', 
                  month: 'long', 
                  day: 'numeric' 
                })}
              </div>

              {/* Availability Display */}
              {deal.total_limit && (
                <div className="flex items-center gap-2 text-sm">
                  <Users className="h-4 w-4 text-muted-fg" />
                  <span className="text-muted-fg">
                    {deal.total_limit - deal.claimed_count}/{deal.total_limit} tilgjengelig
                  </span>
                </div>
              )}

              {deal.original_price && deal.final_price && (
                <div className="flex items-center gap-2 text-sm">
                  <span className="line-through text-muted-fg">{formatPrice(deal.original_price)}</span>
                  <span className="font-semibold">{formatPrice(deal.final_price)}</span>
                </div>
              )}
            </div>

            {/* Quantity Selection */}
            <div>
              <label className="block font-medium mb-3">
                <Users className="inline h-4 w-4 mr-2" />
                {norwegianText.deal.quantity}
              </label>
              <div className="flex items-center gap-3">
                <button
                  onClick={() => setQuantity(Math.max(1, quantity - 1))}
                  disabled={quantity <= 1}
                  className="btn-ghost w-10 h-10 rounded-full flex items-center justify-center disabled:opacity-50"
                >
                  −
                </button>
                <input
                  type="number"
                  min="1"
                  max={maxQuantity}
                  value={quantity}
                  onChange={(e) => setQuantity(Math.max(1, Math.min(maxQuantity, Number(e.target.value))))}
                  className="input text-center w-20"
                />
                <button
                  onClick={() => setQuantity(Math.min(maxQuantity, quantity + 1))}
                  disabled={quantity >= maxQuantity}
                  className="btn-ghost w-10 h-10 rounded-full flex items-center justify-center disabled:opacity-50"
                >
                  +
                </button>
              </div>
              {errors.quantity && (
                <p className="text-danger text-sm mt-1">{errors.quantity}</p>
              )}
              <p className="text-xs text-muted-fg mt-1">
                {norwegianText.deal.userLimit}: {userLimits.maxPerUser} • 
                Gjenstående i dag: {userLimits.remainingToday}
              </p>
            </div>

            {/* Name Fields */}
            <div className="space-y-4">
              <div>
                <label className="block font-medium mb-3">
                  Fornavn *
                </label>
                <input
                  type="text"
                  value={firstName}
                  onChange={(e) => setFirstName(e.target.value)}
                  placeholder="Ditt fornavn"
                  className={cn(
                    'input w-full',
                    errors.firstName && 'border-danger'
                  )}
                />
                {errors.firstName && (
                  <p className="text-danger text-sm mt-1">{errors.firstName}</p>
                )}
              </div>

              <div>
                <label className="block font-medium mb-3">
                  Etternavn *
                </label>
                <input
                  type="text"
                  value={lastName}
                  onChange={(e) => setLastName(e.target.value)}
                  placeholder="Ditt etternavn"
                  className={cn(
                    'input w-full',
                    errors.lastName && 'border-danger'
                  )}
                />
                {errors.lastName && (
                  <p className="text-danger text-sm mt-1">{errors.lastName}</p>
                )}
              </div>
            </div>

            {/* Service Type Selection */}
            {needsServiceTypeSelection && (
              <div>
                <label className="block font-medium mb-3">{norwegianText.deal.serviceType}</label>
                <div className="space-y-2">
                  {hasDineIn && (
                    <button
                      onClick={() => setServiceType('dine_in')}
                      className={cn(
                        'w-full flex items-center justify-between p-3 rounded-2xl border transition-colors',
                        serviceType === 'dine_in'
                          ? 'border-primary bg-primary/5 text-primary'
                          : 'border-border hover:bg-muted'
                      )}
                    >
                      <span>{norwegianText.deal.dineIn}</span>
                      {serviceType === 'dine_in' && <div className="w-2 h-2 bg-primary rounded-full" />}
                    </button>
                  )}
                  {hasTakeaway && (
                    <button
                      onClick={() => setServiceType('takeaway')}
                      className={cn(
                        'w-full flex items-center justify-between p-3 rounded-2xl border transition-colors',
                        serviceType === 'takeaway'
                          ? 'border-primary bg-primary/5 text-primary'
                          : 'border-border hover:bg-muted'
                      )}
                    >
                      <span>{norwegianText.deal.takeaway}</span>
                      {serviceType === 'takeaway' && <div className="w-2 h-2 bg-primary rounded-full" />}
                    </button>
                  )}
                </div>
              </div>
            )}

            {/* Phone Number (for takeaway only) */}
            {needsPhone && (
              <div>
                <label className="block font-medium mb-3">
                  <Phone className="inline h-4 w-4 mr-2" />
                  {norwegianText.deal.phone} *
                </label>
                <input
                  type="tel"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="+47 123 45 678"
                  className={cn(
                    'input w-full',
                    errors.phone && 'border-danger'
                  )}
                />
                {errors.phone && (
                  <p className="text-danger text-sm mt-1">{errors.phone}</p>
                )}
              </div>
            )}

            {/* Special Requests */}
            <div>
              <label className="block font-medium mb-3">
                <MessageSquare className="inline h-4 w-4 mr-2" />
                {norwegianText.deal.specialRequests}
              </label>
              <textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Allergier, spesielle ønsker, tid for eksempel"
                rows={3}
                className="input w-full resize-none"
              />
            </div>

            {/* Total Savings */}
            {totalSavings > 0 && (
              <div className="bg-success/10 border border-success/20 rounded-2xl p-4">
                <div className="flex items-center gap-2 text-success font-semibold">
                  <Calculator className="h-4 w-4" />
                  <span>{norwegianText.deal.totalSavings}</span>
                </div>
                <p className="text-2xl font-bold text-success mt-1">
                  {formatPrice(totalSavings)}
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-border bg-muted/20 flex-shrink-0 mt-auto">
          {errors.submit && (
            <p className="text-danger text-sm mb-3">{errors.submit}</p>
          )}
          <div className="flex gap-3">
            <button
              onClick={onClose}
              disabled={isSubmitting}
              className="btn-ghost flex-1"
            >
              {norwegianText.actions.cancel}
            </button>
            <button
              onClick={handleSubmit}
              disabled={isSubmitting || quantity > maxQuantity}
              className="btn-primary flex-1"
            >
              {isSubmitting ? (
                <div className="flex items-center gap-2">
                  <div className="animate-spin rounded-full h-4 w-4 border-2 border-primary-fg border-t-transparent" />
                  <span>Henter...</span>
                </div>
              ) : (
                norwegianText.actions.confirm
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}



