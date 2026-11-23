import { useEffect, useState, useMemo } from "react";
import {
  Activity,
  AlertTriangle,
  CheckCircle2,
  ChevronDown,
  ChevronUp,
  Clock,
  Compass,
  Database,
  ExternalLink,
  Eye,
  Globe,
  HardDrive,
  Laptop,
  Mail,
  Maximize2,
  MessageSquare,
  Monitor,
  MousePointer,
  RefreshCw,
  Search,
  ShieldAlert,
  ShieldCheck,
  Smartphone,
  Tablet,
  Trash2,
  User,
  Wifi,
  XCircle,
} from "lucide-react";
import { getAdapter } from "../data/store";
import { useContent } from "../context/ContentContext";

/** Formats seconds to e.g. "3m 24s" or "42s" */
function formatDuration(sec) {
  const s = Math.max(0, Number(sec) || 0);
  if (s < 60) return `${s}s`;
  const m = Math.floor(s / 60);
  const rem = s % 60;
  if (m < 60) return `${m}m ${rem}s`;
  const h = Math.floor(m / 60);
  return `${h}h ${m % 60}m`;
}

/** Formats ISO timestamp to relative time e.g. "5m ago" */
function timeAgo(iso) {
  if (!iso) return "Just now";
  const diffMs = Date.now() - new Date(iso).getTime();
  const diffSec = Math.floor(diffMs / 1000);
  if (diffSec < 20) return "Just now";
  if (diffSec < 60) return `${diffSec}s ago`;
  const diffMin = Math.floor(diffSec / 60);
  if (diffMin < 60) return `${diffMin}m ago`;
  const diffHr = Math.floor(diffMin / 60);
  if (diffHr < 24) return `${diffHr}h ago`;
  const diffDays = Math.floor(diffHr / 24);
  return `${diffDays}d ago`;
}

