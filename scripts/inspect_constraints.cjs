const { Client } = require('pg');

const client = new Client({
  connectionString: 'postgresql://postgres:AAmanohar1.60@db.sqbrczfojykfhfugbisr.supabase.co:5432/postgres'
});

async function main() {
  await client.connect();
  const res = await client.query(`
    SELECT pg_get_constraintdef(c.oid) AS condef
    FROM pg_constraint c
    JOIN pg_class t ON c.conrelid = t.oid
    WHERE t.relname = 'personal_items' AND c.conname = 'personal_items_type_check';
  `);
  console.log('Constraint definition:', res.rows[0]?.condef);
  
  // Also we can alter it to allow ('text', 'photo', 'video', 'certificate', 'document', 'file')
  await client.query(`
    ALTER TABLE public.personal_items DROP CONSTRAINT IF EXISTS personal_items_type_check;
    ALTER TABLE public.personal_items ADD CONSTRAINT personal_items_type_check 
    CHECK (type IN ('text', 'photo', 'video', 'certificate', 'document', 'file'));
  `);
  console.log('Updated personal_items_type_check constraint to include document and file!');
  
  await client.end();
}

main().catch(console.error);

