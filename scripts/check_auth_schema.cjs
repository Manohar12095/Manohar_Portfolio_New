const { Client } = require('pg');

const client = new Client({
  connectionString: 'postgresql://postgres:AAmanohar1.60@db.sqbrczfojykfhfugbisr.supabase.co:5432/postgres'
});

async function main() {
  await client.connect();
  const perms = await client.query(`
    SELECT grantee, privilege_type 
    FROM information_schema.role_table_grants 
    WHERE table_schema = 'auth' AND table_name = 'users'
  `);
  console.log('Grants on auth.users:', perms.rows);

  // Check if supabase_auth_admin has permissions on schema auth
  const schemaUsage = await client.query(`
    SELECT nspname, rolname, has_schema_privilege(rolname, nspname, 'USAGE') as usage
    FROM pg_namespace, pg_roles
    WHERE nspname = 'auth' AND rolname IN ('supabase_auth_admin', 'postgres', 'anon', 'authenticated');
  `);
  console.log('Schema usage on auth:', schemaUsage.rows);

  // Check functions in auth
  const funcs = await client.query(`
    SELECT proname, proowner::regrole 
    FROM pg_proc 
    WHERE pronamespace = 'auth'::regnamespace;
  `);
  console.log('Functions in auth:', funcs.rows);

  await client.end();
}

main().catch(console.error);
