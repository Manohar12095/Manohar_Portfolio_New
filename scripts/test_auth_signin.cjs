const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  'https://sqbrczfojykfhfugbisr.supabase.co',
  'sb_publishable_2sr3UUxFtn5ypkr8tCHWpA_Oxr6FMdl'
);

async function test() {
  console.log('Testing Supabase Auth API connectivity...');
  // Check if we can sign in or what error is returned for invalid password vs valid user
  const { data, error } = await supabase.auth.signInWithPassword({
    email: 'temp@manohar.com',
    password: 'WrongPasswordTest123!'
  });
  console.log('Test Sign In result for temp@manohar.com with test password:');
  console.log('Data:', data?.user?.id ? 'User Found' : 'None');
  console.log('Error message:', error ? error.message : 'No Error');
}

test().catch(console.error);

