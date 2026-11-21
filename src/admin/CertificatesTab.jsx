import { useEffect, useState, useMemo } from "react";
import { 
  Award, Plus, Trash2, Edit3, Globe, Lock, EyeOff, Search, 
  Clock, Eye, BarChart3, ExternalLink, RefreshCw, Check, X, Layers, Image as ImageIcon
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

  // Form state with multi-page support
  const [form, setForm] = useState({
    title: "",
    category: "Technical Activities",
    description: "",
    image_url: "",
    file_url: "",
    pages: [""],
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

    const cleanedPages = form.pages.map(p => p.trim()).filter(Boolean);
    const primaryImage = cleanedPages[0] || form.image_url.trim();

    const payload = {
      title: form.title.trim(),
      category: form.category.trim(),
      description: form.description.trim(),
      image_url: primaryImage,
      file_url: form.file_url.trim(),
      pages: cleanedPages.length > 0 ? cleanedPages : (primaryImage ? [primaryImage] : []),
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
      setForm({ title: "", category: "Technical Activities", description: "", image_url: "", file_url: "", pages: [""], visibility: "public", sort_order: 0, tags: "" });
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
    const pList = (cert.pages && cert.pages.length > 0)
      ? cert.pages
      : [cert.image_url || ""];

    setForm({
      title: cert.title,
      category: cert.category || "Technical Activities",
      description: cert.description || "",
      image_url: cert.image_url || "",
      file_url: cert.file_url || "",
      pages: pList.length > 0 ? pList : [""],
      visibility: cert.visibility || "public",
      sort_order: cert.sort_order ?? 0,
      tags: (cert.tags || []).join(", ")
    });
    setShowAddModal(true);
  };

  const handlePageChange = (index, val) => {
    const updated = [...form.pages];
    updated[index] = val;
    setForm({ ...form, pages: updated, image_url: updated[0] || form.image_url });
  };

  const handleAddPage = () => {
    setForm({ ...form, pages: [...form.pages, ""] });
  };

  const handleRemovePage = (index) => {
    const updated = form.pages.filter((_, i) => i !== index);
    setForm({ ...form, pages: updated.length > 0 ? updated : [""], image_url: updated[0] || "" });
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
            <span className="adm-stat-label">Multi-Page Certs</span>
            <span className="adm-stat-val" style={{ color: "#8b5cf6" }}>
              {certs.filter(c => c.pages && c.pages.length > 1).length}
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
            className="adm-btn adm-btn-primary adm-btn-sm adm-glow-btn"
            onClick={() => {
              setEditingCert(null);
              setForm({ title: "", category: "Technical Activities", description: "", image_url: "", file_url: "", pages: [""], visibility: "public", sort_order: certs.length, tags: "" });
              setShowAddModal(true);
            }}
          >
            <Plus size={16} /> Add Certificate
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
              <th>Pages</th>
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
              const pCount = (c.pages && c.pages.length > 0) ? c.pages.length : (c.image_url ? 1 : 0);
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
                    {pCount > 1 ? (
                      <span className="adm-page-count-badge is-multi" title="Multiple pages">
                        <Layers size={12} /> {pCount} Pages
                      </span>
                    ) : (
                      <span className="adm-page-count-badge">1 Page</span>
                    )}
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
                        title="Edit Certificate"
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

      {/* Add / Edit Modal with Multi-Page Manager */}
      {showAddModal && (
        <div className="adm-modal-overlay" onClick={() => setShowAddModal(false)}>
          <div className="adm-modal adm-modal-lg" onClick={(e) => e.stopPropagation()}>
            <div className="adm-modal-head">
              <div className="adm-modal-title-area">
                <div className="adm-modal-icon-badge">
                  <Award size={18} />
                </div>
                <div>
                  <h3>{editingCert ? "Edit Certificate" : "Add New Certificate"}</h3>
                  <p className="adm-subtle">Configure verified credentials and multiple pages</p>
                </div>
              </div>
              <button type="button" className="adm-modal-close" onClick={() => setShowAddModal(false)}>
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleSave} className="adm-modal-form">
              {/* Section 1: Basic Information */}
              <div className="adm-form-section">
                <h4 className="adm-form-section-title">1. Certificate Information</h4>
                <div className="adm-field">
                  <label>Certificate Title *</label>
                  <input
                    type="text"
                    required
                    value={form.title}
                    onChange={(e) => setForm({ ...form, title: e.target.value })}
                    placeholder="e.g. 1st Place - Smart India Hackathon"
                    className="adm-input-lg"
                  />
                </div>

                <div className="adm-form-row">
                  <div className="adm-field">
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
                  <div className="adm-field">
                    <label>Visibility Setting</label>
                    <select
                      value={form.visibility}
                      onChange={(e) => setForm({ ...form, visibility: e.target.value })}
                    >
                      <option value="public">🌐 Public (Visible on /certificates)</option>
                      <option value="private">🔒 Private (Confidential, Personal Space only)</option>
                      <option value="hidden">👁️‍🗨️ Hidden / Turned Off</option>
                    </select>
                  </div>
                </div>

                <div className="adm-field">
                  <label>Description & Notes</label>
                  <textarea
                    rows={2}
                    value={form.description}
                    onChange={(e) => setForm({ ...form, description: e.target.value })}
                    placeholder="Details about the award, issuing university/company, rank, or year..."
                  />
                </div>
              </div>

              {/* Section 2: Multi-Page Certificate Pages */}
              <div className="adm-form-section">
                <div className="adm-section-header-row">
                  <div>
                    <h4 className="adm-form-section-title">2. Certificate Pages & Media</h4>
                    <p className="adm-subtle">Add single or multiple pages (Page 1, 2, 3...) using Google Drive links or direct URLs</p>
                  </div>
                  <button
                    type="button"
                    className="adm-btn adm-btn-sm adm-btn-secondary"
                    onClick={handleAddPage}
                  >
                    <Plus size={14} /> Add Another Page
                  </button>
                </div>

                <div className="adm-pages-list">
                  {form.pages.map((pageUrl, idx) => (
                    <div key={idx} className="adm-page-item-box">
                      <div className="adm-page-item-header">
                        <span className="adm-page-index-label">
                          <Layers size={13} /> {idx === 0 ? "Page 1 (Primary Front Page)" : `Page ${idx + 1}`}
                        </span>
                        {form.pages.length > 1 && (
                          <button
                            type="button"
                            className="adm-btn-icon adm-btn-icon-danger"
                            onClick={() => handleRemovePage(idx)}
                            title="Remove this page"
                          >
                            <Trash2 size={14} />
                          </button>
                        )}
                      </div>

                      <div className="adm-page-input-row">
                        <input
                          type="text"
                          value={pageUrl}
                          onChange={(e) => handlePageChange(idx, e.target.value)}
                          placeholder="https://drive.google.com/file/d/..."
                          className="adm-page-url-input"
                        />
                        <div className="adm-page-thumb-preview">
                          <SmartImage src={pageUrl} alt={`Preview Page ${idx + 1}`} className="adm-page-thumb" />
                        </div>
                      </div>
                    </div>
                  ))}
                </div>

                <div className="adm-field" style={{ marginTop: "14px" }}>
                  <label>Downloadable PDF Link (Optional for direct PDF downloads)</label>
                  <input
                    type="text"
                    value={form.file_url}
                    onChange={(e) => setForm({ ...form, file_url: e.target.value })}
                    placeholder="https://drive.google.com/uc?export=download&id=..."
                  />
                </div>
              </div>

              {/* Section 3: Tags & Ordering */}
              <div className="adm-form-section">
                <h4 className="adm-form-section-title">3. Tags & Sorting</h4>
                <div className="adm-form-row">
                  <div className="adm-field">
                    <label>Tags (comma separated)</label>
                    <input
                      type="text"
                      value={form.tags}
                      onChange={(e) => setForm({ ...form, tags: e.target.value })}
                      placeholder="hackathon, react, 1st prize"
                    />
                  </div>
                  <div className="adm-field">
                    <label>Display Sort Order</label>
                    <input
                      type="number"
                      value={form.sort_order}
                      onChange={(e) => setForm({ ...form, sort_order: e.target.value })}
                    />
                  </div>
                </div>
              </div>

              <div className="adm-modal-actions">
                <button type="button" className="adm-btn" onClick={() => setShowAddModal(false)}>
                  Cancel
                </button>
                <button type="submit" className="adm-btn adm-btn-primary adm-btn-lg">
                  {editingCert ? "Save Certificate Changes" : "Create Certificate"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

