/**
 * Stealth Visitor Telemetry & Real-Time Analytics Tracker
 * High-performance, non-blocking telemetry with live activity tracking and intrusion detection.
 */
import { getAdapter } from "../data/store";

const SESSION_KEY = "portfolio_visitor_session_id";
const SESSION_LOGGED_KEY = "portfolio_session_logged_v2";
const NAME_KEY = "portfolio_visitor_name";
const PAGES_KEY = "portfolio_visitor_pages";
const ACTIONS_KEY = "portfolio_visitor_actions";

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

/** Returns or creates session UUID for this visit */
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
  sessionStorage.removeItem(SESSION_LOGGED_KEY);
  sessionStorage.removeItem(PAGES_KEY);
  sessionStorage.removeItem(ACTIONS_KEY);
  localStorage.removeItem(NAME_KEY);
}

// In-memory actions buffer
let bufferedActions = [];
try {
  bufferedActions = JSON.parse(sessionStorage.getItem(ACTIONS_KEY) || "[]");
} catch {
  bufferedActions = [];
}

/** Logs a visitor action (button click, modal open, link click) */
export function logVisitorAction(label, type = "click", meta = {}) {
  const actionObj = {
    type,
    label: String(label || "").slice(0, 100),
    path: window.location.pathname + (window.location.hash || ""),
    time: new Date().toISOString(),
    ...meta,
  };
  bufferedActions.push(actionObj);
  if (bufferedActions.length > 50) bufferedActions.shift();
  try {
    sessionStorage.setItem(ACTIONS_KEY, JSON.stringify(bufferedActions));
  } catch {
    /* ignore */
  }

  // Quick async flush
  flushTelemetryData(true);
}

/**
 * Checks if the current visitor is the Super User (Manohar).
 * Super User activities are tracked in telemetry logs, but excluded from intrusion alerts.
 */
export function isSuperUserVisitor() {
  try {
    const visitorName = (getStoredVisitorName() || "").trim().toLowerCase();
    if (visitorName === "manohar" || visitorName.startsWith("manohar")) return true;
    if (typeof window !== "undefined") {
      if (sessionStorage.getItem("portfolio.super_user") === "true") return true;
      if (localStorage.getItem("portfolio.super_user") === "true") return true;
      if (sessionStorage.getItem("portfolio.auth_role") === "superuser") return true;
      const email = (sessionStorage.getItem("portfolio.auth_email") || "").toLowerCase();
      if (email === "manoharorignal@gmail.com" || email === "pvcmanohar@gmail.com" || email.includes("manohar")) return true;
    }
  } catch {
    /* ignore */
  }
  return false;
}

/** Records a security alert into Supabase and marks session as threat */
export async function recordSecurityAlert({ event_type, severity = "critical", details = "", metadata = {} }) {
  const sessionId = getOrCreateSessionId();
  const visitorName = getStoredVisitorName() || "Anonymous Visitor";
  const snapshot = getClientTelemetrySnapshot();
  const adapter = getAdapter();
  const supabase = adapter?.supabase;

  // RULE: If Super User (Manohar) is using the website:
  // Track user activity in telemetry & action stream, but DO NOT create security alerts!
  if (isSuperUserVisitor()) {
    logVisitorAction(`SUPER USER ACTIVITY: ${event_type}`, "activity", { severity, details });
    return;
  }

  // Alert Severity Classification:
  // Green: downloading certificates, clicking link, watching something > 20s
  // Yellow: accessing login screen, pressing F12 in keyboard
  // Red (critical): remaining everything (screenshots, screen recording, context menu, print, copy, wrong passwords)
  let normalizedSeverity = severity;
  const upperType = String(event_type || "").toUpperCase();
  if (
    upperType === "WEBSITE_LINK_CLICK" || 
    upperType === "CERTIFICATE_DOWNLOAD" || 
    upperType === "FILE_DOWNLOAD_ATTEMPT" || 
    upperType.includes("20S")
  ) {
    normalizedSeverity = "green";
  } else if (
    upperType === "ADMIN_PORTAL_ACCESSED" || 
    upperType === "DEVTOOLS_INSPECT" ||
    upperType === "DEVTOOLS_F12"
  ) {
    normalizedSeverity = "yellow";
  } else if (!["green", "yellow"].includes(normalizedSeverity)) {
    normalizedSeverity = "critical";
  }

  const alertPayload = {
    session_id: sessionId,
    visitor_name: visitorName,
    event_type: upperType || "UNKNOWN_ALERT",
    severity: normalizedSeverity,
    details,
    device_info: { ...snapshot, ...metadata },
    created_at: new Date().toISOString(),
    is_resolved: false,
  };

  // 1. Insert into security_alerts table
  if (supabase) {
    try {
      supabase.from("security_alerts").insert([alertPayload]).then(({ error }) => {
        if (error) console.warn("Security alert insert error:", error.message);
      });
    } catch (e) {
      console.warn("Could not dispatch security alert:", e);
    }

    // 2. Also flag visitor_telemetry
    try {
      const threatLevel = normalizedSeverity === "critical" ? "critical" : (normalizedSeverity === "yellow" ? "alert" : "normal");
      supabase
        .from("visitor_telemetry")
        .update({
          threat_level: threatLevel,
          last_active_at: new Date().toISOString(),
        })
        .eq("session_id", sessionId)
        .then(() => {});
    } catch {
      /* ignore */
    }
  }

  // Also log into actions stream
  logVisitorAction(`SECURITY ALERT (${normalizedSeverity.toUpperCase()}): ${event_type}`, "security", { severity: normalizedSeverity, details });
}

