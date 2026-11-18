/* ============================================================================
   SUPABASE ADAPTER (example, not used until you wire it in)

   Nothing imports this file, so it does not affect the build. To use it:
     1. npm install @supabase/supabase-js
     2. Copy this file to  src/data/adapters/supabase.js
     3. Follow docs/DATABASE.md (table, security rules, .env, main.jsx)

   It stores the whole portfolio as ONE row: { id: "main", data: <the document> }.
   The document only contains text and image / video links.
   ========================================================================== */
import { createClient } from "@supabase/supabase-js";

const TABLE = "portfolio_documents";
const ROW_ID = "main";

export function createSupabaseAdapter({ url, anonKey }) {
  if (!url || !anonKey) throw new Error("Missing Supabase url or anon key. See docs/DATABASE.md");
  const supabase = createClient(url, anonKey);

  return {
    name: "Supabase (database)",
    supabase, // exposed so a sign-in screen can call supabase.auth.*

    /** Everyone can read (the public site). Returns null if nothing is saved yet. */
    async load() {
      const { data, error } = await supabase.from(TABLE).select("data").eq("id", ROW_ID).maybeSingle();
      if (error) throw new Error(error.message);
      return data?.data ?? null;
    },

    /** Only the signed-in owner can write. The database enforces this, not the browser. */
    async save(doc) {
      const { data: auth } = await supabase.auth.getSession();
      if (!auth.session) throw new Error("Sign in with your owner account before saving.");
      const { error } = await supabase
        .from(TABLE)
        .upsert({ id: ROW_ID, data: doc, updated_at: new Date().toISOString() });
      if (error) throw new Error(error.message);
    },

    async reset() {
      const { error } = await supabase.from(TABLE).delete().eq("id", ROW_ID);
      if (error) throw new Error(error.message);
    },

    /* helpers for a real sign-in step in the admin (see docs/DATABASE.md, step 6) */
    async signIn(email, password) {
      const { error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) throw new Error(error.message);
    },
    async signOut() {
      await supabase.auth.signOut();
    },
    async isSignedIn() {
      const { data } = await supabase.auth.getSession();
      return !!data.session;
    },
  };
}
