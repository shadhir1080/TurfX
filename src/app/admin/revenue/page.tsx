'use client'

import { useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import { supabase } from '@/lib/supabase/client'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { 
  TrendingUp, DollarSign, Percent, Clock, Search, 
  ArrowUpRight, Download, CheckCircle2, XCircle, AlertCircle 
} from 'lucide-react'

export default function AdminRevenuePage() {
  const [bookings, setBookings] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState<string>('all')

  useEffect(() => {
    fetchRevenueData()
  }, [])

  const fetchRevenueData = async () => {
    setLoading(true)
    try {
      const { data, error } = await supabase
        .from('bookings')
        .select('*, turf:turfs(name), user:profiles(full_name, email)')
        .order('created_at', { ascending: false })

      if (error) {
        console.error('Error fetching bookings:', error.message)
      } else {
        setBookings(data || [])
      }
    } catch (err) {
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  // Aggregated Stats
  const confirmedBookings = bookings.filter(b => b.status === 'confirmed')
  const totalVolume = confirmedBookings.reduce((sum, b) => sum + (b.total_amount || 0), 0)
  const totalCommissions = confirmedBookings.reduce((sum, b) => sum + (b.commission_amount || 0), 0)
  
  const pendingBookings = bookings.filter(b => b.status === 'pending')
  const pendingVolume = pendingBookings.reduce((sum, b) => sum + (b.total_amount || 0), 0)
  const pendingCommissions = pendingBookings.reduce((sum, b) => sum + (b.commission_amount || 0), 0)

  const refundVolume = bookings
    .filter(b => b.status === 'cancelled')
    .reduce((sum, b) => sum + (b.total_amount || 0), 0)

  const filtered = bookings.filter(b => {
    const matchesSearch = 
      !search ||
      b.user?.full_name?.toLowerCase().includes(search.toLowerCase()) ||
      b.turf?.name?.toLowerCase().includes(search.toLowerCase()) ||
      b.user?.email?.toLowerCase().includes(search.toLowerCase())

    const matchesStatus = statusFilter === 'all' || b.status === statusFilter

    return matchesSearch && matchesStatus
  })

  const statusConfig: Record<string, { badge: string; icon: any }> = {
    confirmed: { badge: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20', icon: CheckCircle2 },
    pending: { badge: 'bg-yellow-500/10 text-yellow-400 border-yellow-500/20', icon: Clock },
    cancelled: { badge: 'bg-red-500/10 text-red-400 border-red-500/20', icon: XCircle }
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-black text-foreground">Revenue & Financials</h1>
        <p className="text-muted-foreground mt-1">Track transactional volume, commissions collected, and billing operations.</p>
      </div>

      {/* Financial Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5">
        {loading ? (
          [...Array(4)].map((_, i) => (
            <Card key={i} className="glass-dark border-white/10 p-6">
              <div className="shimmer h-8 w-24 rounded mb-4" />
              <div className="shimmer h-10 w-32 rounded" />
            </Card>
          ))
        ) : (
          <>
            <motion.div initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }}>
              <Card className="glass-dark border-white/10 card-hover">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between mb-4">
                    <p className="text-xs text-muted-foreground font-semibold uppercase tracking-wider">Gross Volume</p>
                    <div className="w-9 h-9 rounded-lg bg-emerald-500/10 flex items-center justify-center">
                      <TrendingUp className="w-5 h-5 text-emerald-400" />
                    </div>
                  </div>
                  <h3 className="text-2xl font-black text-white">₹{totalVolume.toLocaleString('en-IN')}</h3>
                  <p className="text-[10px] text-muted-foreground mt-1">From all confirmed bookings</p>
                </CardContent>
              </Card>
            </motion.div>

            <motion.div initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.05 }}>
              <Card className="glass-dark border-white/10 card-hover">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between mb-4">
                    <p className="text-xs text-muted-foreground font-semibold uppercase tracking-wider">Commission Revenue</p>
                    <div className="w-9 h-9 rounded-lg bg-primary/10 flex items-center justify-center">
                      <Percent className="w-5 h-5 text-primary" />
                    </div>
                  </div>
                  <h3 className="text-2xl font-black text-primary">₹{totalCommissions.toLocaleString('en-IN')}</h3>
                  <p className="text-[10px] text-muted-foreground mt-1">Platform share (approx. 10% average)</p>
                </CardContent>
              </Card>
            </motion.div>

            <motion.div initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
              <Card className="glass-dark border-white/10 card-hover">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between mb-4">
                    <p className="text-xs text-muted-foreground font-semibold uppercase tracking-wider">Unconfirmed/Pending</p>
                    <div className="w-9 h-9 rounded-lg bg-yellow-500/10 flex items-center justify-center">
                      <Clock className="w-5 h-5 text-yellow-400" />
                    </div>
                  </div>
                  <h3 className="text-2xl font-black text-yellow-400">₹{pendingVolume.toLocaleString('en-IN')}</h3>
                  <p className="text-[10px] text-muted-foreground mt-1">Potential commission: ₹{pendingCommissions.toLocaleString('en-IN')}</p>
                </CardContent>
              </Card>
            </motion.div>

            <motion.div initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }}>
              <Card className="glass-dark border-white/10 card-hover">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between mb-4">
                    <p className="text-xs text-muted-foreground font-semibold uppercase tracking-wider">Cancelled Volume</p>
                    <div className="w-9 h-9 rounded-lg bg-red-500/10 flex items-center justify-center">
                      <DollarSign className="w-5 h-5 text-red-400" />
                    </div>
                  </div>
                  <h3 className="text-2xl font-black text-red-400">₹{refundVolume.toLocaleString('en-IN')}</h3>
                  <p className="text-[10px] text-muted-foreground mt-1">Sum of all cancelled/refunded slots</p>
                </CardContent>
              </Card>
            </motion.div>
          </>
        )}
      </div>

      {/* Filters and Table */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="relative max-w-sm flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input placeholder="Search user, email or turf..." value={search} onChange={(e) => setSearch(e.target.value)}
            className="pl-10 bg-white/5 border-white/10 rounded-xl h-11" />
        </div>
        
        {/* Status Tabs/Buttons */}
        <div className="flex gap-1.5 bg-white/5 border border-white/10 p-1 rounded-xl shrink-0">
          {['all', 'confirmed', 'pending', 'cancelled'].map(status => (
            <button key={status} onClick={() => setStatusFilter(status)}
              className={`text-xs px-3.5 py-1.5 rounded-lg font-bold capitalize transition-all ${
                statusFilter === status 
                  ? 'bg-primary text-primary-foreground shadow-lg shadow-primary/20' 
                  : 'text-muted-foreground hover:text-foreground'
              }`}>
              {status}
            </button>
          ))}
        </div>
      </div>

      <Card className="glass-dark border-white/10 shadow-xl">
        <CardHeader className="pb-3">
          <CardTitle className="text-base flex items-center justify-between font-bold text-foreground">
            <span className="flex items-center gap-2">
              <ArrowUpRight className="w-5 h-5 text-primary" /> Transaction Ledger ({filtered.length})
            </span>
            <Button size="sm" variant="ghost" onClick={fetchRevenueData} className="text-xs text-primary hover:bg-primary/10">
              Refresh
            </Button>
          </CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="space-y-3">
              {[...Array(5)].map((_, i) => <div key={i} className="shimmer h-14 rounded-xl" />)}
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-white/10 text-muted-foreground">
                    {['Booking ID', 'User / Player', 'Turf / Sport', 'Total Slot Price', 'Commission (10%)', 'Status', 'Payment', 'Date'].map(h => (
                      <th key={h} className="text-left py-3.5 px-2 text-xs font-bold uppercase tracking-wider">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {filtered.map((b, i) => {
                    const cfg = statusConfig[b.status] || { badge: 'bg-white/5 text-muted-foreground', icon: AlertCircle }
                    return (
                      <motion.tr key={b.id} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: i * 0.01 }}
                        className="border-b border-white/5 hover:bg-white/3 transition-colors">
                        <td className="py-3 px-2 font-mono text-[10px] text-muted-foreground">{b.id.slice(0, 8)}...</td>
                        <td className="py-3 px-2">
                          <div>
                            <span className="font-semibold text-foreground block">{b.user?.full_name || '—'}</span>
                            <span className="text-[10px] text-muted-foreground block">{b.user?.email || '—'}</span>
                          </div>
                        </td>
                        <td className="py-3 px-2 font-medium text-foreground">{b.turf?.name || '—'}</td>
                        <td className="py-3 px-2 font-bold text-white">₹{b.total_amount}</td>
                        <td className="py-3 px-2 text-primary font-bold">₹{b.commission_amount}</td>
                        <td className="py-3 px-2">
                          <Badge variant="outline" className={`text-[10px] font-bold tracking-wider uppercase flex items-center gap-1 w-fit px-2 py-0.5 ${cfg.badge}`}>
                            <cfg.icon className="w-3 h-3" />
                            {b.status}
                          </Badge>
                        </td>
                        <td className="py-3 px-2">
                          <Badge variant="outline" className="text-xs uppercase border-white/10">
                            {b.payment_type || 'Full'}
                          </Badge>
                        </td>
                        <td className="py-3 px-2 text-muted-foreground">{new Date(b.created_at).toLocaleDateString('en-IN')}</td>
                      </motion.tr>
                    )
                  })}
                </tbody>
              </table>
              {filtered.length === 0 && (
                <div className="text-center py-12 text-muted-foreground">No financial ledger rows found.</div>
              )}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
