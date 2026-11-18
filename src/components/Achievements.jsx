import { Award, Crown, Flag, Heart, Medal, Rocket, Star, Trophy } from "lucide-react";
import { useContent } from "../context/ContentContext";
import Reels from "./Reels";

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
            <li key={i}>
              <span className="ach-icon">
                <Icon size={22} strokeWidth={1.8} />
              </span>
              <div>
                <h3>{a.title}</h3>
                <p className="ach-meta">{a.meta}</p>
                <p>{a.text}</p>
              </div>
            </li>
          );
        })}
      </ul>
    </section>
  );
}
