const { Client } = require('pg');

const client = new Client({
  connectionString: 'postgresql://postgres:6UcKzGB7fLniLE6U@db.cryhojcfpzdtnnpamzwf.supabase.co:5432/postgres'
});

async function main() {
  await client.connect();
  console.log('Connected...');

  try {
    // 1. Check the exact function source
    const fn = await client.query(`SELECT prosrc FROM pg_proc WHERE proname = 'handle_new_user'`);
    console.log('\nCurrent trigger function:\n', fn.rows[0]?.prosrc);

    // 2. Check if user_role enum exists and its values
    const enumVals = await client.query(`
      SELECT enumlabel FROM pg_enum e
      JOIN pg_type t ON e.enumtypid = t.oid
      WHERE t.typname = 'user_role'
      ORDER BY enumsortorder
    `);
    console.log('\nuser_role enum values:', enumVals.rows.map(r => r.enumlabel));

    // 3. Try a direct INSERT into profiles to see what fails
    const testId = '00000000-0000-0000-0000-000000000001';
    try {
      await client.query(`
        INSERT INTO public.profiles (id, full_name, avatar_url, role)
        VALUES ($1, 'Test User', null, 'user'::user_role)
      `, [testId]);
      console.log('\n✓ Direct INSERT into profiles works!');
      await client.query(`DELETE FROM public.profiles WHERE id = $1`, [testId]);
    } catch (insertErr) {
      console.error('\n✗ Direct INSERT failed:', insertErr.message);
    }

    // 4. Check if auth schema is accessible
    const authCheck = await client.query(`SELECT COUNT(*) FROM auth.users`);
    console.log('\nauth.users count:', authCheck.rows[0].count);

  } catch (err) {
    console.error('Error:', err.message);
  } finally {
    await client.end();
  }
}

main();
