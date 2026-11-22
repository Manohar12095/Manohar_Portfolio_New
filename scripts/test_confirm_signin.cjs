const { Client } = require('pg');
const { createClient } = require('@supabase/supabase-js');

async function testConfirm() {
  const client = new Client({ connectionString: 'postgresql://postgres:AAmanohar1.60@db.sqbrczfojykfhfugbisr.supabase.co:5432/postgres' });
  await client.connect();
  const u = await client.query("SELECT email FROM auth.users WHERE email LIKE 'flow_test%' ORDER BY created_at DESC LIMIT 1");
  const targetEmail = u.rows[0].email;
  console.log('Confirming email for:', targetEmail);
  await client.query("UPDATE auth.users SET email_confirmed_at = now() WHERE email = $1", [targetEmail]);
  await client.end();

  const supabase = createClient('https://sqbrczfojykfhfugbisr.supabase.co', 'sb_publishable_2sr3UUxFtn5ypkr8tCHWpA_Oxr6FMdl');
  const { data, error } = await supabase.auth.signInWithPassword({
    email: targetEmail,
    password: 'TestFlowPassword123!'
  });
  console.log('SIGN IN RESULT AFTER CONFIRMATION:');
  console.log('Error:', error ? error.message : 'NONE (SUCCESS!)');
  console.log('User id:', data?.user?.id);
  console.log('Session access token present:', !!data?.session?.access_token);
}

testConfirm().catch(console.error);
