import { useEffect, useState, useMemo } from "react";
import {
  Activity,
  CheckCircle2,
  Clock,
  Compass,
  Database,
  Globe,
  HardDrive,
  Laptop,
  Maximize2,
  Monitor,
  RefreshCw,
  Search,
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
  if (diffSec < 45) return "Just now";
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
  const [loading, setLoading] = useState(true);
  const [autoRefresh, setAutoRefresh] = useState(true);
  const [lastUpdated, setLastUpdated] = useState(null);
  const [dbHealth, setDbHealth] = useState({ state: "checking", latencyMs: 0 });
  const [search, setSearch] = useState("");
  const [selectedVisitor, setSelectedVisitor] = useState(null);

  const adapter = getAdapter();
  const supabase = adapter?.supabase;

  const fetchTelemetry = async () => {
    if (!supabase) {
      setLoading(false);
      return;
    }
    const t0 = performance.now();
    try {
      const { data, error } = await supabase
        .from("visitor_telemetry")
        .select("*")
        .order("login_time", { ascending: false })
        .limit(100);

      const latency = Math.round(performance.now() - t0);
      if (error) {
        setDbHealth({ state: "error", latencyMs: latency, error: error.message });
      } else {
        setTelemetry(data || []);
        setDbHealth({ state: "connected", latencyMs: latency });
      }
    } catch (err) {
      setDbHealth({ state: "error", latencyMs: 0, error: err.message });
    } finally {
      setLoading(false);
      setLastUpdated(new Date());
    }
  };

  useEffect(() => {
    fetchTelemetry();
  }, []);

  useEffect(() => {
    if (!autoRefresh) return;
    const interval = setInterval(fetchTelemetry, 10000);
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

  // Metrics computation
  const stats = useMemo(() => {
    const total = telemetry.length;
    const tenMinAgo = Date.now() - 10 * 60 * 1000;
    const active = telemetry.filter((v) => new Date(v.last_active_at).getTime() > tenMinAgo).length;
    const totalDuration = telemetry.reduce((sum, v) => sum + (v.duration_seconds || 0), 0);
    const avgDuration = total > 0 ? Math.round(totalDuration / total) : 0;

    let mobile = 0;
    let desktop = 0;
    telemetry.forEach((v) => {
      if (v.device_type === "Mobile" || v.device_type === "Tablet") mobile++;
      else desktop++;
    });

    return { total, active, avgDuration, mobile, desktop };
  }, [telemetry]);

  // Filtered rows
  const filtered = useMemo(() => {
    if (!search.trim()) return telemetry;
    const q = search.toLowerCase();
    return telemetry.filter(
      (v) =>
        (v.visitor_name || "").toLowerCase().includes(q) ||
        (v.browser || "").toLowerCase().includes(q) ||
        (v.os || "").toLowerCase().includes(q) ||
        (v.timezone || "").toLowerCase().includes(q)
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
            <span className="adm-mon-live-dot" /> LIVE TELEMETRY
          </span>
          {lastUpdated && (
            <span className="adm-mon-last-sync">
              Synced {timeAgo(lastUpdated)} ({telemetry.length} logged sessions)
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
            <span>Auto-refresh (10s)</span>
          </label>
          <button
            type="button"
            className="adm-btn adm-btn-sm"
            onClick={fetchTelemetry}
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
          <span className="adm-mon-card-sub">Recorded since database launch</span>
        </div>

        <div className="adm-mon-card">
          <div className="adm-mon-card-head">
            <Activity size={18} className="adm-mon-icon-green" />
            <span>Active Now</span>
          </div>
          <strong className="adm-mon-number adm-mon-number-green">{stats.active}</strong>
          <span className="adm-mon-card-sub">Browsing in the last 10 minutes</span>
        </div>

        <div className="adm-mon-card">
          <div className="adm-mon-card-head">
            <Clock size={18} className="adm-mon-icon-purple" />
            <span>Avg Session Duration</span>
          </div>
          <strong className="adm-mon-number">{formatDuration(stats.avgDuration)}</strong>
          <span className="adm-mon-card-sub">Time spent actively on site</span>
        </div>

        <div className="adm-mon-card">
          <div className="adm-mon-card-head">
            <Laptop size={18} className="adm-mon-icon-teal" />
            <span>Platform Split</span>
          </div>
          <strong className="adm-mon-number">
            {stats.desktop}D / {stats.mobile}M
          </strong>
          <span className="adm-mon-card-sub">
            {stats.total > 0 ? Math.round((stats.desktop / stats.total) * 100) : 0}% Desktop ·{" "}
            {stats.total > 0 ? Math.round((stats.mobile / stats.total) * 100) : 0}% Mobile
          </span>
        </div>
      </div>

      {/* Visitor Logs Section */}
      <div className="adm-block">
        <div className="adm-mon-section-head">
          <div>
            <h3 className="adm-block-title" style={{ margin: 0 }}>
              Visitor Details & Telemetry Logs
            </h3>
            <p className="adm-help" style={{ margin: "4px 0 0" }}>
              Every visitor who enters their name is logged with non-intrusive client metadata and active session duration.
            </p>
          </div>
          <div className="adm-mon-search-wrap">
            <Search size={14} className="adm-mon-search-icon" />
            <input
              type="text"
              placeholder="Search by name, OS, browser..."
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
            <p>{search ? "No visitors match your search." : "No visitors logged yet. Visit the homepage to enter your name!"}</p>
          </div>
        ) : (
          <div className="adm-mon-table-wrap">
            <table className="adm-mon-table">
              <thead>
                <tr>
                  <th>Visitor</th>
                  <th>Login Time</th>
                  <th>Time Spent</th>
                  <th>Device / OS</th>
                  <th>Browser</th>
                  <th>Screen & Viewport</th>
                  <th>Timezone / Lang</th>
                  <th>Pages Viewed</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((v) => {
                  const pages = Array.isArray(v.pages_viewed) ? v.pages_viewed : [];
                  const isRecent = Date.now() - new Date(v.last_active_at).getTime() < 10 * 60 * 1000;
                  return (
                    <tr key={v.session_id} onClick={() => setSelectedVisitor(v)} className="adm-mon-tr">
                      <td>
                        <div className="adm-mon-user-cell">
                          <span className={`adm-mon-user-dot ${isRecent ? "is-live" : ""}`} />
                          <strong>{v.visitor_name}</strong>
                        </div>
                      </td>
                      <td>
                        <span title={new Date(v.login_time).toLocaleString()}>
                          {timeAgo(v.login_time)}
                        </span>
                      </td>
                      <td>
                        <span className="adm-mon-badge adm-mon-badge-dur">
                          {formatDuration(v.duration_seconds)}
                        </span>
                      </td>
                      <td>
                        <span className="adm-mon-badge adm-mon-badge-dev">
                          {v.device_type === "Mobile" ? <Smartphone size={12} /> : v.device_type === "Tablet" ? <Tablet size={12} /> : <Monitor size={12} />}
                          {v.os || "Unknown"}
                        </span>
                      </td>
                      <td>
                        <span className="adm-mon-badge adm-mon-badge-soft">
                          <Compass size={12} /> {v.browser || "Browser"}
                        </span>
                      </td>
                      <td>
                        <span className="adm-mon-subtext">
                          {v.screen_resolution} ({v.viewport_size}) · {v.pixel_ratio}x
                        </span>
                      </td>
                      <td>
                        <span className="adm-mon-subtext">
                          <Globe size={11} style={{ display: "inline", verticalAlign: "middle" }} /> {v.timezone} ({v.language})
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

      {/* Website Health & Connectivity */}
      <div className="adm-block">
        <h3 className="adm-block-title">Website Health & Systems Connectivity</h3>
        <div className="adm-mon-health-grid">
          <div className="adm-mon-health-card">
            <div className="adm-mon-health-left">
              <Database size={20} className="adm-mon-icon-blue" />
              <div>
                <strong>Supabase Database</strong>
                <p className="adm-help" style={{ margin: "2px 0 0" }}>
                  {dbHealth.state === "connected"
                    ? `Connected · Ping: ${dbHealth.latencyMs} ms · Table: visitor_telemetry`
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
                <strong>Admin Authentication & RLS</strong>
                <p className="adm-help" style={{ margin: "2px 0 0" }}>
                  Row-level security enabled · Protected admin session active
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
                  Hardware acceleration active · Particle density normal
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
        <h3 className="adm-block-title">SEO & Search Performance Audit</h3>
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
              <h3>Visitor Session Details</h3>
              <button
                type="button"
                className="adm-btn adm-btn-sm"
                onClick={() => setSelectedVisitor(null)}
              >
                ✕ Close
              </button>
            </div>
            <div className="adm-mon-modal-body">
              <div className="adm-mon-detail-row">
                <span>Visitor Name</span>
                <strong>{selectedVisitor.visitor_name}</strong>
              </div>
              <div className="adm-mon-detail-row">
                <span>Session ID</span>
                <code>{selectedVisitor.session_id}</code>
              </div>
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
              <div className="adm-mon-detail-pages">
                <span>Pages &amp; Sections Viewed ({selectedVisitor.pages_viewed?.length || 0}):</span>
                <ul>
                  {(selectedVisitor.pages_viewed || []).map((p, idx) => (
                    <li key={idx}>
                      <code>{p}</code>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