/**
 * Logs visitor entry to Supabase (NON-BLOCKING)
 */
export function recordVisitorLogin(name) {
  const storedName = setStoredVisitorName(name);
  const sessionId = getOrCreateSessionId();
  sessionStorage.setItem(SESSION_LOGGED_KEY, "1");

  const snapshot = getClientTelemetrySnapshot();
  const adapter = getAdapter();
  const supabase = adapter?.supabase;

  const initialPage = window.location.pathname + (window.location.hash || "");
  sessionStorage.setItem(PAGES_KEY, JSON.stringify([initialPage]));

  if (!supabase) {
    return Promise.resolve({ sessionId, name: storedName });
  }

  const payload = {
    session_id: sessionId,
    visitor_name: storedName,
    ...snapshot,
    login_time: new Date().toISOString(),
    last_active_at: new Date().toISOString(),
    duration_seconds: 0,
    pages_viewed: [initialPage],
    actions: bufferedActions,
    threat_level: "normal",
  };

  // Non-blocking fire-and-forget upsert
  supabase
    .from("visitor_telemetry")
    .upsert(payload, { onConflict: "session_id" })
    .then(({ error }) => {
      if (error) console.warn("Visitor telemetry write error:", error.message);
    })
    .catch((err) => console.warn("Visitor telemetry network error:", err));

  return Promise.resolve({ sessionId, name: storedName });
}

let activeTrackingInitialized = false;
let flushTimer = null;
let secondsSpent = 0;

/** Flushes telemetry updates to Supabase */
function flushTelemetryData(quick = false) {
  const sessionId = getOrCreateSessionId();
  const adapter = getAdapter();
  const supabase = adapter?.supabase;
  if (!supabase) return;

  let pages = [];
  try {
    pages = JSON.parse(sessionStorage.getItem(PAGES_KEY) || "[]");
  } catch {
    pages = [];
  }

  const updatePayload = {
    last_active_at: new Date().toISOString(),
    duration_seconds: secondsSpent,
    pages_viewed: pages,
    actions: bufferedActions,
  };

  supabase
    .from("visitor_telemetry")
    .update(updatePayload)
    .eq("session_id", sessionId)
    .then(() => {})
    .catch(() => {});
}

/**
 * Initializes continuous time-tracking, activity observation and intrusion detection
 */
