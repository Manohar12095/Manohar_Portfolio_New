import Hero from "../components/Hero";
import About from "../components/About";
import Journey from "../components/Journey";
import Experience from "../components/Experience";
import Projects from "../components/Projects";
import Skills from "../components/Skills";
import Achievements from "../components/Achievements";
import Contact from "../components/Contact";
import { useContent } from "../context/ContentContext";

export default function Home() {
  const {
    content: { sections, projects },
  } = useContent();
  const realProjects = projects.items.filter((p) => !p.title.startsWith("[")).length;

  // renders the sections in the order (and with the visibility) chosen in Admin → Sections
  const view = {
    home: <Hero />,
    about: <About projectCount={realProjects} />,
    journey: <Journey />,
    experience: <Experience />,
    projects: <Projects />,
    skills: <Skills />,
    achievements: <Achievements />,
    contact: <Contact />,
  };

  return (
    <>
      {sections
        .filter((s) => s.visible !== false)
        .map((s) => (
          <div key={s.id}>{view[s.id]}</div>
        ))}
    </>
  );
}
