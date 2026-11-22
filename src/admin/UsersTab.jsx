import { useEffect, useState, useMemo } from "react";
import { 
  Users, User, Search, RefreshCw, Smartphone, Laptop, Tablet, 
  Clock, Eye, MousePointer, ShieldAlert, AlertTriangle, CheckCircle2,
  Calendar, Globe, Activity, X, ChevronRight, Filter, Ban, Unlock, Shield, AlertCircle
} from "lucide-react";
import { getAdapter } from "../data/store";
import { BLOCK_DURATIONS, enforceVisitorBlock, releaseVisitorBlock } from "../lib/blocking";

export default function UsersTab({ currentUserEmail, currentUserRole }) {
  const [telemetry, setTelemetry] = useState([]);
  const [securityAlerts, setSecurityAlerts] = useState([]);
  const [blocksList, setBlocksList] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [threatFilter, setThreatFilter] = useState("all");
  const [selectedUser, setSelectedUser] = useState(null);

  // Blocking Modal State
  const [blockingTarget, setBlockingTarget] = useState(null);
  const [selectedDuration, setSelectedDuration] = useState("1d");
  const [customReason, setCustomReason] = useState("Suspicious link clicking activity");
  const [blockSubmitting, setBlockSubmitting] = useState(false);
  const [actionSuccessMsg, setActionSuccessMsg] = useState("");

  const adapter = getAdapter();
  const supabase = adapter?.supabase;
  const isSuperUser = 
    currentUserRole === "superuser" || 
    currentUserEmail === "manoharorignal@gmail.com" || 
    currentUserEmail === "pvcmanohar@gmail.com";

  const fetchData = async () => {
    if (!supabase || !isSuperUser) return;
    setLoading(true);
    try {
      const [telRes, secRes, blkRes] = await Promise.all([
        supabase.from("visitor_telemetry").select("*").order("last_active_at", { ascending: false }),
        supabase.from("security_alerts").select("*").order("created_at", { ascending: false }),
        supabase.from("visitor_blocks").select("*").eq("is_active", true).order("created_at", { ascending: false })
      ]);
      setTelemetry(telRes.data || []);
      setSecurityAlerts(secRes.data || []);
      setBlocksList(blkRes.data || []);
    } catch (err) {
      console.warn("Error fetching users data:", err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isSuperUser) {
      fetchData();
    }
  }, [isSuperUser]);

  if (!isSuperUser) {
    return (
      <div className="adm-access-denied-card" style={{ padding: "48px 24px", textAlign: "center", background: "rgba(15, 23, 42, 0.6)", borderRadius: "16px", border: "1px solid rgba(239, 68, 68, 0.25)", margin: "20px auto", maxWidth: "600px" }}>
        <ShieldAlert size={48} color="#ef4444" style={{ margin: "0 auto 16px", display: "block" }} />
        <h3 style={{ color: "#f87171", margin: "0 0 10px" }}>Access Restricted: Super User Only</h3>
        <p style={{ color: "var(--text-soft)", fontSize: "14px", lineHeight: "1.6", margin: 0 }}>
          Visitor profiles, activity tracking, link click alerts, and device dossiers are confidential and accessible only to Manohar (Super User).
        </p>
      </div>
    );
  }

  // Helper to find active block for a visitor
  const getActiveBlock = (sessionId, visitorName) => {
    return blocksList.find((b) => {
      if (sessionId && b.session_id === sessionId) return true;
      if (visitorName && b.visitor_name && b.visitor_name === visitorName) return true;
      return false;
    });
  };

  const filteredUsers = useMemo(() => {
    return telemetry.filter((u) => {
      const isBlocked = !!getActiveBlock(u.session_id, u.visitor_name) || u.is_blocked;
      
      let matchThreat = true;
      if (threatFilter === "critical") matchThreat = u.threat_level === "critical";
      else if (threatFilter === "alert") matchThreat = u.threat_level === "alert";
      else if (threatFilter === "blocked") matchThreat = isBlocked;
      else if (threatFilter === "normal") matchThreat = (u.threat_level === "normal" || !u.threat_level) && !isBlocked;

      const q = search.toLowerCase();
      const matchSearch =
        !q ||
        (u.visitor_name && u.visitor_name.toLowerCase().includes(q)) ||
        (u.session_id && u.session_id.toLowerCase().includes(q)) ||
        (u.browser && u.browser.toLowerCase().includes(q)) ||
        (u.os && u.os.toLowerCase().includes(q)) ||
        (u.device_type && u.device_type.toLowerCase().includes(q));

      return matchThreat && matchSearch;
    });
  }, [telemetry, blocksList, threatFilter, search]);

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

  // Open Block Modal
  const handleOpenBlockModal = (user) => {
    if (!isSuperUser) {
      alert("Only a Super User can block or terminate visitors.");
      return;
    }
    setBlockingTarget(user);
    setSelectedDuration("1d");
    setCustomReason("Suspicious link clicking activity");
  };

  // Submit Block / Terminate
  const handleConfirmBlock = async (e) => {
    e.preventDefault();
    if (!blockingTarget || !isSuperUser) return;
    setBlockSubmitting(true);
    try {
      await enforceVisitorBlock({
        sessionId: blockingTarget.session_id,
        visitorName: blockingTarget.visitor_name,
        durationType: selectedDuration,
        reason: customReason.trim() || "Administrative security restriction",
        blockedBy: currentUserEmail || "Super User",
      });

      setActionSuccessMsg(`Enforced ${selectedDuration.toUpperCase()} block on ${blockingTarget.visitor_name || blockingTarget.session_id}!`);
      setBlockingTarget(null);
      await fetchData();
      setTimeout(() => setActionSuccessMsg(""), 4000);
    } catch (err) {
      alert("Error blocking visitor: " + err.message);
    } finally {
      setBlockSubmitting(false);
    }
  };

  // Release / Unblock
  const handleUnblock = async (user) => {
    if (!isSuperUser) {
      alert("Only a Super User can release blocks.");
      return;
    }
    if (!confirm(`Are you sure you want to unblock ${user.visitor_name || user.session_id}?`)) return;

    try {
      await releaseVisitorBlock({
        sessionId: user.session_id,
        visitorName: user.visitor_name,
      });

      setActionSuccessMsg(`Unblocked ${user.visitor_name || user.session_id}. Access restored.`);
      await fetchData();
      setTimeout(() => setActionSuccessMsg(""), 4000);
    } catch (err) {
      alert("Error unblocking visitor: " + err.message);
    }
  };

  const selectedUserActiveBlock = selectedUser ? getActiveBlock(selectedUser.session_id, selectedUser.visitor_name) : null;
  const isSelectedUserBlocked = !!selectedUserActiveBlock || selectedUser?.is_blocked;

  return (
    <div className="adm-users-tab">
      {actionSuccessMsg && (
        <div className="adm-alert-success" style={{ marginBottom: "16px" }}>
          <CheckCircle2 size={16} /> {actionSuccessMsg}
        </div>
      )}

      {/* Top Banner */}
      <div className="adm-users-header">
        <div className="adm-users-title">
          <h3><Users size={20} /> Visitor Profiles, Red Alert Tracking & Access Control</h3>
          <p>
            Real-time collected visitor dossiers, link clicking & sharing red alerts, and Super User access termination.
          </p>
        </div>
        <div style={{ display: "flex", gap: "8px" }}>
          <button type="button" className="adm-btn adm-btn-sm" onClick={fetchData} title="Refresh">
            <RefreshCw size={14} className={loading ? "spin" : ""} /> Refresh Data
          </button>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="adm-users-toolbar">
        <div className="adm-users-search">
          <Search size={16} />
          <input
            type="text"
            placeholder="Search visitor name, session ID, OS, browser..."
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
            <option value="blocked">⛔ Blocked Visitors ({telemetry.filter(t => !!getActiveBlock(t.session_id, t.visitor_name) || t.is_blocked).length})</option>
            <option value="critical">🚨 Critical Red Threats ({telemetry.filter(t => t.threat_level === 'critical').length})</option>
            <option value="alert">⚠️ Warning Alerts ({telemetry.filter(t => t.threat_level === 'alert').length})</option>
            <option value="normal">Normal Visitors ({telemetry.filter(t => (t.threat_level === 'normal' || !t.threat_level) && !getActiveBlock(t.session_id, t.visitor_name) && !t.is_blocked).length})</option>
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
              const activeBlock = getActiveBlock(u.session_id, u.visitor_name);
              const isUserBlocked = !!activeBlock || u.is_blocked;
              const hasCritical = u.threat_level === "critical" || isUserBlocked;
              const hasAlert = u.threat_level === "alert";

              return (
                <div
                  key={u.session_id}
                  className={`adm-user-card ${isSelected ? "is-selected" : ""} ${isUserBlocked ? "is-blocked" : hasCritical ? "is-critical" : hasAlert ? "is-alert" : ""}`}
                  onClick={() => setSelectedUser(u)}
                >
                  <div className="adm-user-card-top">
                    <div className="adm-user-avatar" style={isUserBlocked ? { background: "rgba(220, 38, 38, 0.2)", color: "#dc2626" } : hasCritical ? { background: "rgba(239, 68, 68, 0.2)", color: "#ef4444" } : {}}>
                      {isUserBlocked ? <Ban size={18} /> : <User size={18} />}
                    </div>
                    <div className="adm-user-name-box">
                      <strong>{u.visitor_name || "Anonymous Visitor"}</strong>
                      <span className="adm-user-device">
                        {u.device_type} · {u.os} · {u.browser}
                      </span>
                    </div>

                    {isUserBlocked && (
                      <span className="adm-badge-blocked">
                        <Ban size={11} /> BLOCKED ({activeBlock?.duration_type?.toUpperCase() || "ACTIVE"})
                      </span>
                    )}

                    {!isUserBlocked && hasCritical && (
                      <span className="adm-badge-critical" style={{ background: "#ef4444", color: "#fff", fontWeight: 700, padding: "2px 8px", borderRadius: "4px", fontSize: "11px", display: "inline-flex", alignItems: "center", gap: "4px" }}>
                        <ShieldAlert size={12} /> RED WARNING
                      </span>
                    )}

                    {!isUserBlocked && hasAlert && !hasCritical && (
                      <span className="adm-badge-alert" style={{ background: "#f59e0b", color: "#000", fontWeight: 700, padding: "2px 8px", borderRadius: "4px", fontSize: "11px", display: "inline-flex", alignItems: "center", gap: "4px" }}>
                        <AlertTriangle size={12} /> ALERT
                      </span>
                    )}
                  </div>

                  <div className="adm-user-card-bottom">
                    <span><Clock size={12} /> {u.duration_seconds || 0}s ({formatDuration(u.duration_seconds)})</span>
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
              {/* Header with Block/Unblock Actions */}
              <div className="adm-detail-head">
                <div>
                  <div style={{ display: "flex", alignItems: "center", gap: "8px", flexWrap: "wrap" }}>
                    <h2 style={{ margin: 0 }}>{selectedUser.visitor_name || "Anonymous Visitor"}</h2>
                    {isSelectedUserBlocked ? (
                      <span className="adm-badge-blocked" style={{ fontSize: "12px", padding: "4px 10px" }}>
                        <Ban size={13} /> ACCESS RESTRICTED ({selectedUserActiveBlock?.duration_type?.toUpperCase() || "BLOCKED"})
                      </span>
                    ) : selectedUser.threat_level === "critical" ? (
                      <span style={{ background: "#ef4444", color: "#fff", fontSize: "12px", fontWeight: 700, padding: "3px 8px", borderRadius: "6px" }}>
                        🚨 RED WARNING ACTIVATED
                      </span>
                    ) : null}
                  </div>
                  <span className="adm-detail-session">Session ID: {selectedUser.session_id}</span>
                </div>

                <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                  {isSuperUser && (
                    isSelectedUserBlocked ? (
                      <button
                        type="button"
                        className="adm-btn adm-btn-sm"
                        style={{ background: "#16a34a", color: "#fff", borderColor: "#16a34a" }}
                        onClick={() => handleUnblock(selectedUser)}
                      >
                        <Unlock size={14} /> Unblock Access
                      </button>
                    ) : (
                      <button
                        type="button"
                        className="adm-btn adm-btn-sm adm-btn-danger"
                        style={{ background: "#dc2626", color: "#fff" }}
                        onClick={() => handleOpenBlockModal(selectedUser)}
                      >
                        <Ban size={14} /> Block / Terminate
                      </button>
                    )
                  )}
                  <button type="button" className="adm-btn-icon" onClick={() => setSelectedUser(null)}>
                    <X size={18} />
                  </button>
                </div>
              </div>

              {/* Block Banner if Currently Blocked */}
              {isSelectedUserBlocked && (
                <div className="adm-banner-blocked">
                  <div className="adm-banner-blocked-info">
                    <Ban size={22} color="#f87171" />
                    <div>
                      <strong>Access Terminated by Super User</strong>
                      <div style={{ fontSize: "12.5px", color: "#cbd5e1" }}>
                        Duration: <strong>{selectedUserActiveBlock?.duration_type || "Restricted"}</strong> · 
                        Blocked until: <strong>{selectedUserActiveBlock?.blocked_until ? new Date(selectedUserActiveBlock.blocked_until).toLocaleString() : "Permanent Ban"}</strong>
                      </div>
                      <div style={{ fontSize: "12px", color: "#fca5a5", fontStyle: "italic", marginTop: "2px" }}>
                        Reason: "{selectedUserActiveBlock?.reason || selectedUser.block_reason || "Administrative restriction"}"
                      </div>
                    </div>
                  </div>
                  {isSuperUser && (
                    <button
                      type="button"
                      className="adm-btn adm-btn-sm"
                      style={{ background: "#16a34a", color: "#fff" }}
                      onClick={() => handleUnblock(selectedUser)}
                    >
                      <Unlock size={13} /> Unblock Now
                    </button>
                  )}
                </div>
              )}

              {/* Security Alerts (in prominent RED WARNING style) */}
              {userAlerts.length > 0 && (
                <div className="adm-user-threats-box" style={{ background: "rgba(239, 68, 68, 0.1)", border: "1.5px solid #ef4444", borderRadius: "10px", padding: "14px", margin: "14px 0" }}>
                  <h4 style={{ color: "#ef4444", margin: "0 0 10px 0", display: "flex", alignItems: "center", gap: "6px" }}>
                    <ShieldAlert size={18} /> RED WARNING SECURITY ALERTS ({userAlerts.length}):
                  </h4>
                  <div className="adm-threats-list" style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
                    {userAlerts.map((alt) => {
                      const isLinkClick = alt.event_type === "WEBSITE_LINK_CLICK";
                      const isShareAttempt = alt.event_type === "CONTENT_SHARE_ATTEMPT";

                      return (
                        <div 
                          key={alt.id} 
                          className={`adm-threat-item is-red ${isLinkClick ? "is-link-click" : ""} ${isShareAttempt ? "is-share-attempt" : ""}`}
                          style={{ background: "rgba(239, 68, 68, 0.18)", borderLeft: "4px solid #ef4444", padding: "10px 14px", borderRadius: "6px" }}
                        >
                          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "4px" }}>
                            <span style={{ 
                              background: isLinkClick ? "#dc2626" : isShareAttempt ? "#ea580c" : "#ef4444", 
                              color: "#fff", 
                              padding: "2px 8px", 
                              borderRadius: "4px", 
                              fontSize: "11px", 
                              fontWeight: 800,
                              letterSpacing: "0.04em"
                            }}>
                              🚨 RED WARNING: {alt.event_type}
                            </span>
                            <span style={{ fontSize: "12px", color: "var(--text-soft)" }}>
                              {new Date(alt.created_at).toLocaleTimeString()}
                            </span>
                          </div>
                          <p style={{ margin: "4px 0 0", fontSize: "13.5px", color: "#fee2e2", fontWeight: 500 }}>
                            {alt.details}
                          </p>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Personal, Device & Network Snapshot */}
              <div className="adm-detail-section">
                <h4>Personal, Device & Network Information</h4>
                <div className="adm-detail-grid">
                  <div><strong>Full Name:</strong> {selectedUser.visitor_name || "Anonymous Visitor"}</div>
                  <div><strong>Device Type:</strong> {selectedUser.device_type || "N/A"}</div>
                  <div><strong>Operating System:</strong> {selectedUser.os || "N/A"}</div>
                  <div><strong>Browser:</strong> {selectedUser.browser || "N/A"}</div>
                  <div><strong>Location / Timezone:</strong> {selectedUser.timezone || "N/A"}</div>
                  <div><strong>Language:</strong> {selectedUser.language || "N/A"}</div>
                  <div><strong>Network Connection:</strong> {selectedUser.network_type || "N/A"}</div>
                  <div><strong>Downlink Speed:</strong> {selectedUser.downlink_speed || "N/A"}</div>
                  <div><strong>Screen Resolution:</strong> {selectedUser.screen_resolution || "N/A"}</div>
                  <div><strong>Viewport Size:</strong> {selectedUser.viewport_size || "N/A"}</div>
                  <div><strong>Total Viewing Time:</strong> {selectedUser.duration_seconds || 0} seconds ({formatDuration(selectedUser.duration_seconds)})</div>
                  <div><strong>Referrer Source:</strong> {selectedUser.referrer || "Direct Visit"}</div>
                  <div><strong>First Arrived:</strong> {new Date(selectedUser.login_time).toLocaleString()}</div>
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
                Click any user on the left to inspect their device footprint, page history, link clicks, sharing actions, and manage block restrictions.
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Super User Block & Termination Modal */}
      {blockingTarget && (
        <div className="adm-modal-overlay" onClick={() => setBlockingTarget(null)}>
          <div className="adm-modal" onClick={(e) => e.stopPropagation()}>
            <div className="adm-modal-head">
              <div className="adm-modal-title-area">
                <div className="adm-modal-icon-badge" style={{ background: "rgba(239, 68, 68, 0.15)", color: "#ef4444" }}>
                  <Ban size={20} />
                </div>
                <div>
                  <h3 style={{ margin: 0, color: "#f87171" }}>Block / Terminate Visitor Access</h3>
                  <small style={{ color: "var(--text-soft)" }}>
                    Target: <strong>{blockingTarget.visitor_name || "Anonymous Visitor"}</strong> ({blockingTarget.session_id})
                  </small>
                </div>
              </div>
              <button type="button" className="adm-modal-close" onClick={() => setBlockingTarget(null)}>
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleConfirmBlock} className="adm-modal-form">
              <div>
                <label>Select Restriction Duration *</label>
                <select
                  value={selectedDuration}
                  onChange={(e) => setSelectedDuration(e.target.value)}
                  style={{ fontWeight: 600 }}
                >
                  {BLOCK_DURATIONS.map((d) => (
                    <option key={d.id} value={d.id}>
                      {d.label}
                    </option>
                  ))}
                </select>
                <small style={{ color: "var(--text-soft)", fontSize: "12px", marginTop: "4px", display: "block" }}>
                  The visitor's screen will instantly lock into the "Access Blocked" countdown screen until this period elapses.
                </small>
              </div>

              <div>
                <label>Reason for Block</label>
                <div style={{ display: "flex", flexWrap: "wrap", gap: "6px", marginBottom: "8px" }}>
                  {[
                    "Suspicious link clicking activity",
                    "Unauthorized content sharing attempt",
                    "DevTools / F12 inspection detected",
                    "Excessive file download attempts",
                    "Administrative security restriction"
                  ].map((preset) => (
                    <button
                      type="button"
                      key={preset}
                      className="adm-chip"
                      onClick={() => setCustomReason(preset)}
                      style={{ fontSize: "11px", cursor: "pointer", background: customReason === preset ? "rgba(239, 68, 68, 0.25)" : "var(--surface)", border: customReason === preset ? "1px solid #ef4444" : "1px solid var(--border)" }}
                    >
                      {preset}
                    </button>
                  ))}
                </div>
                <textarea
                  rows={2}
                  value={customReason}
                  onChange={(e) => setCustomReason(e.target.value)}
                  placeholder="Specify violation or custom message shown to blocked user..."
                  required
                />
              </div>

              <div className="adm-modal-actions" style={{ marginTop: "14px" }}>
                <button type="button" className="adm-btn" onClick={() => setBlockingTarget(null)}>
                  Cancel
                </button>
                <button
                  type="submit"
                  className="adm-btn adm-btn-primary"
                  style={{ background: "#dc2626", borderColor: "#dc2626" }}
                  disabled={blockSubmitting}
                >
                  {blockSubmitting ? "Enforcing Block..." : "Confirm & Block Access"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
