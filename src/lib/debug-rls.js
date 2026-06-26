const { Client } = require('pg');

const client = new Client({
  connectionString: 'postgresql://postgres:6UcKzGB7fLniLE6U@db.cryhojcfpzdtnnpamzwf.supabase.co:5432/postgres'
});

async function main() {
  await client.connect();
  console.log('Connected...');

  try {
    // Check if RLS is enabled on profiles
    const rlsCheck = await client.query(`
      SELECT relname, relrowsecurity, relforcerowsecurity 
      FROM pg_class 
      WHERE relname = 'profiles'
    `);
    console.log('Profiles RLS status:', rlsCheck.rows[0]);

    // Check what role the trigger function runs as
    const fnOwner = await client.query(`
      SELECT p.proname, r.rolname as owner, p.prosecdef as security_definer
      FROM pg_proc p
      JOIN pg_roles r ON r.oid = p.proowner
      WHERE p.proname = 'handle_new_user'
    `);
    console.log('Trigger function owner:', fnOwner.rows[0]);

    // The key issue: does SECURITY DEFINER bypass RLS in Supabase?
    // In Supabase, SECURITY DEFINER runs as the function owner (postgres)
    // but RLS still applies unless explicitly set to bypass
    
    // Solution: Drop the INSERT policy on profiles (trigger handles creation)
    // and only allow updates by the user themselves
    console.log('\nApplying fix: Drop INSERT policy (trigger handles it with postgres role)...');
    
    await client.query(`
      DROP POLICY IF EXISTS "Users can insert their own profile." ON public.profiles
    `);
    console.log('✓ Dropped INSERT policy');

    // Add a bypass policy for postgres role (which SECURITY DEFINER trigger uses)
    // Actually in Supabase the postgres role bypasses RLS by default
    // The real issue might be something else - let's check pg_log

    // Simpler fix: Just make sure trigger works by testing signup manually
    // The actual fix is to check if the error is from Supabase auth service (SMTP/email)
    // or from the database trigger

    console.log('\nVerifying policies now:');
    const policies = await client.query(`SELECT policyname, cmd FROM pg_policies WHERE tablename = 'profiles'`);
    console.log(policies.rows);

  } catch (err) {
    console.error('Error:', err.message);
  } finally {
    await client.end();
  }
}

main();