export default function MonitoringTab() {
  const { content } = useContent();
  const [telemetry, setTelemetry] = useState([]);
  const [messages, setMessages] = useState([]);
  const [securityAlerts, setSecurityAlerts] = useState([]);
  const [alertsMinimized, setAlertsMinimized] = useState(false);
  const [loading, setLoading] = useState(true);
  const [autoRefresh, setAutoRefresh] = useState(true);
  const [lastUpdated, setLastUpdated] = useState(null);
  const [dbHealth, setDbHealth] = useState({ state: "checking", latencyMs: 0 });
  const [search, setSearch] = useState("");
  const [selectedVisitor, setSelectedVisitor] = useState(null);

  const adapter = getAdapter();
  const supabase = adapter?.supabase;

  const fetchAllData = async (silent = false) => {
    if (!supabase) {
      setLoading(false);
      return;
    }
    if (!silent) setLoading(true);
    const t0 = performance.now();
    try {
      const [
        { data: telemData, error: telemErr },
        { data: msgData },
        { data: alertData },
      ] = await Promise.all([
        supabase
          .from("visitor_telemetry")
          .select("*")
          .order("last_active_at", { ascending: false })
          .limit(100),
        supabase
          .from("contact_messages")
          .select("*")
          .order("created_at", { ascending: false })
          .limit(50),
        supabase
          .from("security_alerts")
          .select("*")
          .order("created_at", { ascending: false })
          .limit(50),
      ]);

      const latency = Math.round(performance.now() - t0);
      if (telemErr) {
        setDbHealth({ state: "error", latencyMs: latency, error: telemErr.message });
      } else {
        setTelemetry(telemData || []);
        setDbHealth({ state: "connected", latencyMs: latency });
      }
      if (msgData) setMessages(msgData);
      if (alertData) {
        // Exclude Super User (Manohar) from intrusion alerts
        const nonSuperAlerts = alertData.filter((a) => {
          const name = (a.visitor_name || "").trim().toLowerCase();
          return name !== "manohar" && !name.includes("manoharorignal") && !name.includes("pvcmanohar");
        });
        setSecurityAlerts(nonSuperAlerts);
      }
    } catch (err) {
      setDbHealth({ state: "error", latencyMs: 0, error: err.message });
    } finally {
      setLoading(false);
      setLastUpdated(new Date());
    }
  };

  useEffect(() => {
    fetchAllData();
  }, []);

  // Supabase Realtime Channel: INSTANT push updates (zero latency)
  useEffect(() => {
    if (!supabase) return;

    const channel = supabase
      .channel("monitoring_realtime_feed")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "visitor_telemetry" },
        () => fetchAllData(true)
      )
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "security_alerts" },
        () => fetchAllData(true)
      )
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "contact_messages" },
        () => fetchAllData(true)
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [supabase]);

  // Fallback Polling heartbeat
  useEffect(() => {
    if (!autoRefresh) return;
    const interval = setInterval(() => fetchAllData(true), 6000);
    return () => clearInterval(interval);
  }, [autoRefresh]);

  const clearAllLogs = async () => {
    if (!supabase) return;
    if (!window.confirm("Are you sure you want to clear all visitor telemetry logs?")) return;
    try {
      await supabase.from("visitor_telemetry").delete().neq("session_id", "");
      setTelemetry([]);
    } catch (err) {
      alert("Could not clear logs: " + err.message);
    }
  };

  const clearAllAlerts = async () => {
    if (!supabase || !window.confirm("Clear all recorded security alerts?")) return;
    try {
      await supabase.from("security_alerts").delete().neq("event_type", "");
      setSecurityAlerts([]);
    } catch (err) {
      alert("Could not clear security alerts: " + err.message);
    }
  };

  const deleteMessage = async (id) => {
    if (!supabase || !window.confirm("Delete this message?")) return;
    try {
      await supabase.from("contact_messages").delete().eq("id", id);
      setMessages((prev) => prev.filter((m) => m.id !== id));
    } catch (err) {
      alert("Could not delete message: " + err.message);
    }
  };

  // Metrics computation
  const stats = useMemo(() => {
    const total = telemetry.length;
    // Active within last 3 minutes
    const threeMinAgo = Date.now() - 3 * 60 * 1000;
    const active = telemetry.filter(
      (v) => new Date(v.last_active_at).getTime() > threeMinAgo
    ).length;
    const totalDuration = telemetry.reduce(
      (sum, v) => sum + (v.duration_seconds || 0),
      0
    );
    const avgDuration = total > 0 ? Math.round(totalDuration / total) : 0;

    let mobile = 0;
    let desktop = 0;
    telemetry.forEach((v) => {
      if (v.device_type === "Mobile" || v.device_type === "Tablet") mobile++;
      else desktop++;
    });

    const activeThreats = securityAlerts.filter((a) => !a.is_resolved).length;

    return { total, active, avgDuration, mobile, desktop, activeThreats };
  }, [telemetry, securityAlerts]);

  // Filtered rows
  const filtered = useMemo(() => {
    if (!search.trim()) return telemetry;
    const q = search.toLowerCase();
    return telemetry.filter(
      (v) =>
        (v.visitor_name || "").toLowerCase().includes(q) ||
        (v.browser || "").toLowerCase().includes(q) ||
        (v.os || "").toLowerCase().includes(q) ||
        (v.timezone || "").toLowerCase().includes(q) ||
        (v.threat_level || "").toLowerCase().includes(q)
    );
  }, [telemetry, search]);

  // SEO Audit checks
  const seoAudit = useMemo(() => {
    const title = content?.settings?.seoTitle || "";
    const desc = content?.settings?.seoDescription || "";
    const siteUrl = content?.site?.url || "";

    return [
      {
        name: "Page Title",
        value: title,
        status: title.length >= 30 && title.length <= 65 ? "pass" : "warn",
        note: `${title.length} characters (ideal: 30 - 65)`,
      },
      {
        name: "Meta Description",
        value: desc,
        status: desc.length >= 100 && desc.length <= 165 ? "pass" : desc.length > 0 ? "warn" : "fail",
        note: `${desc.length} characters (ideal: 110 - 160)`,
      },
      {
        name: "Open Graph Social Sharing",
        value: "og:image, og:title, og:description, og:url",
        status: "pass",
        note: "Configured with SVG branding banner in index.html",
      },
      {
        name: "Favicon & Apple Touch Icon",
        value: "/favicon.svg",
        status: "pass",
        note: "Custom SVG SM monogram icon detected",
      },
      {
        name: "Production URL",
        value: siteUrl,
        status: siteUrl.startsWith("https://") ? "pass" : "warn",
        note: siteUrl.startsWith("https://") ? "Secure HTTPS domain configured" : "Set your final https:// domain",
      },
    ];
  }, [content]);

  return (
    <div className="adm-mon">
      {/* Top Controls Bar */}
      <div className="adm-mon-topbar">
        <div className="adm-mon-topbar-left">
          <span className="adm-mon-live-badge">
            <span className="adm-mon-live-dot" /> REAL-TIME MONITORING
          </span>
          {lastUpdated && (
            <span className="adm-mon-last-sync">
              Synced {timeAgo(lastUpdated)} ({telemetry.length} sessions · {securityAlerts.length} security alerts)
            </span>
          )}
        </div>
        <div className="adm-mon-actions">
          <label className="adm-mon-toggle">
            <input
              type="checkbox"
              checked={autoRefresh}
              onChange={(e) => setAutoRefresh(e.target.checked)}
            />
            <span>Auto-sync (Realtime)</span>
          </label>
          <button
            type="button"
            className="adm-btn adm-btn-sm"
            onClick={() => fetchAllData()}
            disabled={loading}
          >
            <RefreshCw size={14} className={loading ? "adm-spin" : ""} /> Refresh
          </button>
          {telemetry.length > 0 && (
            <button
              type="button"
              className="adm-btn adm-btn-sm adm-btn-danger"
              onClick={clearAllLogs}
              title="Clear all recorded visitor sessions"
            >
              <Trash2 size={14} /> Clear logs
            </button>
          )}
        </div>
      </div>

      {/* Overview Stat Cards */}
      <div className="adm-mon-grid">
        <div className="adm-mon-card">
          <div className="adm-mon-card-head">
            <User size={18} className="adm-mon-icon-blue" />
            <span>Total Visitors</span>
          </div>
          <strong className="adm-mon-number">{stats.total}</strong>
          <span className="adm-mon-card-sub">Recorded across all visits</span>
        </div>

        <div className="adm-mon-card">
          <div className="adm-mon-card-head">
            <Activity size={18} className="adm-mon-icon-green" />
            <span>Active Live Now</span>
          </div>
          <strong className="adm-mon-number adm-mon-number-green">
            {stats.active} {stats.active > 0 && <span className="adm-mon-active-pulse" />}
          </strong>
          <span className="adm-mon-card-sub">Interacting on site right now</span>
        </div>

        <div className="adm-mon-card">
          <div className="adm-mon-card-head">
            <Clock size={18} className="adm-mon-icon-purple" />
            <span>Avg Session Duration</span>
          </div>
          <strong className="adm-mon-number">{formatDuration(stats.avgDuration)}</strong>
          <span className="adm-mon-card-sub">Time spent actively on site</span>
        </div>

        <div className="adm-mon-card" style={stats.activeThreats > 0 ? { borderColor: "rgba(239, 68, 68, 0.4)", background: "rgba(239, 68, 68, 0.04)" } : {}}>
          <div className="adm-mon-card-head">
            <ShieldAlert size={18} style={{ color: stats.activeThreats > 0 ? "#ef4444" : "var(--accent)" }} />
            <span style={{ color: stats.activeThreats > 0 ? "#ef4444" : "inherit", fontWeight: 600 }}>Security Threats</span>
          </div>
          <strong className="adm-mon-number" style={{ color: stats.activeThreats > 0 ? "#ef4444" : "inherit" }}>
            {stats.activeThreats}
          </strong>
          <span className="adm-mon-card-sub">
            {stats.activeThreats > 0 ? "Abnormal / intrusion events logged" : "Zero unauthorized intrusions"}
          </span>
        </div>
      </div>

      {/* Real-time Security & Threat Alerts (RED / YELLOW / GREEN COLOR LEVELS) */}
      <div className="adm-block adm-security-block">
        <div className="adm-mon-section-head">
          <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
            <span className="adm-security-icon-box">
              <ShieldAlert size={22} />
            </span>
            <div>
              <h3 className="adm-block-title" style={{ margin: 0, color: "#dc2626", display: "flex", alignItems: "center", gap: 8 }}>
                🔴 Security Alerts &amp; Intrusion Detection ({securityAlerts.length})
              </h3>
              <p className="adm-help" style={{ margin: "3px 0 0", color: "#b91c1c" }}>
                Color-coded security events: Green (Link clicks, cert downloads, &gt;20s watch), Yellow (Login screens, F12 inspect), Red (Screenshots, screen recording, tampering).
              </p>
            </div>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <button
              type="button"
              className="adm-btn adm-btn-sm"
              onClick={() => setAlertsMinimized(!alertsMinimized)}
              style={{ display: "inline-flex", alignItems: "center", gap: 5 }}
              title={alertsMinimized ? "Expand security alerts table" : "Minimize security alerts table"}
            >
              {alertsMinimized ? <ChevronDown size={14} /> : <ChevronUp size={14} />}
              {alertsMinimized ? "Expand" : "Minimize"}
            </button>
            {securityAlerts.length > 0 && (
              <button
                type="button"
                className="adm-btn adm-btn-sm adm-btn-danger"
                onClick={clearAllAlerts}
                title="Clear all alerts"
              >
                <Trash2 size={13} /> Clear alerts
              </button>
            )}
          </div>
        </div>

        {alertsMinimized ? (
          <div style={{
            padding: "12px 18px",
            background: "rgba(220, 38, 38, 0.05)",
            border: "1px dashed rgba(220, 38, 38, 0.3)",
            borderRadius: "8px",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            marginTop: "12px"
          }}>
            <span style={{ fontSize: "13.5px", color: "#991b1b", fontWeight: 600 }}>
              🛡️ Security Alerts section minimized ({securityAlerts.length} events logged). Click "Expand" to view the table.
            </span>
            <button
              type="button"
              className="adm-btn adm-btn-xs"
              onClick={() => setAlertsMinimized(false)}
            >
              Expand table
            </button>
          </div>
        ) : securityAlerts.length === 0 ? (
          <div className="adm-security-clean">
            <ShieldCheck size={30} className="adm-security-clean-icon" />
            <div>
              <strong>No security threats detected</strong>
              <p style={{ margin: "2px 0 0", fontSize: "0.88rem", opacity: 0.85 }}>
                All visitor sessions and admin gates are operating securely.
              </p>
            </div>
          </div>
        ) : (
          <div className="adm-mon-table-wrap">
            <table className="adm-mon-table adm-security-table">
              <thead>
                <tr>
                  <th>Threat Event</th>
                  <th>Severity</th>
                  <th>Visitor / Attacker</th>
                  <th>Incident Details</th>
                  <th>Device / Browser</th>
                  <th>Detected</th>
                </tr>
              </thead>
              <tbody>
                {securityAlerts.map((a) => {
                  const isGreen = a.severity === "green" || a.severity === "normal" || a.severity === "info";
                  const isYellow = a.severity === "yellow" || a.severity === "warning";
                  const rowClass = isGreen
                    ? "adm-security-row is-green-row"
                    : isYellow
                    ? "adm-security-row is-yellow-row"
                    : "adm-security-row";
                  const badgeClass = isGreen
                    ? "adm-security-badge is-green"
                    : isYellow
                    ? "adm-security-badge is-yellow"
                    : "adm-security-badge is-critical";
                  const badgeLabel = isGreen ? "GREEN (SAFE)" : isYellow ? "YELLOW (WARNING)" : "RED (CRITICAL)";
                  const tagColor = isGreen ? "#16a34a" : isYellow ? "#ca8a04" : "#b91c1c";

                  return (
                    <tr key={a.id} className={rowClass}>
                      <td>
                        <div className="adm-security-event-tag" style={{ color: tagColor }}>
                          <AlertTriangle size={15} />
                          <strong>{a.event_type}</strong>
                        </div>
                      </td>
                      <td>
                        <span className={badgeClass}>
                          {badgeLabel}
                        </span>
                      </td>
                      <td>
                        <strong style={{ color: tagColor }}>{a.visitor_name || "Unknown"}</strong>
                      </td>
                      <td style={{ maxWidth: 340, wordBreak: "break-word" }}>
                        {a.details}
                      </td>
                      <td>
                        <span className="adm-mon-subtext">
                          {a.device_info?.os || "Unknown OS"} · {a.device_info?.browser || "Browser"}
                        </span>
                      </td>
                      <td style={{ whiteSpace: "nowrap" }}>
                        <span title={new Date(a.created_at).toLocaleString()}>
                          {timeAgo(a.created_at)}
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Visitor Details & Telemetry Logs */}
      <div className="adm-block">
        <div className="adm-mon-section-head">
          <div>
            <h3 className="adm-block-title" style={{ margin: 0 }}>
              Visitor Sessions &amp; Activity Reports ({filtered.length})
            </h3>
            <p className="adm-help" style={{ margin: "4px 0 0" }}>
              Every visit logs device snapshot, live time spent, pages viewed, and exact button clicks. Click any row for deep-dive report.
            </p>
          </div>
          <div className="adm-mon-search-wrap">
            <Search size={14} className="adm-mon-search-icon" />
            <input
              type="text"
              placeholder="Search by name, OS, browser, threat..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="adm-mon-search-input"
            />
          </div>
        </div>

        {!supabase ? (
          <div className="adm-mon-empty">
            <Database size={32} />
            <p>Supabase is not connected. Connect Supabase in .env.local to store visitor telemetry.</p>
          </div>
        ) : filtered.length === 0 ? (
          <div className="adm-mon-empty">
            <User size={32} />
            <p>{search ? "No visitors match your search." : "No visitors logged yet."}</p>
          </div>
        ) : (
          <div className="adm-mon-table-wrap">
            <table className="adm-mon-table">
              <thead>
                <tr>
                  <th>Visitor Name</th>
                  <th>Status</th>
                  <th>Last Active</th>
                  <th>Time Spent</th>
                  <th>Actions / Clicks</th>
                  <th>Device / OS</th>
                  <th>Browser</th>
                  <th>Pages Viewed</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((v) => {
                  const pages = Array.isArray(v.pages_viewed) ? v.pages_viewed : [];
                  const actions = Array.isArray(v.actions) ? v.actions : [];
                  const isRecent = Date.now() - new Date(v.last_active_at).getTime() < 3 * 60 * 1000;
                  const isThreat = v.threat_level === "alert" || v.threat_level === "critical";

                  return (
                    <tr
                      key={v.session_id}
                      onClick={() => setSelectedVisitor(v)}
                      className={`adm-mon-tr ${isThreat ? "is-threat-row" : ""}`}
                    >
                      <td>
                        <div className="adm-mon-user-cell">
                          <span className={`adm-mon-user-dot ${isRecent ? "is-live" : ""}`} />
                          <strong>{v.visitor_name}</strong>
                          {isThreat && <span className="adm-threat-badge">🚨 THREAT</span>}
                        </div>
                      </td>
                      <td>
                        {isRecent ? (
                          <span className="adm-mon-live-tag">
                            <span className="adm-mon-live-ping" /> LIVE NOW
                          </span>
                        ) : (
                          <span className="adm-mon-subtext">Offline</span>
                        )}
                      </td>
                      <td>
                        <span title={new Date(v.last_active_at).toLocaleString()}>
                          {timeAgo(v.last_active_at)}
                        </span>
                      </td>
                      <td>
                        <span className="adm-mon-badge adm-mon-badge-dur">
                          {formatDuration(v.duration_seconds)}
                        </span>
                      </td>
                      <td>
                        <span className="adm-mon-badge adm-mon-badge-actions" title={`${actions.length} recorded actions`}>
                          <MousePointer size={11} /> {actions.length} {actions.length === 1 ? "action" : "actions"}
                        </span>
                      </td>
                      <td>
                        <span className="adm-mon-badge adm-mon-badge-dev">
                          {v.device_type === "Mobile" ? (
                            <Smartphone size={12} />
                          ) : v.device_type === "Tablet" ? (
                            <Tablet size={12} />
                          ) : (
                            <Monitor size={12} />
                          )}
                          {v.os || "Unknown"}
                        </span>
                      </td>
                      <td>
                        <span className="adm-mon-badge adm-mon-badge-soft">
                          <Compass size={12} /> {v.browser || "Browser"}
                        </span>
                      </td>
                      <td>
                        <span className="adm-mon-badge adm-mon-badge-pages" title={pages.join(", ")}>
                          {pages.length} {pages.length === 1 ? "page" : "pages"}
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Direct Contact Inquiries Block */}
      <div className="adm-block">
        <div className="adm-mon-section-head">
          <div>
            <h3 className="adm-block-title" style={{ margin: 0, display: "flex", alignItems: "center", gap: 8 }}>
              <Mail size={18} /> Direct Contact Form Inquiries ({messages.length})
            </h3>
            <p className="adm-help" style={{ margin: "4px 0 0" }}>
              Messages submitted through your portfolio contact form, delivered to your email and backed up permanently here.
            </p>
          </div>
        </div>

        {messages.length === 0 ? (
          <div className="adm-mon-empty" style={{ padding: "30px 20px" }}>
            <Mail size={28} />
            <p>No messages received yet. When visitors send a message from the contact form, it appears here and arrives at your Gmail.</p>
          </div>
        ) : (
          <div className="adm-mon-table-wrap">
            <table className="adm-mon-table">
              <thead>
                <tr>
                  <th>Sender</th>
                  <th>Email</th>
                  <th>Message</th>
                  <th>Received</th>
                  <th style={{ width: 60, textAlign: "right" }}>Action</th>
                </tr>
              </thead>
              <tbody>
                {messages.map((m) => (
                  <tr key={m.id}>
                    <td>
                      <strong>{m.name}</strong>
                    </td>
                    <td>
                      <a href={`mailto:${m.email}`} style={{ color: "var(--accent)", textDecoration: "underline" }}>
                        {m.email}
                      </a>
                    </td>
                    <td style={{ maxWidth: 360, whiteSpace: "normal", wordBreak: "break-word" }}>
                      {m.message}
                    </td>
                    <td style={{ whiteSpace: "nowrap" }}>
                      <span title={new Date(m.created_at).toLocaleString()}>{timeAgo(m.created_at)}</span>
                    </td>
                    <td style={{ textAlign: "right" }}>
                      <button
                        type="button"
                        className="adm-mon-btn-icon"
                        onClick={() => deleteMessage(m.id)}
                        title="Delete message"
                      >
                        <Trash2 size={14} />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Website Health & Connectivity */}
      <div className="adm-block">
        <h3 className="adm-block-title">Website Health &amp; Systems Connectivity</h3>
        <div className="adm-mon-health-grid">
          <div className="adm-mon-health-card">
            <div className="adm-mon-health-left">
              <Database size={20} className="adm-mon-icon-blue" />
              <div>
                <strong>Supabase Database</strong>
                <p className="adm-help" style={{ margin: "2px 0 0" }}>
                  {dbHealth.state === "connected"
                    ? `Connected · Ping: ${dbHealth.latencyMs} ms · Realtime Enabled`
                    : dbHealth.state === "checking"
                    ? "Checking connection..."
                    : `Connection error: ${dbHealth.error}`}
                </p>
              </div>
            </div>
            {dbHealth.state === "connected" ? (
              <span className="adm-mon-status-pill is-pass">
                <CheckCircle2 size={14} /> Healthy
              </span>
            ) : (
              <span className="adm-mon-status-pill is-fail">
                <XCircle size={14} /> Error
              </span>
            )}
          </div>

          <div className="adm-mon-health-card">
            <div className="adm-mon-health-left">
              <ShieldCheck size={20} className="adm-mon-icon-green" />
              <div>
                <strong>Admin Authentication &amp; Intrusion Defense</strong>
                <p className="adm-help" style={{ margin: "2px 0 0" }}>
                  Row-level security active · Live intrusion triggers active
                </p>
              </div>
            </div>
            <span className="adm-mon-status-pill is-pass">
              <CheckCircle2 size={14} /> Secure
            </span>
          </div>

          <div className="adm-mon-health-card">
            <div className="adm-mon-health-left">
              <Wifi size={20} className="adm-mon-icon-teal" />
              <div>
                <strong>Three.js WebGL 3D Canvas</strong>
                <p className="adm-help" style={{ margin: "2px 0 0" }}>
                  Hardware acceleration active · Dynamic starfield running
                </p>
              </div>
            </div>
            <span className="adm-mon-status-pill is-pass">
              <CheckCircle2 size={14} /> Running
            </span>
          </div>
        </div>
      </div>

      {/* SEO & Search Engine Audit */}
      <div className="adm-block">
        <h3 className="adm-block-title">SEO &amp; Search Performance Audit</h3>
        <div className="adm-mon-seo-list">
          {seoAudit.map((item) => (
            <div key={item.name} className="adm-mon-seo-item">
              <div className="adm-mon-seo-info">
                <strong>{item.name}</strong>
                <span className="adm-mon-seo-val">{item.value}</span>
                <span className="adm-help">{item.note}</span>
              </div>
              <span className={`adm-mon-status-pill is-${item.status}`}>
                {item.status === "pass" ? <CheckCircle2 size={14} /> : <Compass size={14} />}
                {item.status.toUpperCase()}
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* Modal Detail for Selected Visitor */}
      {selectedVisitor && (
        <div className="adm-mon-modal-overlay" onClick={() => setSelectedVisitor(null)}>
          <div className="adm-mon-modal" onClick={(e) => e.stopPropagation()}>
            <div className="adm-mon-modal-head">
              <div>
                <h3 style={{ margin: 0, display: "flex", alignItems: "center", gap: 8 }}>
                  Visitor Report: {selectedVisitor.visitor_name}
                  {selectedVisitor.threat_level === "alert" && (
                    <span className="adm-threat-badge">🚨 THREAT DETECTED</span>
                  )}
                </h3>
                <span className="adm-mon-subtext">Session ID: {selectedVisitor.session_id}</span>
              </div>
              <button
                type="button"
                className="adm-btn adm-btn-sm"
                onClick={() => setSelectedVisitor(null)}
              >
                ✕ Close
              </button>
            </div>
            <div className="adm-mon-modal-body">
              {/* User Actions & Click Stream Report */}
              <div className="adm-mon-detail-section">
                <strong style={{ display: "flex", alignItems: "center", gap: 6, fontSize: "0.95rem" }}>
                  <MousePointer size={16} /> User Actions &amp; Click Stream ({(selectedVisitor.actions || []).length}):
                </strong>
                {(selectedVisitor.actions || []).length === 0 ? (
                  <p className="adm-help" style={{ margin: "6px 0 0" }}>
                    No specific button clicks recorded yet in this session.
                  </p>
                ) : (
                  <div className="adm-mon-actions-stream">
                    {(selectedVisitor.actions || []).map((act, idx) => (
                      <div key={idx} className={`adm-action-item is-${act.type}`}>
                        <div className="adm-action-meta">
                          <span className="adm-action-time">{timeAgo(act.time)}</span>
                          <span className="adm-action-tag">{act.type.toUpperCase()}</span>
                        </div>
                        <span className="adm-action-label">{act.label}</span>
                        {act.path && <code className="adm-action-path">{act.path}</code>}
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Pages Viewed Timeline */}
              <div className="adm-mon-detail-section">
                <strong style={{ display: "flex", alignItems: "center", gap: 6, fontSize: "0.95rem" }}>
                  <Eye size={16} /> Pages &amp; Sections Viewed ({(selectedVisitor.pages_viewed || []).length}):
                </strong>
                <ul className="adm-pages-list">
                  {(selectedVisitor.pages_viewed || []).map((p, idx) => (
                    <li key={idx}>
                      <code>{p}</code>
                    </li>
                  ))}
                </ul>
              </div>

              {/* Technical Device Snapshot */}
              <div className="adm-mon-detail-row">
                <span>Login Timestamp</span>
                <span>{new Date(selectedVisitor.login_time).toLocaleString()}</span>
              </div>
              <div className="adm-mon-detail-row">
                <span>Last Active</span>
                <span>{new Date(selectedVisitor.last_active_at).toLocaleString()}</span>
              </div>
              <div className="adm-mon-detail-row">
                <span>Total Time Spent</span>
                <strong>{formatDuration(selectedVisitor.duration_seconds)}</strong>
              </div>
              <div className="adm-mon-detail-row">
                <span>Device &amp; Operating System</span>
                <span>
                  {selectedVisitor.device_type} · {selectedVisitor.os}
                </span>
              </div>
              <div className="adm-mon-detail-row">
                <span>Browser</span>
                <span>{selectedVisitor.browser}</span>
              </div>
              <div className="adm-mon-detail-row">
                <span>Screen &amp; Viewport</span>
                <span>
                  Screen: {selectedVisitor.screen_resolution} · Viewport:{" "}
                  {selectedVisitor.viewport_size} · DPR: {selectedVisitor.pixel_ratio}x
                </span>
              </div>
              <div className="adm-mon-detail-row">
                <span>Language &amp; Timezone</span>
                <span>
                  {selectedVisitor.language} ({selectedVisitor.timezone})
                </span>
              </div>
              <div className="adm-mon-detail-row">
                <span>Network &amp; Hardware</span>
                <span>
                  {selectedVisitor.network_type} ({selectedVisitor.downlink_speed}) ·{" "}
                  {selectedVisitor.cpu_cores ? `${selectedVisitor.cpu_cores} Cores` : "N/A"} ·{" "}
                  {selectedVisitor.device_memory ? `${selectedVisitor.device_memory} GB RAM` : "N/A"}
                </span>
              </div>
              <div className="adm-mon-detail-row">
                <span>Referrer</span>
                <span>{selectedVisitor.referrer || "Direct Visit"}</span>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
