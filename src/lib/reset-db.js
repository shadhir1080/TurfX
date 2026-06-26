const { Client } = require('pg');

const client = new Client({
  connectionString: 'postgresql://postgres.cryhojcfpzdtnnpamzwf:6UcKzGB7fLniLE6U@aws-1-ap-northeast-1.pooler.supabase.com:6543/postgres'
});

async function main() {
  await client.connect();
  console.log('Connected to database...');

  try {
    // ============================
    // STEP 1: Clear all data
    // ============================
    console.log('\n🗑️  Clearing all data...');
    await client.query(`DELETE FROM public.payments`);
    console.log('  ✓ payments cleared');
    await client.query(`DELETE FROM public.bookings`);
    console.log('  ✓ bookings cleared');
    await client.query(`DELETE FROM public.turfs`);
    console.log('  ✓ turfs cleared');
    await client.query(`DELETE FROM public.profiles`);
    console.log('  ✓ profiles cleared');

    // Also delete auth users
    await client.query(`DELETE FROM auth.users`);
    console.log('  ✓ auth.users cleared');

    // ============================
    // STEP 2: Fix handle_new_user trigger to save role
    // ============================
    console.log('\n🔧 Fixing handle_new_user trigger...');
    await client.query(`
      CREATE OR REPLACE FUNCTION public.handle_new_user() 
      RETURNS trigger AS $$
      BEGIN
        INSERT INTO public.profiles (id, full_name, avatar_url, role)
        VALUES (
          new.id, 
          new.raw_user_meta_data->>'full_name', 
          new.raw_user_meta_data->>'avatar_url',
          COALESCE(new.raw_user_meta_data->>'role', 'user')::user_role
        );
        RETURN new;
      END;
      $$ LANGUAGE plpgsql SECURITY DEFINER;
    `);
    console.log('  ✓ handle_new_user trigger fixed (now saves role)');

    // ============================
    // STEP 3: Verify
    // ============================
    const profileCount = await client.query('SELECT COUNT(*) FROM public.profiles');
    const turfCount = await client.query('SELECT COUNT(*) FROM public.turfs');
    const bookingCount = await client.query('SELECT COUNT(*) FROM public.bookings');
    const authCount = await client.query('SELECT COUNT(*) FROM auth.users');

    console.log('\n✅ Fresh DB state:');
    console.log(`  profiles: ${profileCount.rows[0].count}`);
    console.log(`  turfs: ${turfCount.rows[0].count}`);
    console.log(`  bookings: ${bookingCount.rows[0].count}`);
    console.log(`  auth.users: ${authCount.rows[0].count}`);
    console.log('\n🎉 Database is clean and ready for real users!');

  } catch (err) {
    console.error('Error:', err.message);
  } finally {
    await client.end();
  }
}

main();
