/**
 * Dynamic pricing utility for TurfBook.
 * Weekdays = base price, Weekends (Sat/Sun) = +20%
 */

export type SlotType = 'morning' | 'evening' | 'night'

export interface Slot {
  id: SlotType
  label: string
  timeRange: string
  icon: string
}

export const SLOTS: Slot[] = [
  { id: 'morning', label: 'Morning',  timeRange: '5:00 AM – 12:00 PM', icon: '🌅' },
  { id: 'evening', label: 'Evening',  timeRange: '12:00 PM – 6:00 PM',  icon: '☀️' },
  { id: 'night',   label: 'Night',    timeRange: '6:00 PM – 12:00 AM',  icon: '🌙' },
]

/** Returns true if the given date falls on a weekend (Sat / Sun) */
export function isWeekend(date: Date = new Date()): boolean {
  const day = date.getDay()
  return day === 0 || day === 6
}

/** Returns the effective price per hour for a given base price and date */
export function getEffectivePrice(basePricePerHour: number, date: Date = new Date()): number {
  if (isWeekend(date)) {
    return Math.round(basePricePerHour * 1.2) // +20% on weekends
  }
  return basePricePerHour
}

/** Returns a formatted label like "₹1,200/hr" or "₹1,440/hr (Weekend)" */
export function formatPrice(basePricePerHour: number, date: Date = new Date()): string {
  const effective = getEffectivePrice(basePricePerHour, date)
  const formatted = `₹${effective.toLocaleString('en-IN')}/hr`
  return isWeekend(date) ? `${formatted} (Weekend)` : formatted
}

/** Calculates total booking amount for given hours and date */
export function calculateBookingAmount(
  basePricePerHour: number,
  hours: number,
  date: Date = new Date()
): { baseAmount: number; effectiveAmount: number; isWeekendSurcharge: boolean } {
  const effectivePricePerHour = getEffectivePrice(basePricePerHour, date)
  return {
    baseAmount: basePricePerHour * hours,
    effectiveAmount: effectivePricePerHour * hours,
    isWeekendSurcharge: isWeekend(date),
  }
}

/** Haversine formula — calculates distance in km between two lat/lng points */
export function getDistanceKm(
  lat1: number, lng1: number,
  lat2: number, lng2: number
): number {
  const R = 6371 // Earth radius in km
  const dLat = ((lat2 - lat1) * Math.PI) / 180
  const dLng = ((lng2 - lng1) * Math.PI) / 180
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
    Math.cos((lat2 * Math.PI) / 180) *
    Math.sin(dLng / 2) * Math.sin(dLng / 2)
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
  return R * c
}

/** Returns Google Maps directions URL for a lat/lng */
export function getDirectionsUrl(lat: number, lng: number, name?: string): string {
  const destination = name
    ? encodeURIComponent(name)
    : `${lat},${lng}`
  return `https://www.google.com/maps/dir/?api=1&destination=${destination}&destination_place_id=`
}
