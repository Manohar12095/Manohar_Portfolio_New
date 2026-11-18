import { Bot, Brain, Camera, Code2, Cpu, Database, Globe, Layers, Palette, Rocket, ShieldCheck, Smartphone, Wrench } from "lucide-react";
import { useContent } from "../context/ContentContext";
import SmartImage from "./SmartImage";
import Tilt from "./Tilt";

export const ABOUT_ICONS = { globe: Globe, smartphone: Smartphone, bot: Bot, palette: Palette, code: Code2, database: Database, cpu: Cpu, camera: Camera, rocket: Rocket, shield: ShieldCheck, brain: Brain, wrench: Wrench, layers: Layers };
const startYear = 2024;

export default function About({ projectCount }) {
  const {
    content: { about, site },
  } = useContent();
  const years = Math.max(1, new Date().getFullYear() - startYear);
  return (
    <section id="about" className="section container">
      <div className="about-grid">
        <Tilt className="about-photo" max={5}>
          <SmartImage src={about.photo} alt={`${site.name} at work`} label="Your second photo" className="about-img" />
          <ul className="stat-stack">
            <li>
              <b>{projectCount}</b>
              <span>projects</span>
            </li>
            <li>
              <b>{years}+</b>
              <span>years coding</span>
            </li>
          </ul>
        </Tilt>

        <div className="about-copy">
          <h2>{about.heading}</h2>
          {about.paragraphs.map((p, i) => (
            <p key={i} className="body">
              {p}
            </p>
          ))}
          <dl className="facts">
            {about.facts.map((f, i) => (
              <div key={i}>
                <dt>{f.label}</dt>
                <dd>{f.value}</dd>
              </div>
            ))}
          </dl>
        </div>
      </div>

      <ul className="do-grid">
        {about.whatIDo.map((d, i) => {
          const Icon = ABOUT_ICONS[d.icon] || Globe;
          return (
            <li key={i}>
              <span className="do-icon">
                <Icon size={22} strokeWidth={1.8} />
              </span>
              <h3>{d.title}</h3>
              <p>{d.text}</p>
            </li>
          );
        })}
      </ul>
    </section>
  );
}
