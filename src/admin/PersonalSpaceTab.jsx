import { useEffect, useState, useMemo } from "react";
import { 
  Plus, Trash2, Edit3, ExternalLink, Image, Video, FileText, 
  Sparkles, ShieldCheck, Check, X, Lock, Download, Share2, Search,
  Eye, FileCheck, Award, Layers, RefreshCw
} from "lucide-react";
import { getAdapter } from "../data/store";
import SmartImage from "../components/SmartImage";

// Built-in verified items from Google Drive folder: 1UwaSR7K92uQal80IUJbT4mzNUynwH6nw
const DEFAULT_PERSONAL_DOCS = [
  { id: "p1", file_id: "1sf9Czqtl8Zshiv-6s8CfVOZxdLuCOhT3", title: "Aadhaar Card", type: "document", category: "Identity", content: "Government of India - National Identity Card", media_url: "https://drive.google.com/file/d/1sf9Czqtl8Zshiv-6s8CfVOZxdLuCOhT3/view?usp=sharing" },
  { id: "p2", file_id: "1zrH6_O8Y1lty6ANUD1wikqZOfl-PDtej", title: "PAN Card", type: "document", category: "Identity", content: "Income Tax Department Permanent Account Number", media_url: "https://drive.google.com/file/d/1zrH6_O8Y1lty6ANUD1wikqZOfl-PDtej/view?usp=sharing" },
  { id: "p3", file_id: "18PylIai5Z83LrLbCXAqF75evMfiZuI3X", title: "Passport", type: "document", category: "Identity", content: "Republic of India Official Passport Document", media_url: "https://drive.google.com/file/d/18PylIai5Z83LrLbCXAqF75evMfiZuI3X/view?usp=sharing" },
  { id: "p4", file_id: "1Hj-9fjl0QO99YT6dSnqTYw-K_ErwZCeU", title: "Driving Licence", type: "document", category: "Identity", content: "Motor Vehicles Department Driving Licence", media_url: "https://drive.google.com/file/d/1Hj-9fjl0QO99YT6dSnqTYw-K_ErwZCeU/view?usp=sharing" },
  { id: "p5", file_id: "1mHqSWbiKlV8PiqU-afYIG1Rp38LxquPg", title: "College ID Card", type: "document", category: "Identity", content: "Official College Identity Verification Card", media_url: "https://drive.google.com/file/d/1mHqSWbiKlV8PiqU-afYIG1Rp38LxquPg/view?usp=sharing" },
  { id: "p6", file_id: "1uIveGAUxbwU5uCfBa83WubHacPeMIKRH", title: "Birth Certificate", type: "document", category: "Civil", content: "Government Registration of Birth Certificate", media_url: "https://drive.google.com/file/d/1uIveGAUxbwU5uCfBa83WubHacPeMIKRH/view?usp=sharing" },
  { id: "p7", file_id: "1_YxxKbgUl1df79oI9zEk1mU6OoUcpMXN", title: "Community Certificate", type: "document", category: "Civil", content: "Official Revenue Administration Community Certificate", media_url: "https://drive.google.com/file/d/1_YxxKbgUl1df79oI9zEk1mU6OoUcpMXN/view?usp=sharing" },
  { id: "p8", file_id: "1jzxeOI4pORhw9y0smj3wy-PNrPAKMvyt", title: "Bank Account Passbook / Statement", type: "document", category: "Financial", content: "Official Bank Account Verification & Statement", media_url: "https://drive.google.com/file/d/1jzxeOI4pORhw9y0smj3wy-PNrPAKMvyt/view?usp=sharing" },
  { id: "p9", file_id: "1SYNNkOzp_YbDpol9LuHf9Y-JMKPinKeV", title: "10th Standard Marksheet", type: "document", category: "Academic", content: "Secondary School Leaving Certificate (SSLC) Examination Marksheet", media_url: "https://drive.google.com/file/d/1SYNNkOzp_YbDpol9LuHf9Y-JMKPinKeV/view?usp=sharing" },
  { id: "p10", file_id: "1BBsnPy5ZTB_rMN1cMRY-TSGI2rWPbPFr", title: "11th Standard Marksheet", type: "document", category: "Academic", content: "Higher Secondary First Year Examination Marksheet", media_url: "https://drive.google.com/file/d/1BBsnPy5ZTB_rMN1cMRY-TSGI2rWPbPFr/view?usp=sharing" },
  { id: "p11", file_id: "1Mg4lwfokRNpT-2trOef636rl_0ZyXa-8", title: "12th Standard Marksheet", type: "document", category: "Academic", content: "Higher Secondary School Certificate (HSC) Examination Marksheet", media_url: "https://drive.google.com/file/d/1Mg4lwfokRNpT-2trOef636rl_0ZyXa-8/view?usp=sharing" },
  { id: "p12", file_id: "1L3DEs07tb-i1m1cVnA9aR0K-6oigkzmj", title: "B.E. Semester 1 Grade Sheet", type: "document", category: "Academic", content: "Bachelor of Engineering - Semester 1 Official Grade Sheet", media_url: "https://drive.google.com/file/d/1L3DEs07tb-i1m1cVnA9aR0K-6oigkzmj/view?usp=sharing" },
  { id: "p13", file_id: "1c_3l47ft6e3kiT2btR2tuzar7AbUcOiU", title: "B.E. Semester 3 Grade Sheet", type: "document", category: "Academic", content: "Bachelor of Engineering - Semester 3 Official Grade Sheet", media_url: "https://drive.google.com/file/d/1c_3l47ft6e3kiT2btR2tuzar7AbUcOiU/view?usp=sharing" },
  { id: "p14", file_id: "1ZuN3UQ7e86jmQtMwNpCI-DywNZroGfEW", title: "Transfer Certificate (TC)", type: "document", category: "Academic", content: "Official Institutional Transfer & Conduct Certificate", media_url: "https://drive.google.com/file/d/1ZuN3UQ7e86jmQtMwNpCI-DywNZroGfEW/view?usp=sharing" },
];

