import { NextResponse } from 'next/server'
import { runQuery } from '@/lib/supabase/db'

const Razorpay = require('razorpay')

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { amount, bookingId, turfId, currency = 'INR' } = body

    const keyId = process.env.RAZORPAY_KEY_ID || ''
    const keySecret = process.env.RAZORPAY_KEY_SECRET || ''
    const isDemoMode = !keyId || keyId === 'your_razorpay_key_id' || !keySecret || keySecret === 'your_razorpay_key_secret'

    if (isDemoMode) {
      const mockOrderId = `mock_order_${Math.random().toString(36).substring(2, 11)}`
      
      // Insert initial payment record in DB bypassing RLS
      await runQuery(
        'INSERT INTO public.payments (booking_id, razorpay_order_id, status) VALUES ($1, $2, $3)',
        [bookingId, mockOrderId, 'created']
      )

      return NextResponse.json({ orderId: mockOrderId, amount, currency, isDemo: true, keyId: keyId || 'rzp_test_T5IWlvsFHy0oB' })
    }

    try {
      const razorpay = new Razorpay({
        key_id: keyId,
        key_secret: keySecret,
      })

      const order = await razorpay.orders.create({
        amount: amount * 100, // Razorpay expects paise
        currency,
        receipt: `booking_${bookingId}`,
        notes: {
          booking_id: bookingId,
          turf_id: turfId,
        },
      })

      // Insert initial payment record in DB bypassing RLS
      await runQuery(
        'INSERT INTO public.payments (booking_id, razorpay_order_id, status) VALUES ($1, $2, $3)',
        [bookingId, order.id, 'created']
      )

      return NextResponse.json({ orderId: order.id, amount, currency, isDemo: false, keyId })
    } catch (razorpayError: any) {
      throw razorpayError
    }
  } catch (error: any) {
    console.error('Razorpay order creation error:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
