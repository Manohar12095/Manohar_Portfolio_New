import { useEffect, useRef } from "react";
import { Briefcase, GraduationCap, BookOpen } from "lucide-react";
import { useContent } from "../context/ContentContext";

const ICONS = { work: Briefcase, learning: BookOpen, education: GraduationCap };

export default function Experience() {
  const {
    content: { experience },
  } = useContent();
  const ref = useRef(null);

  // The blue line fills as you scroll down the timeline.
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const update = () => {
      const r = el.getBoundingClientRect();
      const p = (window.innerHeight * 0.62 - r.top) / r.height;
      el.style.setProperty("--progress", `${Math.min(1, Math.max(0, p)) * 100}%`);
    };
    update();
    window.addEventListener("scroll", update, { passive: true });
    window.addEventListener("resize", update);
    return () => {
      window.removeEventListener("scroll", update);
      window.removeEventListener("resize", update);
    };
  }, []);

  return (
    <section id="experience" className="section container">
      <div className="section-head">
        <h2>{experience.heading}</h2>
        <p>{experience.intro}</p>
      </div>
      <ol className="timeline" ref={ref}>
        {experience.items.map((x, i) => {
          const Icon = ICONS[x.type] || Briefcase;
          return (
            <li key={i} className="tl-item">
              <span className="tl-node">
                <Icon size={17} strokeWidth={2} />
              </span>
              <article className="tl-card">
                <p className="tl-date">{x.date}</p>
                <h3>{x.role}</h3>
                <p className="tl-org">{x.org}</p>
                <p className="body">{x.text}</p>
                {x.bullets?.length > 0 && (
                  <ul className="tl-bullets">
                    {x.bullets.map((b, j) => (
                      <li key={j}>{b}</li>
                    ))}
                  </ul>
                )}
                {x.tags?.length > 0 && (
                  <ul className="pill-row">
                    {x.tags.map((t, j) => (
                      <li key={j} className="pill">
                        {t}
                      </li>
                    ))}
                  </ul>
                )}
              </article>
            </li>
          );
        })}
      </ol>
    </section>
  );
}
