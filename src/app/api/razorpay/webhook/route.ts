import { NextResponse } from 'next/server'
import crypto from 'crypto'
import { runQuery } from '@/lib/supabase/db'

export async function POST(request: Request) {
  try {
    const signature = request.headers.get('x-razorpay-signature') || ''
    const rawBody = await request.text()

    const webhookSecret = process.env.RAZORPAY_WEBHOOK_SECRET

    if (!webhookSecret) {
      console.error('Webhook Secret is not configured in environment variables.')
      return NextResponse.json({ error: 'Webhook configuration error' }, { status: 500 })
    }

    // Verify signature to prevent spoofing
    const expectedSignature = crypto
      .createHmac('sha256', webhookSecret)
      .update(rawBody)
      .digest('hex')

    if (expectedSignature !== signature) {
      console.warn('Webhook warning: Invalid signature received.')
      return NextResponse.json({ error: 'Invalid signature' }, { status: 400 })
    }

    const payload = JSON.parse(rawBody)
    const event = payload.event

    console.log(`Razorpay Webhook Event Received: ${event}`)

    if (event === 'payment.captured') {
      const payment = payload.payload.payment.entity
      const orderId = payment.order_id
      const paymentId = payment.id

      if (!orderId) {
        return NextResponse.json({ success: true, message: 'No order ID associated with this payment' })
      }

      // Update payment record
      const paymentUpdate = await runQuery(
        'UPDATE public.payments SET razorpay_payment_id = $1, status = $2 WHERE razorpay_order_id = $3 RETURNING booking_id',
        [paymentId, 'captured', orderId]
      )

      if (paymentUpdate.rows && paymentUpdate.rows.length > 0) {
        const bookingId = paymentUpdate.rows[0].booking_id
        
        // Update booking status
        await runQuery(
          'UPDATE public.bookings SET status = $1 WHERE id = $2',
          ['confirmed', bookingId]
        )
        console.log(`Webhook Success: Booking ${bookingId} confirmed via order ${orderId}`)
      } else {
        console.warn(`Webhook note: No payment row found for order ${orderId} in database.`)
      }
    } 
    
    else if (event === 'payment.failed') {
      const payment = payload.payload.payment.entity
      const orderId = payment.order_id
      const paymentId = payment.id

      if (!orderId) {
        return NextResponse.json({ success: true, message: 'No order ID associated with this payment' })
      }

      // Update payment record to failed
      const paymentUpdate = await runQuery(
        'UPDATE public.payments SET razorpay_payment_id = $1, status = $2 WHERE razorpay_order_id = $3 RETURNING booking_id',
        [paymentId, 'failed', orderId]
      )

      if (paymentUpdate.rows && paymentUpdate.rows.length > 0) {
        const bookingId = paymentUpdate.rows[0].booking_id
        
        // Cancel the booking to release the slot
        await runQuery(
          'UPDATE public.bookings SET status = $1 WHERE id = $2',
          ['cancelled', bookingId]
        )
        console.log(`Webhook Fail: Booking ${bookingId} cancelled via order ${orderId}`)
      }
    }

    return NextResponse.json({ success: true })
  } catch (error: any) {
    console.error('Razorpay Webhook execution error:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
