import { NextResponse } from 'next/server'
import crypto from 'crypto'
import { runQuery } from '@/lib/supabase/db'

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { razorpay_order_id, razorpay_payment_id, razorpay_signature, bookingId } = body

    const isDemoMode = razorpay_order_id?.startsWith('mock_') || razorpay_signature === 'mock_signature'

    if (!isDemoMode) {
      // Verify signature
      const expectedSignature = crypto
        .createHmac('sha256', process.env.RAZORPAY_KEY_SECRET!)
        .update(`${razorpay_order_id}|${razorpay_payment_id}`)
        .digest('hex')

      if (expectedSignature !== razorpay_signature) {
        return NextResponse.json({ error: 'Invalid payment signature' }, { status: 400 })
      }
    }

    // Update payment record in DB bypassing RLS
    await runQuery(
      'UPDATE public.payments SET razorpay_payment_id = $1, status = $2 WHERE razorpay_order_id = $3',
      [razorpay_payment_id, 'captured', razorpay_order_id]
    )

    // Update booking status to confirmed in DB bypassing RLS
    await runQuery(
      'UPDATE public.bookings SET status = $1 WHERE id = $2',
      ['confirmed', bookingId]
    )

    return NextResponse.json({ success: true })
  } catch (error: any) {
    console.error('Payment verification error:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
