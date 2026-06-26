import { NextResponse } from 'next/server'
import { Client } from 'pg'

const connectionString = 'postgresql://postgres:6UcKzGB7fLniLE6U@db.cryhojcfpzdtnnpamzwf.supabase.co:5432/postgres'

async function getClient() {
  const client = new Client({ connectionString })
  await client.connect()
  return client
}

// GET: Fetch all turfs joined with owner profile details
export async function GET() {
  const client = await getClient()
  try {
    const res = await client.query(`
      SELECT t.*, p.full_name as owner_name 
      FROM public.turfs t
      LEFT JOIN public.profiles p ON t.owner_id = p.id
      ORDER BY t.created_at DESC
    `)
    return NextResponse.json({ success: true, data: res.rows })
  } catch (err: any) {
    console.error('Error fetching admin turfs:', err)
    return NextResponse.json({ success: false, error: err.message }, { status: 500 })
  } finally {
    await client.end()
  }
}

// POST: Add a new turf
export async function POST(req: Request) {
  const client = await getClient()
  try {
    const body = await req.json()
    const {
      name, description, ownerId, pricePerHour, sports, timings, amenities,
      images, isVerified, isPremium, is24Hours, location, coordinates
    } = body

    if (!name || pricePerHour == null) {
      return NextResponse.json({ success: false, error: 'Name and price per hour are required' }, { status: 400 })
    }

    const defaultLoc = location || { city: 'Coimbatore', address: '', area: '' }
    const defaultCoords = coordinates || { lat: 11.0168, lng: 76.9558 }
    const defaultImages = images || ['https://images.unsplash.com/photo-1574629810360-7efbbe195018?w=800&q=80']

    const res = await client.query(`
      INSERT INTO public.turfs (
        id, owner_id, name, description, location, coordinates, price_per_hour, images, 
        is_verified, is_premium, is_24hours, sports, timings, amenities, rating, review_count, is_active, created_at
      )
      VALUES (
        gen_random_uuid(), $1, $2, $3, $4::jsonb, $5::jsonb, $6, $7::text[], 
        $8, $9, $10, $11::text[], $12, $13::text[], 5.0, 0, true, NOW()
      )
      RETURNING id
    `, [
      ownerId || null, name, description || '', JSON.stringify(defaultLoc), JSON.stringify(defaultCoords),
      pricePerHour, defaultImages, isVerified || false, isPremium || false, is24Hours || false,
      sports || [], timings || '6 AM - 10 PM', amenities || []
    ])

    return NextResponse.json({ success: true, message: 'Turf created successfully', turfId: res.rows[0].id })
  } catch (err: any) {
    console.error('Error creating admin turf:', err)
    return NextResponse.json({ success: false, error: err.message }, { status: 500 })
  } finally {
    await client.end()
  }
}

// PUT: Modify turf details
export async function PUT(req: Request) {
  const client = await getClient()
  try {
    const body = await req.json()
    const {
      id, name, description, ownerId, pricePerHour, sports, timings, amenities,
      isVerified, isPremium, is24Hours, isActive, location, coordinates, images
    } = body

    if (!id || !name || pricePerHour == null) {
      return NextResponse.json({ success: false, error: 'ID, name, and price are required' }, { status: 400 })
    }

    const defaultLoc = location || { city: 'Coimbatore', address: '', area: '' }
    const defaultCoords = coordinates || { lat: 11.0168, lng: 76.9558 }
    const defaultImages = images || ['https://images.unsplash.com/photo-1574629810360-7efbbe195018?w=800&q=80']

    await client.query(`
      UPDATE public.turfs 
      SET 
        name = $2, 
        description = $3, 
        owner_id = $4, 
        price_per_hour = $5, 
        sports = $6::text[], 
        timings = $7, 
        amenities = $8::text[], 
        is_verified = $9, 
        is_premium = $10, 
        is_24hours = $11,
        is_active = $12, 
        location = $13::jsonb, 
        coordinates = $14::jsonb,
        images = $15::text[]
      WHERE id = $1
    `, [
      id, name, description || '', ownerId || null, pricePerHour, sports || [],
      timings || '6 AM - 10 PM', amenities || [], isVerified || false, isPremium || false,
      is24Hours || false, isActive ?? true, JSON.stringify(defaultLoc), JSON.stringify(defaultCoords),
      defaultImages
    ])

    return NextResponse.json({ success: true, message: 'Turf updated successfully' })
  } catch (err: any) {
    console.error('Error updating admin turf:', err)
    return NextResponse.json({ success: false, error: err.message }, { status: 500 })
  } finally {
    await client.end()
  }
}

// DELETE: Delete turf cascadingly
export async function DELETE(req: Request) {
  const client = await getClient()
  try {
    const { searchParams } = new URL(req.url)
    const id = searchParams.get('id')

    if (!id) {
      return NextResponse.json({ success: false, error: 'Missing ID parameter' }, { status: 400 })
    }

    // Delete bookings payments
    await client.query(`
      DELETE FROM public.payments 
      WHERE booking_id IN (SELECT id FROM public.bookings WHERE turf_id = $1)
    `, [id])

    // Delete bookings
    await client.query('DELETE FROM public.bookings WHERE turf_id = $1', [id])

    // Delete turf
    await client.query('DELETE FROM public.turfs WHERE id = $1', [id])

    return NextResponse.json({ success: true, message: 'Turf deleted successfully' })
  } catch (err: any) {
    console.error('Error deleting admin turf:', err)
    return NextResponse.json({ success: false, error: err.message }, { status: 500 })
  } finally {
    await client.end()
  }
}
