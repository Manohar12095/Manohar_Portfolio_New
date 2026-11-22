import { useEffect, useState, useMemo } from "react";
import { 
  Shield, UserCheck, UserX, Crown, Edit3, Eye, Plus, 
  Trash2, AlertTriangle, Check, RefreshCw, Key, Copy, EyeOff, Sparkles, X, Lock, Ban, Unlock
} from "lucide-react";
import { createClient } from "@supabase/supabase-js";
import { getAdapter } from "../data/store";
import { BLOCK_DURATIONS, enforceVisitorBlock, releaseVisitorBlock } from "../lib/blocking";

export default function UserControlTab({ currentUserEmail, currentUserRole }) {
  const [rolesList, setRolesList] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);
  const [newEmail, setNewEmail] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [newRole, setNewRole] = useState("editor");
  const [statusMsg, setStatusMsg] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [createdCredentials, setCreatedCredentials] = useState(null);
  const [copiedCreds, setCopiedCreds] = useState(false);

  // Block modal state for admin accounts
  const [blockUserTarget, setBlockUserTarget] = useState(null);
  const [blockDuration, setBlockDuration] = useState("1d");
  const [blockReason, setBlockReason] = useState("Administrative access termination");
  const [blockBusy, setBlockBusy] = useState(false);

  const adapter = getAdapter();
  const supabase = adapter?.supabase;
  const isSuperUser = currentUserRole === "superuser" || currentUserEmail === "manoharorignal@gmail.com" || currentUserEmail === "pvcmanohar@gmail.com";

  const fetchRoles = async () => {
    if (!supabase) return;
    setLoading(true);
    try {
      const { data, error } = await supabase.from("admin_roles").select("*").order("created_at", { ascending: true });
      if (error) throw error;
      setRolesList(data || []);
    } catch (err) {
      console.warn("Error fetching roles:", err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRoles();
  }, []);

  const generateRandomPassword = () => {
    const chars = "ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnpqrstuvwxyz23456789!@#$%&*";
    let pwd = "";
    for (let i = 0; i < 12; i++) {
      pwd += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    setNewPassword(pwd);
  };

  const handleAddUserWithPassword = async (e) => {
    e.preventDefault();
    if (!supabase) return;
    if (!isSuperUser) {
      alert("Only a Super User can add or modify admin user permissions.");
      return;
    }

    const emailClean = newEmail.trim().toLowerCase();
    const passwordClean = newPassword.trim();

    if (!emailClean || !passwordClean) {
      alert("Please provide both an email and password.");
      return;
    }

    if (passwordClean.length < 6) {
      alert("Password must be at least 6 characters long.");
      return;
    }

    setSubmitting(true);
    try {
      let userId = null;
      const supaUrl = import.meta.env.VITE_SUPABASE_URL || "https://sqbrczfojykfhfugbisr.supabase.co";
      const supaKey = import.meta.env.VITE_SUPABASE_ANON_KEY || "sb_publishable_2sr3UUxFtn5ypkr8tCHWpA_Oxr6FMdl";
      const tempAuthClient = createClient(supaUrl, supaKey, {
        auth: { persistSession: false, autoRefreshToken: false }
      });

      // 1. Register user with standard Supabase Auth
      const { data: signData, error: signErr } = await tempAuthClient.auth.signUp({
        email: emailClean,
        password: passwordClean
      });

      if (signErr && !signErr.message?.includes("already registered")) {
        // Fallback to RPC if signup API gives special error
        const { data: rpcData, error: rpcErr } = await supabase.rpc("create_or_update_admin_user", {
          new_email: emailClean,
          new_password: passwordClean,
          new_role: newRole
        });
        if (rpcErr) throw signErr;
        userId = rpcData?.user_id;
      } else {
        userId = signData?.user?.id;
      }

      // 2. Assign role in public.admin_roles
      const { error: roleErr } = await supabase
        .from("admin_roles")
        .upsert({
          user_id: userId || "00000000-0000-0000-0000-000000000000",
          email: emailClean,
          role: newRole,
          updated_at: new Date().toISOString()
        }, { onConflict: "email" });

      if (roleErr) throw roleErr;

      setCreatedCredentials({
        email: emailClean,
        password: passwordClean,
        role: newRole
      });

      setStatusMsg(`Account ready! ${emailClean} is now an ${newRole.toUpperCase()}.`);
      setShowAddModal(false);
      setNewEmail("");
      setNewPassword("");
      fetchRoles();
      setTimeout(() => setStatusMsg(""), 4000);
    } catch (err) {
      alert("Error creating admin user: " + err.message);
    } finally {
      setSubmitting(false);
    }
  };

  const handleCopyCredentials = () => {
    if (!createdCredentials) return;
    const text = `Manohar Portfolio Admin Credentials:\nEmail: ${createdCredentials.email}\nPassword: ${createdCredentials.password}\nRole: ${createdCredentials.role}\nAdmin Portal: ${window.location.origin}/admin`;
    navigator.clipboard.writeText(text);
    setCopiedCreds(true);
    setTimeout(() => setCopiedCreds(false), 2500);
  };

  const handleChangeRole = async (email, role) => {
    if (!isSuperUser) {
      alert("Only a Super User can change roles.");
      return;
    }
    if (!supabase) return;

    try {
      const { error } = await supabase
        .from("admin_roles")
        .update({ role, updated_at: new Date().toISOString() })
        .eq("email", email);

      if (error) throw error;
      setRolesList(prev => prev.map(r => r.email === email ? { ...r, role } : r));
      setStatusMsg(`Role updated for ${email}`);
      setTimeout(() => setStatusMsg(""), 3000);
    } catch (err) {
      alert("Error updating role: " + err.message);
    }
  };

  const handleRemoveRole = async (email) => {
    if (!isSuperUser) {
      alert("Only a Super User can remove admin users.");
      return;
    }
    if (email === "manoharorignal@gmail.com" || email === "pvcmanohar@gmail.com") {
      alert("Cannot remove primary owner account.");
      return;
    }
    if (!confirm(`Are you sure you want to revoke admin access for ${email}?`)) return;

    try {
      const { error } = await supabase.from("admin_roles").delete().eq("email", email);
      if (error) throw error;
      setRolesList(prev => prev.filter(r => r.email !== email));
      setStatusMsg(`Revoked admin access for ${email}`);
      setTimeout(() => setStatusMsg(""), 3000);
    } catch (err) {
      alert("Error removing role: " + err.message);
    }
  };

  const handleConfirmBlockUser = async (e) => {
    e.preventDefault();
    if (!blockUserTarget || !isSuperUser) return;
    setBlockBusy(true);
    try {
      await enforceVisitorBlock({
        email: blockUserTarget.email,
        durationType: blockDuration,
        reason: blockReason.trim() || "Administrative access termination",
        blockedBy: currentUserEmail || "Super User",
      });

      setStatusMsg(`Enforced ${blockDuration.toUpperCase()} block on ${blockUserTarget.email}`);
      setBlockUserTarget(null);
      await fetchRoles();
      setTimeout(() => setStatusMsg(""), 4000);
    } catch (err) {
      alert("Error blocking user: " + err.message);
    } finally {
      setBlockBusy(false);
    }
  };

  const handleUnblockUser = async (user) => {
    if (!isSuperUser) return;
    if (!confirm(`Unblock admin access for ${user.email}?`)) return;

    try {
      await releaseVisitorBlock({ email: user.email });
      setStatusMsg(`Unblocked ${user.email}. Access restored.`);
      await fetchRoles();
      setTimeout(() => setStatusMsg(""), 4000);
    } catch (err) {
      alert("Error unblocking user: " + err.message);
    }
  };

  const filteredRoles = useMemo(() => {
    if (!searchTerm.trim()) return rolesList;
    const q = searchTerm.toLowerCase();
    return rolesList.filter(r => r.email.toLowerCase().includes(q) || r.role.toLowerCase().includes(q));
  }, [rolesList, searchTerm]);

  return (
    <div className="adm-roles-tab">
      {statusMsg && <div className="adm-alert-success">{statusMsg}</div>}

      {/* Role Definitions Explainer */}
      <div className="adm-roles-intro-card">
        <div className="adm-roles-intro-title">
          <h3><Shield size={20} /> User Control & Access Hierarchy</h3>
          <p>
            Define administrative team accounts with custom roles and instant passwords so authorized members can immediately log in and collaborate.
          </p>
        </div>

        <div className="adm-roles-legend-grid">
          <div className="adm-role-legend-item">
            <div className="adm-role-badge is-superuser">
              <Crown size={15} /> Super User (ME)
            </div>
            <p>
              Full unconditional control. Can edit all sections, modify user roles, access private Personal Space, and configure database settings.
            </p>
          </div>

          <div className="adm-role-legend-item">
            <div className="adm-role-badge is-editor">
              <Edit3 size={15} /> Editor
            </div>
            <p>
              Can edit public portfolio content, project cards, and certificates. <strong>Cannot</strong> enter the private Personal Space and <strong>cannot</strong> manage users in User Control.
            </p>
          </div>

          <div className="adm-role-legend-item">
            <div className="adm-role-badge is-viewer">
              <Eye size={15} /> Viewer
            </div>
            <p>
              Read-only observation mode. Can view portfolio telemetry, live visitor tracking, and settings, but <strong>cannot edit or save</strong> any changes.
            </p>
          </div>
        </div>
      </div>

      {/* Created Credentials Banner if newly generated */}
      {createdCredentials && (
        <div className="adm-creds-banner">
          <div className="adm-creds-info">
            <Sparkles size={20} className="adm-creds-icon" />
            <div>
              <strong>User Account Created Successfully!</strong>
              <p>Email: <code>{createdCredentials.email}</code> · Password: <code>{createdCredentials.password}</code> · Role: <code>{createdCredentials.role.toUpperCase()}</code></p>
            </div>
          </div>
          <button type="button" className="adm-btn adm-btn-sm adm-btn-primary" onClick={handleCopyCredentials}>
            {copiedCreds ? <Check size={14} /> : <Copy size={14} />} {copiedCreds ? "Copied!" : "Copy Login Info"}
          </button>
        </div>
      )}

      {/* Actions and Search Toolbar */}
      <div className="adm-roles-action-bar">
        <div className="adm-roles-search">
          <input
            type="text"
            placeholder="Search accounts by email or role..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="adm-input"
          />
        </div>
        <div className="adm-roles-buttons">
          <button type="button" className="adm-btn adm-btn-sm" onClick={fetchRoles} title="Refresh Users">
            <RefreshCw size={14} className={loading ? "spin" : ""} /> Refresh
          </button>
          {isSuperUser && (
            <button
              type="button"
              className="adm-btn adm-btn-primary adm-btn-sm"
              onClick={() => {
                setShowAddModal(true);
                generateRandomPassword();
              }}
            >
              <Plus size={15} /> Add User with Password
            </button>
          )}
        </div>
      </div>

      {/* Roles Table */}
      <div className="adm-roles-table-wrap">
        <table className="adm-roles-table">
          <thead>
            <tr>
              <th>User Email</th>
              <th>Current Role</th>
              <th>Permissions Summary</th>
              {isSuperUser && <th>Change Role</th>}
              {isSuperUser && <th>Action</th>}
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan={5} style={{ textAlign: "center", padding: "24px" }}>Loading authorized users...</td>
              </tr>
            ) : filteredRoles.length === 0 ? (
              <tr>
                <td colSpan={5} style={{ textAlign: "center", padding: "24px" }}>No admin accounts found.</td>
              </tr>
            ) : (
              filteredRoles.map((r) => {
                const isOwner = r.email === "manoharorignal@gmail.com" || r.email === "pvcmanohar@gmail.com";
                return (
                  <tr key={r.email}>
                    <td>
                      <div className="adm-user-cell">
                        <strong>{r.email}</strong>
                        {isOwner && <span className="adm-owner-tag">Primary Owner</span>}
                      </div>
                    </td>
                    <td>
                      <span className={`adm-role-pill is-${r.role}`}>
                        {r.role === "superuser" && <Crown size={12} />}
                        {r.role === "editor" && <Edit3 size={12} />}
                        {r.role === "viewer" && <Eye size={12} />}
                        {r.role.toUpperCase()}
                      </span>
                      {r.is_blocked && (
                        <span className="adm-badge-blocked" style={{ marginLeft: "6px" }}>
                          <Ban size={11} /> BLOCKED
                        </span>
                      )}
                    </td>
                    <td>
                      {r.role === "superuser" && "Full Portfolio + Personal Space + Roles"}
                      {r.role === "editor" && "Public Sections & Certificates (No Personal Space)"}
                      {r.role === "viewer" && "Read-only Observation Mode"}
                    </td>
                    {isSuperUser && (
                      <td>
                        <select
                          value={r.role}
                          disabled={isOwner}
                          onChange={(e) => handleChangeRole(r.email, e.target.value)}
                          className="adm-role-select"
                        >
                          <option value="superuser">Super User (Full Control)</option>
                          <option value="editor">Editor (Public Site Only)</option>
                          <option value="viewer">Viewer (Read-Only)</option>
                        </select>
                      </td>
                    )}
                    {isSuperUser && (
                      <td>
                        <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                          {!isOwner && (
                            r.is_blocked ? (
                              <button
                                type="button"
                                className="adm-btn-icon"
                                style={{ color: "#16a34a" }}
                                title="Unblock user access"
                                onClick={() => handleUnblockUser(r)}
                              >
                                <Unlock size={15} />
                              </button>
                            ) : (
                              <button
                                type="button"
                                className="adm-btn-icon"
                                style={{ color: "#ef4444" }}
                                title="Block / Terminate user"
                                onClick={() => {
                                  setBlockUserTarget(r);
                                  setBlockDuration("1d");
                                  setBlockReason("Administrative access termination");
                                }}
                              >
                                <Ban size={15} />
                              </button>
                            )
                          )}
                          {!isOwner && (
                            <button
                              type="button"
                              className="adm-btn-icon adm-btn-icon-danger"
                              title="Revoke access"
                              onClick={() => handleRemoveRole(r.email)}
                            >
                              <Trash2 size={15} />
                            </button>
                          )}
                        </div>
                      </td>
                    )}
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {/* Add User With Password Modal */}
      {showAddModal && (
        <div className="adm-modal-overlay" onClick={() => setShowAddModal(false)}>
          <div className="adm-modal" onClick={(e) => e.stopPropagation()}>
            <div className="adm-modal-head">
              <div className="adm-modal-title-area">
                <div className="adm-modal-icon-badge" style={{ background: "rgba(56, 189, 248, 0.15)", color: "#38bdf8" }}>
                  <Key size={18} />
                </div>
                <div>
                  <h3 style={{ margin: 0 }}>Add Admin User with Password</h3>
                  <small style={{ color: "var(--text-soft)" }}>Create login credentials and grant access</small>
                </div>
              </div>
              <button type="button" className="adm-modal-close" onClick={() => setShowAddModal(false)}>
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleAddUserWithPassword} className="adm-modal-form">
              <div>
                <label>User Email Address *</label>
                <input
                  type="email"
                  required
                  value={newEmail}
                  onChange={(e) => setNewEmail(e.target.value)}
                  placeholder="colleague@example.com"
                  autoFocus
                />
              </div>

              <div>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "4px" }}>
                  <label style={{ margin: 0 }}>Assign Password *</label>
                  <button
                    type="button"
                    className="adm-link-btn"
                    onClick={generateRandomPassword}
                    style={{ fontSize: "12px", color: "var(--sky-400)", background: "none", border: "none", cursor: "pointer" }}
                  >
                    🎲 Generate Strong Password
                  </button>
                </div>
                <div style={{ position: "relative", display: "flex", alignItems: "center" }}>
                  <input
                    type={showPassword ? "text" : "password"}
                    required
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    placeholder="Enter or generate password..."
                    style={{ paddingRight: "40px" }}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    style={{
                      position: "absolute",
                      right: "10px",
                      background: "none",
                      border: "none",
                      color: "var(--text-soft)",
                      cursor: "pointer",
                      padding: "4px"
                    }}
                    title={showPassword ? "Hide password" : "Show password"}
                  >
                    {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
                <small style={{ color: "var(--text-soft)", fontSize: "12px", marginTop: "4px", display: "block" }}>
                  The user can immediately log in at <code>/admin</code> with this password.
                </small>
              </div>

              <div>
                <label>Administrative Role</label>
                <select value={newRole} onChange={(e) => setNewRole(e.target.value)}>
                  <option value="editor">Editor — Can edit public site & certificates (No Personal Space)</option>
                  <option value="viewer">Viewer — Read-only observation (Cannot save changes)</option>
                  <option value="superuser">Super User — Full unconditional access</option>
                </select>
              </div>

              <div className="adm-modal-actions">
                <button type="button" className="adm-btn" onClick={() => setShowAddModal(false)}>
                  Cancel
                </button>
                <button type="submit" className="adm-btn adm-btn-primary" disabled={submitting}>
                  {submitting ? "Creating User..." : "Save & Grant Access"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Block Admin User Modal */}
      {blockUserTarget && (
        <div className="adm-modal-overlay" onClick={() => setBlockUserTarget(null)}>
          <div className="adm-modal" onClick={(e) => e.stopPropagation()}>
            <div className="adm-modal-head">
              <div className="adm-modal-title-area">
                <div className="adm-modal-icon-badge" style={{ background: "rgba(239, 68, 68, 0.15)", color: "#ef4444" }}>
                  <Ban size={20} />
                </div>
                <div>
                  <h3 style={{ margin: 0, color: "#f87171" }}>Block / Terminate Account Access</h3>
                  <small style={{ color: "var(--text-soft)" }}>
                    Target: <strong>{blockUserTarget.email}</strong>
                  </small>
                </div>
              </div>
              <button type="button" className="adm-modal-close" onClick={() => setBlockUserTarget(null)}>
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleConfirmBlockUser} className="adm-modal-form">
              <div>
                <label>Select Restriction Duration *</label>
                <select
                  value={blockDuration}
                  onChange={(e) => setBlockDuration(e.target.value)}
                  style={{ fontWeight: 600 }}
                >
                  {BLOCK_DURATIONS.map((d) => (
                    <option key={d.id} value={d.id}>
                      {d.label}
                    </option>
                  ))}
                </select>
                <small style={{ color: "var(--text-soft)", fontSize: "12px", marginTop: "4px", display: "block" }}>
                  This user will be immediately locked out of the website and admin dashboard until this duration elapses.
                </small>
              </div>

              <div>
                <label>Reason for Block</label>
                <input
                  type="text"
                  value={blockReason}
                  onChange={(e) => setBlockReason(e.target.value)}
                  placeholder="Specify violation or custom message shown to blocked user..."
                  required
                />
              </div>

              <div className="adm-modal-actions" style={{ marginTop: "14px" }}>
                <button type="button" className="adm-btn" onClick={() => setBlockUserTarget(null)}>
                  Cancel
                </button>
                <button
                  type="submit"
                  className="adm-btn adm-btn-primary"
                  style={{ background: "#dc2626", borderColor: "#dc2626" }}
                  disabled={blockBusy}
                >
                  {blockBusy ? "Enforcing Block..." : "Confirm & Block User"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
