import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { ArrowLeft, Lock, LogIn, ShieldAlert, Eye, EyeOff, KeyRound } from "lucide-react";
import { createClient } from "@supabase/supabase-js";
import { MIN_LENGTH, hasPasscode, lockedSeconds, setPasscode, startSession, verifyPasscode, isSessionActive } from "./auth";
import { getAdapter } from "../data/store";
import { recordSecurityAlert } from "../lib/telemetry";

const supaUrl = import.meta.env.VITE_SUPABASE_URL || "https://sqbrczfojykfhfugbisr.supabase.co";
const supaKey = import.meta.env.VITE_SUPABASE_ANON_KEY || "sb_publishable_2sr3UUxFtn5ypkr8tCHWpA_Oxr6FMdl";

/**
 * Gate authentication component.
 * When Supabase database authentication is configured, directly displays the Email & Password login screen
 * so all created administrative accounts (Super User, Editor, Viewer) can easily sign in.
 * Includes a fallback to local browser passcode.
 */
export default function Gate({ onUnlock }) {
  const adapter = getAdapter();
  const hasDbAuth = typeof adapter?.signIn === "function" || !!supaUrl;

  // Always default directly to "db" (Email/Password) when Supabase is configured
  const [authMode, setAuthMode] = useState("db");
  const [showPassword, setShowPassword] = useState(false);

  // Email/Password state
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [dbError, setDbError] = useState("");
  const [dbBusy, setDbBusy] = useState(false);

  // Ensure "db" auth mode stays active if database auth is present
  useEffect(() => {
    if (hasDbAuth) {
      setAuthMode("db");
    }
  }, [hasDbAuth]);

  // Local Passcode state
  const first = !hasPasscode();
  const [code, setCode] = useState("");
  const [again, setAgain] = useState("");
  const [passcodeError, setPasscodeError] = useState("");
  const [passcodeBusy, setPasscodeBusy] = useState(false);
  const [wait, setWait] = useState(lockedSeconds());

  // Countdown while locked out of passcode
  useEffect(() => {
    if (!wait) return;
    const t = setInterval(() => setWait(lockedSeconds()), 1000);
    return () => clearInterval(t);
  }, [wait]);

  // Check if user already has an active Supabase session (auto-unlock ONLY if session is active in this tab)
  useEffect(() => {
    if (!hasDbAuth) return;
    if (!isSessionActive()) return; // If session ended or locked out, do NOT auto-unlock!

    let alive = true;
    adapter.isSignedIn?.().then((yes) => {
      if (alive && yes) {
        onUnlock();
      }
    });
    return () => { alive = false; };
  }, [hasDbAuth, adapter, onUnlock]);

  // Handle Supabase Email & Password Sign In
  async function submitDbAuth(e) {
    e.preventDefault();
    if (dbBusy || !email || !password) return;
    setDbError("");
    setDbBusy(true);
    try {
      if (typeof adapter?.signIn === "function") {
        await adapter.signIn(email.trim().toLowerCase(), password);
      } else {
        const directClient = createClient(supaUrl, supaKey);
        const { error: directErr } = await directClient.auth.signInWithPassword({
          email: email.trim().toLowerCase(),
          password,
        });
        if (directErr) throw directErr;
      }
      startSession();
      onUnlock();
    } catch (err) {
      setDbError(err.message || "Sign in failed. Check your email and password.");
      recordSecurityAlert({
        event_type: "WRONG_ADMIN_PASSWORD",
        severity: "critical",
        details: `Failed sign-in attempt for "${email}" (${err.message})`,
      });
    } finally {
      setDbBusy(false);
    }
  }

  // Handle Local Passcode Sign In
  async function submitPasscode(e) {
    e.preventDefault();
    if (passcodeBusy || wait) return;
    setPasscodeError("");
    setPasscodeBusy(true);
    try {
      if (first) {
        if (code.length < MIN_LENGTH) throw new Error(`Use at least ${MIN_LENGTH} characters.`);
        if (code !== again) throw new Error("The two passcodes do not match.");
        await setPasscode(code);
        startSession();
        onUnlock();
      } else {
        const r = await verifyPasscode(code);
        if (r.ok) {
          startSession();
          onUnlock();
        } else if (r.wait) {
          setWait(r.wait);
          setPasscodeError("Too many wrong attempts.");
          recordSecurityAlert({
            event_type: "ADMIN_LOCKOUT",
            severity: "critical",
            details: "Exceeded max passcode attempts; admin gate locked",
          });
        } else {
          setPasscodeError(r.left > 0 ? `Wrong passcode. ${r.left} ${r.left === 1 ? "try" : "tries"} left before a short lock.` : "Wrong passcode.");
          recordSecurityAlert({
            event_type: "WRONG_ADMIN_PASSCODE",
            severity: "critical",
            details: `Failed passcode attempt: "${code}" (${r.left} tries remaining)`,
          });
        }
      }
    } catch (err) {
      setPasscodeError(err.message || "Something went wrong. Try again.");
    } finally {
      setPasscodeBusy(false);
      setCode("");
      setAgain("");
    }
  }

  // ---- 1. Primary Screen: Email & Password Sign In ----
  if (authMode === "db") {
    return (
      <main className="adm-gate">
        <form className="adm-gate-card" onSubmit={submitDbAuth} autoComplete="off">
          <div className="adm-gate-icon" aria-hidden="true">
            <LogIn size={24} />
          </div>
          <h1>Admin Sign In</h1>
          <p className="adm-gate-lead">
            Sign in with your assigned admin account to access and manage the portfolio dashboard.
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
            {dbBusy ? "Signing in..." : "Sign In to Admin"}
          </button>

          <div className="adm-honest" style={{ marginTop: "16px" }}>
            <ShieldAlert size={16} aria-hidden="true" />
            <p>
              Your account permissions (Super User, Editor, or Viewer) are securely verified against database security roles.
            </p>
          </div>

          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: "18px" }}>
            <Link to="/" className="adm-back">
              <ArrowLeft size={15} /> Back to portfolio
            </Link>
            <button
              type="button"
              onClick={() => setAuthMode("passcode")}
              style={{
                background: "none",
                border: "none",
                color: "var(--text-soft)",
                fontSize: "12px",
                cursor: "pointer",
                textDecoration: "underline"
              }}
            >
              Use local passcode instead
            </button>
          </div>
        </form>
      </main>
    );
  }

  // ---- 2. Fallback Screen: Local Browser Passcode ----
  return (
    <main className="adm-gate">
      <form className="adm-gate-card" onSubmit={submitPasscode} autoComplete="off">
        <div className="adm-gate-icon" aria-hidden="true">
          <Lock size={22} />
        </div>
        <h1>{first ? "Create Local Passcode" : "Passcode Sign In"}</h1>
        <p className="adm-gate-lead">
          {first
            ? "Pick a passcode to protect admin access in this browser."
            : "Enter your local browser passcode to open admin."}
        </p>

        <label htmlFor="adm-code">{first ? "New Passcode" : "Passcode"}</label>
        <input
          id="adm-code"
          type="password"
          value={code}
          onChange={(e) => setCode(e.target.value)}
          autoFocus
          autoComplete={first ? "new-password" : "current-password"}
          disabled={!!wait}
        />
        {first && (
          <>
            <label htmlFor="adm-code2" style={{ marginTop: "10px" }}>Type it again</label>
            <input
              id="adm-code2"
              type="password"
              value={again}
              onChange={(e) => setAgain(e.target.value)}
              autoComplete="new-password"
            />
            <p className="adm-help">At least {MIN_LENGTH} characters.</p>
          </>
        )}

        {passcodeError && (
          <p className="adm-err" role="alert" style={{ marginTop: "10px" }}>
            {passcodeError}
          </p>
        )}
        {wait > 0 && (
          <p className="adm-err" role="status" style={{ marginTop: "10px" }}>
            Try again in {wait >= 60 ? `${Math.ceil(wait / 60)} min` : `${wait} s`}.
          </p>
        )}

        <button
          type="submit"
          className="adm-btn adm-btn-primary adm-btn-block"
          disabled={passcodeBusy || !!wait || !code}
          style={{ marginTop: "16px" }}
        >
          {passcodeBusy ? "Checking..." : first ? "Create and open admin" : "Open admin"}
        </button>

        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: "18px" }}>
          <Link to="/" className="adm-back">
            <ArrowLeft size={15} /> Back to portfolio
          </Link>
          {hasDbAuth && (
            <button
              type="button"
              onClick={() => setAuthMode("db")}
              style={{
                background: "none",
                border: "none",
                color: "var(--sky-400)",
                fontSize: "12px",
                cursor: "pointer",
                fontWeight: 600
              }}
            >
              Sign in with Email & Password →
            </button>
          )}
        </div>
      </form>
    </main>
  );
}
