import { useState } from "react";
import { Download, ExternalLink, Eye, Share2, Check, Lock, Globe, EyeOff, Layers, FileText } from "lucide-react";
import SmartImage from "./SmartImage";

export default function CertificateCard({ certificate, onOpenLightbox, onRecordView }) {
  const [copied, setCopied] = useState(false);

  const allPages = (certificate.pages && certificate.pages.length > 0)
    ? certificate.pages
    : [certificate.image_url].filter(Boolean);
  const isMultiPage = allPages.length > 1;

  const handleCopy = (e) => {
    e.stopPropagation();
    const link = certificate.image_url || certificate.file_url || window.location.href;
    navigator.clipboard.writeText(link);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDownload = (e) => {
    e.stopPropagation();
    const url = certificate.file_url || certificate.image_url;
    if (url) {
      window.open(url, "_blank", "noopener,noreferrer");
    }
  };

  const handleCardClick = () => {
    if (onRecordView) onRecordView(certificate.id);
    if (onOpenLightbox) onOpenLightbox(certificate);
  };

  const getVisibilityBadge = () => {
    if (certificate.visibility === "private") {
      return <span className="cert-badge cert-badge-private"><Lock size={12} /> Private Space</span>;
    }
    if (certificate.visibility === "hidden") {
      return <span className="cert-badge cert-badge-hidden"><EyeOff size={12} /> Hidden</span>;
    }
    return <span className="cert-badge cert-badge-public"><Globe size={12} /> Public</span>;
  };

  return (
    <div className={`cert-card ${isMultiPage ? "has-multiple-pages" : ""}`} onClick={handleCardClick} role="button" tabIndex={0}>
      <div className="cert-media">
        <SmartImage
          src={allPages[0] || certificate.image_url}
          alt={certificate.title}
          label={certificate.title}
          className="cert-img"
        />
        <div className="cert-overlay">
          <span className="cert-view-btn">
            <Eye size={18} /> {isMultiPage ? `View All ${allPages.length} Pages` : "View Full"}
          </span>
        </div>
        <div className="cert-top-badges">
          <div className="cert-badges-left">
            <span className="cert-category-badge">{certificate.category || "General"}</span>
            {isMultiPage && (
              <span className="cert-badge cert-badge-multipage">
                <Layers size={12} /> Contains {allPages.length} Pages
              </span>
            )}
          </div>
          {getVisibilityBadge()}
        </div>
      </div>

      <div className="cert-body">
        <h3 className="cert-title" title={certificate.title}>{certificate.title}</h3>
        {certificate.description && (
          <p className="cert-desc">{certificate.description}</p>
        )}

        {certificate.tags && certificate.tags.length > 0 && (
          <div className="cert-tags">
            {certificate.tags.slice(0, 3).map((tag, idx) => (
              <span key={idx} className="cert-tag">#{tag}</span>
            ))}
          </div>
        )}

        <div className="cert-actions" onClick={(e) => e.stopPropagation()}>
          <button
            type="button"
            className="cert-action-btn"
            onClick={handleDownload}
            title="Download or open original file"
          >
            <Download size={15} /> Download
          </button>
          <button
            type="button"
            className={`cert-action-btn ${copied ? "is-copied" : ""}`}
            onClick={handleCopy}
            title="Copy public link"
          >
            {copied ? <Check size={15} color="#10b981" /> : <Share2 size={15} />}
            {copied ? "Copied" : "Copy Link"}
          </button>
        </div>
      </div>
    </div>
  );
}

