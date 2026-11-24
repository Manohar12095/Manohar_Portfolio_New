/* ============================================================================
   ADMIN PASSCODE (browser-side)

   What it does:  asks for a passcode before showing /admin, stores only a salted
                  PBKDF2 hash (never the passcode), slows down guessing, and
                  locks itself after 30 minutes of inactivity.
   What it can't do: it runs in the visitor's browser, so it can only discourage casual
                  access. It is NOT real security. Before you connect a database that
                  every visitor shares, protect writes with real authentication
                  (for example Supabase Auth + row-level security). See docs/DATABASE.md.
   ========================================================================== */

const CRED_KEY = "portfolio.admin.v1"; // { salt, hash, iter }
const LOCK_KEY = "portfolio.admin.lock"; // { fails, until }
const SESSION_KEY = "portfolio.admin.session"; // timestamp (sessionStorage)
const ITER = 150000;
const IDLE_MS = 30 * 60 * 1000;
export const MIN_LENGTH = 8;

const b64 = (buf) => btoa(String.fromCharCode(...new Uint8Array(buf)));
const unb64 = (s) => Uint8Array.from(atob(s), (c) => c.charCodeAt(0));

async function derive(passcode, salt, iter) {
  const key = await crypto.subtle.importKey("raw", new TextEncoder().encode(passcode), "PBKDF2", false, ["deriveBits"]);
  return crypto.subtle.deriveBits({ name: "PBKDF2", hash: "SHA-256", salt, iterations: iter }, key, 256);
}

function read(key, store = window.localStorage) {
  try {
    return JSON.parse(store.getItem(key));
  } catch {
    return null;
  }
}
function write(key, value, store = window.localStorage) {
  try {
    store.setItem(key, JSON.stringify(value));
  } catch {
    /* storage blocked */
  }
}

// Clear any legacy client-side passcode credentials
try {
  if (typeof window !== "undefined") {
    window.localStorage?.removeItem(CRED_KEY);
    window.localStorage?.removeItem(LOCK_KEY);
  }
} catch {
  /* ignore */
}

export const hasPasscode = () => false;

export async function setPasscode() {
  throw new Error("Local passcodes are permanently disabled. Authentication is handled exclusively by Supabase Database Auth.");
}

/** Seconds left before another attempt is allowed (0 = allowed now). */
export function lockedSeconds() {
  return 0;
}

export async function verifyPasscode() {
  return { ok: false, wait: 0 };
}

export function startSession() {
  write(SESSION_KEY, Date.now(), window.sessionStorage);
}
export function touchSession() {
  if (isSessionActive()) startSession();
}
export function endSession() {
  try {
    window.sessionStorage.removeItem(SESSION_KEY);
  } catch {
    /* ignore */
  }
}
export function isSessionActive() {
  const t = read(SESSION_KEY, window.sessionStorage);
  return typeof t === "number" && Date.now() - t < IDLE_MS;
}
