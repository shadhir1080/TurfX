'use client'

import { motion } from 'framer-motion'
import Link from 'next/link'
import { useAuth } from '@/contexts/AuthContext'
import { useBookings } from '@/hooks/useBookings'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { CalendarDays, MapPin, Clock, Search, CheckCircle, XCircle } from 'lucide-react'

const fadeUp = {
  hidden: { opacity: 0, y: 20 },
  visible: (i: number) => ({ opacity: 1, y: 0, transition: { delay: i * 0.08 } })
}

const statusConfig: Record<string, { label: string; className: string }> = {
  confirmed: { label: 'Confirmed', className: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' },
  pending: { label: 'Pending', className: 'bg-yellow-500/10 text-yellow-400 border-yellow-500/20' },
  cancelled: { label: 'Cancelled', className: 'bg-red-500/10 text-red-400 border-red-500/20' },
}

export default function UserDashboard() {
  const { user, profile } = useAuth()
  const { bookings, loading } = useBookings({ userId: user?.id })

  const confirmed = bookings.filter(b => b.status === 'confirmed').length
  const pending = bookings.filter(b => b.status === 'pending').length
  const totalSpent = bookings.filter(b => b.status === 'confirmed').reduce((s, b) => s + b.total_amount, 0)

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-black text-foreground">
          Hey, <span className="gradient-text">{profile?.full_name?.split(' ')[0] || 'Player'}!</span> 👋
        </h1>
        <p className="text-muted-foreground mt-1">Ready for your next game? Here&apos;s your activity.</p>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-3 gap-4">
        {[
          { label: 'Confirmed', value: confirmed, color: 'text-emerald-400' },
          { label: 'Pending', value: pending, color: 'text-yellow-400' },
          { label: 'Total Spent', value: `₹${totalSpent.toLocaleString('en-IN')}`, color: 'text-primary' },
        ].map((s, i) => (
          <motion.div key={s.label} custom={i} initial="hidden" animate="visible" variants={fadeUp}>
            <Card className="glass-dark border-white/10 text-center">
              <CardContent className="py-5">
                <p className={`text-2xl font-black ${s.color}`}>{s.value}</p>
                <p className="text-xs text-muted-foreground mt-1">{s.label}</p>
              </CardContent>
            </Card>
          </motion.div>
        ))}
      </div>

      {/* Browse CTA */}
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.2 }}
        className="glass-dark rounded-2xl p-6 border border-primary/20 flex items-center justify-between gap-4 flex-wrap">
        <div>
          <h3 className="font-bold text-foreground text-lg">Find Your Next Game</h3>
          <p className="text-muted-foreground text-sm mt-1">Explore hundreds of turfs near you.</p>
        </div>
        <Link href="/turfs">
          <Button className="bg-primary hover:bg-primary/90 gap-2"><Search className="w-4 h-4" /> Browse Turfs</Button>
        </Link>
      </motion.div>

      {/* Bookings */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-bold text-foreground">Recent Bookings</h2>
          <Link href="/dashboard/bookings"><Button variant="ghost" size="sm" className="text-primary">View All</Button></Link>
        </div>

        {pending > 0 && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="mb-6 bg-yellow-500/10 border border-yellow-500/20 text-yellow-400 p-4 rounded-xl text-sm flex gap-3 items-start">
            <Clock className="w-5 h-5 shrink-0 mt-0.5" />
            <p>You have <strong>{pending} pending booking{pending > 1 ? 's' : ''}</strong>. If you have already completed the payment via the Razorpay link, the turf owner will verify it shortly and your booking status will change to Confirmed.</p>
          </motion.div>
        )}

        {loading ? (
          <div className="space-y-3">{[...Array(3)].map((_, i) => <div key={i} className="shimmer h-20 rounded-2xl" />)}</div>
        ) : bookings.length === 0 ? (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}
            className="glass-dark rounded-2xl p-10 border border-dashed border-white/20 text-center">
            <CalendarDays className="w-10 h-10 text-muted-foreground mx-auto mb-3" />
            <h3 className="font-bold text-foreground mb-2">No bookings yet</h3>
            <p className="text-muted-foreground text-sm mb-4">Start by finding a turf near you.</p>
            <Link href="/turfs"><Button className="bg-primary hover:bg-primary/90">Browse Turfs</Button></Link>
          </motion.div>
        ) : (
          <div className="space-y-3">
            {bookings.slice(0, 5).map((b, i) => {
              const turf = b.turf as any
              const cfg = statusConfig[b.status]
              return (
                <motion.div key={b.id} custom={i} initial="hidden" animate="visible" variants={fadeUp}>
                  <Card className="glass-dark border-white/10 card-hover">
                    <CardContent className="p-4 flex items-center gap-4 flex-wrap">
                      <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
                        <span className="text-xl">⚽</span>
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-semibold text-foreground truncate">{turf?.name || 'Turf'}</p>
                        <div className="flex items-center gap-3 mt-1 text-xs text-muted-foreground flex-wrap">
                          <span className="flex items-center gap-1">
                            <Clock className="w-3 h-3" />
                            {new Date(b.start_time).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
                          </span>
                          {turf?.location?.city && (
                            <span className="flex items-center gap-1">
                              <MapPin className="w-3 h-3" /> {turf.location.city}
                            </span>
                          )}
                        </div>
                      </div>
                      <div className="flex items-center gap-3 shrink-0">
                        <div className="text-right">
                          <p className="font-bold text-foreground">₹{b.total_amount}</p>
                          {b.payment_type === 'advance' ? (
                            <p className="text-[10px] text-yellow-400 font-medium">
                              Paid ₹{b.advance_amount} online, ₹{b.balance_amount} due at venue
                            </p>
                          ) : (
                            <p className="text-[10px] text-emerald-400 font-medium">Fully Paid Online</p>
                          )}
                        </div>
                        <Badge variant="outline" className={`text-xs ${cfg.className}`}>{cfg.label}</Badge>
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}
