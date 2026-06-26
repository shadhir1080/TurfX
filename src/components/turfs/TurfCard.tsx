'use client'

import { motion } from 'framer-motion'
import Link from 'next/link'
import { Database } from '@/lib/supabase/database.types'
import { MapPin, Clock, Star, BadgeCheck, Zap, Moon } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { getEffectivePrice, isWeekend } from '@/lib/pricing'

type Turf = Database['public']['Tables']['turfs']['Row']

interface TurfCardProps {
  turf: Turf
  distanceKm?: number
}

export default function TurfCard({ turf, distanceKm }: TurfCardProps) {
  const location = turf.location as { city?: string; address?: string; area?: string } | null
  const today = new Date()
  const weekend = isWeekend(today)
  const effectivePrice = getEffectivePrice(turf.price_per_hour, today)

  return (
    <Link href={`/turfs/${turf.id}`}>
      <motion.div
        whileHover={{ y: -4, boxShadow: '0 20px 40px rgba(0,0,0,0.3)' }}
        transition={{ duration: 0.2 }}
        className="glass-dark rounded-2xl overflow-hidden border border-white/10 cursor-pointer group h-full flex flex-col"
      >
        {/* Image */}
        <div className="relative h-48 bg-gradient-to-br from-primary/20 to-emerald-900/30 overflow-hidden shrink-0">
          {turf.images && turf.images.length > 0 ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={turf.images[0]}
              alt={turf.name}
              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center">
              <span className="text-6xl opacity-30">⚽</span>
            </div>
          )}

          {/* Top-left badges */}
          <div className="absolute top-3 left-3 flex flex-col gap-1.5">
            {turf.is_verified && (
              <Badge className="bg-primary/90 text-primary-foreground text-xs font-semibold gap-1 w-fit">
                <BadgeCheck className="w-3 h-3" /> Verified
              </Badge>
            )}
            {turf.is_premium && (
              <Badge className="bg-yellow-500/90 text-black text-xs font-bold gap-1 w-fit">
                <Zap className="w-3 h-3" /> Premium
              </Badge>
            )}
            {turf.is_24hours && (
              <Badge className="bg-blue-600/90 text-white text-xs font-semibold gap-1 w-fit">
                <Moon className="w-3 h-3" /> Open All Night
              </Badge>
            )}
          </div>

          {/* Price badge — shows weekend surcharge */}
          <div className="absolute top-3 right-3 bg-black/70 backdrop-blur-sm rounded-lg px-2 py-1 text-right">
            <span className="text-sm font-bold text-white">
              ₹{effectivePrice.toLocaleString('en-IN')}
              <span className="text-xs font-normal text-white/70">/hr</span>
            </span>
            {weekend && (
              <p className="text-[10px] text-yellow-400 font-medium">Weekend rate</p>
            )}
          </div>
        </div>

        {/* Content */}
        <div className="p-5 flex flex-col flex-1">
          {/* Name + Rating */}
          <div className="flex items-start justify-between gap-2 mb-1.5">
            <h3 className="font-bold text-foreground text-base leading-tight group-hover:text-primary transition-colors line-clamp-1">
              {turf.name}
            </h3>
            <div className="flex items-center gap-1 shrink-0">
              <Star className="w-3.5 h-3.5 fill-yellow-400 text-yellow-400" />
              <span className="text-xs font-bold text-foreground">{turf.rating ?? '—'}</span>
              {turf.review_count && (
                <span className="text-xs text-muted-foreground">({turf.review_count})</span>
              )}
            </div>
          </div>

          {/* Location */}
          {(location?.area || location?.city) && (
            <div className="flex items-center gap-1 text-muted-foreground text-xs mb-2">
              <MapPin className="w-3 h-3 shrink-0" />
              <span className="truncate">{location.area || location.city}, Coimbatore</span>
              {distanceKm !== undefined && (
                <span className="ml-auto shrink-0 text-primary font-medium">
                  {distanceKm < 1 ? `${Math.round(distanceKm * 1000)}m` : `${distanceKm.toFixed(1)} km`}
                </span>
              )}
            </div>
          )}

          {/* Sports chips */}
          {turf.sports && turf.sports.length > 0 && (
            <div className="flex flex-wrap gap-1 mb-3">
              {turf.sports.map((sport) => (
                <span key={sport} className="text-[10px] font-medium px-2 py-0.5 rounded-full bg-primary/10 text-primary border border-primary/20">
                  {sport}
                </span>
              ))}
            </div>
          )}

          {/* Amenities (top 3) */}
          {turf.amenities && turf.amenities.length > 0 && (
            <div className="flex flex-wrap gap-1 mb-3">
              {turf.amenities.slice(0, 3).map((a) => (
                <span key={a} className="text-[10px] text-muted-foreground bg-white/5 border border-white/10 rounded-full px-2 py-0.5">
                  {a}
                </span>
              ))}
              {turf.amenities.length > 3 && (
                <span className="text-[10px] text-muted-foreground">+{turf.amenities.length - 3} more</span>
              )}
            </div>
          )}

          {/* Footer */}
          <div className="flex items-center justify-between mt-auto">
            <div className="flex items-center gap-1 text-xs text-muted-foreground">
              <Clock className="w-3 h-3" />
              <span>{turf.timings || 'Check timings'}</span>
            </div>
            <span className="text-xs text-primary font-semibold">Book Now →</span>
          </div>
        </div>
      </motion.div>
    </Link>
  )
}
