import { Client } from 'pg'

const connectionString = 'postgresql://postgres:6UcKzGB7fLniLE6U@db.cryhojcfpzdtnnpamzwf.supabase.co:5432/postgres'

export async function runQuery(queryText: string, params: any[] = []) {
  const client = new Client({ connectionString })
  await client.connect()
  try {
    const res = await client.query(queryText, params)
    return res
  } finally {
    await client.end()
  }
}
