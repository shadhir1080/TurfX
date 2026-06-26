'use client'

import { useEffect, useState } from 'react'
import { useAuth } from '@/contexts/AuthContext'
import { supabase } from '@/lib/supabase/client'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { motion } from 'framer-motion'
import { CalendarDays, Check, X, Loader2, AlertCircle } from 'lucide-react'

export default function OwnerBookingsPage() {
  const { user } = useAuth()
  const [bookings, setBookings] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [updatingId, setUpdatingId] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (user) fetchBookings()
  }, [user])

  const fetchBookings = async () => {
    setLoading(true)
    setError(null)
    try {
      // 1. Get owner's turfs
      const { data: turfs, error: turfsError } = await (supabase.from('turfs') as any)
        .select('id')
        .eq('owner_id', user!.id)

      if (turfsError) throw turfsError

      const turfIds = ((turfs || []) as any[]).map(t => t.id)

      if (turfIds.length > 0) {
        // 2. Get bookings for these turfs
        const { data: bookingsData, error: bookingsError } = await (supabase.from('bookings') as any)
          .select('*, turf:turfs(name), user:profiles(full_name)')
          .in('turf_id', turfIds)
          .order('created_at', { ascending: false })

        if (bookingsError) throw bookingsError
        setBookings((bookingsData as any[]) || [])
      } else {
        setBookings([])
      }
    } catch (err: any) {
      setError(err.message || 'Failed to fetch bookings')
    } finally {
      setLoading(false)
    }
  }

  const handleUpdateStatus = async (bookingId: string, newStatus: 'confirmed' | 'cancelled') => {
    setUpdatingId(bookingId)
    setError(null)
    try {
      const { error } = await (supabase.from('bookings') as any)
        .update({ status: newStatus })
        .eq('id', bookingId)

      if (error) throw error

      // Update local state
      setBookings(prev =>
        prev.map(b => (b.id === bookingId ? { ...b, status: newStatus } : b))
      )
    } catch (err: any) {
      setError(err.message || 'Failed to update booking status')
    } finally {
      setUpdatingId(null)
    }
  }

  const statusColors: Record<string, string> = {
    confirmed: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20',
    pending: 'bg-yellow-500/10 text-yellow-400 border-yellow-500/20',
    cancelled: 'bg-red-500/10 text-red-400 border-red-500/20',
  }

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-black text-foreground">Bookings</h1>
        <p className="text-muted-foreground mt-1">Manage reservations and change slot booking statuses.</p>
      </div>

      {error && (
        <div className="bg-destructive/10 border border-destructive/20 text-destructive px-4 py-3 rounded-xl flex items-center gap-2 text-sm">
          <AlertCircle className="w-4 h-4 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {loading ? (
        <div className="space-y-4">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="glass-dark rounded-2xl border border-white/10 shimmer h-20" />
          ))}
        </div>
      ) : bookings.length === 0 ? (
        <div className="glass-dark rounded-2xl p-12 border border-dashed border-white/20 text-center max-w-xl mx-auto mt-10">
          <CalendarDays className="w-12 h-12 text-muted-foreground mx-auto mb-4 opacity-50" />
          <h3 className="text-xl font-bold text-foreground mb-2">No bookings yet</h3>
          <p className="text-muted-foreground">Bookings for your turf arenas will show up here once players reserve slots.</p>
        </div>
      ) : (
        <Card className="glass-dark border-white/10 overflow-hidden">
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-white/10">
                    <th className="text-left py-4 px-5 text-xs text-muted-foreground font-semibold uppercase tracking-wider">Player</th>
                    <th className="text-left py-4 px-5 text-xs text-muted-foreground font-semibold uppercase tracking-wider">Turf</th>
                    <th className="text-left py-4 px-5 text-xs text-muted-foreground font-semibold uppercase tracking-wider">Date & Time</th>
                    <th className="text-left py-4 px-5 text-xs text-muted-foreground font-semibold uppercase tracking-wider">Pricing</th>
                    <th className="text-left py-4 px-5 text-xs text-muted-foreground font-semibold uppercase tracking-wider">Collected</th>
                    <th className="text-left py-4 px-5 text-xs text-muted-foreground font-semibold uppercase tracking-wider">Status</th>
                    <th className="text-right py-4 px-5 text-xs text-muted-foreground font-semibold uppercase tracking-wider">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {bookings.map((b, i) => {
                    const date = new Date(b.start_time).toLocaleDateString('en-IN', {
                      weekday: 'short',
                      day: 'numeric',
                      month: 'short',
                      year: 'numeric'
                    })
                    const startTime = new Date(b.start_time).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', hour12: true })
                    const endTime = new Date(b.end_time).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', hour12: true })
                    
                    const isUpdating = updatingId === b.id

                    return (
                      <motion.tr
                        key={b.id}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: i * 0.03 }}
                        className="border-b border-white/5 hover:bg-white/3 transition-colors"
                      >
                        <td className="py-4 px-5 font-semibold text-foreground">
                          {b.user?.full_name || 'Anonymous'}
                        </td>
                        <td className="py-4 px-5 text-muted-foreground">
                          {b.turf?.name || '—'}
                        </td>
                        <td className="py-4 px-5">
                          <p className="text-foreground font-medium">{date}</p>
                          <p className="text-xs text-muted-foreground">{startTime} - {endTime}</p>
                        </td>
                        <td className="py-4 px-5">
                          <p className="text-foreground font-bold">₹{b.total_amount}</p>
                          <p className="text-[10px] text-muted-foreground">Platform fee: ₹{b.commission_amount}</p>
                        </td>
                        <td className="py-4 px-5">
                          <div className="space-y-1">
                            <p className="text-xs text-primary font-semibold">
                              Online Paid: ₹{b.payment_type === 'advance' ? b.advance_amount : b.total_amount}
                            </p>
                            <p className="text-xs text-yellow-400 font-semibold">
                              Collect at Venue: ₹{b.payment_type === 'advance' ? b.balance_amount : 0}
                            </p>
                          </div>
                        </td>
                        <td className="py-4 px-5">
                          <Badge variant="outline" className={`text-xs capitalize ${statusColors[b.status] || ''}`}>
                            {b.status} {b.payment_type === 'advance' && '(Advance)'}
                          </Badge>
                        </td>
                        <td className="py-4 px-5 text-right">
                          {isUpdating ? (
                            <Loader2 className="w-5 h-5 animate-spin text-primary ml-auto" />
                          ) : (
                            <div className="flex gap-2 justify-end">
                              {b.status === 'pending' && (
                                <Button
                                  size="sm"
                                  onClick={() => handleUpdateStatus(b.id, 'confirmed')}
                                  className="bg-emerald-600 hover:bg-emerald-700 text-white h-8 px-2.5 rounded-lg flex items-center gap-1"
                                >
                                  <Check className="w-3.5 h-3.5" /> Confirm
                                </Button>
                              )}
                              {b.status !== 'cancelled' && (
                                <Button
                                  size="sm"
                                  variant="ghost"
                                  onClick={() => handleUpdateStatus(b.id, 'cancelled')}
                                  className="text-red-400 hover:text-red-300 hover:bg-red-500/10 h-8 px-2.5 rounded-lg flex items-center gap-1"
                                >
                                  <X className="w-3.5 h-3.5" /> Cancel
                                </Button>
                              )}
                              {b.status === 'cancelled' && (
                                <span className="text-xs text-muted-foreground">No Actions</span>
                              )}
                            </div>
                          )}
                        </td>
                      </motion.tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
