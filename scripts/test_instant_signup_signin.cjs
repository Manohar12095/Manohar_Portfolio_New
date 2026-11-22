const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  'https://sqbrczfojykfhfugbisr.supabase.co',
  'sb_publishable_2sr3UUxFtn5ypkr8tCHWpA_Oxr6FMdl'
);

async function testInstant() {
  const email = 'instant_' + Date.now() + '@manohar.com';
  const password = 'InstantPassword123!';

  console.log('1. Signing up user:', email);
  const { data: suData, error: suErr } = await supabase.auth.signUp({ email, password });
  if (suErr) {
    console.error('Sign up error:', suErr.message);
    return;
  }
  console.log('Signed up! User ID:', suData.user.id);

  console.log('2. Immediately signing in with email & password...');
  const { data: siData, error: siErr } = await supabase.auth.signInWithPassword({ email, password });
  if (siErr) {
    console.error('Sign in error:', siErr.message);
  } else {
    console.log('SUCCESS! Logged in immediately!');
    console.log('Access token present:', !!siData.session?.access_token);
  }
}

testInstant().catch(console.error);

