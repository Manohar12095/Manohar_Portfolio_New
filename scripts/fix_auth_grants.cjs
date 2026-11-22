const { Client } = require('pg');

const client = new Client({
  connectionString: 'postgresql://postgres:AAmanohar1.60@db.sqbrczfojykfhfugbisr.supabase.co:5432/postgres'
});

async function fixGrants() {
  await client.connect();
  console.log('Granting permissions to supabase_auth_admin on schema auth...');

  await client.query(`
    GRANT USAGE ON SCHEMA auth TO supabase_auth_admin;
    GRANT ALL ON ALL TABLES IN SCHEMA auth TO supabase_auth_admin;
    GRANT ALL ON ALL SEQUENCES IN SCHEMA auth TO supabase_auth_admin;
    GRANT ALL ON ALL ROUTINES IN SCHEMA auth TO supabase_auth_admin;
    ALTER DEFAULT PRIVILEGES IN SCHEMA auth GRANT ALL ON TABLES TO supabase_auth_admin;
    ALTER DEFAULT PRIVILEGES IN SCHEMA auth GRANT ALL ON SEQUENCES TO supabase_auth_admin;
    ALTER DEFAULT PRIVILEGES IN SCHEMA auth GRANT ALL ON ROUTINES TO supabase_auth_admin;
  `);

  const perms = await client.query(`
    SELECT grantee, privilege_type 
    FROM information_schema.role_table_grants 
    WHERE table_schema = 'auth' AND table_name = 'users'
  `);
  console.log('Updated grants on auth.users:', perms.rows);

  await client.end();
}

fixGrants().catch(console.error);

