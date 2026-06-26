'use client'

import { useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import { useAuth } from '@/contexts/AuthContext'
import { supabase } from '@/lib/supabase/client'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Building2, CalendarDays, DollarSign, TrendingUp, CheckCircle, Clock, XCircle } from 'lucide-react'
import Link from 'next/link'

const fadeUp = {
  hidden: { opacity: 0, y: 20 },
  visible: (i: number) => ({ opacity: 1, y: 0, transition: { delay: i * 0.08 } })
}

export default function OwnerDashboard() {
  const { user, profile } = useAuth()
  const [stats, setStats] = useState({ turfs: 0, totalBookings: 0, earnings: 0, pending: 0 })
  const [recentBookings, setRecentBookings] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => { if (user) fetchData() }, [user])

  const fetchData = async () => {
    setLoading(true)
    const { data: turfs } = await supabase.from('turfs').select('id').eq('owner_id', user!.id)
    const turfIds = ((turfs || []) as any[]).map(t => t.id)

    if (turfIds.length > 0) {
      const { data: bookings } = await supabase
        .from('bookings')
        .select('*, turf:turfs(name), user:profiles(full_name)')
        .in('turf_id', turfIds)
        .order('created_at', { ascending: false })

      const all = (bookings || []) as any[]
      setRecentBookings(all.slice(0, 8))
      setStats({
        turfs: turfIds.length,
        totalBookings: all.length,
        earnings: all.filter(b => b.status === 'confirmed').reduce((s: number, b: any) => s + (b.total_amount - b.commission_amount), 0),
        pending: all.filter(b => b.status === 'pending').length,
      })
    } else {
      setStats({ turfs: 0, totalBookings: 0, earnings: 0, pending: 0 })
    }
    setLoading(false)
  }

  const statCards = [
    { label: 'My Turfs', value: stats.turfs, icon: Building2, color: 'text-blue-400', bg: 'bg-blue-400/10' },
    { label: 'Total Bookings', value: stats.totalBookings, icon: CalendarDays, color: 'text-purple-400', bg: 'bg-purple-400/10' },
    { label: 'Net Earnings', value: `₹${stats.earnings.toLocaleString('en-IN')}`, icon: DollarSign, color: 'text-primary', bg: 'bg-primary/10' },
    { label: 'Pending', value: stats.pending, icon: TrendingUp, color: 'text-yellow-400', bg: 'bg-yellow-400/10' },
  ]

  const statusColors: Record<string, string> = {
    confirmed: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20',
    pending: 'bg-yellow-500/10 text-yellow-400 border-yellow-500/20',
    cancelled: 'bg-red-500/10 text-red-400 border-red-500/20',
  }

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-black text-foreground">
          Welcome, <span className="gradient-text">{profile?.full_name?.split(' ')[0]}!</span>
        </h1>
        <p className="text-muted-foreground mt-1">Here&apos;s your turf performance at a glance.</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-5">
        {loading ? (
          [...Array(4)].map((_, i) => <div key={i} className="glass-dark rounded-2xl p-6 border border-white/10 shimmer h-28" />)
        ) : statCards.map((card, i) => (
          <motion.div key={card.label} custom={i} initial="hidden" animate="visible" variants={fadeUp}>
            <Card className="glass-dark border-white/10 card-hover">
              <CardContent className="p-6">
                <div className="flex items-center justify-between mb-4">
                  <p className="text-sm text-muted-foreground font-medium">{card.label}</p>
                  <div className={`w-10 h-10 rounded-xl ${card.bg} flex items-center justify-center`}>
                    <card.icon className={`w-5 h-5 ${card.color}`} />
                  </div>
                </div>
                <p className="text-3xl font-black text-foreground">{card.value}</p>
              </CardContent>
            </Card>
          </motion.div>
        ))}
      </div>

      {stats.turfs === 0 && !loading && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}
          className="glass-dark rounded-2xl p-10 border border-dashed border-white/20 text-center">
          <div className="text-6xl mb-4">🏟️</div>
          <h3 className="text-xl font-bold text-foreground mb-2">No turfs listed yet</h3>
          <p className="text-muted-foreground mb-6">Add your first turf to start accepting bookings.</p>
          <Link href="/owner/add-turf">
            <Button className="bg-primary hover:bg-primary/90">Add Your First Turf</Button>
          </Link>
        </motion.div>
      )}

      {recentBookings.length > 0 && (
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-bold text-foreground">Recent Bookings</h2>
            <Link href="/owner/bookings"><Button variant="ghost" size="sm" className="text-primary">View All</Button></Link>
          </div>
          <Card className="glass-dark border-white/10">
            <CardContent className="p-0">
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                   <thead>
                    <tr className="border-b border-white/10">
                      {['Player', 'Turf', 'Date', 'Total Price', 'Platform Fee', 'Online Paid', 'Collect at Venue', 'Status'].map(h => (
                        <th key={h} className="text-left py-3 px-4 text-xs text-muted-foreground font-semibold uppercase tracking-wider">{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {recentBookings.map((b) => (
                      <tr key={b.id} className="border-b border-white/5 hover:bg-white/3 transition-colors">
                        <td className="py-3 px-4 font-medium text-foreground">{(b.user as any)?.full_name || '—'}</td>
                        <td className="py-3 px-4 text-muted-foreground">{(b.turf as any)?.name || '—'}</td>
                        <td className="py-3 px-4 text-muted-foreground">{new Date(b.start_time).toLocaleDateString('en-IN')}</td>
                        <td className="py-3 px-4 font-semibold text-foreground">₹{b.total_amount}</td>
                        <td className="py-3 px-4 text-muted-foreground">₹{b.commission_amount}</td>
                        <td className="py-3 px-4 text-primary font-semibold">
                          ₹{b.payment_type === 'advance' ? b.advance_amount : b.total_amount}
                        </td>
                        <td className="py-3 px-4 text-yellow-400 font-semibold">
                          ₹{b.payment_type === 'advance' ? b.balance_amount : 0}
                        </td>
                        <td className="py-3 px-4">
                          <Badge variant="outline" className={`text-xs ${statusColors[b.status]}`}>{b.status} {b.payment_type === 'advance' && '(Advance)'}</Badge>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      )}
    </div>
  )
}
