const { Client } = require('pg');
const { createClient } = require('@supabase/supabase-js');

const pgClient = new Client({
  connectionString: 'postgresql://postgres:AAmanohar1.60@db.sqbrczfojykfhfugbisr.supabase.co:5432/postgres'
});

async function main() {
  await pgClient.connect();
  const res = await pgClient.query("SELECT id, email, confirmed_at, created_at FROM auth.users WHERE email ILIKE '%temp@manohar.com%'");
  console.log('User in auth.users:', res.rows);

  const roleRes = await pgClient.query("SELECT * FROM public.admin_roles WHERE email ILIKE '%temp@manohar.com%'");
  console.log('Role in admin_roles:', roleRes.rows);

  // Test sign in via Supabase client with Temp123 and TempPassword123!
  const supaUrl = "https://sqbrczfojykfhfugbisr.supabase.co";
  const supaKey = "sb_publishable_2sr3UUxFtn5ypkr8tCHWpA_Oxr6FMdl";
  const supabase = createClient(supaUrl, supaKey, { auth: { persistSession: false } });

  console.log('Testing signIn with Temp123...');
  const { data: d1, error: e1 } = await supabase.auth.signInWithPassword({
    email: 'temp@manohar.com',
    password: 'Temp123'
  });
  if (e1) {
    console.log('Temp123 sign in failed:', e1.message);
  } else {
    console.log('Temp123 sign in SUCCESS!', d1.user.email);
  }

  console.log('Testing signIn with TempPassword123!...');
  const { data: d2, error: e2 } = await supabase.auth.signInWithPassword({
    email: 'temp@manohar.com',
    password: 'TempPassword123!'
  });
  if (e2) {
    console.log('TempPassword123! sign in failed:', e2.message);
  } else {
    console.log('TempPassword123! sign in SUCCESS!', d2.user.email);
  }

  await pgClient.end();
}

main().catch(console.error);
