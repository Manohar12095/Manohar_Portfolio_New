import { useMemo, useState } from "react";
import { ExternalLink, Github } from "lucide-react";
import { useContent } from "../context/ContentContext";
import { cleanLink } from "../lib/url";
import SmartImage from "./SmartImage";
import Tilt from "./Tilt";

const STATUS = {
  live: "Live",
  complete: "Complete",
  "in-progress": "In progress",
};

export default function Projects() {
  const {
    content: { projects },
  } = useContent();
  const [filter, setFilter] = useState("All");
  const [showAll, setShowAll] = useState(false);

  const categories = useMemo(() => ["All", ...new Set(projects.items.map((p) => p.category).filter(Boolean))], [projects.items]);
  const filtered = projects.items.filter((p) => filter === "All" || p.category === filter);
  const limit = Math.max(1, Number(projects.initiallyVisible) || 6);
  const visible = showAll || filter !== "All" ? filtered : filtered.slice(0, limit);
  const hiddenCount = filtered.length - visible.length;

  return (
    <section id="projects" className="section container">
      <div className="section-head">
        <h2>{projects.heading}</h2>
        <p>{projects.intro}</p>
      </div>

      <div className="filters" role="group" aria-label="Filter projects by type">
        {categories.map((c) => (
          <button
            key={c}
            className={`filter${filter === c ? " is-on" : ""}`}
            aria-pressed={filter === c}
            onClick={() => setFilter(c)}
          >
            {c}
          </button>
        ))}
      </div>

      <ul className="project-grid">
        {visible.map((p) => {
          const live = cleanLink(p.links.live);
          const git = cleanLink(p.links.github);
          return (
            <li key={`${p.slug}-${p.title}`}>
              <Tilt className="project-card" max={6}>
                <div className="project-media">
                  <SmartImage src={p.cover} alt="" label={p.title} />
                  <span className={`status status-${p.status}`}>{STATUS[p.status] || p.status}</span>
                </div>
                <div className="project-body">
                  <h3>{p.title}</h3>
                  <p>{p.description}</p>
                  <ul className="pill-row">
                    {p.tags.map((t, i) => (
                      <li key={i} className="pill">
                        {t}
                      </li>
                    ))}
                  </ul>
                  <div className="project-links">
                    {live && (
                      <a className="btn btn-primary btn-sm" href={live} target="_blank" rel="noreferrer">
                        <ExternalLink size={15} /> Live site
                      </a>
                    )}
                    {git && (
                      <a className="btn btn-outline btn-sm" href={git} target="_blank" rel="noreferrer">
                        <Github size={15} /> Code
                      </a>
                    )}
                    {!live && !git && <span className="muted-note">Links coming soon</span>}
                  </div>
                </div>
              </Tilt>
            </li>
          );
        })}
      </ul>

      {hiddenCount > 0 && (
        <div className="center">
          <button className="btn btn-outline" onClick={() => setShowAll(true)}>
            Show {hiddenCount} more projects
          </button>
        </div>
      )}
    </section>
  );
}
