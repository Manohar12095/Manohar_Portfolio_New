import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { 
  Lock, ArrowLeft, Plus, Image, Video, FileText, Award, Eye, 
  Trash2, ExternalLink, ShieldCheck, Sparkles, Calendar, Heart
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
  const [authorized, setAuthorized] = useState(() => isSessionActive());
  const [pinCode, setPinCode] = useState("");
  const [pinError, setPinError] = useState("");
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
  useEffect(() => {
    if (!authorized) {
      setLoading(false);
      return;
    }
    let alive = true;
    async function loadData() {
      if (!supabase) {
        setLoading(false);
        return;
      }
      try {
        const [itemsRes, certsRes] = await Promise.all([
          supabase.from("personal_items").select("*").order("sort_order", { ascending: true }),
          supabase.from("certificates").select("*").eq("visibility", "private").order("sort_order", { ascending: true })
        ]);

        if (alive) {
          setItems(itemsRes.data || []);
          setPrivateCerts(certsRes.data || []);
          setLoading(false);
        }
      } catch (err) {
        console.warn("Failed loading personal space data:", err);
        if (alive) setLoading(false);
      }
    }
    loadData();
    return () => { alive = false; };
  }, [authorized, supabase]);

  const handlePinSubmit = (e) => {
    e.preventDefault();
    if (pinCode.length >= 4) {
      setAuthorized(true);
    } else {
      setPinError("Please enter a valid passkey or sign in to admin.");
    }
  };

  // Filter items
  const displayItems = items.filter((it) => {
    if (filter === "all") return true;
    return it.type === filter;
  });

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
            <Link to="/admin#personal" className="btn btn-outline btn-sm">
              Manage in Admin Panel ↗
            </Link>
          </div>

          <div className="personal-hero">
            <div className="personal-pill">
              <Sparkles size={15} /> Private Personal Area
            </div>
            <h1>Manohar's Personal Space</h1>
            <p>
              An exclusive sanctuary for private milestones, reflections, media archives, and personal credentials.
            </p>
          </div>
        </header>

        {/* Filter Bar */}
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
            <FileText size={15} /> Notes & Thoughts ({items.filter(i => i.type === "text").length})
          </button>
          <button
            type="button"
            className={`personal-tab ${filter === "photo" ? "is-active" : ""}`}
            onClick={() => setFilter("photo")}
          >
            <Image size={15} /> Photos ({items.filter(i => i.type === "photo").length})
          </button>
          <button
            type="button"
            className={`personal-tab ${filter === "video" ? "is-active" : ""}`}
            onClick={() => setFilter("video")}
          >
            <Video size={15} /> Videos ({items.filter(i => i.type === "video").length})
          </button>
          <button
            type="button"
            className={`personal-tab ${filter === "certs" ? "is-active" : ""}`}
            onClick={() => setFilter("certs")}
          >
            <Award size={15} /> Private Certs ({privateCerts.length})
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
            {(filter === "all" || filter === "certs") && privateCerts.length > 0 && (
              <div className="personal-section-certs">
                <h2 className="personal-section-title">
                  <Award size={20} /> Private & Confidential Credentials ({privateCerts.length})
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

            {/* Other Personal Items */}
            {filter !== "certs" && displayItems.map((item) => (
              <div key={item.id} className={`personal-card personal-card-${item.type}`}>
                {item.type === "photo" && item.media_url && (
                  <div className="personal-card-media">
                    <SmartImage src={item.media_url} alt={item.title} className="personal-media-img" />
                  </div>
                )}

                {item.type === "video" && item.media_url && (
                  <div className="personal-card-media">
                    <VideoSurface src={item.media_url} controls loop muted={false} title={item.title} />
                  </div>
                )}

                <div className="personal-card-body">
                  <div className="personal-card-meta">
                    <span className="personal-type-label">
                      {item.type === "text" && <FileText size={14} />}
                      {item.type === "photo" && <Image size={14} />}
                      {item.type === "video" && <Video size={14} />}
                      {item.type.toUpperCase()}
                    </span>
                    <span className="personal-date">
                      {new Date(item.created_at).toLocaleDateString()}
                    </span>
                  </div>

                  {item.title && <h3 className="personal-card-title">{item.title}</h3>}
                  {item.content && <p className="personal-card-text">{item.content}</p>}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
