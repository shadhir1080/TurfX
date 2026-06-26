'use client'

import { useAuth } from '@/contexts/AuthContext'
import { useBookings } from '@/hooks/useBookings'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { motion } from 'framer-motion'
import { CalendarDays, MapPin, Clock, Search } from 'lucide-react'
import Link from 'next/link'

const fadeUp = {
  hidden: { opacity: 0, y: 15 },
  visible: (i: number) => ({ opacity: 1, y: 0, transition: { delay: i * 0.05 } })
}

const statusConfig: Record<string, { label: string; className: string }> = {
  confirmed: { label: 'Confirmed', className: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' },
  pending: { label: 'Pending', className: 'bg-yellow-500/10 text-yellow-400 border-yellow-500/20' },
  cancelled: { label: 'Cancelled', className: 'bg-red-500/10 text-red-400 border-red-500/20' },
}

export default function PlayerBookingsPage() {
  const { user } = useAuth()
  const { bookings, loading } = useBookings({ userId: user?.id })

  return (
    <div className="space-y-8">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-black text-foreground">My Bookings</h1>
          <p className="text-muted-foreground mt-1">View and manage your turf reservations.</p>
        </div>
        <Link href="/turfs">
          <Button className="bg-primary hover:bg-primary/90 gap-2 font-semibold">
            <Search className="w-4 h-4" /> Book a Turf
          </Button>
        </Link>
      </div>

      {loading ? (
        <div className="space-y-4">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="glass-dark rounded-2xl border border-white/10 shimmer h-24" />
          ))}
        </div>
      ) : bookings.length === 0 ? (
        <div className="glass-dark rounded-2xl p-12 border border-dashed border-white/20 text-center max-w-xl mx-auto mt-10">
          <CalendarDays className="w-12 h-12 text-muted-foreground mx-auto mb-4 opacity-50" />
          <h3 className="text-xl font-bold text-foreground mb-2">No bookings found</h3>
          <p className="text-muted-foreground mb-6">You haven&apos;t reserved any turfs yet. Search for slots and start playing!</p>
          <Link href="/turfs">
            <Button className="bg-primary hover:bg-primary/90 font-semibold">Explore Turfs</Button>
          </Link>
        </div>
      ) : (
        <div className="space-y-4">
          {bookings.map((b, i) => {
            const turf = b.turf as any
            const location = turf?.location as { city?: string; address?: string } | null
            const cfg = statusConfig[b.status] || { label: b.status, className: 'bg-white/5 text-muted-foreground border-white/10' }
            
            const date = new Date(b.start_time).toLocaleDateString('en-IN', {
              weekday: 'short',
              day: 'numeric',
              month: 'short',
              year: 'numeric'
            })
            const startTime = new Date(b.start_time).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', hour12: true })
            const endTime = new Date(b.end_time).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', hour12: true })

            return (
              <motion.div
                key={b.id}
                custom={i}
                initial="hidden"
                animate="visible"
                variants={fadeUp}
              >
                <Card className="glass-dark border-white/10 card-hover">
                  <CardContent className="p-5 flex items-center gap-5 flex-wrap">
                    {/* Sport Icon Thumbnail */}
                    <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center shrink-0 border border-primary/25">
                      <span className="text-2xl">⚽</span>
                    </div>

                    {/* Booking/Turf Details */}
                    <div className="flex-1 min-w-0">
                      <h3 className="font-bold text-lg text-foreground truncate group-hover:text-primary transition-colors">
                        {turf?.name || 'Sports Arena'}
                      </h3>
                      <div className="flex items-center gap-3 mt-1.5 text-xs text-muted-foreground flex-wrap">
                        <span className="flex items-center gap-1.5">
                          <CalendarDays className="w-3.5 h-3.5 text-primary" />
                          {date}
                        </span>
                        <span className="flex items-center gap-1.5">
                          <Clock className="w-3.5 h-3.5 text-primary" />
                          {startTime} - {endTime}
                        </span>
                        {location?.address && (
                          <span className="flex items-center gap-1.5">
                            <MapPin className="w-3.5 h-3.5 text-primary" />
                            <span className="truncate">{location.address}</span>
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Pricing and Status Details */}
                    <div className="flex items-center gap-4 shrink-0 flex-wrap justify-between w-full md:w-auto md:justify-end">
                      <div className="text-left md:text-right">
                        <p className="font-bold text-foreground text-lg">₹{b.total_amount}</p>
                        {b.payment_type === 'advance' ? (
                          <p className="text-[10px] text-yellow-400 font-medium">
                            Paid ₹{b.advance_amount} online, ₹{b.balance_amount} due at venue
                          </p>
                        ) : (
                          <p className="text-[10px] text-emerald-400 font-medium">Fully Paid Online</p>
                        )}
                      </div>
                      <Badge variant="outline" className={`text-xs capitalize py-1 px-2.5 ${cfg.className}`}>
                        {cfg.label} {b.payment_type === 'advance' && '(Advance)'}
                      </Badge>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            )
          })}
        </div>
      )}
    </div>
  )
}