function extractDriveId(url) {
  if (!url) return null;
  const match = url.match(/\/d\/([a-zA-Z0-9_-]+)/) || url.match(/[?&]id=([a-zA-Z0-9_-]+)/);
  return match ? match[1] : null;
}

export default function PersonalSpaceTab({ currentUserEmail, currentUserRole }) {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [editingItem, setEditingItem] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [statusMsg, setStatusMsg] = useState("");
  const [search, setSearch] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("All");
  const [sortBy, setSortBy] = useState("recent");
  const [viewingDoc, setViewingDoc] = useState(null);
  const [copiedId, setCopiedId] = useState(null);

  const adapter = getAdapter();
  const supabase = adapter?.supabase;
  const isSuperUser = currentUserRole === "superuser" || currentUserEmail === "manoharorignal@gmail.com" || currentUserEmail === "pvcmanohar@gmail.com";

  const [form, setForm] = useState({
    type: "document",
    category: "Academic",
    title: "",
    content: "",
    media_url: "",
    sort_order: 0
  });

  const fetchItems = async () => {
    if (!supabase) {
      setItems(DEFAULT_PERSONAL_DOCS);
      setLoading(false);
      return;
    }
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from("personal_items")
        .select("*")
        .order("sort_order", { ascending: true });
      if (error) throw error;
      if (data && data.length > 0) {
        setItems(data);
      } else {
        setItems(DEFAULT_PERSONAL_DOCS);
      }
    } catch (err) {
      console.warn("Error fetching personal items:", err.message);
      setItems(DEFAULT_PERSONAL_DOCS);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchItems();
  }, []);

  const handleSave = async (e) => {
    e.preventDefault();
    if (!supabase) return;

    const payload = {
      type: form.type,
      title: form.title.trim(),
      content: form.content.trim(),
      media_url: form.media_url.trim(),
      sort_order: Number(form.sort_order) || 0,
      updated_at: new Date().toISOString()
    };

    try {
      if (editingItem && editingItem.id && !editingItem.id.startsWith("p")) {
        const { error } = await supabase.from("personal_items").update(payload).eq("id", editingItem.id);
        if (error) throw error;
        setStatusMsg("Item updated!");
      } else {
        const { error } = await supabase.from("personal_items").insert([payload]);
        if (error) throw error;
        setStatusMsg("Item created!");
      }

      setEditingItem(null);
      setShowModal(false);
      setForm({ type: "document", category: "Academic", title: "", content: "", media_url: "", sort_order: 0 });
      fetchItems();
      setTimeout(() => setStatusMsg(""), 3000);
    } catch (err) {
      alert("Error saving personal item: " + err.message);
    }
  };

  const handleDelete = async (id) => {
    if (!confirm("Delete this personal item?")) return;
    if (!supabase) return;
    try {
      await supabase.from("personal_items").delete().eq("id", id);
      setItems(prev => prev.filter(i => i.id !== id));
      setStatusMsg("Item removed from personal space");
      setTimeout(() => setStatusMsg(""), 3000);
    } catch (err) {
      alert("Error deleting item: " + err.message);
    }
  };

  const openEdit = (item) => {
    setEditingItem(item);
    setForm({
      type: item.type || "document",
      category: item.category || "Academic",
      title: item.title || "",
      content: item.content || "",
      media_url: item.media_url || "",
      sort_order: item.sort_order ?? 0
    });
    setShowModal(true);
  };

  const handleCopyLink = (item) => {
    const link = item.media_url || `https://drive.google.com/file/d/${item.file_id}/view`;
    navigator.clipboard.writeText(link);
    setCopiedId(item.id || item.file_id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const getTypeRank = (type) => {
    const t = (type || "").toLowerCase();
    if (t === "text" || t === "note") return 1;
    if (t === "document" || t === "pdf" || t === "file") return 2;
    if (t === "photo" || t === "image") return 3;
    if (t === "audio") return 4;
    if (t === "video") return 5;
    return 6;
  };

  const filteredItems = useMemo(() => {
    let list = items.filter(item => {
      const matchCat = categoryFilter === "All" || item.category === categoryFilter;
      const q = search.toLowerCase().trim();
      const matchSearch = !q || 
        (item.title && item.title.toLowerCase().includes(q)) ||
        (item.content && item.content.toLowerCase().includes(q)) ||
        (item.category && item.category.toLowerCase().includes(q)) ||
        (item.type && item.type.toLowerCase().includes(q));
      return matchCat && matchSearch;
    });

    if (sortBy === "recent") {
      list.sort((a, b) => new Date(b.updated_at || b.created_at || 0) - new Date(a.updated_at || a.created_at || 0));
    } else if (sortBy === "added") {
      list.sort((a, b) => new Date(b.created_at || 0) - new Date(a.created_at || 0));
    } else if (sortBy === "type") {
      list.sort((a, b) => getTypeRank(a.type) - getTypeRank(b.type));
    } else if (sortBy === "title-asc") {
      list.sort((a, b) => (a.title || "").localeCompare(b.title || ""));
    } else if (sortBy === "title-desc") {
      list.sort((a, b) => (b.title || "").localeCompare(a.title || ""));
    }

    return list;
  }, [items, categoryFilter, search, sortBy]);

  // Access Denied Screen for Non-SuperUsers
  if (!isSuperUser) {
    return (
      <div className="adm-access-denied-card" style={{ textAlign: "center", padding: "60px 20px", background: "var(--surface)", borderRadius: "16px", border: "1px solid var(--border)", margin: "20px 0" }}>
        <div style={{ width: "64px", height: "64px", borderRadius: "50%", background: "rgba(239, 68, 68, 0.15)", color: "#ef4444", display: "grid", placeItems: "center", margin: "0 auto 16px" }}>
          <Lock size={32} />
        </div>
        <h2 style={{ margin: "0 0 8px" }}>Restricted: Super User Access Only</h2>
        <p style={{ color: "var(--text-soft)", maxWidth: "520px", margin: "0 auto 20px" }}>
          This personal space contains official marksheets, government identity records, and confidential personal milestones. Editors and Viewers cannot access this area.
        </p>
      </div>
    );
  }

  return (
    <div className="adm-personal-tab">
      {statusMsg && <div className="adm-alert-success">{statusMsg}</div>}

      {/* Intro Header */}
      <div className="adm-personal-intro-card">
        <div className="adm-personal-intro-info">
          <h3><Lock size={20} /> Private Personal Space & Credentials Vault</h3>
          <p>
            Secure, encrypted vault for your official marksheets, degrees, government identification cards, and personal milestones. All files are linked directly from your Google Drive storage folder.
          </p>
        </div>
        <div className="adm-personal-intro-actions">
          <a href="/personal" target="_blank" rel="noreferrer" className="adm-btn adm-btn-secondary">
            <ExternalLink size={15} /> Open Private Page ↗
          </a>
          <button
            type="button"
            className="adm-btn adm-btn-primary"
            onClick={() => {
              setEditingItem(null);
              setForm({ type: "document", category: "Academic", title: "", content: "", media_url: "", sort_order: items.length });
              setShowModal(true);
            }}
          >
            <Plus size={15} /> Add Personal Item
          </button>
        </div>
      </div>

      {/* Toolbar: Search, Category Filters, Refresh */}
      <div className="adm-roles-action-bar" style={{ marginTop: "16px" }}>
        <div style={{ display: "flex", gap: "10px", flex: 1 }}>
          <div className="adm-roles-search" style={{ flex: 1 }}>
            <input
              type="text"
              placeholder="Search marksheet, ID card, certificate..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="adm-input"
            />
          </div>
          <select
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value)}
            className="adm-role-select"
            style={{ width: "auto" }}
          >
            <option value="All">All Categories ({items.length})</option>
            <option value="Academic">Academic / Marksheets</option>
            <option value="Identity">Government Identification</option>
            <option value="Civil">Civil Records</option>
            <option value="Financial">Financial Documents</option>
            <option value="Notes">Notes &amp; Text</option>
            <option value="Media">Audios &amp; Videos</option>
          </select>
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value)}
            className="adm-role-select"
            style={{ width: "auto" }}
          >
            <option value="recent">Sort: Recently Modified</option>
            <option value="added">Sort: Date Added</option>
            <option value="type">Sort: Type (Text &gt; Docs &gt; Media)</option>
            <option value="title-asc">Sort: Title (A → Z)</option>
            <option value="title-desc">Sort: Title (Z → A)</option>
          </select>
        </div>
        <button type="button" className="adm-btn adm-btn-sm" onClick={fetchItems}>
          <RefreshCw size={14} className={loading ? "spin" : ""} /> Refresh
        </button>
      </div>

      {/* Grid of Personal Documents */}
      <div className="adm-personal-grid" style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(320px, 1fr))", gap: "16px", marginTop: "16px" }}>
        {loading ? (
          <p>Loading personal files...</p>
        ) : filteredItems.length === 0 ? (
          <div className="adm-empty-box" style={{ gridColumn: "1 / -1" }}>No documents found matching search.</div>
        ) : (
          filteredItems.map((item) => {
            const driveId = extractDriveId(item.media_url) || item.file_id;
            return (
              <div key={item.id || item.file_id} className="adm-personal-card" style={{ background: "var(--surface)", border: "1px solid var(--border)", borderRadius: "12px", padding: "16px", display: "flex", flexDirection: "column", gap: "12px" }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                    <div style={{ width: "36px", height: "36px", borderRadius: "8px", background: "rgba(56, 189, 248, 0.12)", color: "#38bdf8", display: "grid", placeItems: "center" }}>
                      <FileCheck size={18} />
                    </div>
                    <div>
                      <h4 style={{ margin: 0, fontSize: "15px" }}>{item.title}</h4>
                      <span style={{ fontSize: "11px", color: "var(--text-soft)", textTransform: "uppercase", fontWeight: 600 }}>{item.category || "Document"}</span>
                    </div>
                  </div>
                  <span style={{ fontSize: "11px", background: "rgba(255, 255, 255, 0.08)", padding: "2px 6px", borderRadius: "4px" }}>
                    {item.type || "PDF"}
                  </span>
                </div>

                {item.content && (
                  <p style={{ margin: 0, fontSize: "13px", color: "var(--text-soft)", lineHeight: "1.4" }}>
                    {item.content}
                  </p>
                )}

                {/* Quick Action Buttons */}
                <div style={{ display: "flex", gap: "8px", marginTop: "auto", paddingTop: "8px", borderTop: "1px solid var(--border)" }}>
                  <button
                    type="button"
                    className="adm-btn adm-btn-sm adm-btn-primary"
                    style={{ flex: 1, display: "flex", justifyContent: "center", alignItems: "center", gap: "6px" }}
                    onClick={() => setViewingDoc(item)}
                  >
                    <Eye size={14} /> View Document
                  </button>
                  <a
                    href={item.media_url || `https://drive.google.com/file/d/${driveId}/view`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="adm-btn adm-btn-sm"
                    title="Download original file"
                    download
                  >
                    <Download size={14} />
                  </a>
                  <button
                    type="button"
                    className="adm-btn adm-btn-sm"
                    title="Copy Google Drive link"
                    onClick={() => handleCopyLink(item)}
                  >
                    {copiedId === (item.id || item.file_id) ? <Check size={14} color="#10b981" /> : <Share2 size={14} />}
                  </button>
                  <button
                    type="button"
                    className="adm-btn-icon"
                    title="Edit item notes"
                    onClick={() => openEdit(item)}
                  >
                    <Edit3 size={14} />
                  </button>
                  <button
                    type="button"
                    className="adm-btn-icon adm-btn-icon-danger"
                    title="Delete item"
                    onClick={() => handleDelete(item.id)}
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Document Full View Modal */}
      {viewingDoc && (
        <div className="adm-modal-overlay" onClick={() => setViewingDoc(null)}>
          <div className="adm-modal" style={{ maxWidth: "880px", width: "95vw" }} onClick={(e) => e.stopPropagation()}>
            <div className="adm-modal-head">
              <div className="adm-modal-title-area">
                <div className="adm-modal-icon-badge" style={{ background: "rgba(56, 189, 248, 0.15)", color: "#38bdf8" }}>
                  <FileCheck size={18} />
                </div>
                <div>
                  <h3 style={{ margin: 0 }}>{viewingDoc.title}</h3>
                  <small style={{ color: "var(--text-soft)" }}>{viewingDoc.category} · Confidential Document</small>
                </div>
              </div>
              <div style={{ display: "flex", gap: "8px", alignItems: "center" }}>
                <a
                  href={viewingDoc.media_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="adm-btn adm-btn-sm"
                  download
                >
                  <Download size={14} /> Download
                </a>
                <button type="button" className="adm-modal-close" onClick={() => setViewingDoc(null)}>
                  <X size={18} />
                </button>
              </div>
            </div>

            <div style={{ padding: "16px", height: "72vh" }}>
              {(() => {
                const driveId = extractDriveId(viewingDoc.media_url) || viewingDoc.file_id;
                if (driveId) {
                  return (
                    <iframe
                      src={`https://drive.google.com/file/d/${driveId}/preview`}
                      title={viewingDoc.title}
                      style={{ width: "100%", height: "100%", border: "none", borderRadius: "8px", background: "#1e293b" }}
                      allow="autoplay"
                    />
                  );
                }
                return (
                  <SmartImage src={viewingDoc.media_url} alt={viewingDoc.title} style={{ width: "100%", height: "100%", objectFit: "contain" }} />
                );
              })()}
            </div>
          </div>
        </div>
      )}

      {/* Add / Edit Personal Item Modal */}
      {showModal && (
        <div className="adm-modal-overlay" onClick={() => setShowModal(false)}>
          <div className="adm-modal" onClick={(e) => e.stopPropagation()}>
            <div className="adm-modal-head">
              <div className="adm-modal-title-area">
                <div className="adm-modal-icon-badge">
                  <FileText size={18} />
                </div>
                <h3 style={{ margin: 0 }}>{editingItem ? "Edit Personal Document" : "Add Personal Document / Note"}</h3>
              </div>
              <button type="button" className="adm-modal-close" onClick={() => setShowModal(false)}>
                <X size={18} />
              </button>
            </div>
            <form onSubmit={handleSave} className="adm-modal-form">
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px" }}>
                <div>
                  <label>Item Type</label>
                  <select
                    value={form.type}
                    onChange={(e) => setForm({ ...form, type: e.target.value })}
                  >
                    <option value="document">📄 Document / PDF</option>
                    <option value="text">📝 Text Note / Document</option>
                    <option value="photo">🖼️ Image / Photo</option>
                    <option value="audio">🎵 Audio Track / Recording</option>
                    <option value="video">🎬 Video Clip</option>
                  </select>
                </div>
                <div>
                  <label>Category</label>
                  <select
                    value={form.category}
                    onChange={(e) => setForm({ ...form, category: e.target.value })}
                  >
                    <option value="Academic">Academic (Marksheet / Grade Sheet / TC)</option>
                    <option value="Identity">Government Identification</option>
                    <option value="Civil">Civil Records</option>
                    <option value="Financial">Financial Documents</option>
                    <option value="Notes">Notes &amp; Reflections</option>
                    <option value="General">General Personal Item</option>
                  </select>
                </div>
              </div>

              <label>Document / Note Title *</label>
              <input
                type="text"
                required
                value={form.title}
                onChange={(e) => setForm({ ...form, title: e.target.value })}
                placeholder="e.g. B.E. Semester 4 Marksheet or System Architecture Notes"
              />

              <label>Google Drive or Direct Media Link {form.type !== "text" ? "*" : "(Optional)"}</label>
              <input
                type="text"
                required={form.type !== "text"}
                value={form.media_url}
                onChange={(e) => setForm({ ...form, media_url: e.target.value })}
                placeholder="https://drive.google.com/file/d/.../view?usp=sharing"
              />

              <label>Content / Notes / Description</label>
              <textarea
                rows={6}
                value={form.content}
                onChange={(e) => setForm({ ...form, content: e.target.value })}
                placeholder="Type or paste document text, note contents, or descriptions..."
                style={{ fontFamily: form.type === "text" ? "var(--font-mono, monospace)" : "inherit" }}
              />

              <div className="adm-modal-actions">
                <button type="button" className="adm-btn" onClick={() => setShowModal(false)}>
                  Cancel
                </button>
                <button type="submit" className="adm-btn adm-btn-primary">
                  {editingItem ? "Update Document" : "Save Document"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
