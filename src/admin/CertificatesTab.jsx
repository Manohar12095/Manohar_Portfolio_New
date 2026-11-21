import { useEffect, useState, useMemo } from "react";
import { 
  Award, Plus, Trash2, Edit3, Globe, Lock, EyeOff, Search, 
  Clock, Eye, BarChart3, ExternalLink, RefreshCw, Check, X
} from "lucide-react";
import { getAdapter } from "../data/store";
import SmartImage from "../components/SmartImage";

export default function CertificatesTab() {
  const [certs, setCerts] = useState([]);
  const [views, setViews] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [activeCategory, setActiveCategory] = useState("All");
  const [editingCert, setEditingCert] = useState(null);
  const [showAddModal, setShowAddModal] = useState(false);
  const [statusMsg, setStatusMsg] = useState("");

  const adapter = getAdapter();
  const supabase = adapter?.supabase;

  // Form state
  const [form, setForm] = useState({
    title: "",
    category: "Technical Activities",
    description: "",
    image_url: "",
    file_url: "",
    visibility: "public",
    sort_order: 0,
    tags: ""
  });

  const fetchData = async () => {
    if (!supabase) {
      setLoading(false);
      return;
    }
    setLoading(true);
    try {
      const [certsRes, viewsRes] = await Promise.all([
        supabase.from("certificates").select("*").order("sort_order", { ascending: true }),
        supabase.from("certificate_views").select("*").order("created_at", { ascending: false })
      ]);
      setCerts(certsRes.data || []);
      setViews(viewsRes.data || []);
    } catch (err) {
      console.warn("Error fetching certificates:", err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  // Compute analytics
  const analytics = useMemo(() => {
    const map = {};
    views.forEach((v) => {
      if (!v.certificate_id) return;
      if (!map[v.certificate_id]) {
        map[v.certificate_id] = { views: 0, totalMs: 0 };
      }
      map[v.certificate_id].views += 1;
      map[v.certificate_id].totalMs += v.time_spent_ms || 0;
    });

    const topCerts = certs
      .map((c) => ({
        ...c,
        viewCount: map[c.id]?.views || 0,
        timeSec: Math.round((map[c.id]?.totalMs || 0) / 1000)
      }))
      .sort((a, b) => b.viewCount - a.viewCount)
      .slice(0, 5);

    return {
      totalViews: views.length,
      topCerts,
      map
    };
  }, [certs, views]);

  const handleSave = async (e) => {
    e.preventDefault();
    if (!supabase) return;

    const payload = {
      title: form.title.trim(),
      category: form.category.trim(),
      description: form.description.trim(),
      image_url: form.image_url.trim(),
      file_url: form.file_url.trim(),
      visibility: form.visibility,
      sort_order: Number(form.sort_order) || 0,
      tags: typeof form.tags === "string" ? form.tags.split(",").map(t => t.trim()).filter(Boolean) : form.tags,
      updated_at: new Date().toISOString()
    };

    try {
      if (editingCert) {
        const { error } = await supabase.from("certificates").update(payload).eq("id", editingCert.id);
        if (error) throw error;
        setStatusMsg("Certificate updated successfully!");
      } else {
        const { error } = await supabase.from("certificates").insert([payload]);
        if (error) throw error;
        setStatusMsg("Certificate created successfully!");
      }

      setEditingCert(null);
      setShowAddModal(false);
      setForm({ title: "", category: "Technical Activities", description: "", image_url: "", file_url: "", visibility: "public", sort_order: 0, tags: "" });
      fetchData();
      setTimeout(() => setStatusMsg(""), 3000);
    } catch (err) {
      alert("Error saving certificate: " + err.message);
    }
  };

  const handleToggleVisibility = async (cert, newVisibility) => {
    if (!supabase) return;
    try {
      await supabase.from("certificates").update({ visibility: newVisibility }).eq("id", cert.id);
      setCerts(prev => prev.map(c => c.id === cert.id ? { ...c, visibility: newVisibility } : c));
    } catch (err) {
      alert("Error updating visibility: " + err.message);
    }
  };

  const handleDelete = async (certId) => {
    if (!confirm("Are you sure you want to delete this certificate?")) return;
    if (!supabase) return;
    try {
      await supabase.from("certificates").delete().eq("id", certId);
      setCerts(prev => prev.filter(c => c.id !== certId));
    } catch (err) {
      alert("Error deleting certificate: " + err.message);
    }
  };

  const openEdit = (cert) => {
    setEditingCert(cert);
    setForm({
      title: cert.title,
      category: cert.category || "Technical Activities",
      description: cert.description || "",
      image_url: cert.image_url || "",
      file_url: cert.file_url || "",
      visibility: cert.visibility || "public",
      sort_order: cert.sort_order ?? 0,
      tags: (cert.tags || []).join(", ")
    });
    setShowAddModal(true);
  };

  const filteredCerts = useMemo(() => {
    return certs.filter((c) => {
      const matchCat = activeCategory === "All" || c.category === activeCategory;
      const q = search.toLowerCase();
      const matchSearch = !q || c.title.toLowerCase().includes(q) || (c.category && c.category.toLowerCase().includes(q));
      return matchCat && matchSearch;
    });
  }, [certs, activeCategory, search]);

  const categories = useMemo(() => {
    const set = new Set();
    certs.forEach(c => { if (c.category) set.add(c.category); });
    return ["All", ...Array.from(set).sort()];
  }, [certs]);

  return (
    <div className="adm-certs-tab">
      {statusMsg && <div className="adm-alert-success">{statusMsg}</div>}

      {/* Top Analytics Banner */}
      <div className="adm-certs-analytics-card">
        <div className="adm-certs-analytics-head">
          <div className="adm-analytics-stat">
            <span className="adm-stat-label">Total Verified Certificates</span>
            <span className="adm-stat-val">{certs.length}</span>
          </div>
          <div className="adm-analytics-stat">
            <span className="adm-stat-label">Public (Visible)</span>
            <span className="adm-stat-val" style={{ color: "#10b981" }}>
              {certs.filter(c => c.visibility === "public").length}
            </span>
          </div>
          <div className="adm-analytics-stat">
            <span className="adm-stat-label">Private Space Only</span>
            <span className="adm-stat-val" style={{ color: "#6366f1" }}>
              {certs.filter(c => c.visibility === "private").length}
            </span>
          </div>
          <div className="adm-analytics-stat">
            <span className="adm-stat-label">Total Views Tracked</span>
            <span className="adm-stat-val" style={{ color: "#f59e0b" }}>
              {analytics.totalViews}
            </span>
          </div>
        </div>

        {analytics.topCerts.length > 0 && (
          <div className="adm-top-viewed-certs">
            <h4><BarChart3 size={15} /> Most Viewed Certificates by Visitors:</h4>
            <div className="adm-top-certs-list">
              {analytics.topCerts.map((tc, idx) => (
                <div key={tc.id} className="adm-top-cert-item">
                  <span className="adm-cert-rank">#{idx + 1}</span>
                  <span className="adm-cert-title">{tc.title}</span>
                  <span className="adm-cert-metrics">
                    <strong>{tc.viewCount} views</strong> ({tc.timeSec}s avg viewing time)
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Action Bar */}
      <div className="adm-certs-toolbar">
        <div className="adm-certs-search">
          <Search size={16} />
          <input
            type="text"
            placeholder="Search certificates..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>

        <div className="adm-certs-actions">
          <a href="/certificates" target="_blank" rel="noreferrer" className="adm-btn adm-btn-sm">
            <ExternalLink size={14} /> View Public Page ↗
          </a>
          <button
            type="button"
            className="adm-btn adm-btn-primary adm-btn-sm"
            onClick={() => {
              setEditingCert(null);
              setForm({ title: "", category: "Technical Activities", description: "", image_url: "", file_url: "", visibility: "public", sort_order: certs.length, tags: "" });
              setShowAddModal(true);
            }}
          >
            <Plus size={15} /> Add Certificate
          </button>
        </div>
      </div>

      {/* Category Filter Pills */}
      <div className="adm-cat-pills">
        {categories.map((cat) => (
          <button
            key={cat}
            type="button"
            className={`adm-cat-pill ${activeCategory === cat ? "is-active" : ""}`}
            onClick={() => setActiveCategory(cat)}
          >
            {cat} ({cat === "All" ? certs.length : certs.filter(c => c.category === cat).length})
          </button>
        ))}
      </div>

      {/* Certificates Table */}
      <div className="adm-certs-table-wrap">
        <table className="adm-certs-table">
          <thead>
            <tr>
              <th>Preview</th>
              <th>Title & Category</th>
              <th>Visibility Control</th>
              <th>Views</th>
              <th>Sort</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {filteredCerts.map((c) => {
              const viewCount = analytics.map[c.id]?.views || 0;
              const viewSec = Math.round((analytics.map[c.id]?.totalMs || 0) / 1000);
              return (
                <tr key={c.id}>
                  <td className="adm-td-img">
                    <SmartImage src={c.image_url} alt={c.title} className="adm-cert-thumb" />
                  </td>
                  <td>
                    <strong>{c.title}</strong>
                    <div className="adm-cert-meta-cat">{c.category || "General"}</div>
                    {c.description && <p className="adm-cert-desc-short">{c.description}</p>}
                  </td>
                  <td>
                    <div className="adm-vis-toggle-group">
                      <button
                        type="button"
                        className={`adm-vis-btn ${c.visibility === "public" ? "is-public" : ""}`}
                        title="Visible on Public /certificates page"
                        onClick={() => handleToggleVisibility(c, "public")}
                      >
                        <Globe size={13} /> Public
                      </button>
                      <button
                        type="button"
                        className={`adm-vis-btn ${c.visibility === "private" ? "is-private" : ""}`}
                        title="Private Space only"
                        onClick={() => handleToggleVisibility(c, "private")}
                      >
                        <Lock size={13} /> Private
                      </button>
                      <button
                        type="button"
                        className={`adm-vis-btn ${c.visibility === "hidden" ? "is-hidden" : ""}`}
                        title="Turned off / Hidden"
                        onClick={() => handleToggleVisibility(c, "hidden")}
                      >
                        <EyeOff size={13} /> Off
                      </button>
                    </div>
                  </td>
                  <td>
                    <span className="adm-view-count-badge">
                      <Eye size={12} /> {viewCount} ({viewSec}s)
                    </span>
                  </td>
                  <td>{c.sort_order ?? 0}</td>
                  <td>
                    <div className="adm-row-actions">
                      <button
                        type="button"
                        className="adm-btn-icon"
                        title="Edit"
                        onClick={() => openEdit(c)}
                      >
                        <Edit3 size={15} />
                      </button>
                      <button
                        type="button"
                        className="adm-btn-icon adm-btn-icon-danger"
                        title="Delete"
                        onClick={() => handleDelete(c.id)}
                      >
                        <Trash2 size={15} />
                      </button>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Add / Edit Modal */}
      {showAddModal && (
        <div className="adm-modal-overlay">
          <div className="adm-modal">
            <div className="adm-modal-head">
              <h3>{editingCert ? "Edit Certificate" : "Add New Certificate"}</h3>
              <button type="button" className="adm-modal-close" onClick={() => setShowAddModal(false)}>
                <X size={18} />
              </button>
            </div>
            <form onSubmit={handleSave} className="adm-modal-form">
              <label>Title *</label>
              <input
                type="text"
                required
                value={form.title}
                onChange={(e) => setForm({ ...form, title: e.target.value })}
                placeholder="e.g. 1st Prize in Hackathon"
              />

              <div className="adm-form-row">
                <div>
                  <label>Category</label>
                  <select
                    value={form.category}
                    onChange={(e) => setForm({ ...form, category: e.target.value })}
                  >
                    <option value="Academy">Academy</option>
                    <option value="Extra-Curricular">Extra-Curricular</option>
                    <option value="Internship">Internship</option>
                    <option value="NCC">NCC</option>
                    <option value="Social Activity">Social Activity</option>
                    <option value="Sports">Sports</option>
                    <option value="Technical Activities">Technical Activities</option>
                    <option value="Value Added Courses (VAC)">Value Added Courses (VAC)</option>
                    <option value="Others">Others</option>
                  </select>
                </div>
                <div>
                  <label>Visibility</label>
                  <select
                    value={form.visibility}
                    onChange={(e) => setForm({ ...form, visibility: e.target.value })}
                  >
                    <option value="public">Public (Shows on /certificates)</option>
                    <option value="private">Private (Shows only in Personal Space)</option>
                    <option value="hidden">Hidden / Turned Off</option>
                  </select>
                </div>
              </div>

              <label>Image URL (Google Drive share link or direct URL)</label>
              <input
                type="text"
                value={form.image_url}
                onChange={(e) => setForm({ ...form, image_url: e.target.value })}
                placeholder="https://drive.google.com/file/d/..."
              />

              <label>Downloadable Document / PDF Link (Optional)</label>
              <input
                type="text"
                value={form.file_url}
                onChange={(e) => setForm({ ...form, file_url: e.target.value })}
                placeholder="https://drive.google.com/uc?export=download&id=..."
              />

              <label>Description / Details</label>
              <textarea
                rows={3}
                value={form.description}
                onChange={(e) => setForm({ ...form, description: e.target.value })}
                placeholder="Brief summary of the credential, issuing organization, grade or prize..."
              />

              <div className="adm-form-row">
                <div>
                  <label>Tags (comma separated)</label>
                  <input
                    type="text"
                    value={form.tags}
                    onChange={(e) => setForm({ ...form, tags: e.target.value })}
                    placeholder="hackathon, react, 1st prize"
                  />
                </div>
                <div>
                  <label>Sort Order</label>
                  <input
                    type="number"
                    value={form.sort_order}
                    onChange={(e) => setForm({ ...form, sort_order: e.target.value })}
                  />
                </div>
              </div>

              <div className="adm-modal-actions">
                <button type="button" className="adm-btn" onClick={() => setShowAddModal(false)}>
                  Cancel
                </button>
                <button type="submit" className="adm-btn adm-btn-primary">
                  {editingCert ? "Update Certificate" : "Add Certificate"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
