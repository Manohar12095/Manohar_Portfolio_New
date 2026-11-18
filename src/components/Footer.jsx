import { ArrowUp } from "lucide-react";
import { useContent } from "../context/ContentContext";
import { prefersReducedMotion } from "../hooks/useMotion";

export default function Footer() {
  const {
    content: { site },
  } = useContent();
  return (
    <footer className="footer container">
      <p>
        © {new Date().getFullYear()} {site.name}. {site.footerNote}
      </p>
      <button
        className="btn btn-outline btn-sm"
        onClick={() => window.scrollTo({ top: 0, behavior: prefersReducedMotion() ? "auto" : "smooth" })}
      >
        <ArrowUp size={16} /> Back to top
      </button>
    </footer>
  );
}
