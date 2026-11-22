const { Client } = require('pg');

const client = new Client({
  connectionString: 'postgresql://postgres:AAmanohar1.60@db.sqbrczfojykfhfugbisr.supabase.co:5432/postgres'
});

async function main() {
  await client.connect();
  const res = await client.query('SELECT * FROM auth.schema_migrations ORDER BY version');
  console.log('Total migrations in auth.schema_migrations:', res.rows.length);
  console.log('First 5:', res.rows.slice(0, 5));
  console.log('Last 5:', res.rows.slice(-5));
  await client.end();
}

main().catch(console.error);

