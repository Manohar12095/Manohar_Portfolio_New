const { Client } = require('pg');
const { createClient } = require('@supabase/supabase-js');

async function recreateTempUser() {
  const client = new Client({ connectionString: 'postgresql://postgres:AAmanohar1.60@db.sqbrczfojykfhfugbisr.supabase.co:5432/postgres' });
  await client.connect();
  
  // Remove broken manual row from auth.users and auth.identities
  await client.query("DELETE FROM auth.identities WHERE email = 'temp@manohar.com'");
  await client.query("DELETE FROM auth.users WHERE email = 'temp@manohar.com'");
  console.log('Cleaned up previous temp@manohar.com row');
  await client.end();

  // Create cleanly via Supabase Auth
  const supabase = createClient(
    'https://sqbrczfojykfhfugbisr.supabase.co',
    'sb_publishable_2sr3UUxFtn5ypkr8tCHWpA_Oxr6FMdl'
  );

  const testEmail = 'temp@manohar.com';
  const testPassword = 'TempPassword123!';

  const { data: suData, error: suErr } = await supabase.auth.signUp({
    email: testEmail,
    password: testPassword
  });

  if (suErr) {
    console.error('Recreate error:', suErr.message);
    return;
  }
  console.log('Created user cleanly! ID:', suData.user.id);

  // Link role
  const { error: roleErr } = await supabase.from('admin_roles').upsert({
    user_id: suData.user.id,
    email: testEmail,
    role: 'viewer',
    updated_at: new Date().toISOString()
  }, { onConflict: 'email' });

  if (roleErr) console.error('Role link error:', roleErr);
  else console.log('Role linked to viewer in admin_roles!');

  // Verify sign in
  const { data: siData, error: siErr } = await supabase.auth.signInWithPassword({
    email: testEmail,
    password: testPassword
  });

  if (siErr) console.error('Sign in verification failed:', siErr.message);
  else console.log('LOGIN VERIFIED! temp@manohar.com can now log in with password: TempPassword123!');
}

recreateTempUser().catch(console.error);
