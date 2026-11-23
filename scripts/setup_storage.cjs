const { Client } = require('pg');
const { createClient } = require('@supabase/supabase-js');

async function setup() {
  const connectionString = 'postgresql://postgres:AAmanohar1.60@db.sqbrczfojykfhfugbisr.supabase.co:5432/postgres';
  const client = new Client({ connectionString });
  
  await client.connect();
  console.log('Connected to PostgreSQL successfully.');

  // Check storage buckets
  const b = await client.query('SELECT id, name, public FROM storage.buckets;');
  console.log('Existing buckets:', b.rows);

  // Insert or update portfolio-media bucket
  await client.query(`
    INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
    VALUES ('portfolio-media', 'portfolio-media', true, 52428800, null)
    ON CONFLICT (id) DO UPDATE SET public = true;
  `);
  console.log('Bucket portfolio-media created/updated to public=true.');

  // Create RLS policies for storage.objects
  await client.query(`
    DO $$
    BEGIN
      IF NOT EXISTS (
        SELECT 1 FROM pg_policies WHERE schemaname = 'storage' AND tablename = 'objects' AND policyname = 'Public Access'
      ) THEN
        CREATE POLICY "Public Access" ON storage.objects FOR SELECT USING (bucket_id = 'portfolio-media');
      END IF;

      IF NOT EXISTS (
        SELECT 1 FROM pg_policies WHERE schemaname = 'storage' AND tablename = 'objects' AND policyname = 'Allow Uploads'
      ) THEN
        CREATE POLICY "Allow Uploads" ON storage.objects FOR INSERT WITH CHECK (bucket_id = 'portfolio-media');
      END IF;

      IF NOT EXISTS (
        SELECT 1 FROM pg_policies WHERE schemaname = 'storage' AND tablename = 'objects' AND policyname = 'Allow Updates'
      ) THEN
        CREATE POLICY "Allow Updates" ON storage.objects FOR UPDATE USING (bucket_id = 'portfolio-media');
      END IF;

      IF NOT EXISTS (
        SELECT 1 FROM pg_policies WHERE schemaname = 'storage' AND tablename = 'objects' AND policyname = 'Allow Deletes'
      ) THEN
        CREATE POLICY "Allow Deletes" ON storage.objects FOR DELETE USING (bucket_id = 'portfolio-media');
      END IF;
    END
    $$;
  `);
  console.log('Storage RLS policies configured successfully.');

  await client.end();

  // Test with supabase-js client
  const supabase = createClient('https://sqbrczfojykfhfugbisr.supabase.co', 'sb_publishable_2sr3UUxFtn5ypkr8tCHWpA_Oxr6FMdl');
  const testBuffer = Buffer.from('test-image-content-portfolio');
  const uploadRes = await supabase.storage.from('portfolio-media').upload('test/verify.txt', testBuffer, {
    contentType: 'text/plain',
    upsert: true
  });
  console.log('Test Upload Result:', uploadRes);

  const { data: publicUrlData } = supabase.storage.from('portfolio-media').getPublicUrl('test/verify.txt');
  console.log('Public URL:', publicUrlData?.publicUrl);
}

setup().catch(console.error);

