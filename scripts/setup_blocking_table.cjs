const { Client } = require('pg');

const client = new Client({
  connectionString: 'postgresql://postgres:AAmanohar1.60@db.sqbrczfojykfhfugbisr.supabase.co:5432/postgres'
});

async function main() {
  await client.connect();
  console.log('Connected to PostgreSQL');

  const sql = `
    CREATE TABLE IF NOT EXISTS public.visitor_blocks (
      id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
      session_id text,
      visitor_name text,
      ip_address text,
      duration_type text NOT NULL, -- 'terminate', '5m', '1h', '12h', '1d', '1w', '1mo', '6mo', '1y', 'permanent'
      blocked_until timestamp with time zone,
      reason text DEFAULT 'Administrative security restriction',
      blocked_by text DEFAULT 'Super User',
      is_active boolean DEFAULT true,
      created_at timestamp with time zone DEFAULT now(),
      updated_at timestamp with time zone DEFAULT now()
    );

    CREATE INDEX IF NOT EXISTS idx_visitor_blocks_lookup ON public.visitor_blocks (session_id, visitor_name, is_active);

    ALTER TABLE public.visitor_blocks ENABLE ROW LEVEL SECURITY;

    DROP POLICY IF EXISTS "Allow public read access to active blocks" ON public.visitor_blocks;
    CREATE POLICY "Allow public read access to active blocks"
    ON public.visitor_blocks FOR SELECT TO anon, authenticated
    USING (true);

    DROP POLICY IF EXISTS "Allow admin full access to visitor blocks" ON public.visitor_blocks;
    CREATE POLICY "Allow admin full access to visitor blocks"
    ON public.visitor_blocks FOR ALL TO anon, authenticated
    USING (true) WITH CHECK (true);

    GRANT ALL ON public.visitor_blocks TO anon, authenticated, service_role, postgres;

    -- Also add blocking columns to visitor_telemetry
    ALTER TABLE public.visitor_telemetry
    ADD COLUMN IF NOT EXISTS is_blocked boolean DEFAULT false,
    ADD COLUMN IF NOT EXISTS blocked_until timestamp with time zone,
    ADD COLUMN IF NOT EXISTS block_reason text;

    -- Also add blocking columns to admin_roles
    ALTER TABLE public.admin_roles
    ADD COLUMN IF NOT EXISTS is_blocked boolean DEFAULT false,
    ADD COLUMN IF NOT EXISTS blocked_until timestamp with time zone,
    ADD COLUMN IF NOT EXISTS block_reason text;
  `;

  await client.query(sql);
  console.log('Successfully configured public.visitor_blocks and blocking columns!');

  await client.end();
}

main().catch(console.error);
