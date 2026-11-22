const { Client } = require('pg');

const client = new Client({
  connectionString: 'postgresql://postgres:AAmanohar1.60@db.sqbrczfojykfhfugbisr.supabase.co:5432/postgres'
});

async function inspectAuthTables() {
  await client.connect();
  const tables = await client.query(`
    SELECT table_name 
    FROM information_schema.tables 
    WHERE table_schema = 'auth'
  `);
  console.log('Tables in auth schema:', tables.rows.map(r => r.table_name));

  // Check schema_migrations
  if (tables.rows.some(r => r.table_name === 'schema_migrations')) {
    const migs = await client.query('SELECT * FROM auth.schema_migrations ORDER BY version DESC LIMIT 5');
    console.log('Auth migrations:', migs.rows);
  }

  // Grant all permissions on all tables in auth schema to supabase_auth_admin, anon, authenticated, service_role
  await client.query(`
    GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA auth TO supabase_auth_admin;
    GRANT ALL PRIVILEGES ON ALL SEQUENCES IN SCHEMA auth TO supabase_auth_admin;
    GRANT ALL PRIVILEGES ON ALL FUNCTIONS IN SCHEMA auth TO supabase_auth_admin;
  `);

  await client.end();
}

inspectAuthTables().catch(console.error);
