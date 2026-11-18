import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { ArrowLeft, Lock, LogIn, ShieldAlert } from "lucide-react";
import { MIN_LENGTH, hasPasscode, lockedSeconds, setPasscode, startSession, verifyPasscode } from "./auth";
import { getAdapter } from "../data/store";

/** Sets the first passcode, or asks for it on later visits. Calls onUnlock() when done.
    When a database adapter with signIn is connected, adds an email/password step after the passcode. */
export default function Gate({ onUnlock }) {
  const adapter = getAdapter();
  const hasDbAuth = typeof adapter.signIn === "function";

  const first = !hasPasscode();
  const [code, setCode] = useState("");
  const [again, setAgain] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const [wait, setWait] = useState(lockedSeconds());

  // Supabase sign-in state (shown after passcode is accepted)
  const [passcodeDone, setPasscodeDone] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  // countdown while locked out
  useEffect(() => {
    if (!wait) return;
    const t = setInterval(() => setWait(lockedSeconds()), 1000);
    return () => clearInterval(t);
  }, [wait]);

  // Check if already signed in to Supabase (e.g. session persisted)
  useEffect(() => {
    if (!hasDbAuth || !passcodeDone) return;
    let alive = true;
    adapter.isSignedIn?.().then((yes) => {
      if (alive && yes) onUnlock();
    });
    return () => { alive = false; };
  }, [passcodeDone, hasDbAuth, adapter, onUnlock]);

  async function submitPasscode(e) {
    e.preventDefault();
    if (busy || wait) return;
    setError("");
    setBusy(true);
    try {
      if (first) {
        if (code.length < MIN_LENGTH) throw new Error(`Use at least ${MIN_LENGTH} characters.`);
        if (code !== again) throw new Error("The two passcodes do not match.");
        await setPasscode(code);
        startSession();
        if (hasDbAuth) {
          setPasscodeDone(true);
        } else {
          onUnlock();
        }
      } else {
        const r = await verifyPasscode(code);
        if (r.ok) {
          if (hasDbAuth) {
            setPasscodeDone(true);
          } else {
            onUnlock();
          }
        } else if (r.wait) {
          setWait(r.wait);
          setError("Too many wrong attempts.");
        } else {
          setError(r.left > 0 ? `Wrong passcode. ${r.left} ${r.left === 1 ? "try" : "tries"} left before a short lock.` : "Wrong passcode.");
        }
      }
    } catch (err) {
      setError(err.message || "Something went wrong. Try again.");
    } finally {
      setBusy(false);
      setCode("");
      setAgain("");
    }
  }

  async function submitDbAuth(e) {
    e.preventDefault();
    if (busy) return;
    setError("");
    setBusy(true);
    try {
      await adapter.signIn(email, password);
      onUnlock();
    } catch (err) {
      setError(err.message || "Sign in failed. Check your email and password.");
    } finally {
      setBusy(false);
      setPassword("");
    }
  }

  // ---- Supabase sign-in screen (shown after passcode accepted) ----
  if (passcodeDone && hasDbAuth) {
    return (
      <main className="adm-gate">
        <form className="adm-gate-card" onSubmit={submitDbAuth} autoComplete="off">
          <div className="adm-gate-icon" aria-hidden="true">
            <LogIn size={22} />
          </div>
          <h1>Sign in to your account</h1>
          <p className="adm-gate-lead">
            Your passcode is correct. Now sign in with your database account so you can save changes.
          </p>

          <label htmlFor="adm-email">Email</label>
          <input
            id="adm-email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            autoFocus
            autoComplete="email"
          />

          <label htmlFor="adm-pass">Password</label>
          <input
            id="adm-pass"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            autoComplete="current-password"
          />

          {error && (
            <p className="adm-err" role="alert">
              {error}
            </p>
          )}

          <button className="adm-btn adm-btn-primary adm-btn-block" disabled={busy || !email || !password}>
            {busy ? "Signing in…" : "Sign in and open admin"}
          </button>

          <div className="adm-honest">
            <ShieldAlert size={16} aria-hidden="true" />
            <p>
              This signs in to the database that stores your portfolio content. Only your owner account can write.
              The <code>anon</code> key in this site is meant to be public — the database rules are the real protection.
            </p>
          </div>

          <Link to="/" className="adm-back">
            <ArrowLeft size={15} /> Back to the portfolio
          </Link>
        </form>
      </main>
    );
  }

  // ---- Passcode screen (always shown first) ----
  return (
    <main className="adm-gate">
      <form className="adm-gate-card" onSubmit={submitPasscode} autoComplete="off">
        <div className="adm-gate-icon" aria-hidden="true">
          <Lock size={22} />
        </div>
        <h1>{first ? "Create your admin passcode" : "Admin sign in"}</h1>
        <p className="adm-gate-lead">
          {first
            ? "Pick a passcode you will remember. You will use it each time you open the admin on this browser."
            : "Enter your passcode to edit the portfolio."}
        </p>

        <label htmlFor="adm-code">{first ? "New passcode" : "Passcode"}</label>
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
            <label htmlFor="adm-code2">Type it again</label>
            <input id="adm-code2" type="password" value={again} onChange={(e) => setAgain(e.target.value)} autoComplete="new-password" />
            <p className="adm-help">At least {MIN_LENGTH} characters. A short sentence is easy to remember and hard to guess.</p>
          </>
        )}

        {error && (
          <p className="adm-err" role="alert">
            {error}
          </p>
        )}
        {wait > 0 && (
          <p className="adm-err" role="status">
            Try again in {wait >= 60 ? `${Math.ceil(wait / 60)} min` : `${wait} s`}.
          </p>
        )}

        <button className="adm-btn adm-btn-primary adm-btn-block" disabled={busy || !!wait || !code}>
          {busy ? "Checking…" : first ? "Create passcode and open admin" : "Open admin"}
        </button>

        <div className="adm-honest">
          <ShieldAlert size={16} aria-hidden="true" />
          <p>
            {hasDbAuth
              ? "After this passcode step you will sign in with your database account. The database rules decide who can write."
              : <>This passcode only protects the admin <strong>in this browser</strong>. It keeps casual visitors out, but it is not real
                account security. Before you connect a shared database, add proper sign-in (see <code>docs/DATABASE.md</code>).</>}
          </p>
        </div>

        <Link to="/" className="adm-back">
          <ArrowLeft size={15} /> Back to the portfolio
        </Link>
      </form>
    </main>
  );
}
