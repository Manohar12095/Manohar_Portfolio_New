import { useEffect, useMemo, useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { Download, Github, Menu, X } from "lucide-react";
import { useContent } from "../context/ContentContext";
import { cleanLink, safeUrl } from "../lib/url";
import { useScrollSpy, prefersReducedMotion } from "../hooks/useMotion";
import SmartImage from "./SmartImage";

export default function Nav() {
  const {
    content: { site, socials, sections },
  } = useContent();
  const { pathname } = useLocation();
  const onHome = pathname === "/";

  // the menu follows the Sections order and visibility set in the admin
  const links = useMemo(
    () => sections.filter((s) => s.visible !== false).map((s) => ({ id: s.id, label: s.label })),
    [sections]
  );
  const ids = useMemo(() => links.map((l) => l.id), [links]);
  const active = useScrollSpy(ids, onHome);

  const [open, setOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const github = cleanLink(socials.github);
  const resume = safeUrl(site.resumeUrl);

  useEffect(() => setOpen(false), [pathname]);
  useEffect(() => {
    const on = () => setScrolled(window.scrollY > 12);
    on();
    window.addEventListener("scroll", on, { passive: true });
    return () => window.removeEventListener("scroll", on);
  }, []);

  const go = (e, id) => {
    setOpen(false);
    if (!onHome) return; // Link navigates to "/#id" and the home page scrolls there
    e.preventDefault();
    const el = document.getElementById(id);
    if (!el) return;
    el.scrollIntoView({ behavior: prefersReducedMotion() ? "auto" : "smooth", block: "start" });
    window.history.replaceState(null, "", id === "home" ? "/" : `/#${id}`);
  };

  return (
    <header className={`nav-wrap${scrolled ? " is-scrolled" : ""}`}>
      <nav className="nav container" aria-label="Main">
        <Link to="/" className="brand" onClick={(e) => go(e, "home")} aria-label={`${site.name} — home`}>
          <span className="brand-mark">
            {site.logo ? (
              <SmartImage src={site.logo} alt={site.name} className="brand-logo-img" />
            ) : (
              <img src="/logo.png" alt={site.name} className="brand-logo-img" />
            )}
          </span>
          <span className="brand-name">
            {site.shortName}
            <i>.</i>
          </span>
        </Link>

        <ul className={`nav-links${open ? " is-open" : ""}`}>
          {links.map((l) => (
            <li key={l.id}>
              <Link
                to={l.id === "home" ? "/" : `/#${l.id}`}
                className={onHome && active === l.id ? "is-active" : ""}
                aria-current={onHome && active === l.id ? "true" : undefined}
                onClick={(e) => go(e, l.id)}
              >
                {l.label}
              </Link>
            </li>
          ))}
          {resume && (
            <li className="nav-links-mobile-cta">
              <a className="btn btn-outline" href={resume} download>
                <Download size={17} /> Resume
              </a>
            </li>
          )}
        </ul>

        <div className="nav-actions">
          {github && (
            <a className="icon-btn" href={github} target="_blank" rel="noreferrer" aria-label="GitHub profile">
              <Github size={19} />
            </a>
          )}
          {resume && (
            <a className="btn btn-outline btn-sm nav-resume" href={resume} download>
              <Download size={17} /> Resume
            </a>
          )}
          <button
            className="icon-btn nav-toggle"
            onClick={() => setOpen((v) => !v)}
            aria-expanded={open}
            aria-label={open ? "Close menu" : "Open menu"}
          >
            {open ? <X size={20} /> : <Menu size={20} />}
          </button>
        </div>
      </nav>
    </header>
  );
}
