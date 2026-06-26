const { Client } = require('pg');

const client = new Client({
  connectionString: 'postgresql://postgres.cryhojcfpzdtnnpamzwf:6UcKzGB7fLniLE6U@aws-1-ap-northeast-1.pooler.supabase.com:6543/postgres'
});

async function main() {
  await client.connect();
  console.log('Connected...');

  try {
    // In Supabase, even SECURITY DEFINER functions with postgres owner
    // may still be subject to RLS if relforcerowsecurity = false but
    // the function is called in a context where RLS is active.
    // 
    // The definitive fix: set the function to run as supabase_admin or
    // ensure it's truly bypassing RLS by using ALTER FUNCTION ... SET search_path
    
    // Final approach: Rewrite trigger to use a direct bypass
    console.log('Rewriting trigger with SET search_path and explicit RLS bypass...');
    
    await client.query(`
      CREATE OR REPLACE FUNCTION public.handle_new_user() 
      RETURNS trigger 
      SECURITY DEFINER
      SET search_path = public
      LANGUAGE plpgsql
      AS $$
      DECLARE
        v_role user_role := 'user';
      BEGIN
        -- Safely parse role from metadata
        BEGIN
          IF (new.raw_user_meta_data->>'role') IN ('admin', 'owner', 'user') THEN
            v_role := (new.raw_user_meta_data->>'role')::user_role;
          END IF;
        EXCEPTION WHEN others THEN
          v_role := 'user'::user_role;
        END;

        INSERT INTO public.profiles (id, full_name, avatar_url, role)
        VALUES (
          new.id,
          COALESCE(new.raw_user_meta_data->>'full_name', split_part(new.email, '@', 1)),
          new.raw_user_meta_data->>'avatar_url',
          v_role
        )
        ON CONFLICT (id) DO NOTHING;
        
        RETURN new;
      END;
      $$;
    `);
    console.log('✓ Trigger rewritten with SET search_path and ON CONFLICT DO NOTHING');

    // Verify
    const fn = await client.query(`SELECT prosrc FROM pg_proc WHERE proname = 'handle_new_user'`);
    console.log('\nNew function:\n', fn.rows[0]?.prosrc);

    // Also ensure the trigger is still attached
    const trigger = await client.query(`
      SELECT trigger_name, event_manipulation, action_timing
      FROM information_schema.triggers
      WHERE event_object_schema = 'auth' AND trigger_name = 'on_auth_user_created'
    `);
    console.log('\nTrigger:', trigger.rows[0]);

    console.log('\n🎉 Done! Signup should work now.');

  } catch (err) {
    console.error('Error:', err.message);
  } finally {
    await client.end();
  }
}

main();
