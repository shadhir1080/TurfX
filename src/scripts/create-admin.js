const { createClient } = require('@supabase/supabase-js');
const { Client } = require('pg');

const supabaseUrl = 'https://cryhojcfpzdtnnpamzwf.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImNyeWhvamNmcHpkdG5ucGFtendmIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Nzk0Mjk4NTksImV4cCI6MjA5NTAwNTg1OX0.tBLKggpgwCAf28lruWGHWrlticuGrAsgxHjUHQNbebo';
const connectionString = 'postgresql://postgres.cryhojcfpzdtnnpamzwf:6UcKzGB7fLniLE6U@aws-1-ap-northeast-1.pooler.supabase.com:6543/postgres';

const email = 'admin@turfx.com';
const password = 'Admin@TurfX2026';

async function run() {
  console.log(`[Admin Seeding] Initializing Supabase client and PG connection...`);
  const supabase = createClient(supabaseUrl, supabaseAnonKey);
  const pgClient = new Client({ connectionString });

  await pgClient.connect();

  try {
    // 1. Try to sign up the user via Supabase Auth
    console.log(`[Admin Seeding] Attempting to sign up ${email}...`);
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          role: 'admin',
          full_name: 'System Admin'
        }
      }
    });

    if (error) {
      console.log(`[Admin Seeding] Supabase Auth sign up note/error: ${error.message}`);
    } else {
      console.log(`[Admin Seeding] Supabase Auth user created successfully.`);
    }

    // 2. Run SQL to confirm email and set roles
    console.log(`[Admin Seeding] Confirming email and updating metadata in auth.users...`);
    const sql1 = `
      UPDATE auth.users 
      SET 
        email_confirmed_at = NOW(), 
        raw_user_meta_data = jsonb_set(COALESCE(raw_user_meta_data, '{}'::jsonb), '{role}', '"admin"'),
        raw_app_meta_data = jsonb_set(COALESCE(raw_app_meta_data, '{}'::jsonb), '{provider}', '"email"')
      WHERE email = $1;
    `;
    await pgClient.query(sql1, [email]);

    console.log(`[Admin Seeding] Creating/updating profile in public.profiles...`);
    const sql2 = `
      INSERT INTO public.profiles (id, role, full_name, created_at)
      SELECT id, 'admin', 'System Admin', NOW()
      FROM auth.users
      WHERE email = $1
      ON CONFLICT (id) DO UPDATE 
      SET role = 'admin', full_name = 'System Admin';
    `;
    await pgClient.query(sql2, [email]);
    console.log(`[Admin Seeding] PostgreSQL updates completed.`);

    // 3. Let's verify the user's role and metadata
    const verifyUser = await pgClient.query('SELECT id, email, raw_user_meta_data FROM auth.users WHERE email = $1', [email]);
    const verifyProfile = await pgClient.query('SELECT id, role, full_name FROM public.profiles WHERE id = $1', [verifyUser.rows[0]?.id]);

    console.log(`\nVerification Results:`);
    console.log(`Auth User:`, verifyUser.rows[0]);
    console.log(`Profile:`, verifyProfile.rows[0]);
    console.log(`\nSuccessfully created/updated Master Admin user:`);
    console.log(`- Email: ${email}`);
    console.log(`- Password: ${password}`);

  } catch (err) {
    console.error(`[Admin Seeding] Error occurred:`, err);
  } finally {
    await pgClient.end();
  }
}

run();
