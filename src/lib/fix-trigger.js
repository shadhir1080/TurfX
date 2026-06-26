const { Client } = require('pg');

const client = new Client({
  connectionString: 'postgresql://postgres.cryhojcfpzdtnnpamzwf:6UcKzGB7fLniLE6U@aws-1-ap-northeast-1.pooler.supabase.com:6543/postgres'
});

async function main() {
  await client.connect();
  console.log('Connected...');

  try {
    // Fix the trigger to handle role safely + use SECURITY DEFINER so it bypasses RLS
    console.log('Fixing handle_new_user trigger...');
    await client.query(`
      CREATE OR REPLACE FUNCTION public.handle_new_user() 
      RETURNS trigger AS $$
      DECLARE
        user_role_val user_role;
      BEGIN
        -- Safely determine role, defaulting to 'user'
        BEGIN
          user_role_val := (new.raw_user_meta_data->>'role')::user_role;
        EXCEPTION WHEN invalid_text_representation THEN
          user_role_val := 'user'::user_role;
        END;
        
        IF user_role_val IS NULL THEN
          user_role_val := 'user'::user_role;
        END IF;

        INSERT INTO public.profiles (id, full_name, avatar_url, role)
        VALUES (
          new.id, 
          COALESCE(new.raw_user_meta_data->>'full_name', ''),
          new.raw_user_meta_data->>'avatar_url',
          user_role_val
        );
        RETURN new;
      END;
      $$ LANGUAGE plpgsql SECURITY DEFINER;
    `);
    console.log('✓ Trigger fixed!');

    // Verify trigger is attached
    const triggerCheck = await client.query(`
      SELECT trigger_name FROM information_schema.triggers
      WHERE event_object_schema = 'auth' AND event_object_table = 'users'
    `);
    console.log('Triggers on auth.users:', triggerCheck.rows);

    // Verify profiles table RLS policies
    const policies = await client.query(`
      SELECT policyname, cmd FROM pg_policies WHERE tablename = 'profiles'
    `);
    console.log('Profile policies:', policies.rows);

  } catch (err) {
    console.error('Error:', err.message);
  } finally {
    await client.end();
  }
}

main();
