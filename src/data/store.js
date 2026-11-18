/* ============================================================================
   STORAGE ADAPTER  —  where your edited content is saved.

   Right now it saves into THIS BROWSER (localStorage), which is why the admin works
   with no database. When you are ready for a real database, replace the adapter:

       // in src/main.jsx, before rendering
       import { setAdapter } from "./data/store";
       import { createSupabaseAdapter } from "./data/adapters/supabase";   // copy supabase.example.js to supabase.js first
       setAdapter(createSupabaseAdapter({ url: import.meta.env.VITE_SUPABASE_URL, anonKey: import.meta.env.VITE_SUPABASE_ANON_KEY }));

   An adapter is just an object with these functions:
       loadSync()  OPTIONAL. Return the saved document immediately (or null).
       load()      async. Return the saved document (or null if nothing is saved yet).
       save(doc)   async. Store the document. Throw an Error if it fails.
       reset()     OPTIONAL. async. Delete the stored document.

   The document is plain JSON containing only text and image/video links:
       { version, updatedAt, content: {...}, themes: { activeId, custom: [...] } }
   See docs/DATABASE.md for a ready-made table design.
   ========================================================================== */

const KEY = "portfolio.data.v1";

export const localAdapter = {
  name: "Browser storage (localStorage)",
  local: true, // the admin uses this to explain that data stays in this browser

  loadSync() {
    try {
      const raw = window.localStorage.getItem(KEY);
      return raw ? JSON.parse(raw) : null;
    } catch {
      return null;
    }
  },

  async load() {
    return this.loadSync();
  },

  async save(doc) {
    try {
      window.localStorage.setItem(KEY, JSON.stringify(doc));
    } catch {
      throw new Error("this browser blocked or filled its storage");
    }
  },

  async reset() {
    try {
      window.localStorage.removeItem(KEY);
    } catch {
      /* ignore */
    }
  },

  /** Size of the saved document in KB (shown in the admin). */
  sizeKb() {
    try {
      return Math.round(((window.localStorage.getItem(KEY) || "").length / 1024) * 10) / 10;
    } catch {
      return 0;
    }
  },
};

let adapter = localAdapter;
export const getAdapter = () => adapter;
export const setAdapter = (a) => {
  adapter = a;
};
