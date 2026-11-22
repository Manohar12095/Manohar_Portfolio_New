import { useEffect, useState, useMemo, useRef } from "react";
import { Link } from "react-router-dom";
import { 
  ArrowLeft, Search, Filter, Grid, List, Download, Share2, 
  ExternalLink, Check, X, Award, ShieldCheck, Eye, Clock, ZoomIn,
  ChevronLeft, ChevronRight, Layers, FileText
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
  const [activePageIndex, setActivePageIndex] = useState(0);
  const [viewFormat, setViewFormat] = useState("slide"); // 'slide' | 'pdf'
  const [copiedLink, setCopiedLink] = useState(false);

  function extractDriveId(url) {
    if (!url) return null;
    const match = url.match(/\/d\/([a-zA-Z0-9_-]+)/) || url.match(/[?&]id=([a-zA-Z0-9_-]+)/);
    return match ? match[1] : null;
  }

  const activeDriveId = useMemo(() => {
    if (!activeCert) return null;
    return extractDriveId(activeCert.file_url) || extractDriveId(activeCert.image_url);
  }, [activeCert]);

  // Active certificate pages
  const activePages = useMemo(() => {
    if (!activeCert) return [];
    if (activeCert.pages && Array.isArray(activeCert.pages) && activeCert.pages.length > 0) {
      return activeCert.pages;
    }
    return [activeCert.image_url].filter(Boolean);
  }, [activeCert]);

  const isMultiPage = useMemo(() => {
    if (!activeCert) return false;
    return (
      activePages.length > 1 ||
      activeCert.is_multipage ||
      Boolean(activeCert.title && /marksheet|semester|sem|curriculum|transcript|page/i.test(activeCert.title))
    );
  }, [activeCert, activePages]);

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
    setActivePageIndex(0);
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
    setActivePageIndex(0);
    viewStartTime.current = null;
    currentCertId.current = null;
  };

  // Close lightbox on Escape key & arrow keys for page flipping
  useEffect(() => {
    const onKey = (e) => {
      if (e.key === "Escape") handleCloseLightbox();
      if (activeCert && isMultiPage) {
        if (e.key === "ArrowLeft") setActivePageIndex((i) => Math.max(0, i - 1));
        if (e.key === "ArrowRight") setActivePageIndex((i) => Math.min(activePages.length - 1, i + 1));
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [activeCert, isMultiPage, activePages.length]);

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
                <div className="certs-lightbox-meta-row">
                  <span className="certs-lightbox-cat">{activeCert.category}</span>
                  {isMultiPage && (
                    <span className="certs-lightbox-page-pill" style={{ background: "rgba(56, 189, 248, 0.2)", color: "#38bdf8", border: "1px solid rgba(56, 189, 248, 0.4)", fontWeight: 700 }}>
                      <Layers size={13} /> Contains Multiple Pages {activePages.length > 1 ? `· Page ${activePageIndex + 1} of ${activePages.length}` : ""}
                    </span>
                  )}
                </div>
                <h2>{activeCert.title}</h2>
                {activeDriveId && (
                  <div className="certs-mode-switcher" style={{ display: "flex", gap: "8px", marginTop: "8px" }}>
                    <button
                      type="button"
                      className={`btn btn-xs ${viewFormat === "slide" ? "btn-primary" : "btn-outline"}`}
                      onClick={() => setViewFormat("slide")}
                    >
                      🖼 Slide Image View
                    </button>
                    <button
                      type="button"
                      className={`btn btn-xs ${viewFormat === "pdf" ? "btn-primary" : "btn-outline"}`}
                      onClick={() => setViewFormat("pdf")}
                    >
                      📑 Interactive Multi-Page PDF Reader
                    </button>
                  </div>
                )}
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
                  href={activeCert.file_url || activePages[activePageIndex] || activeCert.image_url}
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
              {viewFormat === "pdf" && activeDriveId ? (
                <div className="certs-lightbox-pdf-wrap" style={{ width: "100%", height: "70vh", position: "relative" }}>
                  <iframe
                    src={`https://drive.google.com/file/d/${activeDriveId}/preview`}
                    title={activeCert.title}
                    style={{ width: "100%", height: "100%", border: "none", borderRadius: "10px", background: "#1e293b" }}
                    allow="autoplay"
                  />
                </div>
              ) : (
                <>
                  {isMultiPage && (
                    <button
                      type="button"
                      className="certs-lightbox-nav-btn is-prev"
                      onClick={(e) => { e.stopPropagation(); setActivePageIndex((i) => Math.max(0, i - 1)); }}
                      disabled={activePageIndex === 0}
                      aria-label="Previous Page"
                      title="Previous Page (Left Arrow)"
                    >
                      <ChevronLeft size={28} />
                    </button>
                  )}

                  <SmartImage
                    key={activePages[activePageIndex] || activeCert.image_url}
                    src={activePages[activePageIndex] || activeCert.image_url}
                    alt={`${activeCert.title} - Page ${activePageIndex + 1}`}
                    label={activeCert.title}
                    className="certs-lightbox-img"
                  />

                  {isMultiPage && (
                    <button
                      type="button"
                      className="certs-lightbox-nav-btn is-next"
                      onClick={(e) => { e.stopPropagation(); setActivePageIndex((i) => Math.min(activePages.length - 1, i + 1)); }}
                      disabled={activePageIndex === activePages.length - 1}
                      aria-label="Next Page"
                      title="Next Page (Right Arrow)"
                    >
                      <ChevronRight size={28} />
                    </button>
                  )}
                </>
              )}
            </div>

            {isMultiPage && (
              <div className="certs-lightbox-multipage-bar">
                <button
                  type="button"
                  className="btn btn-outline btn-xs"
                  onClick={() => setActivePageIndex((i) => Math.max(0, i - 1))}
                  disabled={activePageIndex === 0}
                >
                  <ChevronLeft size={14} /> Previous Page
                </button>

                <div className="certs-lightbox-dots">
                  {activePages.map((_, idx) => (
                    <button
                      key={idx}
                      type="button"
                      className={`certs-dot ${idx === activePageIndex ? "is-active" : ""}`}
                      onClick={() => setActivePageIndex(idx)}
                      title={`Jump to Page ${idx + 1}`}
                    >
                      {idx + 1}
                    </button>
                  ))}
                </div>

                <button
                  type="button"
                  className="btn btn-outline btn-xs"
                  onClick={() => setActivePageIndex((i) => Math.min(activePages.length - 1, i + 1))}
                  disabled={activePageIndex === activePages.length - 1}
                >
                  Next Page <ChevronRight size={14} />
                </button>
              </div>
            )}

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

