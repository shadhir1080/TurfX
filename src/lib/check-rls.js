const { Client } = require('pg');

const client = new Client({
  connectionString: 'postgresql://postgres:6UcKzGB7fLniLE6U@db.cryhojcfpzdtnnpamzwf.supabase.co:5432/postgres'
});

async function main() {
  await client.connect();
  try {
    const rlsRes = await client.query(`
      SELECT tablename, policyname, permissive, roles, cmd, qual, with_check 
      FROM pg_policies 
      WHERE tablename = 'profiles'
    `);
    console.log('Policies:', rlsRes.rows);
  } catch (err) {
    console.error('Error:', err.message);
  } finally {
    await client.end();
  }
}
main();
