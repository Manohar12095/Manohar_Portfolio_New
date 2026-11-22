const { Client } = require('pg');
const { createClient } = require('@supabase/supabase-js');

const supaUrl = "https://sqbrczfojykfhfugbisr.supabase.co";
const supaKey = "sb_publishable_2sr3UUxFtn5ypkr8tCHWpA_Oxr6FMdl";
const pgConnStr = "postgresql://postgres:AAmanohar1.60@db.sqbrczfojykfhfugbisr.supabase.co:5432/postgres";

async function verifyAll() {
  console.log("=== STARTING FULL PROJECT VERIFICATION ===");
  const results = {};

  // 1. Database Connection & Schema Health
  const pgClient = new Client({ connectionString: pgConnStr });
  await pgClient.connect();

  try {
    const tablesRes = await pgClient.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
      ORDER BY table_name;
    `);
    results.tables = tablesRes.rows.map(r => r.table_name);
    console.log("1. Public Tables Verified:", results.tables.join(", "));

    // Check visitor_blocks schema
    const blocksCols = await pgClient.query(`
      SELECT column_name, data_type 
      FROM information_schema.columns 
      WHERE table_name = 'visitor_blocks';
    `);
    results.visitor_blocks_columns = blocksCols.rows.map(r => `${r.column_name} (${r.data_type})`);
    console.log("2. visitor_blocks Columns:", results.visitor_blocks_columns.join(", "));

    // Check visitor_telemetry blocking columns
    const telCols = await pgClient.query(`
      SELECT column_name 
      FROM information_schema.columns 
      WHERE table_name = 'visitor_telemetry' AND column_name IN ('is_blocked', 'blocked_until', 'block_reason');
    `);
    console.log("3. visitor_telemetry Blocking Columns:", telCols.rows.map(r => r.column_name).join(", "));

    // Check admin_roles
    const adminRoles = await pgClient.query(`SELECT email, role, is_blocked FROM public.admin_roles ORDER BY created_at;`);
    console.log("4. Configured Admin Accounts:", adminRoles.rows);

    // Check personal items in private vault
    const itemsCount = await pgClient.query(`SELECT count(*) FROM public.personal_items;`);
    console.log("5. Personal Space Items Count:", itemsCount.rows[0].count);

  } catch (err) {
    console.error("Database check failed:", err.message);
  } finally {
    await pgClient.end();
  }

  // 2. Telemetry & Security Alert Ingestion Flow Test
  console.log("\n--- Testing Telemetry Ingestion Flow ---");
  const supabase = createClient(supaUrl, supaKey, { auth: { persistSession: false } });
  
  const testSessionId = "test_verify_" + Date.now();
  
  // Test telemetry insert
  const { error: telErr } = await supabase.from("visitor_telemetry").insert([{
    session_id: testSessionId,
    visitor_name: "Automated Verifier",
    device_type: "Desktop",
    browser: "Verification Engine",
    os: "Windows",
    login_time: new Date().toISOString(),
    last_active_at: new Date().toISOString(),
    duration_seconds: 10,
    threat_level: "normal",
    actions: [{ type: "test", label: "Verification Streamer Ping", time: new Date().toISOString() }]
  }]);
  console.log("6. Telemetry Upsert / Streamer Result:", telErr ? "FAILED: " + telErr.message : "SUCCESS (Streamer Active)");

  // Test security alert (link click & share trigger)
  const { error: alertErr } = await supabase.from("security_alerts").insert([{
    session_id: testSessionId,
    visitor_name: "Automated Verifier",
    event_type: "WEBSITE_LINK_CLICK",
    severity: "critical",
    details: "Verification test: simulated link click event",
    created_at: new Date().toISOString()
  }]);
  console.log("7. Security Alert Streamer Result:", alertErr ? "FAILED: " + alertErr.message : "SUCCESS (Security Streamer Active)");

  // Clean up verification test rows
  await supabase.from("visitor_telemetry").delete().eq("session_id", testSessionId);
  await supabase.from("security_alerts").delete().eq("session_id", testSessionId);
  console.log("8. Cleaned up verification telemetry markers.");

  // 3. User Authentication Test for temp@manohar.com
  console.log("\n--- Testing User Auth Login Flow ---");
  const { data: authData, error: authErr } = await supabase.auth.signInWithPassword({
    email: "temp@manohar.com",
    password: "Temp123"
  });
  if (authErr) {
    console.log("9. Auth Sign-in with Temp123 FAILED:", authErr.message);
  } else {
    console.log("9. Auth Sign-in with Temp123 SUCCESS:", authData.user.email, "| ID:", authData.user.id);
  }

  console.log("\n=== FULL VERIFICATION SUITE FINISHED ===");
}

verifyAll().catch(console.error);
