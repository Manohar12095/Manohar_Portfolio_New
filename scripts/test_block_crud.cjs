const { Client } = require('pg');

const client = new Client({
  connectionString: 'postgresql://postgres:AAmanohar1.60@db.sqbrczfojykfhfugbisr.supabase.co:5432/postgres'
});

async function run() {
  await client.connect();
  const testId = 'test_session_' + Date.now();
  
  // 1. Insert test block
  await client.query(
    'INSERT INTO public.visitor_blocks (session_id, visitor_name, duration_type, blocked_until, reason, blocked_by, is_active) VALUES ($1, $2, $3, NOW() + interval \'5 minutes\', $4, $5, true)',
    [testId, 'Test Visitor', '5m', 'Automated test', 'Super User']
  );
  console.log('Inserted test block');

  // 2. Query
  const r = await client.query('SELECT session_id, duration_type, is_active, blocked_until FROM public.visitor_blocks WHERE session_id = $1', [testId]);
  console.log('Query result:', r.rows[0]);

  // 3. Deactivate
  await client.query('UPDATE public.visitor_blocks SET is_active = false WHERE session_id = $1', [testId]);
  console.log('Deactivated test block');

  // 4. Clean up
  await client.query('DELETE FROM public.visitor_blocks WHERE session_id = $1', [testId]);
  console.log('Test clean up completed');

  await client.end();
}

run().catch(console.error);

