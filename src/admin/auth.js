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

export const hasPasscode = () => !!read(CRED_KEY)?.hash;

export async function setPasscode(passcode) {
  if (typeof passcode !== "string" || passcode.length < MIN_LENGTH) {
    throw new Error(`Use at least ${MIN_LENGTH} characters.`);
  }
  const salt = crypto.getRandomValues(new Uint8Array(16));
  const hash = await derive(passcode, salt, ITER);
  write(CRED_KEY, { salt: b64(salt), hash: b64(hash), iter: ITER });
  write(LOCK_KEY, { fails: 0, until: 0 });
}

/** Seconds left before another attempt is allowed (0 = allowed now). */
export function lockedSeconds() {
  const l = read(LOCK_KEY);
  return l && l.until > Date.now() ? Math.ceil((l.until - Date.now()) / 1000) : 0;
}

export async function verifyPasscode(passcode) {
  const wait = lockedSeconds();
  if (wait) return { ok: false, wait };
  const cred = read(CRED_KEY);
  if (!cred) return { ok: false, wait: 0 };
  const got = new Uint8Array(await derive(passcode || "", unb64(cred.salt), cred.iter || ITER));
  const want = unb64(cred.hash);
  let diff = got.length ^ want.length; // constant-time compare
  for (let i = 0; i < got.length; i++) diff |= got[i] ^ (want[i] || 0);
  if (diff === 0) {
    write(LOCK_KEY, { fails: 0, until: 0 });
    startSession();
    return { ok: true, wait: 0 };
  }
  const fails = (read(LOCK_KEY)?.fails || 0) + 1;
  // after 5 wrong tries: 30s, 60s, 120s ... up to 15 minutes
  const delay = fails >= 5 ? Math.min(15 * 60, 30 * 2 ** (fails - 5)) * 1000 : 0;
  write(LOCK_KEY, { fails, until: delay ? Date.now() + delay : 0 });
  return { ok: false, wait: Math.ceil(delay / 1000), left: Math.max(0, 5 - fails) };
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
