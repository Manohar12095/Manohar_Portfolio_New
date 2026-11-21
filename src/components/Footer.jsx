import { ArrowUp, Award } from "lucide-react";
import { Link } from "react-router-dom";
import { useContent } from "../context/ContentContext";
import { prefersReducedMotion } from "../hooks/useMotion";

export default function Footer() {
  const {
    content: { site },
  } = useContent();
  return (
    <footer className="footer container">
      <div className="footer-certs-cta">
        <Link to="/certificates" className="btn btn-primary btn-md footer-certs-btn" aria-label="View my certificates">
          <Award size={18} /> View my certificates
        </Link>
      </div>
      <div className="footer-bottom-row">
        <p>
          © {new Date().getFullYear()} {site.name}. {site.footerNote}
        </p>
        <button
          className="btn btn-outline btn-sm"
          onClick={() => window.scrollTo({ top: 0, behavior: prefersReducedMotion() ? "auto" : "smooth" })}
        >
          <ArrowUp size={16} /> Back to top
        </button>
      </div>
    </footer>
  );
}
