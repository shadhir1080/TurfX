import { NextResponse } from 'next/server'
import { Client } from 'pg'

const connectionString = 'postgresql://postgres:6UcKzGB7fLniLE6U@db.cryhojcfpzdtnnpamzwf.supabase.co:5432/postgres'

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url)
    const email = searchParams.get('email')

    if (!email) {
      return NextResponse.json({ success: true, exists: false })
    }

    const client = new Client({ connectionString })
    await client.connect()

    try {
      const res = await client.query('SELECT id FROM auth.users WHERE LOWER(email) = LOWER($1)', [email.trim()])
      const exists = res.rows.length > 0
      return NextResponse.json({ success: true, exists })
    } catch (err: any) {
      console.error('Error checking duplicate email:', err)
      return NextResponse.json({ success: false, error: err.message }, { status: 500 })
    } finally {
      await client.end()
    }
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 })
  }
}
