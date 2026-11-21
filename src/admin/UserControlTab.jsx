import { useEffect, useState } from "react";
import { 
  Shield, UserCheck, UserX, Crown, Edit3, Eye, Plus, 
  Trash2, AlertTriangle, Check, RefreshCw
} from "lucide-react";
import { getAdapter } from "../data/store";

export default function UserControlTab({ currentUserEmail, currentUserRole }) {
  const [rolesList, setRolesList] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);
  const [newEmail, setNewEmail] = useState("");
  const [newRole, setNewRole] = useState("editor");
  const [statusMsg, setStatusMsg] = useState("");

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

  const handleAddOrUpdateUser = async (e) => {
    e.preventDefault();
    if (!supabase) return;
    if (!isSuperUser) {
      alert("Only a Super User can add or modify admin user permissions.");
      return;
    }

    try {
      const emailClean = newEmail.trim().toLowerCase();
      // Look up user id from auth or generate one
      const payload = {
        user_id: "00000000-0000-0000-0000-000000000000",
        email: emailClean,
        role: newRole,
        updated_at: new Date().toISOString()
      };

      const { error } = await supabase
        .from("admin_roles")
        .upsert(payload, { onConflict: "email" });

      if (error) throw error;
      setStatusMsg(`Role updated for ${emailClean} to ${newRole}`);
      setShowAddModal(false);
      setNewEmail("");
      fetchRoles();
      setTimeout(() => setStatusMsg(""), 3000);
    } catch (err) {
      alert("Error adding admin role: " + err.message);
    }
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
    } catch (err) {
      alert("Error removing role: " + err.message);
    }
  };

  return (
    <div className="adm-roles-tab">
      {statusMsg && <div className="adm-alert-success">{statusMsg}</div>}

      {/* Role Definitions Explainer */}
      <div className="adm-roles-intro-card">
        <h3><Shield size={20} /> User Control & Access Hierarchy</h3>
        <p>Define administrative access and editing rights for team members and reviewers.</p>

        <div className="adm-roles-legend-grid">
          <div className="adm-role-legend-item">
            <div className="adm-role-badge is-superuser">
              <Crown size={15} /> Super User (ME)
            </div>
            <p>
              Full unconditional control. Can edit all sections, modify user roles, access private Personal Space, and configure database keys.
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
              Read-only review access. Can view portfolio telemetry, live monitoring, and draft settings, but <strong>cannot edit or save</strong> any changes.
            </p>
          </div>
        </div>
      </div>

      {/* Actions */}
      <div className="adm-roles-action-bar">
        <h4>Authorized Administrative Accounts ({rolesList.length})</h4>
        {isSuperUser && (
          <button
            type="button"
            className="adm-btn adm-btn-primary adm-btn-sm"
            onClick={() => setShowAddModal(true)}
          >
            <Plus size={15} /> Add / Invite User
          </button>
        )}
      </div>

      {/* Roles Table */}
      <div className="adm-roles-table-wrap">
        <table className="adm-roles-table">
          <thead>
            <tr>
              <th>User Email</th>
              <th>Current Role</th>
              <th>Permissions</th>
              {isSuperUser && <th>Change Role</th>}
              {isSuperUser && <th>Action</th>}
            </tr>
          </thead>
          <tbody>
            {rolesList.map((r) => {
              const isOwner = r.email === "manoharorignal@gmail.com" || r.email === "pvcmanohar@gmail.com";
              return (
                <tr key={r.email}>
                  <td>
                    <strong>{r.email}</strong>
                    {isOwner && <span className="adm-owner-tag">Primary Owner</span>}
                  </td>
                  <td>
                    <span className={`adm-role-pill is-${r.role}`}>
                      {r.role === "superuser" && <Crown size={12} />}
                      {r.role === "editor" && <Edit3 size={12} />}
                      {r.role === "viewer" && <Eye size={12} />}
                      {r.role.toUpperCase()}
                    </span>
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
                        <option value="superuser">Super User</option>
                        <option value="editor">Editor</option>
                        <option value="viewer">Viewer</option>
                      </select>
                    </td>
                  )}
                  {isSuperUser && (
                    <td>
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
                    </td>
                  )}
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Add User Modal */}
      {showAddModal && (
        <div className="adm-modal-overlay">
          <div className="adm-modal">
            <div className="adm-modal-head">
              <h3>Grant Admin Role</h3>
              <button type="button" className="adm-modal-close" onClick={() => setShowAddModal(false)}>
                ✕
              </button>
            </div>
            <form onSubmit={handleAddOrUpdateUser} className="adm-modal-form">
              <label>User Email Address *</label>
              <input
                type="email"
                required
                value={newEmail}
                onChange={(e) => setNewEmail(e.target.value)}
                placeholder="colleague@example.com"
              />

              <label>Role</label>
              <select value={newRole} onChange={(e) => setNewRole(e.target.value)}>
                <option value="editor">Editor (Can edit public site, no Personal Space)</option>
                <option value="viewer">Viewer (Read-only, cannot edit or save)</option>
                <option value="superuser">Super User (Full control)</option>
              </select>

              <div className="adm-modal-actions">
                <button type="button" className="adm-btn" onClick={() => setShowAddModal(false)}>
                  Cancel
                </button>
                <button type="submit" className="adm-btn adm-btn-primary">
                  Save Role
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

