import { useEffect, useState } from "react";
import { 
  Plus, Trash2, Edit3, ExternalLink, Image, Video, FileText, 
  Sparkles, ShieldCheck, Check, X, Lock
} from "lucide-react";
import { getAdapter } from "../data/store";
import SmartImage from "../components/SmartImage";

export default function PersonalSpaceTab() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [editingItem, setEditingItem] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [statusMsg, setStatusMsg] = useState("");

  const adapter = getAdapter();
  const supabase = adapter?.supabase;

  const [form, setForm] = useState({
    type: "text",
    title: "",
    content: "",
    media_url: "",
    sort_order: 0
  });

  const fetchItems = async () => {
    if (!supabase) return;
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from("personal_items")
        .select("*")
        .order("sort_order", { ascending: true });
      if (error) throw error;
      setItems(data || []);
    } catch (err) {
      console.warn("Error fetching personal items:", err.message);
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
      if (editingItem) {
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
      setForm({ type: "text", title: "", content: "", media_url: "", sort_order: 0 });
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
    } catch (err) {
      alert("Error deleting item: " + err.message);
    }
  };

  const openEdit = (item) => {
    setEditingItem(item);
    setForm({
      type: item.type || "text",
      title: item.title || "",
      content: item.content || "",
      media_url: item.media_url || "",
      sort_order: item.sort_order ?? 0
    });
    setShowModal(true);
  };

  return (
    <div className="adm-personal-tab">
      {statusMsg && <div className="adm-alert-success">{statusMsg}</div>}

      <div className="adm-personal-intro-card">
        <div className="adm-personal-intro-info">
          <h3><Lock size={18} /> Private Personal Space Settings</h3>
          <p>
            Add notes, memories, personal photos, videos, and milestones. Only accessible by you or authorized admins.
          </p>
        </div>
        <div className="adm-personal-intro-actions">
          <a href="/personal" target="_blank" rel="noreferrer" className="adm-btn adm-btn-primary">
            <ExternalLink size={15} /> Open Personal Space ↗
          </a>
          <button
            type="button"
            className="adm-btn adm-btn-secondary"
            onClick={() => {
              setEditingItem(null);
              setForm({ type: "text", title: "", content: "", media_url: "", sort_order: items.length });
              setShowModal(true);
            }}
          >
            <Plus size={15} /> Add Personal Item
          </button>
        </div>
      </div>

      <div className="adm-personal-list">
        {loading ? (
          <p>Loading personal items...</p>
        ) : items.length === 0 ? (
          <div className="adm-empty-box">No personal items created yet. Click "Add Personal Item" to start!</div>
        ) : (
          items.map((item) => (
            <div key={item.id} className="adm-personal-item-row">
              <div className="adm-p-item-type">
                {item.type === "text" && <FileText size={18} />}
                {item.type === "photo" && <Image size={18} />}
                {item.type === "video" && <Video size={18} />}
                <span>{item.type}</span>
              </div>

              {item.media_url && (
                <div className="adm-p-item-preview">
                  <SmartImage src={item.media_url} alt="" className="adm-p-thumb" />
                </div>
              )}

              <div className="adm-p-item-content">
                <strong>{item.title || "Untitled Note"}</strong>
                {item.content && <p>{item.content}</p>}
                <span className="adm-p-date">{new Date(item.created_at).toLocaleDateString()}</span>
              </div>

              <div className="adm-p-item-actions">
                <button type="button" className="adm-btn-icon" onClick={() => openEdit(item)} title="Edit">
                  <Edit3 size={15} />
                </button>
                <button type="button" className="adm-btn-icon adm-btn-icon-danger" onClick={() => handleDelete(item.id)} title="Delete">
                  <Trash2 size={15} />
                </button>
              </div>
            </div>
          ))
        )}
      </div>

      {showModal && (
        <div className="adm-modal-overlay">
          <div className="adm-modal">
            <div className="adm-modal-head">
              <h3>{editingItem ? "Edit Personal Item" : "New Personal Item"}</h3>
              <button type="button" className="adm-modal-close" onClick={() => setShowModal(false)}>
                <X size={18} />
              </button>
            </div>
            <form onSubmit={handleSave} className="adm-modal-form">
              <label>Type</label>
              <select
                value={form.type}
                onChange={(e) => setForm({ ...form, type: e.target.value })}
              >
                <option value="text">Note / Written Milestone</option>
                <option value="photo">Personal Photo</option>
                <option value="video">Personal Video (.mp4 / Drive)</option>
              </select>

              <label>Title</label>
              <input
                type="text"
                value={form.title}
                onChange={(e) => setForm({ ...form, title: e.target.value })}
                placeholder="e.g. My Next Startup Milestone"
              />

              {(form.type === "photo" || form.type === "video") && (
                <>
                  <label>Media Link (Google Drive, YouTube, or Direct URL)</label>
                  <input
                    type="text"
                    value={form.media_url}
                    onChange={(e) => setForm({ ...form, media_url: e.target.value })}
                    placeholder="https://drive.google.com/file/d/..."
                  />
                </>
              )}

              <label>Content / Thoughts / Story</label>
              <textarea
                rows={4}
                value={form.content}
                onChange={(e) => setForm({ ...form, content: e.target.value })}
                placeholder="Write whatever is on your mind..."
              />

              <label>Sort Order</label>
              <input
                type="number"
                value={form.sort_order}
                onChange={(e) => setForm({ ...form, sort_order: e.target.value })}
              />

              <div className="adm-modal-actions">
                <button type="button" className="adm-btn" onClick={() => setShowModal(false)}>
                  Cancel
                </button>
                <button type="submit" className="adm-btn adm-btn-primary">
                  {editingItem ? "Update Item" : "Create Item"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
