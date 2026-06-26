const { Client } = require('pg');

const client = new Client({
  connectionString: 'postgresql://postgres.cryhojcfpzdtnnpamzwf:6UcKzGB7fLniLE6U@aws-1-ap-northeast-1.pooler.supabase.com:6543/postgres'
});

async function main() {
  await client.connect();
  try {
    const fnRes = await client.query(`
      SELECT prosrc 
      FROM pg_proc 
      WHERE proname = 'handle_new_user'
    `);
    console.log('Function definition:', fnRes.rows[0].prosrc);
  } catch (err) {
    console.error('Error:', err.message);
  } finally {
    await client.end();
  }
}
main();
