/**
 * Stealth Visitor Telemetry & Analytics Tracker
 * Collects non-intrusive client metadata and logs sessions to Supabase
 */
import { getAdapter } from "../data/store";

const SESSION_KEY = "portfolio_visitor_session_id";
const NAME_KEY = "portfolio_visitor_name";
const PAGES_KEY = "portfolio_visitor_pages";

/** Detects device type based on userAgent & touch capabilities */
function detectDevice() {
  const ua = navigator.userAgent || "";
  if (/(tablet|ipad|playbook|silk)|(android(?!.*mobi))/i.test(ua)) {
    return "Tablet";
  }
  if (/Mobile|Android|iP(hone|od)|IEMobile|BlackBerry|Kindle|Silk-Accelerated|(hpw|web)OS|Opera M(obi|ini)/i.test(ua)) {
    return "Mobile";
  }
  return "Desktop";
}

/** Detects OS */
function detectOS() {
  const ua = navigator.userAgent || "";
  if (/Windows/i.test(ua)) return "Windows";
  if (/Mac OS X|Macintosh/i.test(ua)) return "macOS";
  if (/Android/i.test(ua)) return "Android";
  if (/iPhone|iPad|iPod/i.test(ua)) return "iOS";
  if (/Linux/i.test(ua)) return "Linux";
  if (/CrOS/i.test(ua)) return "ChromeOS";
  return "Unknown OS";
}

/** Detects Browser */
function detectBrowser() {
  const ua = navigator.userAgent || "";
  if (/Edg\//i.test(ua)) return "Microsoft Edge";
  if (/OPR\/|Opera/i.test(ua)) return "Opera";
  if (/Chrome\//i.test(ua) && !/Chromium|Edg/i.test(ua)) return "Google Chrome";
  if (/Safari\//i.test(ua) && !/Chrome|Chromium/i.test(ua)) return "Safari";
  if (/Firefox\//i.test(ua)) return "Mozilla Firefox";
  if (/Brave/i.test(ua) || navigator.brave) return "Brave";
  return "Modern Browser";
}

/** Collects full non-intrusive client device snapshot */
export function getClientTelemetrySnapshot() {
  const conn = navigator.connection || navigator.mozConnection || navigator.webkitConnection;
  return {
    device_type: detectDevice(),
    os: detectOS(),
    browser: detectBrowser(),
    screen_resolution: `${window.screen?.width || 0}x${window.screen?.height || 0}`,
    viewport_size: `${window.innerWidth}x${window.innerHeight}`,
    pixel_ratio: window.devicePixelRatio || 1,
    language: navigator.language || "en",
    timezone: Intl.DateTimeFormat().resolvedOptions().timeZone || "UTC",
    network_type: conn?.effectiveType || conn?.type || "unknown",
    downlink_speed: conn?.downlink ? `${conn.downlink} Mbps` : "N/A",
    cpu_cores: navigator.hardwareConcurrency || null,
    device_memory: navigator.deviceMemory || null,
    referrer: document.referrer || "Direct Visit",
  };
}

/** Returns or creates session UUID */
export function getOrCreateSessionId() {
  let id = sessionStorage.getItem(SESSION_KEY);
  if (!id) {
    id = "vis_" + Math.random().toString(36).substring(2, 10) + "_" + Date.now().toString(36);
    sessionStorage.setItem(SESSION_KEY, id);
  }
  return id;
}

/** Checks if visitor has entered their name */
export function getStoredVisitorName() {
  return sessionStorage.getItem(NAME_KEY) || localStorage.getItem(NAME_KEY) || "";
}

/** Stores visitor name */
export function setStoredVisitorName(name) {
  const trimmed = (name || "").trim().slice(0, 80);
  if (trimmed) {
    sessionStorage.setItem(NAME_KEY, trimmed);
    localStorage.setItem(NAME_KEY, trimmed);
  }
  return trimmed;
}

/** Clears visitor session to test the gate again */
export function resetVisitorSession() {
  sessionStorage.removeItem(NAME_KEY);
  sessionStorage.removeItem(SESSION_KEY);
  sessionStorage.removeItem(PAGES_KEY);
  localStorage.removeItem(NAME_KEY);
}

/**
 * Logs visitor entry to Supabase
 */
export async function recordVisitorLogin(name) {
  const storedName = setStoredVisitorName(name);
  const sessionId = getOrCreateSessionId();
  const snapshot = getClientTelemetrySnapshot();
  const adapter = getAdapter();
  const supabase = adapter?.supabase;

  if (!supabase) {
    // If running in local storage mode without Supabase
    return { sessionId, name: storedName };
  }

  const initialPage = window.location.pathname + (window.location.hash || "");
  sessionStorage.setItem(PAGES_KEY, JSON.stringify([initialPage]));

  try {
    const payload = {
      session_id: sessionId,
      visitor_name: storedName,
      ...snapshot,
      login_time: new Date().toISOString(),
      last_active_at: new Date().toISOString(),
      duration_seconds: 0,
      pages_viewed: [initialPage],
    };

    const { error } = await supabase.from("visitor_telemetry").upsert(payload, { onConflict: "session_id" });
    if (error) {
      console.warn("Visitor telemetry write error:", error.message);
    }
  } catch (err) {
    console.warn("Could not log visitor telemetry:", err);
  }

  return { sessionId, name: storedName };
}

/**
 * Initializes continuous time-tracking and section observation
 */
export function initTelemetryTracking() {
  const sessionId = getOrCreateSessionId();
  const name = getStoredVisitorName();
  if (!name) return () => {};

  const adapter = getAdapter();
  const supabase = adapter?.supabase;
  if (!supabase) return () => {};

  let secondsSpent = 0;
  let pages = [];
  try {
    pages = JSON.parse(sessionStorage.getItem(PAGES_KEY) || "[]");
  } catch {
    pages = [];
  }

  const trackCurrentPage = () => {
    const current = window.location.pathname + (window.location.hash || "");
    if (!pages.includes(current)) {
      pages.push(current);
      sessionStorage.setItem(PAGES_KEY, JSON.stringify(pages));
    }
  };

  trackCurrentPage();
  window.addEventListener("hashchange", trackCurrentPage);
  window.addEventListener("popstate", trackCurrentPage);

  const flushTelemetry = async () => {
    try {
      await supabase
        .from("visitor_telemetry")
        .update({
          last_active_at: new Date().toISOString(),
          duration_seconds: secondsSpent,
          pages_viewed: pages,
        })
        .eq("session_id", sessionId);
    } catch {
      // quiet catch on exit
    }
  };

  // Heartbeat every 15 seconds
  const interval = setInterval(() => {
    secondsSpent += 15;
    flushTelemetry();
  }, 15000);

  const onVisibilityChange = () => {
    if (document.visibilityState === "hidden") {
      flushTelemetry();
    }
  };

  document.addEventListener("visibilitychange", onVisibilityChange);
  window.addEventListener("beforeunload", flushTelemetry);

  return () => {
    clearInterval(interval);
    window.removeEventListener("hashchange", trackCurrentPage);
    window.removeEventListener("popstate", trackCurrentPage);
    document.removeEventListener("visibilitychange", onVisibilityChange);
    window.removeEventListener("beforeunload", flushTelemetry);
  };
}

