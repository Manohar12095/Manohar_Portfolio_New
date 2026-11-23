import { useEffect, useState, useMemo } from "react";
import { Link, useNavigate } from "react-router-dom";
import { 
  Lock, ArrowLeft, Plus, Image, Video, FileText, Award, Eye, 
  Trash2, ExternalLink, ShieldCheck, Sparkles, Calendar, Heart,
  Search, Music, Edit3, X, Check, Save, File, RefreshCw, SlidersHorizontal
} from "lucide-react";
import { getAdapter } from "../data/store";
import { isSessionActive } from "../admin/auth";
import SmartImage from "../components/SmartImage";
import VideoSurface from "../components/VideoSurface";

export default function PersonalSpace() {
  const [items, setItems] = useState([]);
  const [privateCerts, setPrivateCerts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("all");
  const [search, setSearch] = useState("");
  const [sortBy, setSortBy] = useState("recent");
  const [authorized, setAuthorized] = useState(() => isSessionActive());
  const [pinCode, setPinCode] = useState("");
  const [pinError, setPinError] = useState("");

  // In-place text & item editor modal state
  const [editorOpen, setEditorOpen] = useState(false);
  const [editingItem, setEditingItem] = useState(null);
  const [editorForm, setEditorForm] = useState({
    title: "",
    type: "text",
    category: "Personal Note",
    content: "",
    media_url: "",
  });
  const [editorBusy, setEditorBusy] = useState(false);
  const [editorMsg, setEditorMsg] = useState("");

  const navigate = useNavigate();
  const adapter = getAdapter();
  const supabase = adapter?.supabase;

  // Check auth
  useEffect(() => {
    async function checkAuth() {
      if (isSessionActive()) {
        setAuthorized(true);
        return;
      }
      if (supabase) {
        const { data } = await supabase.auth.getSession();
        if (data?.session) {
          setAuthorized(true);
        }
      }
    }
    checkAuth();
  }, [supabase]);

  // Load private personal items and private certificates
  const loadData = async () => {
    if (!authorized) {
      setLoading(false);
      return;
    }
    if (!supabase) {
      setLoading(false);
      return;
    }
    try {
      const [itemsRes, certsRes] = await Promise.all([
        supabase.from("personal_items").select("*").order("sort_order", { ascending: true }),
        supabase.from("certificates").select("*").eq("visibility", "private").order("sort_order", { ascending: true })
      ]);

      setItems(itemsRes.data || []);
      setPrivateCerts(certsRes.data || []);
      setLoading(false);
    } catch (err) {
      console.warn("Failed loading personal space data:", err);
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [authorized, supabase]);

  const handlePinSubmit = (e) => {
    e.preventDefault();
    if (pinCode.length >= 4) {
      setAuthorized(true);
    } else {
      setPinError("Please enter a valid passkey or sign in to admin.");
    }
  };

  // Open editor for creating a new text document or note
  const handleOpenCreateNote = () => {
    setEditingItem(null);
    setEditorForm({
      title: "",
      type: "text",
      category: "Personal Note",
      content: "",
      media_url: "",
    });
    setEditorMsg("");
    setEditorOpen(true);
  };

  // Open in-place editor for existing item
  const handleOpenEdit = (item) => {
    setEditingItem(item);
    setEditorForm({
      title: item.title || "",
      type: item.type || "text",
      category: item.category || "Personal Note",
      content: item.content || "",
      media_url: item.media_url || "",
    });
    setEditorMsg("");
    setEditorOpen(true);
  };

  // Save changes (in-place create or update)
  const handleSaveEditor = async (e) => {
    e.preventDefault();
    if (!editorForm.title.trim()) {
      setEditorMsg("Please provide a title.");
      return;
    }
    setEditorBusy(true);
    setEditorMsg("");

    const payload = {
      title: editorForm.title.trim(),
      type: editorForm.type,
      category: editorForm.category.trim(),
      content: editorForm.content.trim(),
      media_url: editorForm.media_url.trim(),
      updated_at: new Date().toISOString(),
    };

    try {
      if (supabase) {
        if (editingItem && editingItem.id && !editingItem.id.startsWith("p")) {
          const { error } = await supabase.from("personal_items").update(payload).eq("id", editingItem.id);
          if (error) throw error;
        } else {
          const { error } = await supabase.from("personal_items").insert([{
            ...payload,
            sort_order: items.length + 1,
            created_at: new Date().toISOString(),
          }]);
          if (error) throw error;
        }
      }

      // Update local state immediately
      if (editingItem) {
        setItems((prev) => prev.map((it) => (it.id === editingItem.id ? { ...it, ...payload } : it)));
      } else {
        const newItem = { id: `local-${Date.now()}`, ...payload, created_at: new Date().toISOString() };
        setItems((prev) => [newItem, ...prev]);
      }

      setEditorOpen(false);
      loadData();
    } catch (err) {
      setEditorMsg("Error saving: " + err.message);
    } finally {
      setEditorBusy(false);
    }
  };

  // Delete item
  const handleDeleteItem = async (itemId) => {
    if (!window.confirm("Are you sure you want to delete this personal item?")) return;
    try {
      if (supabase && !itemId.startsWith("local-") && !itemId.startsWith("p")) {
        await supabase.from("personal_items").delete().eq("id", itemId);
      }
      setItems((prev) => prev.filter((it) => it.id !== itemId));
    } catch (err) {
      alert("Error deleting item: " + err.message);
    }
  };

  // Helper to get sort ranking for types
  const getTypeRank = (type) => {
    const t = (type || "").toLowerCase();
    if (t === "text" || t === "note") return 1;
    if (t === "document" || t === "pdf" || t === "file") return 2;
    if (t === "photo" || t === "image") return 3;
    if (t === "audio") return 4;
    if (t === "video") return 5;
    return 6;
  };

  // Filter and sort items
  const filteredAndSortedItems = useMemo(() => {
    let list = items.filter((it) => {
      // Tab filter
      if (filter !== "all") {
        if (filter === "document") {
          if (it.type !== "document" && it.type !== "file" && it.type !== "pdf") return false;
        } else if (filter === "photo") {
          if (it.type !== "photo" && it.type !== "image") return false;
        } else if (filter === "audio") {
          if (it.type !== "audio") return false;
        } else if (filter === "video") {
          if (it.type !== "video") return false;
        } else if (filter === "text") {
          if (it.type !== "text" && it.type !== "note") return false;
        } else if (it.type !== filter) {
          return false;
        }
      }

      // Search query
      const q = search.trim().toLowerCase();
      if (q) {
        const inTitle = (it.title || "").toLowerCase().includes(q);
        const inContent = (it.content || "").toLowerCase().includes(q);
        const inCat = (it.category || "").toLowerCase().includes(q);
        const inType = (it.type || "").toLowerCase().includes(q);
        if (!inTitle && !inContent && !inCat && !inType) return false;
      }

      return true;
    });

    // Sorting
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
  }, [items, filter, search, sortBy]);

  if (!authorized) {
    return (
      <div className="personal-gate-screen">
        <div className="personal-gate-card">
          <div className="personal-gate-icon">
            <Lock size={28} />
          </div>
          <h1>Personal Sanctuary</h1>
          <p>
            This is Manohar's private personal space containing personal memories, milestones, notes, and private certificates.
          </p>

          <form onSubmit={handlePinSubmit} className="personal-gate-form">
            <label htmlFor="ps-pin">Enter Admin Passcode</label>
            <input
              id="ps-pin"
              type="password"
              placeholder="••••••••"
              value={pinCode}
              onChange={(e) => { setPinCode(e.target.value); setPinError(""); }}
              autoFocus
            />
            {pinError && <p className="personal-gate-error">{pinError}</p>}
            <button type="submit" className="btn btn-primary btn-block">
              Unlock Personal Space
            </button>
          </form>

          <div className="personal-gate-links">
            <Link to="/admin" className="personal-gate-link">
              Sign in via Admin Dashboard →
            </Link>
            <br />
            <Link to="/" className="personal-gate-link personal-gate-subtle">
              ← Return to Public Portfolio
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="personal-space-page">
      <div className="container">
        {/* Top Header */}
        <header className="personal-header">
          <div className="personal-nav-row">
            <Link to="/" className="personal-back-btn">
              <ArrowLeft size={16} /> Return to Portfolio
            </Link>
            <div style={{ display: "flex", gap: "10px", alignItems: "center" }}>
              <button
                type="button"
                className="btn btn-primary btn-sm"
                onClick={handleOpenCreateNote}
                style={{ display: "inline-flex", alignItems: "center", gap: "6px" }}
              >
                <Plus size={15} /> New Note / Text
              </button>
              <Link to="/admin#personal" className="btn btn-outline btn-sm">
                Manage in Admin Panel ↗
              </Link>
            </div>
          </div>

          <div className="personal-hero">
            <div className="personal-pill">
              <Sparkles size={15} /> Private Personal Area
            </div>
            <h1>Manohar's Personal Space</h1>
            <p>
              An exclusive vault for private milestones, reflections, text notes, audio recordings, documents, and private credentials.
            </p>
          </div>
        </header>

        {/* Toolbar: Search & Sort Controls */}
        <div className="personal-toolbar" style={{
          display: "flex",
          gap: "14px",
          alignItems: "center",
          flexWrap: "wrap",
          margin: "24px 0 16px",
          padding: "16px 20px",
          background: "var(--surface)",
          border: "1px solid var(--border)",
          borderRadius: "var(--r-lg)",
          boxShadow: "var(--shadow-sm)"
        }}>
          {/* Search Box */}
          <div style={{ flex: "1 1 260px", position: "relative", display: "flex", alignItems: "center" }}>
            <Search size={17} style={{ position: "absolute", left: "12px", color: "var(--ink-soft)" }} />
            <input
              type="text"
              placeholder="Search files, notes, documents, audios by title or text..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              style={{
                width: "100%",
                padding: "9px 34px 9px 36px",
                borderRadius: "8px",
                border: "1px solid var(--border)",
                background: "var(--bg)",
                color: "var(--ink)",
                fontSize: "14px"
              }}
            />
            {search && (
              <button
                type="button"
                onClick={() => setSearch("")}
                style={{ position: "absolute", right: "10px", background: "none", border: "none", cursor: "pointer", color: "var(--ink-soft)" }}
              >
                <X size={15} />
              </button>
            )}
          </div>

          {/* Sort By Dropdown */}
          <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
            <SlidersHorizontal size={16} color="var(--ink-soft)" />
            <span style={{ fontSize: "13px", color: "var(--ink-soft)", fontWeight: 600 }}>Sort by:</span>
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              style={{
                padding: "8px 14px",
                borderRadius: "8px",
                border: "1px solid var(--border)",
                background: "var(--bg)",
                color: "var(--ink)",
                fontSize: "13.5px",
                fontWeight: 600,
                cursor: "pointer"
              }}
            >
              <option value="recent">Recently Modified</option>
              <option value="added">Date Added (Newest)</option>
              <option value="type">Type (Text &gt; Docs &gt; Media)</option>
              <option value="title-asc">Title (A → Z)</option>
              <option value="title-desc">Title (Z → A)</option>
            </select>
          </div>
        </div>

        {/* Filter Tabs */}
        <div className="personal-tabs">
          <button
            type="button"
            className={`personal-tab ${filter === "all" ? "is-active" : ""}`}
            onClick={() => setFilter("all")}
          >
            All Items ({items.length + privateCerts.length})
          </button>
          <button
            type="button"
            className={`personal-tab ${filter === "text" ? "is-active" : ""}`}
            onClick={() => setFilter("text")}
          >
            <FileText size={15} /> Notes &amp; Text ({items.filter(i => i.type === "text" || i.type === "note").length})
          </button>
          <button
            type="button"
            className={`personal-tab ${filter === "document" ? "is-active" : ""}`}
            onClick={() => setFilter("document")}
          >
            <Award size={15} /> Documents &amp; Marksheets ({items.filter(i => i.type === "document" || i.type === "file" || i.type === "pdf").length})
          </button>
          <button
            type="button"
            className={`personal-tab ${filter === "photo" ? "is-active" : ""}`}
            onClick={() => setFilter("photo")}
          >
            <Image size={15} /> Photos ({items.filter(i => i.type === "photo" || i.type === "image").length})
          </button>
          <button
            type="button"
            className={`personal-tab ${filter === "audio" ? "is-active" : ""}`}
            onClick={() => setFilter("audio")}
          >
            <Music size={15} /> Audios ({items.filter(i => i.type === "audio").length})
          </button>
          <button
            type="button"
            className={`personal-tab ${filter === "video" ? "is-active" : ""}`}
            onClick={() => setFilter("video")}
          >
            <Video size={15} /> Videos ({items.filter(i => i.type === "video").length})
          </button>
        </div>

        {/* Content Grid */}
        {loading ? (
          <div className="personal-loading">
            <div className="personal-spinner" />
            <p>Unlocking your personal space...</p>
          </div>
        ) : (
          <div className="personal-grid">
            {/* Private Certificates Section */}
            {(filter === "all" || filter === "certs") && !search && privateCerts.length > 0 && (
              <div className="personal-section-certs" style={{ gridColumn: "1 / -1", marginBottom: "16px" }}>
                <h2 className="personal-section-title">
                  <Award size={20} /> Private &amp; Confidential Credentials ({privateCerts.length})
                </h2>
                <div className="personal-certs-grid">
                  {privateCerts.map((cert) => (
                    <div key={cert.id} className="personal-card personal-cert-card">
                      <div className="personal-cert-media">
                        <SmartImage src={cert.image_url} alt={cert.title} className="personal-cert-img" />
                      </div>
                      <div className="personal-card-body">
                        <div className="personal-badge-row">
                          <span className="personal-badge">{cert.category || "Personal"}</span>
                          <span className="personal-badge personal-badge-secret">Confidential</span>
                        </div>
                        <h3>{cert.title}</h3>
                        {cert.description && <p>{cert.description}</p>}
                        {cert.file_url && (
                          <a href={cert.file_url} target="_blank" rel="noopener noreferrer" className="btn btn-outline btn-sm">
                            <ExternalLink size={14} /> Open Document
                          </a>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Empty State */}
            {filteredAndSortedItems.length === 0 && (
              <div style={{ gridColumn: "1 / -1", textAlign: "center", padding: "60px 20px", color: "var(--ink-soft)" }}>
                <FileText size={36} style={{ margin: "0 auto 12px", opacity: 0.5 }} />
                <h3>No items match your filter</h3>
                <p>Try searching for a different keyword or create a new text note.</p>
                <button type="button" className="btn btn-primary btn-sm" onClick={handleOpenCreateNote} style={{ marginTop: "12px" }}>
                  <Plus size={14} /> Create Text Note
                </button>
              </div>
            )}

            {/* Personal Items Cards */}
            {filteredAndSortedItems.map((item) => {
              const isText = item.type === "text" || item.type === "note";
              const isAudio = item.type === "audio" || (item.media_url && /\.(mp3|wav|ogg|m4a|aac)(\?.*)?$/i.test(item.media_url));
              const isVideo = item.type === "video";
              const isPhoto = item.type === "photo" || item.type === "image";
              const isDoc = item.type === "document" || item.type === "file" || item.type === "pdf";

              return (
                <div key={item.id} className={`personal-card personal-card-${item.type || "text"}`}>
                  {/* Photo Preview */}
                  {isPhoto && item.media_url && (
                    <div className="personal-card-media">
                      <SmartImage src={item.media_url} alt={item.title} className="personal-media-img" />
                    </div>
                  )}

                  {/* Video Preview */}
                  {isVideo && item.media_url && (
                    <div className="personal-card-media">
                      <VideoSurface src={item.media_url} controls loop muted={false} title={item.title} />
                    </div>
                  )}

                  {/* Body */}
                  <div className="personal-card-body">
                    <div className="personal-card-meta">
                      <span className="personal-type-label">
                        {isText && <FileText size={14} />}
                        {isPhoto && <Image size={14} />}
                        {isAudio && <Music size={14} />}
                        {isVideo && <Video size={14} />}
                        {isDoc && <Award size={14} />}
                        {(item.category || item.type || "NOTE").toUpperCase()}
                      </span>
                      <span className="personal-date">
                        {item.updated_at ? `Edited ${new Date(item.updated_at).toLocaleDateString()}` : new Date(item.created_at || Date.now()).toLocaleDateString()}
                      </span>
                    </div>

                    {item.title && <h3 className="personal-card-title">{item.title}</h3>}

                    {/* Content / Text / Notes (with in-place text view) */}
                    {item.content && (
                      <p className="personal-card-text" style={{
                        background: isText ? "rgba(0,0,0,0.02)" : "transparent",
                        padding: isText ? "10px 12px" : "0",
                        borderRadius: "6px",
                        borderLeft: isText ? "3px solid var(--accent)" : "none",
                        fontFamily: isText ? "inherit" : "inherit"
                      }}>
                        {item.content}
                      </p>
                    )}

                    {/* Audio Player */}
                    {isAudio && item.media_url && (
                      <div style={{ marginTop: "12px" }}>
                        <audio controls src={item.media_url} style={{ width: "100%", outline: "none" }} />
                      </div>
                    )}

                    {/* Media / Download Links */}
                    {item.media_url && !isAudio && (
                      <div style={{ display: "flex", gap: "8px", marginTop: "14px" }}>
                        <a
                          href={item.media_url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="btn btn-primary btn-sm"
                          style={{ flex: 1, textAlign: "center", display: "inline-flex", alignItems: "center", justifyContent: "center", gap: "6px" }}
                        >
                          <ExternalLink size={14} /> Open Document / File
                        </a>
                      </div>
                    )}

                    {/* In-Place Actions: Edit & Delete */}
                    <div style={{
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "center",
                      marginTop: "14px",
                      paddingTop: "12px",
                      borderTop: "1px solid var(--border)"
                    }}>
                      <button
                        type="button"
                        onClick={() => handleOpenEdit(item)}
                        className="btn btn-outline btn-xs"
                        style={{ display: "inline-flex", alignItems: "center", gap: "5px" }}
                        title="Edit text content and details in-place"
                      >
                        <Edit3 size={13} /> Edit Note / Content
                      </button>

                      <button
                        type="button"
                        onClick={() => handleDeleteItem(item.id)}
                        className="btn btn-xs"
                        style={{ color: "#ef4444", background: "none", border: "none", cursor: "pointer", display: "inline-flex", alignItems: "center", gap: "4px" }}
                        title="Delete item"
                      >
                        <Trash2 size={13} /> Delete
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* In-Place Text Editor Modal */}
        {editorOpen && (
          <div className="adm-modal-overlay" style={{
            position: "fixed",
            inset: 0,
            background: "rgba(0,0,0,0.65)",
            backdropFilter: "blur(5px)",
            display: "grid",
            placeItems: "center",
            zIndex: 1000,
            padding: "20px"
          }}>
            <div className="adm-modal-card" style={{
              background: "var(--surface)",
              color: "var(--ink)",
              maxWidth: "680px",
              width: "100%",
              borderRadius: "16px",
              border: "1px solid var(--border)",
              boxShadow: "var(--shadow-xl)",
              overflow: "hidden"
            }}>
              <div style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                padding: "18px 24px",
                borderBottom: "1px solid var(--border)"
              }}>
                <h3 style={{ margin: 0, fontSize: "1.2rem", display: "flex", alignItems: "center", gap: "8px" }}>
                  <Edit3 size={18} color="var(--accent)" />
                  {editingItem ? "Edit Note / Text Document" : "Create New Note / Document"}
                </h3>
                <button
                  type="button"
                  onClick={() => setEditorOpen(false)}
                  style={{ background: "none", border: "none", cursor: "pointer", color: "var(--ink-soft)" }}
                >
                  <X size={20} />
                </button>
              </div>

              <form onSubmit={handleSaveEditor} style={{ padding: "24px", display: "grid", gap: "16px" }}>
                {editorMsg && (
                  <div style={{ padding: "10px 14px", background: "#fee2e2", color: "#b91c1c", borderRadius: "8px", fontSize: "13.5px" }}>
                    {editorMsg}
                  </div>
                )}

                <div>
                  <label style={{ display: "block", fontSize: "13px", fontWeight: 700, marginBottom: "6px" }}>
                    Title *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. My Personal Note, Project Architecture Blueprint, etc."
                    value={editorForm.title}
                    onChange={(e) => setEditorForm({ ...editorForm, title: e.target.value })}
                    style={{
                      width: "100%",
                      padding: "10px 14px",
                      borderRadius: "8px",
                      border: "1px solid var(--border)",
                      background: "var(--bg)",
                      color: "var(--ink)",
                      fontSize: "14.5px"
                    }}
                  />
                </div>

                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "14px" }}>
                  <div>
                    <label style={{ display: "block", fontSize: "13px", fontWeight: 700, marginBottom: "6px" }}>
                      Item Type
                    </label>
                    <select
                      value={editorForm.type}
                      onChange={(e) => setEditorForm({ ...editorForm, type: e.target.value })}
                      style={{
                        width: "100%",
                        padding: "10px 14px",
                        borderRadius: "8px",
                        border: "1px solid var(--border)",
                        background: "var(--bg)",
                        color: "var(--ink)",
                        fontSize: "14px"
                      }}
                    >
                      <option value="text">📝 Text / Note / Markdown</option>
                      <option value="document">📄 Document / PDF</option>
                      <option value="photo">🖼️ Image / Photo</option>
                      <option value="audio">🎵 Audio Track / Recording</option>
                      <option value="video">🎬 Video Clip</option>
                    </select>
                  </div>

                  <div>
                    <label style={{ display: "block", fontSize: "13px", fontWeight: 700, marginBottom: "6px" }}>
                      Category / Tag
                    </label>
                    <input
                      type="text"
                      placeholder="e.g. Notes, Reflection, Identity, Audio"
                      value={editorForm.category}
                      onChange={(e) => setEditorForm({ ...editorForm, category: e.target.value })}
                      style={{
                        width: "100%",
                        padding: "10px 14px",
                        borderRadius: "8px",
                        border: "1px solid var(--border)",
                        background: "var(--bg)",
                        color: "var(--ink)",
                        fontSize: "14px"
                      }}
                    />
                  </div>
                </div>

                {/* Text Content Editor (Monospace & Comfortable) */}
                <div>
                  <label style={{ display: "block", fontSize: "13px", fontWeight: 700, marginBottom: "6px" }}>
                    Text Content / Notes
                  </label>
                  <textarea
                    rows={8}
                    placeholder="Type or paste your text, notes, reflections, or document body here..."
                    value={editorForm.content}
                    onChange={(e) => setEditorForm({ ...editorForm, content: e.target.value })}
                    style={{
                      width: "100%",
                      padding: "12px 14px",
                      borderRadius: "8px",
                      border: "1px solid var(--border)",
                      background: "var(--bg)",
                      color: "var(--ink)",
                      fontSize: "14px",
                      lineHeight: "1.6",
                      fontFamily: "var(--font-mono, monospace)",
                      resize: "vertical"
                    }}
                  />
                </div>

                {/* Optional Media Link */}
                <div>
                  <label style={{ display: "block", fontSize: "13px", fontWeight: 700, marginBottom: "6px" }}>
                    Media / File Link (Optional - Google Drive link or direct URL)
                  </label>
                  <input
                    type="text"
                    placeholder="https://drive.google.com/file/d/... or direct media link"
                    value={editorForm.media_url}
                    onChange={(e) => setEditorForm({ ...editorForm, media_url: e.target.value })}
                    style={{
                      width: "100%",
                      padding: "10px 14px",
                      borderRadius: "8px",
                      border: "1px solid var(--border)",
                      background: "var(--bg)",
                      color: "var(--ink)",
                      fontSize: "13.5px"
                    }}
                  />
                </div>

                <div style={{ display: "flex", justifyContent: "flex-end", gap: "10px", marginTop: "10px" }}>
                  <button
                    type="button"
                    className="btn btn-outline btn-sm"
                    onClick={() => setEditorOpen(false)}
                    disabled={editorBusy}
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="btn btn-primary btn-sm"
                    disabled={editorBusy}
                    style={{ display: "inline-flex", alignItems: "center", gap: "6px" }}
                  >
                    <Save size={15} />
                    {editorBusy ? "Saving..." : editingItem ? "Save Changes" : "Create Note"}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