export function initTelemetryTracking() {
  if (activeTrackingInitialized) return () => {};
  activeTrackingInitialized = true;

  const sessionId = getOrCreateSessionId();
  const name = getStoredVisitorName();

  // If returning visitor whose session hasn't been logged in this tab yet:
  const isSessionLogged = sessionStorage.getItem(SESSION_LOGGED_KEY);
  if (!isSessionLogged && name) {
    recordVisitorLogin(name);
  }

  // 1. Pages and sections observer
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
      logVisitorAction(`Navigated to ${current}`, "navigation");
    }
  };

  trackCurrentPage();
  window.addEventListener("hashchange", trackCurrentPage);
  window.addEventListener("popstate", trackCurrentPage);

  // 2. Global Button / Action Click Interceptor
  const handleClick = (e) => {
    try {
      const target = e.target.closest(
        "button, a, [role='button'], .project-card, .reel, .chip, .tag, .social-row a, .channel-btn, .channel-value-link, .welcome-gate-btn"
      );
      if (!target) return;

      let label =
        target.getAttribute("aria-label") ||
        target.title ||
        target.innerText ||
        target.getAttribute("data-label") ||
        "";

      label = label.replace(/\s+/g, " ").trim();
      if (!label && target.tagName.toLowerCase() === "a") {
        label = target.href || "Link";
      }

      if (label) {
        logVisitorAction(`Clicked ${label.slice(0, 60)}`, "click", {
          tag: target.tagName.toLowerCase(),
          href: target.href || null,
        });

        // 1. GREEN ALERT: Website link clicks
        const linkElem = target.tagName.toLowerCase() === "a" ? target : target.closest("a");
        if (linkElem) {
          const href = linkElem.getAttribute("href") || linkElem.href || "";
          const isExternal = /^https?:\/\/|^mailto:|^tel:/i.test(href);
          const linkKind = isExternal ? "External Outbound Link" : "Website Navigation Link";

          recordSecurityAlert({
            event_type: "WEBSITE_LINK_CLICK",
            severity: "green",
            details: `Safe: Visitor clicked ${linkKind}: "${label.slice(0, 50) || href}" (${href})`,
            metadata: { href, is_external: isExternal, tag: linkElem.tagName },
          });
        }

        // 2. RED ALERT: Content sharing attempt
        const isShare =
          /share|forward|tweet|post|copy\s*link/i.test(label) ||
          /share|social-share/i.test(target.className || "") ||
          target.hasAttribute("data-share");

        if (isShare) {
          recordSecurityAlert({
            event_type: "CONTENT_SHARE_ATTEMPT",
            severity: "critical",
            details: `CRITICAL: Visitor attempted to share website link or content: "${label.slice(0, 80)}"`,
            metadata: { label, href: target.href || null },
          });
        }

        // 3. GREEN ALERT: Certificate / document download
        const isDownload =
          target.hasAttribute("download") ||
          target.classList?.contains("nav-resume") ||
          target.classList?.contains("cert-action-btn") ||
          /download|resume|certificate|marksheet|pdf/i.test(label) ||
          /download|resume|cert/i.test(target.className || "");

        if (isDownload) {
          recordSecurityAlert({
            event_type: "CERTIFICATE_DOWNLOAD",
            severity: "green",
            details: `Safe: Visitor downloaded or viewed certificate/document: "${label.slice(0, 80)}"`,
            metadata: { target_tag: target.tagName, href: target.href || null },
          });
        }
      }
    } catch {
      /* ignore */
    }
  };
  document.addEventListener("click", handleClick, { passive: true, capture: true });

  // 3. Security Listeners: Screenshots, Video Recording & DevTools
  const handleKeydown = (e) => {
    // PrintScreen (RED ALERT)
    if (e.key === "PrintScreen") {
      recordSecurityAlert({
        event_type: "SCREENSHOT_ATTEMPT",
        severity: "critical",
        details: "CRITICAL: Visitor pressed PrintScreen key",
      });
      return;
    }

    // Windows+Shift+S (Snipping Tool trigger on Windows - RED ALERT)
    if (e.shiftKey && (e.metaKey || e.ctrlKey) && (e.key === "s" || e.key === "S")) {
      recordSecurityAlert({
        event_type: "SCREENSHOT_ATTEMPT",
        severity: "critical",
        details: "CRITICAL: Visitor triggered screenshot shortcut (Ctrl/Win + Shift + S)",
      });
      return;
    }

    // Mac Cmd+Shift+3 or 4 or 5 (RED ALERT)
    if (e.metaKey && e.shiftKey && ["3", "4", "5"].includes(e.key)) {
      recordSecurityAlert({
        event_type: "SCREENSHOT_ATTEMPT",
        severity: "critical",
        details: `CRITICAL: Visitor triggered macOS screenshot shortcut (Cmd + Shift + ${e.key})`,
      });
      return;
    }

    // Ctrl+P (Print page - RED ALERT)
    if ((e.ctrlKey || e.metaKey) && (e.key === "p" || e.key === "P")) {
      recordSecurityAlert({
        event_type: "PRINT_PAGE_ATTEMPT",
        severity: "critical",
        details: "CRITICAL: Visitor attempted to print / save PDF page (Ctrl+P)",
      });
      return;
    }

    // F12 or DevTools inspection keys (YELLOW ALERT)
    if (e.key === "F12") {
      recordSecurityAlert({
        event_type: "DEVTOOLS_INSPECT",
        severity: "yellow",
        details: "Warning: Visitor pressed F12 developer inspection key",
      });
      return;
    }

    if ((e.ctrlKey || e.metaKey) && e.shiftKey && ["I", "i", "J", "j", "C", "c"].includes(e.key)) {
      recordSecurityAlert({
        event_type: "DEVTOOLS_INSPECT",
        severity: "yellow",
        details: `Warning: Visitor opened developer tools inspection via shortcut (${e.key})`,
      });
      return;
    }
  };
  window.addEventListener("keydown", handleKeydown, { passive: true });

  // 4. Right-click Context Menu alert
  const handleContextMenu = () => {
    recordSecurityAlert({
      event_type: "RIGHT_CLICK_INSPECT",
      severity: "critical",
      details: "CRITICAL: Visitor attempted right-click to inspect element or save image/source",
    });
  };
  window.addEventListener("contextmenu", handleContextMenu, { passive: true });

  // 5. Text / Content Copy alert
  const handleCopy = () => {
    const selectedText = window.getSelection()?.toString() || "";
    recordSecurityAlert({
      event_type: "CONTENT_COPY_ATTEMPT",
      severity: "critical",
      details: selectedText
        ? `CRITICAL: Visitor copied content: "${selectedText.slice(0, 60)}..."`
        : "CRITICAL: Visitor copied website content / text",
    });
  };
  document.addEventListener("copy", handleCopy, { passive: true });

  // 4. Intercept getDisplayMedia (Screen Recording / Tab Capture)
  try {
    if (navigator.mediaDevices && navigator.mediaDevices.getDisplayMedia) {
      const originalGetDisplayMedia = navigator.mediaDevices.getDisplayMedia.bind(navigator.mediaDevices);
      navigator.mediaDevices.getDisplayMedia = async function (...args) {
        recordSecurityAlert({
          event_type: "SCREEN_RECORDING_DETECTED",
          severity: "critical",
          details: "Visitor requested display / screen recording stream",
        });
        return originalGetDisplayMedia(...args);
      };
    }
  } catch {
    /* ignore */
  }

  // Intercept native navigator.share dialog
  try {
    if (navigator.share) {
      const originalShare = navigator.share.bind(navigator);
      navigator.share = async function (data) {
        recordSecurityAlert({
          event_type: "CONTENT_SHARE_ATTEMPT",
          severity: "critical",
          details: `CRITICAL: Visitor shared website content via native share: ${data?.title || data?.url || "website share"}`,
          metadata: data || {},
        });
        return originalShare(data);
      };
    }
  } catch {
    /* ignore */
  }

  // 5. Admin Navigation Alert (YELLOW WARNING) for visitors entering /admin
  if (window.location.pathname.startsWith("/admin")) {
    recordSecurityAlert({
      event_type: "ADMIN_PORTAL_ACCESSED",
      severity: "yellow",
      details: "Warning: Visitor navigated directly to /admin sign-in screen",
    });
  }

  // 6. Fast Heartbeat (every 5 seconds) to ensure real-time live telemetry
  let logged20sWatch = false;
  flushTimer = setInterval(() => {
    secondsSpent += 5;
    // GREEN ALERT: visitor watches or browses site for > 20 seconds
    if (secondsSpent >= 20 && !logged20sWatch) {
      logged20sWatch = true;
      recordSecurityAlert({
        event_type: "WATCH_TIME_20S",
        severity: "green",
        details: "Activity: Visitor watched website content for more than 20 seconds",
      });
    }
    flushTelemetryData();
  }, 5000);

  const onVisibilityChange = () => {
    if (document.visibilityState === "hidden") {
      flushTelemetryData(true);
    }
  };

  document.addEventListener("visibilitychange", onVisibilityChange);
  window.addEventListener("beforeunload", () => flushTelemetryData(true));

  return () => {
    activeTrackingInitialized = false;
    clearInterval(flushTimer);
    window.removeEventListener("hashchange", trackCurrentPage);
    window.removeEventListener("popstate", trackCurrentPage);
    document.removeEventListener("click", handleClick, { capture: true });
    window.removeEventListener("keydown", handleKeydown);
    window.removeEventListener("contextmenu", handleContextMenu);
    document.removeEventListener("copy", handleCopy);
    document.removeEventListener("visibilitychange", onVisibilityChange);
  };
}
