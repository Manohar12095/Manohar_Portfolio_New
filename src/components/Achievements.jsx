import { Award, Crown, Flag, Heart, Medal, Rocket, Star, Trophy, Image as ImageIcon, ExternalLink } from "lucide-react";
import { Link } from "react-router-dom";
import { useContent } from "../context/ContentContext";
import Reels from "./Reels";
import SmartImage from "./SmartImage";

export const ACH_ICONS = { trophy: Trophy, medal: Medal, award: Award, star: Star, crown: Crown, flag: Flag, rocket: Rocket, heart: Heart };

export default function Achievements() {
  const {
    content: { achievements },
  } = useContent();
  return (
    <section id="achievements" className="section container">
      <div className="section-head">
        <h2>{achievements.heading}</h2>
        <p>{achievements.intro}</p>
      </div>

      {achievements.reels.length > 0 && <Reels items={achievements.reels} />}

      <ul className="ach-list">
        {achievements.list.map((a, i) => {
          const Icon = ACH_ICONS[a.icon] || Trophy;
          return (
            <li key={i} className={a.image ? "has-image" : ""}>
              <span className="ach-icon">
                <Icon size={22} strokeWidth={1.8} />
              </span>
              <div className="ach-content">
                <h3>{a.title}</h3>
                <p className="ach-meta">{a.meta}</p>
                <p>{a.text}</p>
                {a.image && (
                  <div className="ach-media">
                    <a href={a.image} target="_blank" rel="noopener noreferrer" className="ach-photo-link" title="View certificate / photo">
                      <SmartImage src={a.image} alt={a.title} className="ach-thumb" />
                      <span className="ach-photo-badge">
                        <ImageIcon size={14} /> View Certificate
                      </span>
                    </a>
                  </div>
                )}
              </div>
            </li>
          );
        })}
      </ul>

      <div className="ach-certificates-cta">
        <Link to="/certificates" className="btn btn-outline btn-md">
          <Award size={18} /> View All 70+ Verified Certificates & Credentials ↗
        </Link>
      </div>
    </section>
  );
}
