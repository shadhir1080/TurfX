'use client'

import { useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import { supabase } from '@/lib/supabase/client'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Users, Building2, DollarSign, TrendingUp, CheckCircle, Clock, XCircle, Activity } from 'lucide-react'

interface Stats {
  totalUsers: number
  totalOwners: number
  totalTurfs: number
  totalRevenue: number
  pendingBookings: number
  confirmedBookings: number
  cancelledBookings: number
}

const fadeUp = {
  hidden: { opacity: 0, y: 20 },
  visible: (i: number) => ({ opacity: 1, y: 0, transition: { delay: i * 0.08, duration: 0.4 } })
}

export default function AdminDashboard() {
  const [stats, setStats] = useState<Stats | null>(null)
  const [loading, setLoading] = useState(true)
  const [recentBookings, setRecentBookings] = useState<any[]>([])

  useEffect(() => {
    fetchStats()
    fetchRecentBookings()
  }, [])

  const fetchStats = async () => {
    const [usersRes, ownersRes, turfsRes, bookingsRes] = await Promise.all([
      supabase.from('profiles').select('id', { count: 'exact' }).eq('role', 'user'),
      supabase.from('profiles').select('id', { count: 'exact' }).eq('role', 'owner'),
      supabase.from('turfs').select('id', { count: 'exact' }),
      supabase.from('bookings').select('status, total_amount, commission_amount'),
    ])

    const bookings = (bookingsRes.data || []) as any[]
    setStats({
      totalUsers: usersRes.count || 0,
      totalOwners: ownersRes.count || 0,
      totalTurfs: turfsRes.count || 0,
      totalRevenue: bookings.filter(b => b.status === 'confirmed').reduce((s, b) => s + b.commission_amount, 0),
      pendingBookings: bookings.filter(b => b.status === 'pending').length,
      confirmedBookings: bookings.filter(b => b.status === 'confirmed').length,
      cancelledBookings: bookings.filter(b => b.status === 'cancelled').length,
    })
    setLoading(false)
  }

  const fetchRecentBookings = async () => {
    const { data } = await supabase
      .from('bookings')
      .select('*, turf:turfs(name), user:profiles(full_name)')
      .order('created_at', { ascending: false })
      .limit(8)
    setRecentBookings(data || [])
  }

  const statCards = stats ? [
    { label: 'Total Users', value: stats.totalUsers, icon: Users, color: 'text-blue-400', bg: 'bg-blue-400/10' },
    { label: 'Turf Owners', value: stats.totalOwners, icon: Building2, color: 'text-purple-400', bg: 'bg-purple-400/10' },
    { label: 'Listed Turfs', value: stats.totalTurfs, icon: TrendingUp, color: 'text-emerald-400', bg: 'bg-emerald-400/10' },
    { label: 'Commission Earned', value: `₹${stats.totalRevenue.toLocaleString('en-IN')}`, icon: DollarSign, color: 'text-primary', bg: 'bg-primary/10' },
  ] : []

  const statusConfig: Record<string, { icon: any; label: string; className: string }> = {
    confirmed: { icon: CheckCircle, label: 'Confirmed', className: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' },
    pending: { icon: Clock, label: 'Pending', className: 'bg-yellow-500/10 text-yellow-400 border-yellow-500/20' },
    cancelled: { icon: XCircle, label: 'Cancelled', className: 'bg-red-500/10 text-red-400 border-red-500/20' },
  }

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-black text-foreground">Dashboard Overview</h1>
        <p className="text-muted-foreground mt-1">Monitor the entire platform at a glance.</p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-5">
        {loading ? (
          [...Array(4)].map((_, i) => (
            <div key={i} className="glass-dark rounded-2xl p-6 border border-white/10">
              <div className="shimmer h-8 w-24 rounded mb-3" />
              <div className="shimmer h-10 w-16 rounded" />
            </div>
          ))
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

      {/* Booking Status Row */}
      {stats && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.3 }}
          className="grid grid-cols-3 gap-4">
          {[
            { label: 'Confirmed', count: stats.confirmedBookings, color: 'text-emerald-400', bg: 'bg-emerald-400/10' },
            { label: 'Pending', count: stats.pendingBookings, color: 'text-yellow-400', bg: 'bg-yellow-400/10' },
            { label: 'Cancelled', count: stats.cancelledBookings, color: 'text-red-400', bg: 'bg-red-400/10' },
          ].map((item) => (
            <Card key={item.label} className="glass-dark border-white/10">
              <CardContent className="p-5 text-center">
                <p className={`text-2xl font-black ${item.color}`}>{item.count}</p>
                <p className="text-xs text-muted-foreground mt-1">{item.label} Bookings</p>
              </CardContent>
            </Card>
          ))}
        </motion.div>
      )}

      {/* Recent Bookings Table */}
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }}>
        <Card className="glass-dark border-white/10">
          <CardHeader className="flex flex-row items-center justify-between pb-4">
            <CardTitle className="text-lg font-bold flex items-center gap-2">
              <Activity className="w-5 h-5 text-primary" /> Recent Bookings
            </CardTitle>
          </CardHeader>
          <CardContent>
            {recentBookings.length === 0 ? (
              <div className="text-center py-10 text-muted-foreground">No bookings yet.</div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-white/10">
                      {['User', 'Turf', 'Amount', 'Commission', 'Status', 'Date'].map(h => (
                        <th key={h} className="text-left py-3 px-2 text-xs text-muted-foreground font-semibold uppercase tracking-wider">{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {recentBookings.map((b) => {
                      const cfg = statusConfig[b.status]
                      return (
                        <tr key={b.id} className="border-b border-white/5 hover:bg-white/3 transition-colors">
                          <td className="py-3 px-2 font-medium text-foreground">{(b.user as any)?.full_name || '—'}</td>
                          <td className="py-3 px-2 text-muted-foreground">{(b.turf as any)?.name || '—'}</td>
                          <td className="py-3 px-2 font-semibold text-foreground">₹{b.total_amount}</td>
                          <td className="py-3 px-2 text-primary font-semibold">₹{b.commission_amount}</td>
                          <td className="py-3 px-2">
                            <Badge variant="outline" className={`text-xs ${cfg?.className}`}>{cfg?.label}</Badge>
                          </td>
                          <td className="py-3 px-2 text-muted-foreground">{new Date(b.created_at).toLocaleDateString('en-IN')}</td>
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </CardContent>
        </Card>
      </motion.div>
    </div>
  )
}
