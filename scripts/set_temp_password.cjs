const { Client } = require('pg');

const client = new Client({
  connectionString: 'postgresql://postgres:AAmanohar1.60@db.sqbrczfojykfhfugbisr.supabase.co:5432/postgres'
});

async function setPassword() {
  await client.connect();
  
  // We can use Supabase pgcrypto to update encrypted_password
  // or use crypt('Temp123', gen_salt('bf'))
  const sql = `
    UPDATE auth.users
    SET encrypted_password = crypt('Temp123', gen_salt('bf')),
        updated_at = NOW(),
        email_confirmed_at = NOW()
    WHERE email ILIKE 'temp@manohar.com';
  `;

  await client.query(sql);
  console.log('Password updated in auth.users to Temp123');

  // Verify in public.admin_roles that role is viewer
  const roleRes = await client.query(`
    INSERT INTO public.admin_roles (user_id, email, role, updated_at)
    VALUES ((SELECT id FROM auth.users WHERE email ILIKE 'temp@manohar.com'), 'temp@manohar.com', 'viewer', NOW())
    ON CONFLICT (email) DO UPDATE SET role = 'viewer', is_blocked = false, blocked_until = null, block_reason = null;
  `);
  console.log('Role verified in admin_roles:', roleRes.rowCount);

  await client.end();
}

setPassword().catch(console.error);
