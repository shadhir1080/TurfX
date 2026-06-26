import { NextResponse } from 'next/server'
import { Client } from 'pg'

const connectionString = 'postgresql://postgres.cryhojcfpzdtnnpamzwf:6UcKzGB7fLniLE6U@aws-1-ap-northeast-1.pooler.supabase.com:6543/postgres'

async function getClient() {
  const client = new Client({ connectionString })
  await client.connect()
  return client
}

// GET: Fetch all profiles joined with auth.users email
export async function GET() {
  const client = await getClient()
  try {
    const res = await client.query(`
      SELECT p.id, p.role, p.full_name, p.avatar_url, p.created_at, p.is_active, u.email 
      FROM public.profiles p
      LEFT JOIN auth.users u ON p.id = u.id
      ORDER BY p.created_at DESC
    `)
    return NextResponse.json({ success: true, data: res.rows })
  } catch (err: any) {
    console.error('Error fetching admin users:', err)
    return NextResponse.json({ success: false, error: err.message }, { status: 500 })
  } finally {
    await client.end()
  }
}

// POST: Add new user/owner
export async function POST(req: Request) {
  const client = await getClient()
  try {
    const body = await req.json()
    const { email, password, fullName, role } = body

    if (!email || !password || !fullName || !role) {
      return NextResponse.json({ success: false, error: 'Missing required fields' }, { status: 400 })
    }

    // Check if email already exists
    const checkEmail = await client.query('SELECT id FROM auth.users WHERE email = $1', [email])
    if (checkEmail.rows.length > 0) {
      return NextResponse.json({ success: false, error: 'Email already exists' }, { status: 400 })
    }

    // Insert user into auth.users (uses crypt to hash password)
    const userRes = await client.query(`
      INSERT INTO auth.users (id, instance_id, email, encrypted_password, email_confirmed_at, raw_user_meta_data, raw_app_meta_data, created_at, updated_at, role, is_super_admin)
      VALUES (
        gen_random_uuid(),
        '00000000-0000-0000-0000-000000000000',
        $1,
        crypt($2, gen_salt('bf')),
        NOW(),
        jsonb_build_object('role', $3::text, 'full_name', $4::text),
        '{"provider": "email", "providers": ["email"]}'::jsonb,
        NOW(),
        NOW(),
        'authenticated',
        false
      )
      RETURNING id
    `, [email, password, role, fullName])

    const userId = userRes.rows[0].id

    // Insert profile into public.profiles
    await client.query(`
      INSERT INTO public.profiles (id, role, full_name, is_active, email, created_at)
      VALUES ($1, $2, $3, true, $4, NOW())
    `, [userId, role, fullName, email])

    return NextResponse.json({ success: true, message: 'User created successfully', userId })
  } catch (err: any) {
    console.error('Error creating admin user:', err)
    return NextResponse.json({ success: false, error: err.message }, { status: 500 })
  } finally {
    await client.end()
  }
}

// PUT: Modify user details
export async function PUT(req: Request) {
  const client = await getClient()
  try {
    const body = await req.json()
    const { id, email, password, fullName, role, isActive } = body

    if (!id || !email || !fullName || !role) {
      return NextResponse.json({ success: false, error: 'Missing required fields' }, { status: 400 })
    }

    // 1. Update profiles table
    await client.query(`
      UPDATE public.profiles 
      SET full_name = $2, role = $3, is_active = $4, email = $5 
      WHERE id = $1
    `, [id, fullName, role, isActive, email])

    // 2. Update auth.users email and raw_user_meta_data
    if (password) {
      await client.query(`
        UPDATE auth.users 
        SET 
          email = $2,
          encrypted_password = crypt($3, gen_salt('bf')),
          raw_user_meta_data = jsonb_build_object('role', $4::text, 'full_name', $5::text),
          updated_at = NOW()
        WHERE id = $1
      `, [id, email, password, role, fullName])
    } else {
      await client.query(`
        UPDATE auth.users 
        SET 
          email = $2,
          raw_user_meta_data = jsonb_build_object('role', $3::text, 'full_name', $4::text),
          updated_at = NOW()
        WHERE id = $1
      `, [id, email, role, fullName])
    }

    return NextResponse.json({ success: true, message: 'User updated successfully' })
  } catch (err: any) {
    console.error('Error updating admin user:', err)
    return NextResponse.json({ success: false, error: err.message }, { status: 500 })
  } finally {
    await client.end()
  }
}

// DELETE: Delete user/owner cascadingly
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
      WHERE booking_id IN (
        SELECT id FROM public.bookings 
        WHERE user_id = $1 OR turf_id IN (SELECT id FROM public.turfs WHERE owner_id = $1)
      )
    `, [id])

    // Delete bookings
    await client.query(`
      DELETE FROM public.bookings 
      WHERE user_id = $1 OR turf_id IN (SELECT id FROM public.turfs WHERE owner_id = $1)
    `, [id])

    // Delete turfs
    await client.query(`
      DELETE FROM public.turfs 
      WHERE owner_id = $1
    `, [id])

    // Delete profile
    await client.query('DELETE FROM public.profiles WHERE id = $1', [id])

    // Delete auth user
    await client.query('DELETE FROM auth.users WHERE id = $1', [id])

    return NextResponse.json({ success: true, message: 'User deleted successfully' })
  } catch (err: any) {
    console.error('Error deleting admin user:', err)
    return NextResponse.json({ success: false, error: err.message }, { status: 500 })
  } finally {
    await client.end()
  }
}
