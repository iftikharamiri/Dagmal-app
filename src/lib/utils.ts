export function cn(...inputs: (string | undefined | null | boolean)[]) {
  return inputs.filter(Boolean).join(' ')
}

export function calcFinalPrice(
  original?: number,
  discount?: number,
  type: 'percent' | 'amount' = 'amount'
): number | undefined {
  if (original == null) return undefined
  if (!discount) return original
  return type === 'percent'
    ? Math.max(0, Math.round(original * (1 - discount / 100)))
    : Math.max(0, original - discount)
}

export function calcSavings(
  original?: number,
  final?: number,
  qty = 1
): number {
  if (original == null || final == null) return 0
  return Math.max(0, (original - final) * qty)
}

export function formatPrice(price: number): string {
  // Convert øre to NOK (1 NOK = 100 øre)
  const priceInNOK = price / 100
  return new Intl.NumberFormat('no-NO', {
    style: 'currency',
    currency: 'NOK',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(priceInNOK)
}

export function formatTime(time: string): string {
  return time.slice(0, 5) // HH:MM format
}

export function isTimeInRange(
  startTime: string,
  endTime: string,
  currentTime?: Date
): boolean {
  const now = currentTime || new Date()
  const currentHour = now.getHours()
  const currentMinute = now.getMinutes()
  const currentTimeString = `${currentHour.toString().padStart(2, '0')}:${currentMinute.toString().padStart(2, '0')}`

  return currentTimeString >= startTime && currentTimeString <= endTime
}

export function isDealActiveToday(days: number[]): boolean {
  const today = new Date().getDay() // 0 = Sunday, 1 = Monday, etc.
  // Convert JavaScript day (0-6) to our day format (1-7)
  // 0=Sunday->7, 1=Monday->1, 2=Tuesday->2, 3=Wednesday->3, 4=Thursday->4, 5=Friday->5, 6=Saturday->6
  const dayIndex = today === 0 ? 7 : today
  return days.includes(dayIndex)
}

export function getDayName(dayNumber: number): string {
  const days = [
    'Søndag',
    'Mandag',
    'Tirsdag',
    'Onsdag',
    'Torsdag',
    'Fredag',
    'Lørdag',
  ]
  return days[dayNumber === 7 ? 0 : dayNumber] || ''
}

export function debounce<T extends (...args: any[]) => any>(
  func: T,
  wait: number
): T {
  let timeout: NodeJS.Timeout
  return ((...args: any[]) => {
    clearTimeout(timeout)
    timeout = setTimeout(() => func(...args), wait)
  }) as T
}

// Complete a claim: set status to completed and stamp redeemed_at (idempotent)
export async function completeClaim(claimId: string) {
  const { supabase } = await import('./supabase')
  const now = new Date().toISOString()
  
  // Try RPC first (if it exists in DB)
  try {
    const rpc = await supabase.rpc('redeem_claim', { claim_id: claimId })
    if (!rpc.error && rpc.data && Array.isArray(rpc.data) && rpc.data.length > 0) {
      return rpc.data[0]
    }
    // If RPC returns empty (already redeemed) or doesn't exist, fall through to update
  } catch (rpcError) {
    // RPC function might not exist, fall through to direct update
    console.warn('RPC redeem_claim not available, using direct update:', rpcError)
  }
  
  // Fallback: direct update with guard (idempotent)
  const { data, error } = await supabase
    .from('claims')
    .update({ status: 'completed', redeemed_at: now })
    .eq('id', claimId)
    .is('redeemed_at', null)
    .select('*')
    .maybeSingle()
  
  if (error) {
    throw new Error(`Failed to complete claim: ${error.message}`)
  }
  
  if (!data) {
    throw new Error('Claim already redeemed or not found')
  }
  
  return data
}
