import { useEffect, useState } from "react";
import { ArrowRight, Download, Mail, Play, X } from "lucide-react";
import { useContent } from "../context/ContentContext";
import { cleanLink, parseVideo, safeUrl } from "../lib/url";
import SmartImage from "./SmartImage";
import Tilt from "./Tilt";
import VideoSurface from "./VideoSurface";

export default function Hero() {
  const {
    content: { hero, site },
  } = useContent();
  const [line1 = "", line2 = ""] = hero.titleLines;
  const [playing, setPlaying] = useState(false);
  const [note, setNote] = useState("");
  const hasVideo = !!parseVideo(hero.video);

  // Escape stops the video and brings the photo back
  useEffect(() => {
    if (!playing) return;
    const onKey = (e) => e.key === "Escape" && setPlaying(false);
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [playing]);

  // if the video link changes in the admin, go back to the photo
  useEffect(() => setPlaying(false), [hero.video]);

  const failed = () => {
    setPlaying(false);
    setNote("Video unavailable. Check the link.");
    setTimeout(() => setNote(""), 4000);
  };

  return (
    <section id="home" className="hero container">
      <div className="hero-copy hero-in">
        <p className="tag" style={{ "--i": 0 }}>
          <span className="tag-dot" />
          {hero.badge}
        </p>
        <h1 style={{ "--i": 1 }}>
          <span>{line1}</span>
          <span className="grad">{line2}</span>
        </h1>
        <p className="lede" style={{ "--i": 2 }}>
          {hero.intro}
        </p>
        <div className="hero-cta" style={{ "--i": 3 }}>
          <a className="btn btn-primary" href="#projects">
            View my projects <ArrowRight size={18} />
          </a>
          <a className="btn btn-outline" href={safeUrl(site.resumeUrl) || undefined} download>
            <Download size={18} /> Download resume
          </a>
          <a className="btn btn-soft" href="#contact">
            <Mail size={18} /> Let's connect
          </a>
        </div>
        <ul className="chips" style={{ "--i": 4 }}>
          {hero.chips.map((c, i) => (
            <li key={i}>
              <span className="chip-dot" />
              {c}
            </li>
          ))}
        </ul>
      </div>

      <div className="hero-visual hero-in">
        <Tilt className="photo-card" max={playing ? 0 : 6} style={{ "--i": 2 }} id="hero-photo">
          <div className={`photo-frame${playing ? " is-playing" : ""}`}>
            {playing ? (
              <div className="photo-media">
                <VideoSurface
                  src={hero.video}
                  poster={cleanLink(hero.photo)}
                  autoPlay
                  controls={false}
                  onEnded={() => setPlaying(false)}
                  onError={failed}
                  title={`${site.name} intro video`}
                />
                <button className="video-close" onClick={() => setPlaying(false)} aria-label="Close video and show the photo">
                  <X size={16} />
                </button>
              </div>
            ) : (
              <div className="photo-media">
                <SmartImage src={hero.photo} alt={`Portrait of ${site.name}`} label="Your portrait photo" className="photo-img" eager />
              </div>
            )}

            <div className="photo-caption">
              <div>
                <strong>{hero.photoCaptionName}</strong>
                <span>{note || hero.status}</span>
              </div>
              {hasVideo ? (
                <button className="play-btn" onClick={() => setPlaying(true)} aria-label="Play intro video" title="Play intro video">
                  <Play size={16} fill="currentColor" strokeWidth={0} />
                </button>
              ) : (
                <i className="pulse" aria-hidden="true" />
              )}
            </div>
          </div>

          {hero.floatingTags.map((t, i) =>
            i < 3 ? (
              <span key={i} className={`float-tag float-tag-${i + 1}`} aria-hidden="true">
                {t}
              </span>
            ) : null
          )}
        </Tilt>
      </div>

      <a className="scroll-cue" href="#about" aria-label="Scroll to the next section">
        <span>Scroll</span>
        <i />
      </a>
    </section>
  );
}
