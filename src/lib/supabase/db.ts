import { Client } from 'pg'

const connectionString = 'postgresql://postgres.cryhojcfpzdtnnpamzwf:6UcKzGB7fLniLE6U@aws-1-ap-northeast-1.pooler.supabase.com:6543/postgres'

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
