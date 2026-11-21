import { useEffect, useState, useMemo } from "react";
import { 
  Users, User, Search, RefreshCw, Smartphone, Laptop, Tablet, 
  Clock, Eye, MousePointer, ShieldAlert, AlertTriangle, CheckCircle2,
  Calendar, Globe, Activity, X, ChevronRight, Filter
} from "lucide-react";
import { getAdapter } from "../data/store";

export default function UsersTab() {
  const [telemetry, setTelemetry] = useState([]);
  const [securityAlerts, setSecurityAlerts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [threatFilter, setThreatFilter] = useState("all");
  const [selectedUser, setSelectedUser] = useState(null);

  const adapter = getAdapter();
  const supabase = adapter?.supabase;

  const fetchData = async () => {
    if (!supabase) return;
    setLoading(true);
    try {
      const [telRes, secRes] = await Promise.all([
        supabase.from("visitor_telemetry").select("*").order("last_active_at", { ascending: false }),
        supabase.from("security_alerts").select("*").order("created_at", { ascending: false })
      ]);
      setTelemetry(telRes.data || []);
      setSecurityAlerts(secRes.data || []);
    } catch (err) {
      console.warn("Error fetching users data:", err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const filteredUsers = useMemo(() => {
    return telemetry.filter((u) => {
      const matchThreat = threatFilter === "all" || u.threat_level === threatFilter;
      const q = search.toLowerCase();
      const matchSearch =
        !q ||
        (u.visitor_name && u.visitor_name.toLowerCase().includes(q)) ||
        (u.browser && u.browser.toLowerCase().includes(q)) ||
        (u.os && u.os.toLowerCase().includes(q)) ||
        (u.device_type && u.device_type.toLowerCase().includes(q));
      return matchThreat && matchSearch;
    });
  }, [telemetry, threatFilter, search]);

  // Alerts for selected user
  const userAlerts = useMemo(() => {
    if (!selectedUser) return [];
    return securityAlerts.filter(
      (a) => a.session_id === selectedUser.session_id || a.visitor_name === selectedUser.visitor_name
    );
  }, [selectedUser, securityAlerts]);

  const formatDuration = (sec) => {
    const s = Math.max(0, Number(sec) || 0);
    if (s < 60) return `${s}s`;
    const m = Math.floor(s / 60);
    return `${m}m ${s % 60}s`;
  };

  return (
    <div className="adm-users-tab">
      {/* Top Banner */}
      <div className="adm-users-header">
        <div className="adm-users-title">
          <h3><Users size={20} /> Visitor Profiles & Activity Inspector</h3>
          <p>
            Browse real-time collected visitor dossiers, their session durations, clicked elements, and security threats.
          </p>
        </div>
        <button type="button" className="adm-btn adm-btn-sm" onClick={fetchData} title="Refresh">
          <RefreshCw size={14} className={loading ? "spin" : ""} /> Refresh Data
        </button>
      </div>

      {/* Filter and Search Bar */}
      <div className="adm-users-toolbar">
        <div className="adm-users-search">
          <Search size={16} />
          <input
            type="text"
            placeholder="Search visitor name, OS, browser..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>

        <div className="adm-users-filters">
          <select
            value={threatFilter}
            onChange={(e) => setThreatFilter(e.target.value)}
            className="adm-users-select"
            aria-label="Filter by threat level"
          >
            <option value="all">All Visitors ({telemetry.length})</option>
            <option value="critical">Critical Threats ({telemetry.filter(t => t.threat_level === 'critical').length})</option>
            <option value="alert">Alerts ({telemetry.filter(t => t.threat_level === 'alert').length})</option>
            <option value="normal">Normal Visitors ({telemetry.filter(t => t.threat_level === 'normal' || !t.threat_level).length})</option>
          </select>
        </div>
      </div>

      {/* Users Master-Detail Layout */}
      <div className="adm-users-layout">
        <div className="adm-users-list-pane">
          {filteredUsers.length === 0 ? (
            <div className="adm-empty-box">No visitor records matching criteria.</div>
          ) : (
            filteredUsers.map((u) => {
              const isSelected = selectedUser?.session_id === u.session_id;
              const hasCritical = u.threat_level === "critical";
              const hasAlert = u.threat_level === "alert";

              return (
                <div
                  key={u.session_id}
                  className={`adm-user-card ${isSelected ? "is-selected" : ""} ${hasCritical ? "is-critical" : hasAlert ? "is-alert" : ""}`}
                  onClick={() => setSelectedUser(u)}
                >
                  <div className="adm-user-card-top">
                    <div className="adm-user-avatar">
                      <User size={18} />
                    </div>
                    <div className="adm-user-name-box">
                      <strong>{u.visitor_name || "Anonymous Visitor"}</strong>
                      <span className="adm-user-device">
                        {u.device_type} · {u.os} · {u.browser}
                      </span>
                    </div>
                    {hasCritical && (
                      <span className="adm-badge-critical">
                        <ShieldAlert size={12} /> CRITICAL
                      </span>
                    )}
                    {hasAlert && !hasCritical && (
                      <span className="adm-badge-alert">
                        <AlertTriangle size={12} /> ALERT
                      </span>
                    )}
                  </div>

                  <div className="adm-user-card-bottom">
                    <span><Clock size={12} /> {formatDuration(u.duration_seconds)}</span>
                    <span><Eye size={12} /> {(u.pages_viewed || []).length} pages</span>
                    <span><MousePointer size={12} /> {(u.actions || []).length} actions</span>
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Detail Inspector Pane */}
        <div className="adm-users-detail-pane">
          {selectedUser ? (
            <div className="adm-user-detail-card">
              <div className="adm-detail-head">
                <div>
                  <h2>{selectedUser.visitor_name || "Anonymous Visitor"}</h2>
                  <span className="adm-detail-session">Session: {selectedUser.session_id}</span>
                </div>
                <button type="button" className="adm-btn-icon" onClick={() => setSelectedUser(null)}>
                  <X size={18} />
                </button>
              </div>

              {/* Security Alerts (in red) */}
              {userAlerts.length > 0 && (
                <div className="adm-user-threats-box">
                  <h4><ShieldAlert size={16} /> Security Alerts For This Visitor ({userAlerts.length}):</h4>
                  <div className="adm-threats-list">
                    {userAlerts.map((alt) => (
                      <div key={alt.id} className="adm-threat-item is-red">
                        <div className="adm-threat-badge">{alt.event_type}</div>
                        <p className="adm-threat-details">{alt.details}</p>
                        <span className="adm-threat-time">
                          {new Date(alt.created_at).toLocaleTimeString()}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Hardware & Network Snapshot */}
              <div className="adm-detail-section">
                <h4>Device & Network Snapshot</h4>
                <div className="adm-detail-grid">
                  <div><strong>Device Type:</strong> {selectedUser.device_type || "N/A"}</div>
                  <div><strong>OS:</strong> {selectedUser.os || "N/A"}</div>
                  <div><strong>Browser:</strong> {selectedUser.browser || "N/A"}</div>
                  <div><strong>Screen:</strong> {selectedUser.screen_resolution || "N/A"}</div>
                  <div><strong>Viewport:</strong> {selectedUser.viewport_size || "N/A"}</div>
                  <div><strong>Network:</strong> {selectedUser.network_type || "N/A"} ({selectedUser.downlink_speed || "N/A"})</div>
                  <div><strong>Timezone:</strong> {selectedUser.timezone || "N/A"}</div>
                  <div><strong>Language:</strong> {selectedUser.language || "N/A"}</div>
                  <div><strong>Duration:</strong> {formatDuration(selectedUser.duration_seconds)}</div>
                  <div><strong>First Seen:</strong> {new Date(selectedUser.login_time).toLocaleString()}</div>
                  <div><strong>Last Active:</strong> {new Date(selectedUser.last_active_at).toLocaleString()}</div>
                </div>
              </div>

              {/* Pages Visited */}
              <div className="adm-detail-section">
                <h4>Pages Visited ({(selectedUser.pages_viewed || []).length})</h4>
                <div className="adm-detail-pages">
                  {(selectedUser.pages_viewed || []).map((page, idx) => (
                    <span key={idx} className="adm-page-badge">{page}</span>
                  ))}
                </div>
              </div>

              {/* Actions / Click Stream */}
              <div className="adm-detail-section">
                <h4>Interactive Click Stream ({(selectedUser.actions || []).length} Actions)</h4>
                <div className="adm-actions-stream">
                  {(selectedUser.actions || []).length === 0 ? (
                    <p className="adm-subtle">No clicks logged yet.</p>
                  ) : (
                    (selectedUser.actions || []).map((act, idx) => (
                      <div key={idx} className="adm-action-item">
                        <span className="adm-action-dot" />
                        <div className="adm-action-info">
                          <strong>{act.label}</strong>
                          <span className="adm-action-meta">
                            {act.type} · {act.path || ""} · {act.time ? new Date(act.time).toLocaleTimeString() : ""}
                          </span>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            </div>
          ) : (
            <div className="adm-detail-placeholder">
              <User size={48} className="adm-ph-icon" />
              <h3>Select a visitor to view detailed activity</h3>
              <p>
                Click any user on the left to inspect their device footprint, page history, actions, and security alerts.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
