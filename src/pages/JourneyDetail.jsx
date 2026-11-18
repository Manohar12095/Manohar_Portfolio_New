import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { ChevronDown, ChevronRight } from "lucide-react";
import { useContent } from "../context/ContentContext";
import SmartImage from "../components/SmartImage";

/** Groups entries by year, newest first. Entries with no year go last. Order inside a year is kept. */
function groupByYear(entries) {
  const map = new Map();
  for (const e of entries) {
    const key = /^\d{4}$/.test(String(e.year || "").trim()) ? String(e.year).trim() : "";
    if (!map.has(key)) map.set(key, []);
    map.get(key).push(e);
  }
  return [...map.entries()].sort(([a], [b]) => (a && b ? Number(b) - Number(a) : a ? -1 : b ? 1 : 0)).map(([label, items]) => ({ label, items }));
}

/** The list on a journey page. An entry with details is an accordion; one without is a plain row. */
function Entries({ entries }) {
  const groups = groupByYear(entries);
  const showYears = groups.some((g) => g.label);
  const firstWithText = entries.find((e) => e.text)?.title;
  const [open, setOpen] = useState(firstWithText ?? null);

  return (
    <div className="entries">
      {groups.map((g, gi) => (
        <section key={g.label || "none"} className="year-group" aria-label={g.label || undefined}>
          {showYears && <h2 className="year-head">{g.label || "Other"}</h2>}
          <ul className="acc">
            {g.items.map((e, i) => {
              const id = `${gi}-${i}`;
              if (!e.text) {
                return (
                  <li key={id} className="acc-static">
                    <h3 className="acc-row">
                      <span>{e.title}</span>
                      {e.meta && <small>{e.meta}</small>}
                    </h3>
                  </li>
                );
              }
              const on = open === e.title;
              return (
                <li key={id} className={on ? "is-open" : ""}>
                  <h3>
                    <button id={`acc-btn-${id}`} aria-expanded={on} aria-controls={`acc-panel-${id}`} onClick={() => setOpen(on ? null : e.title)}>
                      <span>
                        {e.title}
                        {e.meta && <small>{e.meta}</small>}
                      </span>
                      <ChevronDown size={20} className="acc-chev" />
                    </button>
                  </h3>
                  <div id={`acc-panel-${id}`} role="region" aria-labelledby={`acc-btn-${id}`} className="acc-panel">
                    <div>
                      <p>{e.text}</p>
                    </div>
                  </div>
                </li>
              );
            })}
          </ul>
        </section>
      ))}
    </div>
  );
}

export default function JourneyDetail() {
  const {
    content: { journey },
  } = useContent();
  const { slug } = useParams();
  const item = journey.items.find((j) => j.slug === slug);
  const [shot, setShot] = useState(0);

  useEffect(() => setShot(0), [slug]);

  if (!item) {
    return (
      <main className="container detail">
        <h1>That page does not exist</h1>
        <p className="body">The journey page you opened is not in the list.</p>
        <Link className="btn btn-primary" to="/#journey">
          Back to My journey
        </Link>
      </main>
    );
  }

  // skip empty slots so an unset cover does not leave a blank first photo; keep one slot so the labelled placeholder still shows
  const photos = [item.cover, ...item.gallery].filter(Boolean);
  const images = photos.length ? photos : [""];
  const entries = item.entries;

  return (
    <main className="container detail">
      <nav className="crumbs" aria-label="Breadcrumb">
        <Link to="/">Home</Link>
        <ChevronRight size={15} />
        <Link to="/#journey">My journey</Link>
        <ChevronRight size={15} />
        <span aria-current="page">{item.title}</span>
      </nav>

      <h1 className="detail-title">{item.title}</h1>
      {item.intro && <p className="lede">{item.intro}</p>}

      <div className="detail-grid">
        <div className="gallery">
          <div className="gallery-main">
            <SmartImage key={images[shot]} src={images[shot]} alt={`${item.title}, photo ${shot + 1}`} label={`${item.title} photo ${shot + 1}`} eager />
          </div>
          {images.length > 1 && (
            <ul className="gallery-thumbs">
              {images.map((src, i) => (
                <li key={i}>
                  <button className={i === shot ? "is-on" : ""} onClick={() => setShot(i)} aria-label={`Show photo ${i + 1}`} aria-pressed={i === shot}>
                    <SmartImage src={src} alt="" label={`${i + 1}`} />
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>

        {entries.length > 0 ? <Entries entries={entries} key={slug} /> : <p className="body">Details for this page are coming soon.</p>}
      </div>
    </main>
  );
}
