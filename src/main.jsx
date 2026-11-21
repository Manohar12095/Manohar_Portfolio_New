import React from "react";
import ReactDOM from "react-dom/client";
import { BrowserRouter } from "react-router-dom";
import App from "./App";
import { ContentProvider } from "./context/ContentContext";
import { setAdapter } from "./data/store";
import { createSupabaseAdapter } from "./data/adapters/supabase";
import "./styles/global.css";

// --- Supabase database adapter (see docs/DATABASE.md) ---
// Connects to Supabase with env vars or defaults to public project credentials.
const supaUrl = import.meta.env.VITE_SUPABASE_URL || "https://sqbrczfojykfhfugbisr.supabase.co";
const supaKey = import.meta.env.VITE_SUPABASE_ANON_KEY || "sb_publishable_2sr3UUxFtn5ypkr8tCHWpA_Oxr6FMdl";
if (supaUrl && supaKey) {
  setAdapter(createSupabaseAdapter({ url: supaUrl, anonKey: supaKey }));
}

ReactDOM.createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <ContentProvider>
      <BrowserRouter>
        <App />
      </BrowserRouter>
    </ContentProvider>
  </React.StrictMode>
);
