import { useRef, useState } from "react";
import { ChevronLeft, ChevronRight, Play } from "lucide-react";
import { parseVideo } from "../lib/url";
import SmartImage from "./SmartImage";
import VideoSurface from "./VideoSurface";

/** One slide: shows the picture or poster; centre slide plays video if video exists. */
function ReelMedia({ item, active }) {
  const [broken, setBroken] = useState(false);
  const isExplicitImage = item.mediaType === "image";
  const parsedVid = !isExplicitImage && parseVideo(item.video);
  const hasVideo = !isExplicitImage && !!parsedVid && !broken;
  const imageSrc = item.poster || item.image;

  return (
    <>
      <SmartImage src={imageSrc} alt="" label={item.title} className="reel-poster" />
      {hasVideo && active && (
        <VideoSurface src={item.video} poster={imageSrc} muted loop controls title={item.title} onError={() => setBroken(true)} />
      )}
      {hasVideo && !active && (
        <span className="reel-play" aria-hidden="true" title="Play video">
          <Play size={22} fill="currentColor" />
        </span>
      )}
    </>
  );
}

export default function Reels({ items }) {
  const n = items.length;
  const [i, setI] = useState(Math.floor((n - 1) / 2)); // start in the middle so both sides show
  const at = Math.min(i, n - 1);
  const go = (d) => setI(() => Math.min(n - 1, Math.max(0, at + d)));
  const touch = useRef(null);

  const onKey = (e) => {
    if (e.key === "ArrowLeft") go(-1);
    if (e.key === "ArrowRight") go(1);
  };

  return (
    <div className="reels" aria-roledescription="carousel" aria-label="Achievement reels">
      <div
        className="reels-stage"
        tabIndex={0}
        onKeyDown={onKey}
        onPointerDown={(e) => (touch.current = e.clientX)}
        onPointerUp={(e) => {
          if (touch.current == null) return;
          const dx = e.clientX - touch.current;
          touch.current = null;
          if (Math.abs(dx) > 50) go(dx < 0 ? 1 : -1);
        }}
      >
        <div className="reels-track">
          {items.map((item, idx) => {
            const o = idx - at;
            const abs = Math.abs(o);
            const style = {
              transform: `translate(-50%,-50%) translateX(${o * 64}%) translateZ(${-abs * 170}px) rotateY(${-o * 36}deg) scale(${o === 0 ? 1 : 0.88})`,
              opacity: abs > 2 ? 0 : o === 0 ? 1 : abs === 1 ? 0.55 : 0.25,
              zIndex: 10 - abs,
              pointerEvents: abs > 2 ? "none" : "auto",
            };
            return (
              <figure
                key={idx}
                className={`reel${o === 0 ? " is-active" : ""}`}
                style={style}
                aria-hidden={o !== 0}
                aria-label={`${idx + 1} of ${n}: ${item.title}`}
              >
                <ReelMedia item={item} active={o === 0} />
                {o !== 0 && <button className="reel-hit" onClick={() => setI(idx)} aria-label={`Show ${item.title}`} />}
              </figure>
            );
          })}
        </div>
      </div>

      <div className="reels-bar">
        <button className="icon-btn" onClick={() => go(-1)} disabled={at === 0} aria-label="Previous reel">
          <ChevronLeft size={20} />
        </button>
        <div className="reels-title" aria-live="polite">
          <strong>{items[at].title}</strong>
          <span>
            {at + 1} / {n}
          </span>
        </div>
        <button className="icon-btn" onClick={() => go(1)} disabled={at === n - 1} aria-label="Next reel">
          <ChevronRight size={20} />
        </button>
      </div>
    </div>
  );
}
