const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  'https://sqbrczfojykfhfugbisr.supabase.co',
  'sb_publishable_2sr3UUxFtn5ypkr8tCHWpA_Oxr6FMdl'
);

async function testFlow() {
  const email = 'flow_test_' + Date.now() + '@manohar.com';
  const password = 'TestFlowPassword123!';

  console.log('Signing up with', email);
  const { data: suData, error: suErr } = await supabase.auth.signUp({
    email,
    password
  });
  console.log('SignUp error:', suErr ? suErr.message : 'none');
  console.log('User id:', suData?.user?.id);

  console.log('Attempting signInWithPassword with', email);
  const { data: siData, error: siErr } = await supabase.auth.signInWithPassword({
    email,
    password
  });
  console.log('SignIn error:', siErr ? siErr.message : 'none');
  console.log('Session access_token exists:', !!siData?.session?.access_token);
}

testFlow().catch(console.error);
