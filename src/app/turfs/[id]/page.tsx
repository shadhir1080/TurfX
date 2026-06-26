'use client'

import dynamic from 'next/dynamic'
import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Script from 'next/script'
import { supabase } from '@/lib/supabase/client'
import { useAuth } from '@/contexts/AuthContext'
import { Database } from '@/lib/supabase/database.types'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import Navbar from '@/components/layout/Navbar'
import {
  MapPin, Star, Clock, Zap, Moon, BadgeCheck,
  ExternalLink, ChevronLeft, Users, Calendar, ArrowRight,
  CreditCard, Smartphone, Landmark as BankIcon, Check, ShieldAlert, Loader2
} from 'lucide-react'
import { motion } from 'framer-motion'
import {
  getEffectivePrice, isWeekend, SLOTS, getDirectionsUrl,
  calculateBookingAmount
} from '@/lib/pricing'

// Dynamically import map to avoid SSR issues
const TurfMap = dynamic(() => import('@/components/map/TurfMap'), { ssr: false })

type Turf = Database['public']['Tables']['turfs']['Row']

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
    slots.push({ id, label })
  }
  return slots
}

export default function TurfDetailPage({ params }: { params: { id: string } }) {
  const [turf, setTurf] = useState<Turf | null>(null)
  const [loading, setLoading] = useState(true)
  const [selectedSlot, setSelectedSlot] = useState<string | null>(null)
  const [selectedDate, setSelectedDate] = useState<string>(
    new Date().toISOString().split('T')[0]
  )
  const [paymentType, setPaymentType] = useState<'full' | 'advance'>('full')
  const [bookingLoading, setBookingLoading] = useState(false)
  const [bookedSlots, setBookedSlots] = useState<string[]>([])
  const { user, profile } = useAuth()
  const router = useRouter()

  // Mock Razorpay States
  const [showMockRazorpay, setShowMockRazorpay] = useState(false)
  const [currentBookingId, setCurrentBookingId] = useState<string | null>(null)
  const [currentOrderId, setCurrentOrderId] = useState<string | null>(null)
  const [mockMethod, setMockMethod] = useState<'card' | 'upi' | 'netbanking'>('upi')
  const [mockProcessing, setMockProcessing] = useState(false)

  useEffect(() => {
    fetchTurf()
  }, [params.id])

  useEffect(() => {
    fetchBookedSlots()
  }, [params.id, selectedDate])

  const fetchBookedSlots = async () => {
    try {
      const startOfDay = `${selectedDate}T00:00:00.000`
      const endOfDay = `${selectedDate}T23:59:59.999`
      
      const { data, error } = await supabase
        .from('bookings')
        .select('start_time')
        .eq('turf_id', params.id)
        .neq('status', 'cancelled')
        .gte('start_time', startOfDay)
        .lte('start_time', endOfDay)

      if (error) {
        console.error('Error fetching booked slots:', error.message)
      } else {
        const booked = ((data as any[]) || []).map(b => {
          const date = new Date(b.start_time)
          const hrs = String(date.getHours()).padStart(2, '0')
          return `${hrs}:00`
        })
        setBookedSlots(booked)
      }
    } catch (e) {
      console.error('Error fetching booked slots:', e)
    }
  }

  const fetchTurf = async () => {
    setLoading(true)
    try {
      const { data, error } = await supabase.from('turfs').select('*').eq('id', params.id).single()
      if (error || !data) {
        setTurf(null)
      } else {
        setTurf(data)
      }
    } catch (err) {
      console.error('[TurfX Ultra] Error fetching turf details:', err)
      setTurf(null)
    }
    setLoading(false)
  }

  const location = turf?.location as { city?: string; address?: string; area?: string } | null
  const coordinates = turf?.coordinates as { lat?: number; lng?: number } | null
  const chosenDate = new Date(selectedDate + 'T12:00:00')
  const weekend = isWeekend(chosenDate)
  const effectivePrice = turf ? getEffectivePrice(turf.price_per_hour, chosenDate) : 0

  const commissionRate = turf ? (turf.custom_commission_rate ?? 10) : 10
  const platformFee = Math.round(effectivePrice * (commissionRate / 100))
  const totalAmount = effectivePrice + platformFee

  const advanceAmountVal = Math.round(effectivePrice * 0.3)
  const payNowAmount = paymentType === 'full' ? totalAmount : (advanceAmountVal + platformFee)
  const balanceDue = paymentType === 'full' ? 0 : (totalAmount - payNowAmount)

  const handleBook = async () => {
    if (!user) { router.push('/auth/login'); return }
    if (!selectedSlot || !turf) return
    setBookingLoading(true)

    const startHour = parseInt(selectedSlot.split(':')[0])
    const start = new Date(`${selectedDate}T${String(startHour).padStart(2, '0')}:00:00`)
    const end = new Date(start.getTime() + 60 * 60 * 1000)

    try {
      const { data: bookingData, error } = await (supabase.from('bookings') as any).insert({
        user_id: user.id,
        turf_id: turf.id,
        start_time: start.toISOString(),
        end_time: end.toISOString(),
        total_amount: totalAmount,
        commission_amount: platformFee,
        status: 'pending',
        payment_type: paymentType,
        advance_amount: paymentType === 'full' ? totalAmount : advanceAmountVal,
        balance_amount: balanceDue,
      }).select().single()

      if (error || !bookingData) {
        setBookingLoading(false)
        alert('Booking creation failed. Please try again.')
        return
      }

      // Call API to create Razorpay Order
      const orderRes = await fetch('/api/razorpay/create-order', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          amount: payNowAmount,
          bookingId: bookingData.id,
          turfId: turf.id,
        }),
      })

      const orderData = await orderRes.json()
      if (orderData.error) {
        setBookingLoading(false)
        alert(`Order creation failed: ${orderData.error}`)
        return
      }

      if (orderData.isDemo) {
        setCurrentBookingId(bookingData.id)
        setCurrentOrderId(orderData.orderId)
        setShowMockRazorpay(true)
        setBookingLoading(false)
        return
      }

      // Live/Test Razorpay Flow using the Checkout SDK
      const options: any = {
        key: process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID || 'rzp_test_T5IWlvsFHy0oB',
        amount: orderData.amount * 100, // in paise
        currency: orderData.currency || 'INR',
        name: 'Turf Booking',
        description: `Payment for ${turf.name}`,
        handler: async function (response: any) {
          try {
            const verifyRes = await fetch('/api/razorpay/verify-payment', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                razorpay_order_id: response.razorpay_order_id || orderData.orderId,
                razorpay_payment_id: response.razorpay_payment_id,
                razorpay_signature: response.razorpay_signature || 'mock_signature',
                bookingId: bookingData.id,
              }),
            })
            const verifyData = await verifyRes.json()
            if (verifyData.success) {
              router.push('/dashboard')
            } else {
              alert('Payment verification failed: ' + (verifyData.error || 'Unknown error'))
            }
          } catch (err: any) {
            console.error(err)
            alert('Error verifying payment: ' + err.message)
          } finally {
            setBookingLoading(false)
          }
        },
        prefill: {
          name: user?.email || '',
          email: user?.email || '',
        },
        theme: {
          color: '#10b981',
        },
        modal: {
          ondismiss: function () {
            setBookingLoading(false)
          },
        },
      }

      // ONLY include order_id if it is not in demo mode
      if (!orderData.isDemo) {
        options.order_id = orderData.orderId
      }

      if (typeof (window as any).Razorpay === 'undefined') {
        alert('Razorpay SDK failed to load. Please check your internet connection and refresh the page.')
        setBookingLoading(false)
        return
      }

      const rzp = new (window as any).Razorpay(options)
      rzp.open()
    } catch (err: any) {
      console.error(err)
      alert('An error occurred: ' + err.message)
      setBookingLoading(false)
    }
  }

  const handleMockPaymentSuccess = async () => {
    if (!currentBookingId) return
    setMockProcessing(true)
    try {
      const verifyRes = await fetch('/api/razorpay/verify-payment', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          razorpay_order_id: currentOrderId || 'mock_order_123',
          razorpay_payment_id: 'pay_mock_' + Math.random().toString(36).substring(2, 10),
          razorpay_signature: 'mock_signature',
          bookingId: currentBookingId,
        }),
      })
      const verifyData = await verifyRes.json()
      if (verifyData.success) {
        setShowMockRazorpay(false)
        router.push('/dashboard')
      } else {
        alert('Mock payment verification failed')
      }
    } catch (err: any) {
      alert('Error verifying mock payment: ' + err.message)
    } finally {
      setMockProcessing(false)
    }
  }

  const slots = generateHourlySlots(turf?.timings)

  if (loading) {
    return (
      <div className="min-h-screen bg-background">
        <Navbar />
        <div className="pt-24 max-w-5xl mx-auto px-4 space-y-6">
          <div className="shimmer h-80 rounded-2xl" />
          <div className="shimmer h-10 w-1/2 rounded" />
          <div className="shimmer h-6 w-1/3 rounded" />
        </div>
      </div>
    )
  }

  if (!turf) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Navbar />
        <div className="text-center">
          <p className="text-3xl mb-4">🏟️</p>
          <h2 className="text-xl font-bold text-foreground mb-2">Turf not found</h2>
          <Button onClick={() => router.push('/turfs')} className="bg-primary hover:bg-primary/90">Browse Turfs</Button>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      {/* Razorpay script */}
      <Script src="https://checkout.razorpay.com/v1/checkout.js" strategy="lazyOnload" />

      <div className="pt-20 pb-16 max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Back */}
        <button onClick={() => router.back()}
          className="flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground mb-6 mt-4 transition-colors">
          <ChevronLeft className="w-4 h-4" /> Back to Turfs
        </button>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Left — Main Info */}
          <div className="lg:col-span-2 space-y-6">
            {/* Hero Image */}
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
              className="relative h-72 sm:h-80 rounded-2xl overflow-hidden">
              {turf.images && turf.images.length > 0 ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={turf.images[0]} alt={turf.name} className="w-full h-full object-cover" />
              ) : (
                <div className="w-full h-full bg-gradient-to-br from-primary/20 to-emerald-900/30 flex items-center justify-center">
                  <span className="text-8xl opacity-30">⚽</span>
                </div>
              )}
              <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
              {/* Overlay badges */}
              <div className="absolute top-4 left-4 flex gap-2 flex-wrap">
                {turf.is_verified && (
                  <Badge className="bg-primary/90 text-primary-foreground gap-1">
                    <BadgeCheck className="w-3 h-3" /> Verified
                  </Badge>
                )}
                {turf.is_premium && (
                  <Badge className="bg-yellow-500/90 text-black font-bold gap-1">
                    <Zap className="w-3 h-3" /> Premium
                  </Badge>
                )}
                {turf.is_24hours && (
                  <Badge className="bg-blue-600/90 text-white gap-1">
                    <Moon className="w-3 h-3" /> Open All Night
                  </Badge>
                )}
              </div>
            </motion.div>

            {/* Name + Rating */}
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.1 }}>
              <div className="flex items-start justify-between gap-4 flex-wrap">
                <h1 className="text-3xl font-black text-foreground">{turf.name}</h1>
                <div className="flex items-center gap-2">
                  <Star className="w-5 h-5 fill-yellow-400 text-yellow-400" />
                  <span className="text-xl font-bold text-foreground">{turf.rating ?? '—'}</span>
                  {turf.review_count && (
                    <span className="text-sm text-muted-foreground">({turf.review_count} reviews)</span>
                  )}
                </div>
              </div>

              <div className="flex items-center gap-1 text-muted-foreground mt-2">
                <MapPin className="w-4 h-4 shrink-0" />
                <span className="text-sm">{location?.address || location?.area}, Coimbatore</span>
                {coordinates?.lat && coordinates?.lng && (
                  <a href={getDirectionsUrl(coordinates.lat, coordinates.lng, turf.name)}
                    target="_blank" rel="noopener noreferrer"
                    className="ml-2 inline-flex items-center gap-1 text-xs text-primary hover:underline font-medium">
                    Get Directions <ExternalLink className="w-3 h-3" />
                  </a>
                )}
              </div>

              <div className="flex items-center gap-1 text-muted-foreground mt-1">
                <Clock className="w-4 h-4 shrink-0" />
                <span className="text-sm">{turf.timings || '—'}</span>
              </div>
            </motion.div>

            {/* Sports */}
            {turf.sports && turf.sports.length > 0 && (
              <div>
                <h3 className="text-sm font-semibold text-foreground mb-2">Sports Available</h3>
                <div className="flex flex-wrap gap-2">
                  {turf.sports.map(s => (
                    <span key={s} className="px-3 py-1 rounded-full bg-primary/10 text-primary border border-primary/20 text-sm font-medium">
                      {s}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* Description */}
            {turf.description && (
              <div>
                <h3 className="text-sm font-semibold text-foreground mb-2">About this Turf</h3>
                <p className="text-sm text-muted-foreground leading-relaxed">{turf.description}</p>
              </div>
            )}

            {/* Amenities */}
            {turf.amenities && turf.amenities.length > 0 && (
              <div>
                <h3 className="text-sm font-semibold text-foreground mb-2">Amenities</h3>
                <div className="flex flex-wrap gap-2">
                  {turf.amenities.map(a => (
                    <span key={a} className="px-2.5 py-1 rounded-lg bg-white/5 border border-white/10 text-xs text-muted-foreground">
                      {a}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* Map */}
            {coordinates?.lat && coordinates?.lng && (
              <div>
                <h3 className="text-sm font-semibold text-foreground mb-3 flex items-center gap-2">
                  <MapPin className="w-4 h-4 text-primary" /> Location on Map
                </h3>
                <TurfMap
                  turfs={[{ id: turf.id, name: turf.name, lat: coordinates.lat, lng: coordinates.lng, price_per_hour: turf.price_per_hour, rating: turf.rating }]}
                  centerLat={coordinates.lat}
                  centerLng={coordinates.lng}
                  zoom={15}
                  height="320px"
                />
              </div>
            )}
          </div>

          {/* Right — Booking Panel */}
          <div className="lg:col-span-1">
            <div className="sticky top-24">
              <Card className="glass-dark border-white/10 shadow-2xl">
                <CardHeader className="pb-3">
                  <CardTitle className="text-base font-bold">Book a Slot</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {/* Pricing */}
                  <div className="bg-primary/10 border border-primary/20 rounded-xl p-4 space-y-1.5">
                    <div className="flex items-baseline gap-2 justify-between">
                      <span className="text-xs text-muted-foreground font-medium">Turf Rate</span>
                      <div className="flex items-baseline gap-1">
                        <span className="text-xl font-black text-foreground">
                          ₹{effectivePrice.toLocaleString('en-IN')}
                        </span>
                        <span className="text-muted-foreground text-xs">/hr</span>
                      </div>
                    </div>

                    <div className="flex items-baseline gap-2 justify-between text-xs border-t border-white/5 pt-1.5 text-muted-foreground">
                      <span>Platform Commission Fee</span>
                      <span>₹{platformFee.toLocaleString('en-IN')}</span>
                    </div>

                    <div className="flex items-baseline gap-2 justify-between text-sm font-bold border-t border-white/10 pt-1.5 text-foreground">
                      <span>Total Amount</span>
                      <span>₹{totalAmount.toLocaleString('en-IN')}</span>
                    </div>

                    {weekend ? (
                      <p className="text-[10px] text-yellow-400 mt-1 font-medium text-center">
                        ⚡ Weekend rate (+20%). Weekday: ₹{turf.price_per_hour.toLocaleString('en-IN')}/hr
                      </p>
                    ) : (
                      <p className="text-[10px] text-muted-foreground mt-1 text-center">
                        Weekend: ₹{Math.round(turf.price_per_hour * 1.2).toLocaleString('en-IN')}/hr
                      </p>
                    )}
                  </div>

                  {/* Date picker */}
                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider flex items-center gap-1">
                      <Calendar className="w-3.5 h-3.5" /> Select Date
                    </label>
                    <input
                      type="date"
                      value={selectedDate}
                      min={new Date().toISOString().split('T')[0]}
                      onChange={(e) => {
                        setSelectedDate(e.target.value)
                        setSelectedSlot(null) // Reset slot on date change
                      }}
                      className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm text-foreground focus:outline-none focus:border-primary"
                    />
                  </div>

                  {/* Hourly Slot picker */}
                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                      Select 1-Hour Slot
                    </label>
                    <div className="max-h-48 overflow-y-auto space-y-2 pr-1 custom-scrollbar">
                      {slots.length === 0 ? (
                        <p className="text-xs text-muted-foreground py-2">No slots available for this turf.</p>
                      ) : (
                        slots.map((slot) => {
                          const isBooked = bookedSlots.includes(slot.id)
                          return (
                            <button 
                              key={slot.id} 
                              disabled={isBooked}
                              onClick={() => setSelectedSlot(slot.id)}
                              className={`w-full flex items-center justify-between px-3 py-2 rounded-lg border text-xs transition-all ${
                                isBooked
                                  ? 'border-red-950/20 bg-red-950/10 text-red-400/60 cursor-not-allowed opacity-60'
                                  : selectedSlot === slot.id
                                    ? 'border-primary bg-primary/10 text-foreground font-bold'
                                    : 'border-white/10 bg-white/5 text-muted-foreground hover:border-white/20'
                              }`}
                            >
                              <span className="flex items-center gap-2">
                                <span>⏰</span>
                                <span className={isBooked ? 'line-through' : 'font-medium'}>{slot.label}</span>
                              </span>
                              {isBooked && (
                                <span className="text-[9px] bg-red-500/20 text-red-400 px-1.5 py-0.5 rounded uppercase font-bold tracking-wider">
                                  Unavailable
                                </span>
                              )}
                            </button>
                          )
                        })
                      )}
                    </div>
                  </div>

                  {/* Payment Type Selector */}
                  <div className="space-y-2 border-t border-white/10 pt-3">
                    <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider block">
                      Choose Payment Method
                    </label>
                    <div className="grid grid-cols-2 gap-2">
                      <button
                        type="button"
                        onClick={() => setPaymentType('full')}
                        className={`p-2.5 rounded-lg border text-center transition-all ${
                          paymentType === 'full'
                            ? 'border-primary bg-primary/10 text-foreground font-bold'
                            : 'border-white/10 bg-white/5 text-muted-foreground hover:border-white/20 text-xs'
                        }`}
                      >
                        <p className="text-xs">Whole Payment</p>
                        <p className="text-[10px] text-muted-foreground mt-0.5">₹{totalAmount}</p>
                      </button>

                      <button
                        type="button"
                        onClick={() => setPaymentType('advance')}
                        className={`p-2.5 rounded-lg border text-center transition-all ${
                          paymentType === 'advance'
                            ? 'border-primary bg-primary/10 text-foreground font-bold'
                            : 'border-white/10 bg-white/5 text-muted-foreground hover:border-white/20 text-xs'
                        }`}
                      >
                        <p className="text-xs">Advance Pay</p>
                        <p className="text-[10px] text-muted-foreground mt-0.5">₹{advanceAmountVal + platformFee}</p>
                      </button>
                    </div>
                  </div>

                  {/* Details Breakdown */}
                  <div className="bg-white/5 border border-white/10 rounded-lg p-3 space-y-1 text-xs text-muted-foreground">
                    <div className="flex justify-between">
                      <span>Amount Payable Now:</span>
                      <span className="text-foreground font-semibold">₹{payNowAmount}</span>
                    </div>
                    {paymentType === 'advance' && (
                      <div className="flex justify-between border-t border-white/5 pt-1 mt-1 text-[10px]">
                        <span>Pay remaining balance at Turf:</span>
                        <span className="text-yellow-400 font-semibold">₹{balanceDue}</span>
                      </div>
                    )}
                  </div>

                  {/* Book Button */}
                  <Button
                    onClick={handleBook}
                    disabled={!selectedSlot || bookingLoading}
                    className="w-full h-11 bg-primary hover:bg-primary/90 font-bold text-sm"
                  >
                    {bookingLoading ? 'Processing...' : (
                      <span className="flex items-center gap-2">
                        {paymentType === 'full' ? 'Pay & Book' : 'Pay Advance & Book'} <ArrowRight className="w-4 h-4" />
                      </span>
                    )}
                  </Button>
              {!user && (
                    <p className="text-center text-[11px] text-muted-foreground">
                      <button onClick={() => router.push('/auth/login')} className="text-primary underline">Sign in</button> to book this turf
                    </p>
                  )}

                  {/* Amenities quick view */}
                  <div className="pt-2 border-t border-white/10">
                    <div className="flex items-center gap-2 text-[10px] text-muted-foreground">
                      <Users className="w-3.5 h-3.5" />
                      <span>{turf.review_count?.toLocaleString('en-IN') ?? '—'} players have booked here</span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </div>

      {/* Mock Razorpay Checkout Modal */}
      {showMockRazorpay && (
        <div className="fixed inset-0 bg-black/80 z-55 flex items-center justify-center p-4 backdrop-blur-sm">
          <motion.div
            initial={{ scale: 0.95, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="bg-[#0f111a] border border-white/10 rounded-2xl w-full max-w-md overflow-hidden text-left shadow-2xl flex flex-col z-55"
          >
            {/* Header */}
            <div className="bg-[#171a26] p-5 border-b border-white/5 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-emerald-500/10 flex items-center justify-center border border-emerald-500/30">
                  <span className="text-emerald-400 font-black text-sm">R</span>
                </div>
                <div>
                  <span className="font-bold text-white text-sm flex items-center gap-1.5">
                    Razorpay <span className="text-[9px] bg-yellow-500/10 text-yellow-400 border border-yellow-500/20 px-1.5 py-0.5 rounded font-bold uppercase tracking-wider">Test Mode</span>
                  </span>
                  <p className="text-[10px] text-muted-foreground mt-0.5">Payment for {turf.name}</p>
                </div>
              </div>
              <div className="text-right">
                <p className="text-xs text-muted-foreground">Amount Payable</p>
                <p className="text-lg font-black text-emerald-400">₹{payNowAmount}</p>
              </div>
            </div>

            {/* Methods Tab */}
            <div className="flex border-b border-white/5 bg-[#12141f]">
              {[
                { id: 'upi' as const, label: 'UPI / QR', icon: Smartphone },
                { id: 'card' as const, label: 'Card', icon: CreditCard },
                { id: 'netbanking' as const, label: 'Netbanking', icon: BankIcon }
              ].map(t => (
                <button
                  key={t.id}
                  onClick={() => setMockMethod(t.id)}
                  className={`flex-1 py-3 px-2 text-xs font-semibold flex items-center justify-center gap-1.5 transition-all border-b-2 ${
                    mockMethod === t.id
                      ? 'border-emerald-500 text-emerald-400 bg-white/3'
                      : 'border-transparent text-muted-foreground hover:text-foreground hover:bg-white/1'
                  }`}
                >
                  <t.icon className="w-3.5 h-3.5" />
                  {t.label}
                </button>
              ))}
            </div>

            {/* Form Content */}
            <div className="p-6 space-y-4 bg-[#0f111a] flex-1">
              {mockMethod === 'upi' && (
                <div className="space-y-3">
                  <div className="space-y-1.5">
                    <Label htmlFor="mockUpi" className="text-xs text-muted-foreground">Enter UPI ID</Label>
                    <Input
                      id="mockUpi"
                      defaultValue="success@razorpay"
                      className="bg-white/5 border-white/10 text-foreground focus:border-emerald-500"
                      placeholder="e.g. success@razorpay"
                      disabled={mockProcessing}
                    />
                  </div>
                  <p className="text-[10px] text-muted-foreground">Use any UPI ID to simulate a successful payment instantly.</p>
                </div>
              )}

              {mockMethod === 'card' && (
                <div className="space-y-3">
                  <div className="space-y-1.5">
                    <Label htmlFor="mockCardNum" className="text-xs text-muted-foreground">Card Number</Label>
                    <Input
                      id="mockCardNum"
                      defaultValue="4111 1111 1111 1111"
                      className="bg-white/5 border-white/10 text-foreground focus:border-emerald-500"
                      placeholder="4111 1111 1111 1111"
                      disabled={mockProcessing}
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-1.5">
                      <Label htmlFor="mockCardExp" className="text-xs text-muted-foreground">Expiry (MM/YY)</Label>
                      <Input
                        id="mockCardExp"
                        defaultValue="12/30"
                        className="bg-white/5 border-white/10 text-foreground focus:border-emerald-500"
                        placeholder="12/30"
                        disabled={mockProcessing}
                      />
                    </div>
                    <div className="space-y-1.5">
                      <Label htmlFor="mockCardCvv" className="text-xs text-muted-foreground">CVV</Label>
                      <Input
                        id="mockCardCvv"
                        type="password"
                        defaultValue="123"
                        className="bg-white/5 border-white/10 text-foreground focus:border-emerald-500"
                        placeholder="123"
                        disabled={mockProcessing}
                      />
                    </div>
                  </div>
                </div>
              )}

              {mockMethod === 'netbanking' && (
                <div className="space-y-3">
                  <div className="space-y-1.5">
                    <Label className="text-xs text-muted-foreground">Select Bank</Label>
                    <select
                      className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm text-foreground focus:outline-none focus:border-emerald-500"
                      disabled={mockProcessing}
                    >
                      <option className="bg-[#0f111a]" value="sbi">State Bank of India</option>
                      <option className="bg-[#0f111a]" value="hdfc">HDFC Bank</option>
                      <option className="bg-[#0f111a]" value="icici">ICICI Bank</option>
                      <option className="bg-[#0f111a]" value="axis">Axis Bank</option>
                    </select>
                  </div>
                  <p className="text-[10px] text-muted-foreground">All listed banks will process the transaction successfully.</p>
                </div>
              )}
            </div>

            {/* Footer buttons */}
            <div className="p-4 border-t border-white/5 bg-[#12141f] flex gap-3">
              <Button
                variant="outline"
                disabled={mockProcessing}
                onClick={() => {
                  setShowMockRazorpay(false)
                  setBookingLoading(false)
                }}
                className="flex-1 border-white/10 text-muted-foreground hover:bg-white/5"
              >
                Cancel
              </Button>
              <Button
                onClick={handleMockPaymentSuccess}
                disabled={mockProcessing}
                className="flex-1 bg-emerald-600 hover:bg-emerald-700 text-white font-bold"
              >
                {mockProcessing ? (
                  <span className="flex items-center gap-1">
                    <Loader2 className="w-4 h-4 animate-spin" /> Processing...
                  </span>
                ) : (
                  `Pay ₹${payNowAmount}`
                )}
              </Button>
            </div>
          </motion.div>
        </div>
      )}
    </div>
  )
}
