import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase/client'
import { Database } from '@/lib/supabase/database.types'

type Booking = Database['public']['Tables']['bookings']['Row'] & {
  turf?: Database['public']['Tables']['turfs']['Row']
}

interface UseBookingsOptions {
  userId?: string
  turfOwnerId?: string
}

export function useBookings(options: UseBookingsOptions = {}) {
  const [bookings, setBookings] = useState<Booking[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    fetchBookings()
  }, [options.userId, options.turfOwnerId])

  const fetchBookings = async () => {
    setLoading(true)

    let query = supabase
      .from('bookings')
      .select('*, turf:turfs(*)')
      .order('created_at', { ascending: false })

    if (options.userId) query = query.eq('user_id', options.userId)

    const { data, error } = await query
    if (error) setError(error.message)
    else setBookings((data as Booking[]) || [])
    setLoading(false)
  }

  return { bookings, loading, error, refetch: fetchBookings }
}
