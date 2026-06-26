const { Client } = require('pg');

const client = new Client({
  connectionString: 'postgresql://postgres.cryhojcfpzdtnnpamzwf:6UcKzGB7fLniLE6U@aws-1-ap-northeast-1.pooler.supabase.com:6543/postgres'
});

async function main() {
  await client.connect();
  try {
    const tableRes = await client.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public'
    `);
    console.log('Tables in public schema:', tableRes.rows.map(r => r.table_name).join(', '));

    const triggerRes = await client.query(`
      SELECT event_object_schema as table_schema,
             event_object_table as table_name,
             trigger_name,
             event_manipulation as event,
             action_statement as definition
      FROM information_schema.triggers
      WHERE event_object_schema IN ('public', 'auth')
    `);
    console.log('Triggers:', triggerRes.rows);
  } catch (err) {
    console.error('Error:', err.message);
  } finally {
    await client.end();
  }
}
main();
