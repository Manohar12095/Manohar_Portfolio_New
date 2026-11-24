import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { ArrowLeft, LogIn, ShieldAlert, Eye, EyeOff } from "lucide-react";
import { createClient } from "@supabase/supabase-js";
import { startSession, isSessionActive } from "./auth";
import { getAdapter } from "../data/store";
import { recordSecurityAlert, recordVisitorLogin } from "../lib/telemetry";

const supaUrl = import.meta.env.VITE_SUPABASE_URL || "https://sqbrczfojykfhfugbisr.supabase.co";
const supaKey = import.meta.env.VITE_SUPABASE_ANON_KEY || "sb_publishable_2sr3UUxFtn5ypkr8tCHWpA_Oxr6FMdl";

/**
 * Admin Gate Authentication Component.
 * EXCLUSIVELY uses Supabase Database Authentication (Email & Password).
 * 
 * Strict Access Policy:
 * 1. Only Manohar (Owner/Super User) and users explicitly created in the Supabase database can sign in.
 * 2. Client-side/local passcodes and creation bypasses are completely eliminated.
 * 3. Any unauthorized attempt is rejected and recorded into security alerts.
 */
export default function Gate({ onUnlock }) {
  const [showPassword, setShowPassword] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [dbError, setDbError] = useState("");
  const [dbBusy, setDbBusy] = useState(false);

  // Check if user already has an active Supabase session in this tab
  useEffect(() => {
    if (!isSessionActive()) return;

    let alive = true;
    const directClient = createClient(supaUrl, supaKey);
    directClient.auth.getSession().then(({ data }) => {
      if (alive && data?.session?.user) {
        onUnlock();
      }
    }).catch(() => {
      /* ignore */
    });
    return () => { alive = false; };
  }, [onUnlock]);

  // Handle Supabase Email & Password Sign In
  async function submitDbAuth(e) {
    e.preventDefault();
    if (dbBusy || !email || !password) return;
    setDbError("");
    setDbBusy(true);

    const cleanEmail = email.trim().toLowerCase();
    try {
      const directClient = createClient(supaUrl, supaKey);
      const { data, error: authErr } = await directClient.auth.signInWithPassword({
        email: cleanEmail,
        password,
      });

      if (authErr) {
        throw authErr;
      }

      if (!data?.user) {
        throw new Error("Authentication failed. No user record returned.");
      }

      // Verify authorization: Manohar (Owner) or user with role in admin_roles
      const isOwner = cleanEmail === "manoharorignal@gmail.com" || cleanEmail === "pvcmanohar@gmail.com";
      if (!isOwner) {
        const { data: roleRow, error: roleErr } = await directClient
          .from("admin_roles")
          .select("role")
          .eq("email", cleanEmail)
          .maybeSingle();

        if (roleErr || !roleRow) {
          await directClient.auth.signOut();
          throw new Error("Access denied: Your account is not authorized to access this admin portal.");
        }
      }

      // Also ensure adapter reflects signed in user
      const adapter = getAdapter();
      if (typeof adapter?.signIn === "function") {
        try {
          await adapter.signIn(cleanEmail, password);
        } catch {
          /* direct auth already succeeded */
        }
      }

      startSession();
      const adminUser = cleanEmail.split("@")[0] || "Admin";
      recordVisitorLogin(adminUser);
      onUnlock();
    } catch (err) {
      const errMsg = err.message || "Invalid email or password.";
      setDbError(errMsg);
      recordSecurityAlert({
        event_type: "WRONG_ADMIN_PASSWORD",
        severity: "critical",
        details: `Unauthorized portal login attempt for "${cleanEmail}": ${errMsg}`,
      });
    } finally {
      setDbBusy(false);
    }
  }

  return (
    <main className="adm-gate">
      <form className="adm-gate-card" onSubmit={submitDbAuth} autoComplete="off">
        <div className="adm-gate-icon" aria-hidden="true">
          <LogIn size={24} />
        </div>
        <h1>Admin Sign In</h1>
        <p className="adm-gate-lead">
          Sign in with your authorized admin account to access and manage the portfolio dashboard.
        </p>

        <label htmlFor="adm-email">Email Address</label>
        <input
          id="adm-email"
          type="email"
          required
          placeholder="admin@example.com"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          autoFocus
          autoComplete="email"
        />

        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: "12px", marginBottom: "4px" }}>
          <label htmlFor="adm-pass" style={{ margin: 0 }}>Password</label>
          <button
            type="button"
            onClick={() => setShowPassword(!showPassword)}
            style={{
              background: "none",
              border: "none",
              color: "var(--text-soft)",
              fontSize: "12px",
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              gap: "4px"
            }}
          >
            {showPassword ? <EyeOff size={13} /> : <Eye size={13} />}
            {showPassword ? "Hide" : "Show"}
          </button>
        </div>

        <input
          id="adm-pass"
          type={showPassword ? "text" : "password"}
          required
          placeholder="Enter your password..."
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          autoComplete="current-password"
        />

        {dbError && (
          <p className="adm-err" role="alert" style={{ marginTop: "10px" }}>
            {dbError}
          </p>
        )}

        <button
          type="submit"
          className="adm-btn adm-btn-primary adm-btn-block"
          disabled={dbBusy || !email || !password}
          style={{ marginTop: "16px" }}
        >
          {dbBusy ? "Verifying Credentials..." : "Sign In to Admin"}
        </button>

        <div className="adm-honest" style={{ marginTop: "16px" }}>
          <ShieldAlert size={16} aria-hidden="true" />
          <p>
            Strict Database Access Control. Only Manohar and administrative users created in the database can sign in.
          </p>
        </div>

        <div style={{ display: "flex", justifyContent: "flex-start", alignItems: "center", marginTop: "18px" }}>
          <Link to="/" className="adm-back">
            <ArrowLeft size={15} /> Back to portfolio
          </Link>
        </div>
      </form>
    </main>
  );
}
