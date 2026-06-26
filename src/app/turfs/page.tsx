'use client'

import { useState } from 'react'
import dynamic from 'next/dynamic'
import { motion } from 'framer-motion'
import { Search, SlidersHorizontal, MapPin, Map, LayoutGrid } from 'lucide-react'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import Navbar from '@/components/layout/Navbar'
import TurfCard from '@/components/turfs/TurfCard'
import { useTurfs } from '@/hooks/useTurfs'
import { getDistanceKm } from '@/lib/pricing'

// SSR-safe map import
const TurfMap = dynamic(() => import('@/components/map/TurfMap'), { ssr: false })

export default function TurfsPage() {
  const [search, setSearch] = useState('')
  const [submittedSearch, setSubmittedSearch] = useState('')
  const [sortBy, setSortBy] = useState('nearest')
  const [viewMode, setViewMode] = useState<'grid' | 'map'>('grid')

  const { turfs, loading, userLocation } = useTurfs({
    searchQuery: submittedSearch,
    sortByNearest: sortBy === 'nearest',
  })

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault()
    setSubmittedSearch(search)
  }

  const sorted = [...turfs].sort((a, b) => {
    if (sortBy === 'price_asc') return a.price_per_hour - b.price_per_hour
    if (sortBy === 'price_desc') return b.price_per_hour - a.price_per_hour
    if (sortBy === 'rating') return (b.rating ?? 0) - (a.rating ?? 0)
    // 'nearest' sort already handled by the hook
    return 0
  })

  // Compute distance for display
  const getDistance = (turf: typeof turfs[0]): number | undefined => {
    if (!userLocation) return undefined
    const coords = turf.coordinates as { lat?: number; lng?: number } | null
    if (!coords?.lat || !coords?.lng) return undefined
    return getDistanceKm(userLocation.lat, userLocation.lng, coords.lat, coords.lng)
  }

  // Build map turf data
  const mapTurfs = turfs
    .map((t) => {
      const coords = t.coordinates as { lat?: number; lng?: number } | null
      if (!coords?.lat || !coords?.lng) return null
      return { id: t.id, name: t.name, lat: coords.lat, lng: coords.lng, price_per_hour: t.price_per_hour, rating: t.rating }
    })
    .filter(Boolean) as Array<{ id: string; name: string; lat: number; lng: number; price_per_hour: number; rating?: number | null }>

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <div className="pt-24 pb-16 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8">
          <motion.h1 initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
            className="text-4xl font-black text-foreground mb-2">
            Browse <span className="gradient-text">Turfs</span>
          </motion.h1>
          <p className="text-muted-foreground">
            Showing {loading ? '...' : sorted.length} turfs in Coimbatore
            {userLocation ? ' — sorted by nearest to you' : ''}
          </p>
        </div>

        {/* Search & Filter Bar */}
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}
          className="flex flex-col sm:flex-row gap-3 mb-6">
          <form onSubmit={handleSearch} className="flex gap-2 flex-1">
            <div className="relative flex-1">
              <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input placeholder="Search by turf name or area..." value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-10 bg-white/5 border-white/10 focus:border-primary" />
            </div>
            <Button type="submit" className="bg-primary hover:bg-primary/90 shrink-0">
              <Search className="w-4 h-4 mr-1" /> Search
            </Button>
          </form>

          <div className="flex items-center gap-2 flex-wrap">
            <SlidersHorizontal className="w-4 h-4 text-muted-foreground" />
            <Select value={sortBy} onValueChange={(val) => setSortBy(val || 'nearest')}>
              <SelectTrigger className="w-44 bg-white/5 border-white/10">
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="glass-dark border-white/10">
                <SelectItem value="nearest">📍 Nearest First</SelectItem>
                <SelectItem value="rating">⭐ Top Rated</SelectItem>
                <SelectItem value="price_asc">Price: Low to High</SelectItem>
                <SelectItem value="price_desc">Price: High to Low</SelectItem>
              </SelectContent>
            </Select>

            {/* View toggle */}
            <div className="flex rounded-lg border border-white/10 overflow-hidden">
              <button onClick={() => setViewMode('grid')}
                className={`px-3 py-2 text-sm transition-colors ${viewMode === 'grid' ? 'bg-primary text-primary-foreground' : 'text-muted-foreground hover:bg-white/5'}`}>
                <LayoutGrid className="w-4 h-4" />
              </button>
              <button onClick={() => setViewMode('map')}
                className={`px-3 py-2 text-sm transition-colors ${viewMode === 'map' ? 'bg-primary text-primary-foreground' : 'text-muted-foreground hover:bg-white/5'}`}>
                <Map className="w-4 h-4" />
              </button>
            </div>
          </div>
        </motion.div>

        {/* Map View */}
        {viewMode === 'map' && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="mb-8">
            <TurfMap
              turfs={mapTurfs}
              centerLat={userLocation?.lat ?? 11.0168}
              centerLng={userLocation?.lng ?? 76.9558}
              zoom={12}
              height="480px"
            />
            <p className="text-xs text-muted-foreground mt-2 text-center">
              Click any marker to see details and get directions.
            </p>
          </motion.div>
        )}

        {/* Grid View */}
        {viewMode === 'grid' && (
          <>
            {loading ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                {[...Array(9)].map((_, i) => (
                  <div key={i} className="glass-dark rounded-2xl overflow-hidden border border-white/10">
                    <div className="shimmer h-48" />
                    <div className="p-5 space-y-3">
                      <div className="shimmer h-5 rounded w-3/4" />
                      <div className="shimmer h-4 rounded w-1/2" />
                      <div className="shimmer h-4 rounded w-full" />
                    </div>
                  </div>
                ))}
              </div>
            ) : sorted.length === 0 ? (
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}
                className="text-center py-20 glass-dark rounded-2xl border border-dashed border-white/20">
                <div className="text-5xl mb-4">🏟️</div>
                <h3 className="text-xl font-bold text-foreground mb-2">No turfs found</h3>
                <p className="text-muted-foreground">Try a different search term or check back later.</p>
              </motion.div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                {sorted.map((turf, i) => (
                  <motion.div key={turf.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: i * 0.05 }}
                    className="h-full">
                    <TurfCard turf={turf} distanceKm={getDistance(turf)} />
                  </motion.div>
                ))}
              </div>
            )}
          </>
        )}
      </div>
    </div>
  )
}
