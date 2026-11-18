import { Link } from "react-router-dom";
import { ArrowUpRight } from "lucide-react";
import { useContent } from "../context/ContentContext";
import SmartImage from "./SmartImage";

export default function Journey() {
  const {
    content: { journey },
  } = useContent();
  return (
    <section id="journey" className="section container">
      <div className="section-head">
        <h2>{journey.heading}</h2>
        <p>{journey.intro}</p>
      </div>
      <ul className="journey-grid">
        {journey.items.map((j, i) => (
          <li key={`${j.slug}-${i}`}>
            <Link to={`/journey/${j.slug}`} className="journey-card">
              <div className="journey-media">
                <SmartImage src={j.cover} alt="" label={j.title} />
              </div>
              <div className="journey-body">
                <h3>{j.title}</h3>
                <p>{j.summary}</p>
                <span className="btn btn-outline btn-sm">
                  View more <ArrowUpRight size={16} />
                </span>
              </div>
            </Link>
          </li>
        ))}
      </ul>
    </section>
  );
}
