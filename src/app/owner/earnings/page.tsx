'use client'

import { useEffect, useState } from 'react'
import { useAuth } from '@/contexts/AuthContext'
import { supabase } from '@/lib/supabase/client'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { motion } from 'framer-motion'
import { DollarSign, Landmark, Wallet, Coins, CalendarDays, TrendingUp, Sparkles } from 'lucide-react'

export default function OwnerEarningsPage() {
  const { user } = useAuth()
  const [bookings, setBookings] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [stats, setStats] = useState({
    grossEarnings: 0,
    platformFee: 0,
    netEarnings: 0,
    onlinePaid: 0,
    venueCollect: 0,
    pendingEarnings: 0
  })

  useEffect(() => {
    if (user) fetchEarningsData()
  }, [user])

  const fetchEarningsData = async () => {
    setLoading(true)
    try {
      const { data: turfs } = await (supabase.from('turfs') as any)
        .select('id')
        .eq('owner_id', user!.id)

      const turfIds = ((turfs || []) as any[]).map(t => t.id)

      if (turfIds.length > 0) {
        const { data: bookingsData } = await (supabase.from('bookings') as any)
          .select('*, turf:turfs(name), user:profiles(full_name)')
          .in('turf_id', turfIds)
          .order('created_at', { ascending: false })

        const allBookings = (bookingsData as any[]) || []
        setBookings(allBookings)

        // Filter confirmed and compute stats
        const confirmed = allBookings.filter(b => b.status === 'confirmed')
        const pending = allBookings.filter(b => b.status === 'pending')

        const gross = confirmed.reduce((acc, b) => acc + b.total_amount, 0)
        const commission = confirmed.reduce((acc, b) => acc + b.commission_amount, 0)
        const net = gross - commission

        // Calculate Online Paid vs Venue Collect for confirmed bookings
        const online = confirmed.reduce((acc, b) => {
          const amt = b.payment_type === 'advance' ? b.advance_amount : b.total_amount
          return acc + (amt || 0)
        }, 0)

        const venue = confirmed.reduce((acc, b) => {
          const amt = b.payment_type === 'advance' ? b.balance_amount : 0
          return acc + (amt || 0)
        }, 0)

        // Pending earnings (what could be earned)
        const pendingNet = pending.reduce((acc, b) => acc + (b.total_amount - b.commission_amount), 0)

        setStats({
          grossEarnings: gross,
          platformFee: commission,
          netEarnings: net,
          onlinePaid: online,
          venueCollect: venue,
          pendingEarnings: pendingNet
        })
      }
    } catch (err) {
      console.error('Error fetching earnings data:', err)
    } finally {
      setLoading(false)
    }
  }

  const statCards = [
    { label: 'Net Earnings', value: `₹${stats.netEarnings.toLocaleString('en-IN')}`, icon: DollarSign, color: 'text-primary', bg: 'bg-primary/10', desc: 'Earnings after platform fees' },
    { label: 'Platform Commission', value: `₹${stats.platformFee.toLocaleString('en-IN')}`, icon: Landmark, color: 'text-blue-400', bg: 'bg-blue-400/10', desc: 'TurfX Ultra platform fees (10%)' },
    { label: 'Online Payouts', value: `₹${stats.onlinePaid.toLocaleString('en-IN')}`, icon: Wallet, color: 'text-purple-400', bg: 'bg-purple-400/10', desc: 'Settled to your linked account' },
    { label: 'Collect at Venue', value: `₹${stats.venueCollect.toLocaleString('en-IN')}`, icon: Coins, color: 'text-yellow-400', bg: 'bg-yellow-400/10', desc: 'Cash/direct payment at venue' }
  ]

  // Calculate percentage of online payouts
  const onlineRatio = stats.netEarnings > 0 ? (stats.onlinePaid / (stats.onlinePaid + stats.venueCollect)) * 100 : 0

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-black text-foreground">Earnings Report</h1>
        <p className="text-muted-foreground mt-1">Track payouts, commissions, and revenue analytics.</p>
      </div>

      {loading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-5">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="glass-dark rounded-2xl p-6 border border-white/10 shimmer h-28" />
          ))}
        </div>
      ) : (
        <>
          {/* Stats Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-5">
            {statCards.map((card, i) => (
              <motion.div
                key={card.label}
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.05 }}
              >
                <Card className="glass-dark border-white/10 card-hover">
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between mb-3">
                      <p className="text-sm text-muted-foreground font-medium">{card.label}</p>
                      <div className={`w-10 h-10 rounded-xl ${card.bg} flex items-center justify-center`}>
                        <card.icon className={`w-5 h-5 ${card.color}`} />
                      </div>
                    </div>
                    <p className="text-3xl font-black text-foreground">{card.value}</p>
                    <p className="text-[10px] text-muted-foreground mt-1">{card.desc}</p>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Payment Method Breakdown */}
            <Card className="glass-dark border-white/10 lg:col-span-1 flex flex-col justify-between">
              <CardHeader>
                <CardTitle className="text-base font-bold flex items-center gap-2">
                  <TrendingUp className="w-4 h-4 text-primary" /> Settlement Split
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-6 pb-6">
                <div>
                  <div className="flex justify-between text-xs text-muted-foreground mb-2">
                    <span>Online Settled</span>
                    <span className="font-semibold text-foreground">{onlineRatio.toFixed(1)}%</span>
                  </div>
                  <div className="w-full bg-white/5 h-2.5 rounded-full overflow-hidden">
                    <div
                      className="bg-primary h-full rounded-full transition-all duration-500"
                      style={{ width: `${onlineRatio}%` }}
                    />
                  </div>
                </div>

                <div className="space-y-3 pt-2">
                  <div className="flex items-center justify-between text-xs">
                    <span className="flex items-center gap-1.5 text-muted-foreground">
                      <span className="w-2 h-2 rounded-full bg-primary" /> Online Payments
                    </span>
                    <span className="font-semibold text-foreground">₹{stats.onlinePaid.toLocaleString('en-IN')}</span>
                  </div>
                  <div className="flex items-center justify-between text-xs">
                    <span className="flex items-center gap-1.5 text-muted-foreground">
                      <span className="w-2 h-2 rounded-full bg-yellow-400" /> Collect at Venue
                    </span>
                    <span className="font-semibold text-foreground">₹{stats.venueCollect.toLocaleString('en-IN')}</span>
                  </div>
                </div>

                <div className="p-4 rounded-xl bg-yellow-500/5 border border-yellow-500/10 flex items-start gap-3 mt-4">
                  <Sparkles className="w-5 h-5 text-yellow-400 shrink-0 mt-0.5" />
                  <div>
                    <h4 className="text-xs font-bold text-yellow-400">Potential Earnings</h4>
                    <p className="text-[10px] text-muted-foreground mt-1">
                      You have pending bookings with a net potential revenue of{' '}
                      <span className="font-bold text-foreground">₹{stats.pendingEarnings.toLocaleString('en-IN')}</span>. Confirm them to add to your settlement!
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Transactions / Completed Bookings list */}
            <Card className="glass-dark border-white/10 lg:col-span-2">
              <CardHeader>
                <CardTitle className="text-base font-bold flex items-center gap-2">
                  <CalendarDays className="w-4 h-4 text-primary" /> Confirmed Transactions
                </CardTitle>
              </CardHeader>
              <CardContent className="p-0">
                {bookings.filter(b => b.status === 'confirmed').length === 0 ? (
                  <div className="text-center py-12 text-muted-foreground text-sm">
                    No completed settlements found.
                  </div>
                ) : (
                  <div className="overflow-x-auto max-h-[350px] overflow-y-auto">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="border-b border-white/10 sticky top-0 bg-background z-10">
                          <th className="text-left py-3 px-4 text-xs text-muted-foreground font-semibold uppercase tracking-wider">Date</th>
                          <th className="text-left py-3 px-4 text-xs text-muted-foreground font-semibold uppercase tracking-wider">Turf</th>
                          <th className="text-left py-3 px-4 text-xs text-muted-foreground font-semibold uppercase tracking-wider">Gross</th>
                          <th className="text-left py-3 px-4 text-xs text-muted-foreground font-semibold uppercase tracking-wider">Fee</th>
                          <th className="text-right py-3 px-4 text-xs text-muted-foreground font-semibold uppercase tracking-wider">Settled</th>
                        </tr>
                      </thead>
                      <tbody>
                        {bookings
                          .filter(b => b.status === 'confirmed')
                          .map((b) => {
                            const date = new Date(b.start_time).toLocaleDateString('en-IN', {
                              day: 'numeric',
                              month: 'short',
                              year: '2-digit'
                            })
                            const settled = b.total_amount - b.commission_amount
                            const isAdvance = b.payment_type === 'advance'

                            return (
                              <tr key={b.id} className="border-b border-white/5 hover:bg-white/3 transition-colors">
                                <td className="py-3 px-4 text-muted-foreground font-medium">{date}</td>
                                <td className="py-3 px-4 text-foreground font-semibold">{b.turf?.name || '—'}</td>
                                <td className="py-3 px-4 text-muted-foreground">₹{b.total_amount}</td>
                                <td className="py-3 px-4 text-red-400">₹{b.commission_amount}</td>
                                <td className="py-3 px-4 text-right">
                                  <p className="text-primary font-bold">₹{settled}</p>
                                  <p className="text-[9px] text-muted-foreground">
                                    {isAdvance
                                      ? `₹${b.advance_amount} Online / ₹${b.balance_amount} Cash`
                                      : '100% Online'}
                                  </p>
                                </td>
                              </tr>
                            )
                          })}
                      </tbody>
                    </table>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </>
      )}
    </div>
  )
}
