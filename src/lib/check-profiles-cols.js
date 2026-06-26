const { Client } = require('pg');

const client = new Client({
  connectionString: 'postgresql://postgres:6UcKzGB7fLniLE6U@db.cryhojcfpzdtnnpamzwf.supabase.co:5432/postgres'
});

async function main() {
  await client.connect();
  try {
    const fnRes = await client.query(`
      SELECT column_name, column_default, data_type 
      FROM information_schema.columns 
      WHERE table_name = 'profiles'
    `);
    console.log('Columns:', fnRes.rows);
  } catch (err) {
    console.error('Error:', err.message);
  } finally {
    await client.end();
  }
}
main();
