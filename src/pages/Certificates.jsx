import { useEffect, useState, useMemo, useRef } from "react";
import { Link } from "react-router-dom";
import { 
  ArrowLeft, Search, Filter, Grid, List, Download, Share2, 
  ExternalLink, Check, X, Award, ShieldCheck, Eye, Clock, ZoomIn
} from "lucide-react";
import { getAdapter } from "../data/store";
import { getOrCreateSessionId, getStoredVisitorName, logVisitorAction } from "../lib/telemetry";
import CertificateCard from "../components/CertificateCard";
import SmartImage from "../components/SmartImage";

export default function Certificates() {
  const [certificates, setCertificates] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("All");
  const [sortBy, setSortBy] = useState("default");
  const [viewMode, setViewMode] = useState("grid"); // 'grid' | 'list'
  const [activeCert, setActiveCert] = useState(null);
  const [copiedLink, setCopiedLink] = useState(false);

  // Analytics timer for active certificate viewing
  const viewStartTime = useRef(null);
  const currentCertId = useRef(null);

  // Fetch certificates from Supabase
  useEffect(() => {
    let alive = true;
    async function fetchCerts() {
      const adapter = getAdapter();
      const supabase = adapter?.supabase;
      if (!supabase) {
        setLoading(false);
        return;
      }
      try {
        const { data, error } = await supabase
          .from("certificates")
          .select("*")
          .eq("visibility", "public")
          .order("sort_order", { ascending: true });

        if (error) throw error;
        if (alive) {
          setCertificates(data || []);
          setLoading(false);
        }
      } catch (err) {
        console.warn("Failed to load certificates from database:", err.message);
        if (alive) setLoading(false);
      }
    }
    fetchCerts();
    return () => { alive = false; };
  }, []);

  // Record view time when modal opens or closes
  const recordViewDuration = (certId, durationMs) => {
    if (!certId || durationMs < 500) return;
    const adapter = getAdapter();
    const supabase = adapter?.supabase;
    if (!supabase) return;

    const sessionId = getOrCreateSessionId();
    const visitorName = getStoredVisitorName() || "Anonymous Visitor";

    supabase.from("certificate_views").insert([
      {
        certificate_id: certId,
        session_id: sessionId,
        visitor_name: visitorName,
        time_spent_ms: Math.round(durationMs),
        created_at: new Date().toISOString()
      }
    ]).then(({ error }) => {
      if (error) console.warn("Could not log certificate view:", error.message);
    });
  };

  const handleOpenLightbox = (cert) => {
    if (activeCert && viewStartTime.current) {
      const spent = Date.now() - viewStartTime.current;
      recordViewDuration(activeCert.id, spent);
    }
    setActiveCert(cert);
    viewStartTime.current = Date.now();
    currentCertId.current = cert.id;
    logVisitorAction(`Opened Certificate: ${cert.title}`, "certificate_view", { certId: cert.id });
  };

  const handleCloseLightbox = () => {
    if (activeCert && viewStartTime.current) {
      const spent = Date.now() - viewStartTime.current;
      recordViewDuration(activeCert.id, spent);
    }
    setActiveCert(null);
    viewStartTime.current = null;
    currentCertId.current = null;
  };

  // Close lightbox on Escape key
  useEffect(() => {
    const onKey = (e) => {
      if (e.key === "Escape") handleCloseLightbox();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [activeCert]);

  // Extract distinct categories
  const categories = useMemo(() => {
    const set = new Set();
    certificates.forEach((c) => {
      if (c.category) set.add(c.category);
    });
    return ["All", ...Array.from(set).sort()];
  }, [certificates]);

  // Filter and sort certificates
  const filteredCerts = useMemo(() => {
    let list = certificates.filter((c) => {
      const matchesCategory = selectedCategory === "All" || c.category === selectedCategory;
      const q = search.trim().toLowerCase();
      const matchesSearch =
        !q ||
        c.title.toLowerCase().includes(q) ||
        (c.category && c.category.toLowerCase().includes(q)) ||
        (c.description && c.description.toLowerCase().includes(q)) ||
        (c.tags && c.tags.some((t) => t.toLowerCase().includes(q)));
      return matchesCategory && matchesSearch;
    });

    if (sortBy === "title-asc") {
      list.sort((a, b) => a.title.localeCompare(b.title));
    } else if (sortBy === "title-desc") {
      list.sort((a, b) => b.title.localeCompare(a.title));
    } else if (sortBy === "category") {
      list.sort((a, b) => (a.category || "").localeCompare(b.category || ""));
    } else {
      list.sort((a, b) => (a.sort_order ?? 0) - (b.sort_order ?? 0));
    }

    return list;
  }, [certificates, selectedCategory, search, sortBy]);

  const handleCopyActiveLink = () => {
    if (!activeCert) return;
    const link = activeCert.file_url || activeCert.image_url || window.location.href;
    navigator.clipboard.writeText(link);
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 2000);
  };

  return (
    <div className="certs-page">
      <div className="container">
        {/* Top Header */}
        <header className="certs-header">
          <Link to="/" className="certs-back-link">
            <ArrowLeft size={16} /> Back to Portfolio
          </Link>
          <div className="certs-title-area">
            <div className="certs-badge">
              <ShieldCheck size={16} /> Verified Credentials & Certificates
            </div>
            <h1>Certificates & Accreditations</h1>
            <p>
              A verified catalog of official awards, course completions, national symposiums, workshops, and sports achievements.
            </p>
          </div>
        </header>

        {/* Controls: Search, Category Filters, Sort, View */}
        <div className="certs-toolbar">
          <div className="certs-search-box">
            <Search size={18} className="certs-search-icon" />
            <input
              type="text"
              placeholder="Search certificates by title, keyword, or tag..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="certs-search-input"
            />
            {search && (
              <button className="certs-search-clear" onClick={() => setSearch("")}>
                <X size={16} />
              </button>
            )}
          </div>

          <div className="certs-toolbar-actions">
            <div className="certs-sort-select-wrapper">
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
                className="certs-sort-select"
                aria-label="Sort certificates"
              >
                <option value="default">Default Order</option>
                <option value="title-asc">Title (A → Z)</option>
                <option value="title-desc">Title (Z → A)</option>
                <option value="category">Category</option>
              </select>
            </div>

            <div className="certs-view-toggle">
              <button
                type="button"
                className={`certs-view-btn ${viewMode === "grid" ? "is-active" : ""}`}
                onClick={() => setViewMode("grid")}
                title="Grid View"
              >
                <Grid size={17} />
              </button>
              <button
                type="button"
                className={`certs-view-btn ${viewMode === "list" ? "is-active" : ""}`}
                onClick={() => setViewMode("list")}
                title="List View"
              >
                <List size={17} />
              </button>
            </div>
          </div>
        </div>

        {/* Category Pills */}
        <div className="certs-categories" role="tablist">
          {categories.map((cat) => {
            const count = cat === "All" ? certificates.length : certificates.filter((c) => c.category === cat).length;
            const active = selectedCategory === cat;
            return (
              <button
                key={cat}
                type="button"
                role="tab"
                aria-selected={active}
                className={`certs-cat-pill ${active ? "is-active" : ""}`}
                onClick={() => setSelectedCategory(cat)}
              >
                <span>{cat}</span>
                <span className="certs-cat-count">{count}</span>
              </button>
            );
          })}
        </div>

        {/* Content Area */}
        {loading ? (
          <div className="certs-loading">
            <div className="certs-spinner" />
            <p>Loading verified certificates...</p>
          </div>
        ) : filteredCerts.length === 0 ? (
          <div className="certs-empty">
            <Award size={48} className="certs-empty-icon" />
            <h3>No certificates found</h3>
            <p>Try refining your search keyword or selecting a different category.</p>
            <button
              type="button"
              className="btn btn-outline btn-sm"
              onClick={() => { setSearch(""); setSelectedCategory("All"); }}
            >
              Reset Filters
            </button>
          </div>
        ) : (
          <div className={`certs-display ${viewMode === "list" ? "is-list-view" : "is-grid-view"}`}>
            {filteredCerts.map((cert) => (
              <CertificateCard
                key={cert.id}
                certificate={cert}
                onOpenLightbox={handleOpenLightbox}
                onRecordView={(id) => logVisitorAction(`Viewed Certificate Card: ${cert.title}`, "click")}
              />
            ))}
          </div>
        )}

        <div className="certs-footer-note">
          <p>
            Showing {filteredCerts.length} of {certificates.length} certificates. Original scanned documents and credentials are hosted securely on Google Drive & Supabase Storage.
          </p>
        </div>
      </div>

      {/* Lightbox Modal */}
      {activeCert && (
        <div className="certs-lightbox-overlay" onClick={handleCloseLightbox}>
          <div className="certs-lightbox-container" onClick={(e) => e.stopPropagation()}>
            <div className="certs-lightbox-header">
              <div className="certs-lightbox-info">
                <span className="certs-lightbox-cat">{activeCert.category}</span>
                <h2>{activeCert.title}</h2>
              </div>
              <div className="certs-lightbox-controls">
                <button
                  type="button"
                  className="certs-btn-icon"
                  onClick={handleCopyActiveLink}
                  title="Copy direct link"
                >
                  {copiedLink ? <Check size={18} color="#10b981" /> : <Share2 size={18} />}
                </button>
                <a
                  href={activeCert.file_url || activeCert.image_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="certs-btn-icon"
                  title="Download / Open Original"
                  download
                >
                  <Download size={18} />
                </a>
                <button
                  type="button"
                  className="certs-btn-icon certs-btn-close"
                  onClick={handleCloseLightbox}
                  title="Close (Esc)"
                >
                  <X size={20} />
                </button>
              </div>
            </div>

            <div className="certs-lightbox-media">
              <SmartImage
                src={activeCert.image_url}
                alt={activeCert.title}
                label={activeCert.title}
                className="certs-lightbox-img"
              />
            </div>

            {activeCert.description && (
              <div className="certs-lightbox-footer">
                <p>{activeCert.description}</p>
                {activeCert.tags && activeCert.tags.length > 0 && (
                  <div className="certs-tags">
                    {activeCert.tags.map((t, idx) => (
                      <span key={idx} className="cert-tag">#{t}</span>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

