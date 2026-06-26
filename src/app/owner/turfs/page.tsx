'use client'

import { useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import Link from 'next/link'
import { useAuth } from '@/contexts/AuthContext'
import { supabase } from '@/lib/supabase/client'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { 
  Building2, Plus, Star, MapPin, CheckCircle, Clock, Zap, 
  Edit2, Calendar, ShieldAlert, Check, X, Loader2, Info
} from 'lucide-react'

// Helper to parse slots based on timing string
function generateHourlySlots(timings: string | null | undefined) {
  let startHour = 6
  let endHour = 22

  if (timings) {
    const tLower = timings.toLowerCase()
    if (tLower.includes('24 hours') || tLower.includes('24h')) {
      startHour = 0
      endHour = 24
    } else {
      const parts = timings.split('-')
      if (parts.length === 2) {
        const parseTime = (str: string) => {
          const s = str.trim().toLowerCase()
          let hour = parseInt(s)
          if (s.includes('pm') && hour !== 12) hour += 12
          if (s.includes('am') && hour === 12) hour = 0
          return hour
        }
        try {
          startHour = parseTime(parts[0])
          endHour = parseTime(parts[1])
          if (endHour === 0) endHour = 24
        } catch (e) {
          // fallback
        }
      }
    }
  }

  const slots = []
  for (let h = startHour; h < endHour; h++) {
    const displayHour = h % 12 === 0 ? 12 : h % 12
    const ampm = h >= 12 && h < 24 ? 'PM' : 'AM'
    
    let nextH = h + 1
    const nextDisplayHour = nextH % 12 === 0 ? 12 : nextH % 12
    const nextAmpm = nextH >= 12 && nextH < 24 ? 'PM' : (nextH >= 24 ? 'AM' : 'AM')

    const label = `${displayHour}:00 ${ampm} - ${nextDisplayHour}:00 ${nextAmpm}`
    const id = `${String(h).padStart(2, '0')}:00`
    slots.push({ id, label, hour: h })
  }
  return slots
}

export default function MyTurfsPage() {
  const { user } = useAuth()
  const [turfs, setTurfs] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  // Dialog Control
  const [editOpen, setEditOpen] = useState(false)
  const [blocksOpen, setBlocksOpen] = useState(false)
  const [selectedTurf, setSelectedTurf] = useState<any>(null)

  // Edit Form state
  const [formName, setFormName] = useState('')
  const [formDescription, setFormDescription] = useState('')
  const [formPrice, setFormPrice] = useState('')
  const [formTimings, setFormTimings] = useState('6 AM - 11 PM')
  const [formSportType, setFormSportType] = useState('football')
  const [formCity, setFormCity] = useState('')
  const [formAddress, setFormAddress] = useState('')
  const [actionLoading, setActionLoading] = useState(false)

  // Blocks Manager state
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0])
  const [bookings, setBookings] = useState<any[]>([])
  const [blockLoading, setBlockLoading] = useState(false)

  useEffect(() => {
    if (user?.id) {
      fetchTurfs()
    }
  }, [user?.id])

  useEffect(() => {
    if (blocksOpen && selectedTurf) {
      fetchBookingsForDate()
    }
  }, [selectedDate, selectedTurf, blocksOpen])

  const fetchTurfs = async () => {
    setLoading(true)
    try {
      const { data, error } = await supabase
        .from('turfs')
        .select('*')
        .eq('owner_id', user?.id || '')
        .order('created_at', { ascending: false })

      if (error) {
        console.error(error.message)
      } else {
        setTurfs(data || [])
      }
    } catch (err) {
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  const fetchBookingsForDate = async () => {
    if (!selectedTurf) return
    setBlockLoading(true)
    try {
      const startOfDay = `${selectedDate}T00:00:00.000`
      const endOfDay = `${selectedDate}T23:59:59.999`
      const { data, error } = await supabase
        .from('bookings')
        .select('*, user:profiles(full_name, email)')
        .eq('turf_id', selectedTurf.id)
        .neq('status', 'cancelled')
        .gte('start_time', startOfDay)
        .lte('start_time', endOfDay)

      if (error) {
        console.error('Error fetching bookings:', error.message)
      } else {
        setBookings(data || [])
      }
    } catch (err) {
      console.error(err)
    } finally {
      setBlockLoading(false)
    }
  }

  // Open Edit Modal
  const openEditModal = (turf: any) => {
    setSelectedTurf(turf)
    setFormName(turf.name || '')
    setFormDescription(turf.description || '')
    setFormPrice(turf.price_per_hour?.toString() || '')
    setFormTimings(turf.timings || '6 AM - 11 PM')
    
    const loc = turf.location as { city?: string; address?: string; sport_type?: string } | null
    setFormCity(loc?.city || '')
    setFormAddress(loc?.address || '')
    setFormSportType(loc?.sport_type || 'football')
    
    setEditOpen(true)
  }

  // Handle Edit Submit
  const handleEditSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!selectedTurf) return
    setActionLoading(true)

    try {
      const { error } = await (supabase.from('turfs') as any)
        .update({
          name: formName,
          description: formDescription,
          price_per_hour: parseFloat(formPrice),
          timings: formTimings,
          location: { city: formCity, address: formAddress, sport_type: formSportType }
        })
        .eq('id', selectedTurf.id)

      if (error) {
        alert('Error updating turf: ' + error.message)
      } else {
        setEditOpen(false)
        fetchTurfs()
      }
    } catch (err: any) {
      alert('Error updating turf: ' + err.message)
    } finally {
      setActionLoading(false)
    }
  }

  // Open Block Manager Modal
  const openBlocksModal = (turf: any) => {
    setSelectedTurf(turf)
    setSelectedDate(new Date().toISOString().split('T')[0])
    setBookings([])
    setBlocksOpen(true)
  }

  // Block a slot
  const handleBlockSlot = async (slotHour: number) => {
    if (!selectedTurf || !user) return
    setActionLoading(true)

    const start = new Date(`${selectedDate}T${String(slotHour).padStart(2, '0')}:00:00`)
    const end = new Date(start.getTime() + 60 * 60 * 1000)

    try {
      const { error } = await (supabase.from('bookings') as any)
        .insert({
          turf_id: selectedTurf.id,
          user_id: user.id, // Owner is blocking
          start_time: start.toISOString(),
          end_time: end.toISOString(),
          total_amount: 0,
          commission_amount: 0,
          status: 'confirmed',
          payment_type: 'blocked'
        })

      if (error) {
        alert('Failed to block slot: ' + error.message)
      } else {
        fetchBookingsForDate()
      }
    } catch (err: any) {
      alert('Error: ' + err.message)
    } finally {
      setActionLoading(false)
    }
  }

  // Unblock a slot
  const handleUnblockSlot = async (bookingId: string) => {
    setActionLoading(true)
    try {
      const { error } = await supabase
        .from('bookings')
        .delete()
        .eq('id', bookingId)

      if (error) {
        alert('Failed to unblock slot: ' + error.message)
      } else {
        fetchBookingsForDate()
      }
    } catch (err: any) {
      alert('Error: ' + err.message)
    } finally {
      setActionLoading(false)
    }
  }

  const slots = generateHourlySlots(selectedTurf?.timings)

  return (
    <div className="space-y-8">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-black text-foreground">My Turfs</h1>
          <p className="text-muted-foreground mt-1">Manage, update details, and control slot calendars for your sports arenas.</p>
        </div>
        <Link href="/owner/add-turf">
          <Button className="bg-primary hover:bg-primary/90 gap-2 font-semibold rounded-xl">
            <Plus className="w-4 h-4" /> Add New Turf
          </Button>
        </Link>
      </div>

      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="glass-dark rounded-2xl p-6 border border-white/10 shimmer h-80" />
          ))}
        </div>
      ) : turfs.length === 0 ? (
        <div className="glass-dark rounded-2xl p-12 border border-dashed border-white/20 text-center max-w-xl mx-auto mt-10">
          <div className="text-6xl mb-4">🏟️</div>
          <h3 className="text-xl font-bold text-foreground mb-2">No turfs listed yet</h3>
          <p className="text-muted-foreground mb-6">List your sports facility and start accepting bookings from players today!</p>
          <Link href="/owner/add-turf">
            <Button className="bg-primary hover:bg-primary/90 font-semibold rounded-xl">List Your First Turf</Button>
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
          {turfs.map((turf, i) => {
            const location = turf.location as { city?: string; address?: string; sport_type?: string } | null
            return (
              <motion.div
                key={turf.id}
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.05 }}
              >
                <Card className="glass-dark border-white/10 overflow-hidden flex flex-col h-full card-hover">
                  {/* Image/Header Section */}
                  <div className="relative h-44 bg-gradient-to-br from-primary/10 to-emerald-950/20 overflow-hidden shrink-0">
                    {turf.images && turf.images.length > 0 ? (
                      <img
                        src={turf.images[0]}
                        alt={turf.name}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center bg-white/5">
                        <Building2 className="w-12 h-12 text-muted-foreground" />
                      </div>
                    )}
                    <div className="absolute top-3 left-3 flex flex-col gap-1.5">
                      {turf.is_verified ? (
                        <Badge className="bg-emerald-500/90 text-black text-xs font-bold gap-1 w-fit">
                          <CheckCircle className="w-3 h-3" /> Verified
                        </Badge>
                      ) : (
                        <Badge className="bg-yellow-500/90 text-black text-xs font-bold gap-1 w-fit">
                          Pending Verification
                        </Badge>
                      )}
                      {turf.is_premium && (
                        <Badge className="bg-primary text-primary-foreground text-xs font-bold gap-1 w-fit">
                          <Zap className="w-3 h-3" /> Premium
                        </Badge>
                      )}
                    </div>
                    <div className="absolute bottom-3 right-3 bg-black/60 backdrop-blur-sm px-2.5 py-1 rounded-lg text-sm font-bold text-white">
                      ₹{turf.price_per_hour}/hr
                    </div>
                  </div>

                  {/* Body Content */}
                  <CardContent className="p-5 flex-1 flex flex-col justify-between">
                    <div>
                      <div className="flex items-start justify-between gap-2 mb-2">
                        <h3 className="font-bold text-lg text-foreground line-clamp-1">{turf.name}</h3>
                        <div className="flex items-center gap-1 shrink-0">
                          <Star className="w-3.5 h-3.5 fill-yellow-400 text-yellow-400" />
                          <span className="text-xs font-bold text-foreground">{turf.rating ?? '—'}</span>
                        </div>
                      </div>

                      {location && (
                        <p className="text-xs text-muted-foreground flex items-center gap-1 mb-3">
                          <MapPin className="w-3 h-3 text-primary shrink-0" />
                          <span className="truncate">{location.address || location.city}</span>
                        </p>
                      )}

                      <p className="text-xs text-muted-foreground line-clamp-2 mb-4">
                        {turf.description || 'No description provided.'}
                      </p>
                    </div>

                    <div className="pt-4 border-t border-white/5 space-y-4">
                      <div className="flex items-center justify-between text-xs text-muted-foreground">
                        <div className="flex items-center gap-1">
                          <Clock className="w-3.5 h-3.5" />
                          <span>{turf.timings || 'Flexible Hours'}</span>
                        </div>
                        {location?.sport_type && (
                          <Badge variant="outline" className="border-white/10 text-muted-foreground text-[10px] capitalize">
                            {location.sport_type}
                          </Badge>
                        )}
                      </div>

                      <div className="grid grid-cols-2 gap-2 pt-1">
                        <Button size="sm" variant="outline" onClick={() => openEditModal(turf)}
                          className="border-white/10 hover:bg-white/5 text-xs rounded-lg gap-1.5">
                          <Edit2 className="w-3 h-3" /> Edit Details
                        </Button>
                        <Button size="sm" onClick={() => openBlocksModal(turf)}
                          className="bg-primary hover:bg-primary/90 text-primary-foreground text-xs font-semibold rounded-lg gap-1.5">
                          <Calendar className="w-3 h-3" /> Slots & Blocks
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            )
          })}
        </div>
      )}

      {/* Edit Details Dialog */}
      <Dialog open={editOpen} onOpenChange={setEditOpen}>
        <DialogContent className="glass-dark border-white/10 max-w-md text-foreground rounded-2xl max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-lg font-bold">
              <Edit2 className="w-5 h-5 text-primary" /> Edit Turf Details
            </DialogTitle>
          </DialogHeader>
          <form onSubmit={handleEditSubmit} className="space-y-4 pt-2">
            <div className="space-y-1.5">
              <Label className="text-xs">Turf Name *</Label>
              <Input value={formName} onChange={(e) => setFormName(e.target.value)} required className="bg-white/5 border-white/10 rounded-xl" />
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs">Description</Label>
              <textarea value={formDescription} onChange={(e) => setFormDescription(e.target.value)}
                className="w-full min-h-[80px] p-2.5 bg-white/5 border border-white/10 focus:border-primary focus:ring-1 focus:ring-primary rounded-xl text-sm" />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label className="text-xs">Price Per Hour (₹) *</Label>
                <Input type="number" min="1" value={formPrice} onChange={(e) => setFormPrice(e.target.value)} required className="bg-white/5 border-white/10 rounded-xl" />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs">Operating Hours (Timings) *</Label>
                <Input value={formTimings} onChange={(e) => setFormTimings(e.target.value)} placeholder="e.g. 6 AM - 11 PM" required className="bg-white/5 border-white/10 rounded-xl" />
              </div>
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs">Sport Type</Label>
              <Select value={formSportType} onValueChange={(val) => setFormSportType(val || '')}>
                <SelectTrigger className="bg-white/5 border-white/10 rounded-xl">
                  <SelectValue placeholder="Select sport type" />
                </SelectTrigger>
                <SelectContent className="bg-slate-900 border-white/10 text-white rounded-xl">
                  {['Football', 'Cricket', 'Badminton', 'Basketball', 'Tennis', 'Multi-sport'].map(s => (
                    <SelectItem key={s} value={s.toLowerCase()}>{s}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label className="text-xs">City *</Label>
                <Input value={formCity} onChange={(e) => setFormCity(e.target.value)} required className="bg-white/5 border-white/10 rounded-xl" />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs">Full Address</Label>
                <Input value={formAddress} onChange={(e) => setFormAddress(e.target.value)} className="bg-white/5 border-white/10 rounded-xl" />
              </div>
            </div>

            <div className="flex gap-3 pt-2">
              <Button type="button" variant="outline" onClick={() => setEditOpen(false)} className="flex-1 border-white/10 rounded-xl">Cancel</Button>
              <Button type="submit" disabled={actionLoading} className="flex-1 bg-primary hover:bg-primary/90 font-bold rounded-xl">
                {actionLoading ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Saving...</> : 'Save Changes'}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      {/* Slots & Blocks Dialog */}
      <Dialog open={blocksOpen} onOpenChange={setBlocksOpen}>
        <DialogContent className="glass-dark border-white/10 max-w-lg text-foreground rounded-2xl max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-lg font-bold">
              <Calendar className="w-5 h-5 text-primary" /> Slots & Blockings Controller
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-4 pt-2">
            <div className="flex flex-col sm:flex-row gap-3 items-start sm:items-center justify-between">
              <div className="space-y-1 w-full sm:w-auto">
                <Label className="text-xs">Target Date</Label>
                <input
                  type="date"
                  value={selectedDate}
                  min={new Date().toISOString().split('T')[0]}
                  onChange={(e) => setSelectedDate(e.target.value)}
                  className="w-full sm:w-44 bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-xs text-foreground focus:outline-none focus:border-primary"
                />
              </div>
              <div className="text-right text-xs text-muted-foreground">
                Venue timings: <strong className="text-white">{selectedTurf?.timings || '6 AM - 10 PM'}</strong>
              </div>
            </div>

            <p className="text-xs text-muted-foreground leading-relaxed flex gap-1.5 items-start bg-blue-500/10 border border-blue-500/20 p-2.5 rounded-xl text-blue-400">
              <Info className="w-4 h-4 shrink-0 mt-0.5" />
              <span>
                To close the turf for maintenance, holiday, or private games, block the desired hour slots. Booked slots cannot be overridden here.
              </span>
            </p>

            {/* Slots Grid */}
            <div className="space-y-2 border-t border-white/5 pt-4 max-h-[45vh] overflow-y-auto pr-1 custom-scrollbar">
              {blockLoading ? (
                <div className="space-y-2 py-4">
                  {[...Array(4)].map((_, i) => <div key={i} className="shimmer h-12 rounded-xl" />)}
                </div>
              ) : slots.length === 0 ? (
                <p className="text-xs text-muted-foreground text-center py-6">No hours generated for timings range.</p>
              ) : (
                slots.map(slot => {
                  // Find if there is an existing booking matching this start time hour
                  const matchedBooking = bookings.find(b => {
                    const start = new Date(b.start_time)
                    return start.getHours() === slot.hour
                  })

                  const isBlocked = matchedBooking && matchedBooking.payment_type === 'blocked'
                  const isPlayerBooked = matchedBooking && matchedBooking.payment_type !== 'blocked'

                  return (
                    <div key={slot.id} className="flex items-center justify-between p-3 rounded-xl border border-white/5 bg-white/3 text-xs">
                      <div>
                        <div className="font-semibold text-white flex items-center gap-1.5">
                          <span>⏰</span>
                          {slot.label}
                        </div>
                        {isPlayerBooked && (
                          <div className="text-[10px] text-yellow-400 mt-0.5">
                            👤 Booked by: <span className="font-medium text-white">{matchedBooking.user?.full_name || 'Player'}</span> ({matchedBooking.user?.email || 'No email'})
                          </div>
                        )}
                        {isBlocked && (
                          <div className="text-[10px] text-red-400 mt-0.5">
                            🚫 Closed by Owner / Maintenance
                          </div>
                        )}
                        {!matchedBooking && (
                          <div className="text-[10px] text-emerald-400 mt-0.5">
                            🟢 Available for Booking
                          </div>
                        )}
                      </div>

                      <div>
                        {isPlayerBooked ? (
                          <Badge variant="outline" className="border-yellow-500/30 text-yellow-400 text-[10px] uppercase font-bold py-1 px-2.5">
                            Player Booked
                          </Badge>
                        ) : isBlocked ? (
                          <Button size="sm" variant="ghost" disabled={actionLoading} onClick={() => handleUnblockSlot(matchedBooking.id)}
                            className="text-xs h-8 text-emerald-400 hover:text-emerald-300 hover:bg-emerald-500/10 rounded-lg gap-1">
                            <Check className="w-3.5 h-3.5" /> Unblock
                          </Button>
                        ) : (
                          <Button size="sm" variant="ghost" disabled={actionLoading} onClick={() => handleBlockSlot(slot.hour)}
                            className="text-xs h-8 text-red-400 hover:text-red-300 hover:bg-red-500/10 rounded-lg gap-1">
                            <X className="w-3.5 h-3.5" /> Block Slot
                          </Button>
                        )}
                      </div>
                    </div>
                  )
                })
              )}
            </div>

            <div className="flex justify-end pt-2 border-t border-white/10">
              <Button onClick={() => setBlocksOpen(false)} className="bg-white/5 border border-white/10 hover:bg-white/10 text-white rounded-xl px-6">
                Close Calendar
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
