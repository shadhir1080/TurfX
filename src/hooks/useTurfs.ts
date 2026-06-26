import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase/client'
import { Database } from '@/lib/supabase/database.types'
import { getDistanceKm } from '@/lib/pricing'

type Turf = Database['public']['Tables']['turfs']['Row']

interface UseTurfsOptions {
  limit?: number
  verified?: boolean
  ownerId?: string
  searchQuery?: string
  sortByNearest?: boolean
  userLat?: number
  userLng?: number
  isAdmin?: boolean
}

const SUPABASE_CONFIGURED =
  typeof process !== 'undefined' &&
  process.env.NEXT_PUBLIC_SUPABASE_URL &&
  process.env.NEXT_PUBLIC_SUPABASE_URL !== 'your_supabase_project_url' &&
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY &&
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY !== 'your_supabase_anon_key_here'

export function useTurfs(options: UseTurfsOptions = {}) {
  const [turfs, setTurfs] = useState<Turf[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [userLocation, setUserLocation] = useState<{ lat: number; lng: number } | null>(null)

  // Get user's geolocation once if sortByNearest is requested
  useEffect(() => {
    if (options.sortByNearest && !options.userLat) {
      if (typeof window !== 'undefined' && navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(
          (pos) => setUserLocation({ lat: pos.coords.latitude, lng: pos.coords.longitude }),
          () => {
            // Default to Coimbatore city center if permission denied
            setUserLocation({ lat: 11.0168, lng: 76.9558 })
          }
        )
      } else {
        setUserLocation({ lat: 11.0168, lng: 76.9558 })
      }
    }
  }, [options.sortByNearest])

  useEffect(() => {
    fetchTurfs()
  }, [options.ownerId, options.searchQuery, options.verified, userLocation])

  const applyFiltersAndSort = (data: Turf[]): Turf[] => {
    let result = [...data]

    // Filter
    if (options.verified) result = result.filter(t => t.is_verified)
    if (options.ownerId) result = result.filter(t => t.owner_id === options.ownerId)
    if (options.searchQuery) {
      const q = options.searchQuery.toLowerCase()
      result = result.filter(t =>
        t.name.toLowerCase().includes(q) ||
        (t.description ?? '').toLowerCase().includes(q) ||
        JSON.stringify(t.location ?? '').toLowerCase().includes(q)
      )
    }

    // Sort by nearest
    const loc = userLocation || (options.userLat && options.userLng ? { lat: options.userLat, lng: options.userLng } : null)
    if (options.sortByNearest && loc) {
      result = result
        .map((turf) => {
          const coords = turf.coordinates as { lat?: number; lng?: number } | null
          const dist = coords?.lat && coords?.lng
            ? getDistanceKm(loc.lat, loc.lng, coords.lat, coords.lng)
            : 9999
          return { ...turf, _distance: dist }
        })
        .sort((a: any, b: any) => a._distance - b._distance)
    }

    // Limit
    if (options.limit) result = result.slice(0, options.limit)

    return result
  }

  const fetchTurfs = async () => {
    setLoading(true)

    // If Supabase not configured, use empty data
    if (!SUPABASE_CONFIGURED) {
      setTurfs([])
      setLoading(false)
      return
    }

    try {
      let query = supabase.from('turfs').select('*').order('created_at', { ascending: false })

      if (options.verified) query = query.eq('is_verified', true)
      if (options.ownerId) query = query.eq('owner_id', options.ownerId)
      
      // Standard players/users should only see active turfs
      if (!options.isAdmin && !options.ownerId) {
        query = query.eq('is_active', true)
      }

      if (options.searchQuery) {
        query = query.or(`name.ilike.%${options.searchQuery}%,description.ilike.%${options.searchQuery}%`)
      }
      if (options.limit && !options.sortByNearest) query = query.limit(options.limit)

      const { data, error: supabaseError } = await query

      if (supabaseError) {
        console.error('[TurfX Ultra] Supabase error:', supabaseError.message)
        setTurfs([])
      } else if (!data) {
        setTurfs([])
      } else {
        // Real Supabase data
        const result = applyFiltersAndSort(data)
        setTurfs(result)
      }
    } catch (err) {
      console.error('[TurfX Ultra] Fetch error:', err)
      setTurfs([])
    }

    setLoading(false)
  }

  const refetch = () => fetchTurfs()

  return { turfs, loading, error, refetch, userLocation }
}
