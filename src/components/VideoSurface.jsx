import { useEffect, useRef } from "react";
import { parseVideo } from "../lib/url";

/**
 * Plays a video that fills its parent. Understands:
 *  - direct files (.mp4 / .webm, or a file in /public)
 *  - YouTube links (reports when the video ends)
 *  - Google Drive share links (plays in Drive's own player; no "ended" signal)
 * Parent decides the size: this element is position:absolute; inset:0.
 */
export default function VideoSurface({
  src,
  poster,
  autoPlay = true,
  muted = false,
  loop = false,
  controls = false,
  onEnded,
  onError,
  title = "Video",
  className = "",
}) {
  const v = parseVideo(src);
  if (!v) return null;
  if (v.kind === "file") {
    return (
      <FileVideo
        src={v.src}
        poster={poster}
        autoPlay={autoPlay}
        muted={muted}
        loop={loop}
        controls={controls}
        onEnded={onEnded}
        onError={onError}
        className={className}
      />
    );
  }
  if (v.kind === "youtube") {
    return (
      <YouTubeFrame id={v.id} autoPlay={autoPlay} muted={muted} loop={loop} controls={controls} onEnded={onEnded} title={title} className={className} />
    );
  }
  return (
    <iframe
      className={`video-surface ${className}`}
      src={`https://drive.google.com/file/d/${v.id}/preview`}
      title={title}
      allow="autoplay; fullscreen; encrypted-media"
      allowFullScreen
      referrerPolicy="no-referrer"
    />
  );
}

function FileVideo({ src, poster, autoPlay, muted, loop, controls, onEnded, onError, className }) {
  const ref = useRef(null);

  useEffect(() => {
    const el = ref.current;
    if (!el || !autoPlay) return;
    const p = el.play();
    if (p && p.catch) {
      p.catch(() => {
        // the browser blocked sound; try again silently so the video still plays
        el.muted = true;
        el.play().catch(() => {});
      });
    }
  }, [src, autoPlay]);

  const toggle = () => {
    const el = ref.current;
    if (!el || controls) return;
    if (el.paused) el.play().catch(() => {});
    else el.pause();
  };

  return (
    <video
      ref={ref}
      className={`video-surface ${className}`}
      src={src}
      poster={poster || undefined}
      muted={muted}
      loop={loop}
      controls={controls}
      playsInline
      preload="auto"
      onEnded={onEnded}
      onError={onError}
      onClick={toggle}
    />
  );
}

function YouTubeFrame({ id, autoPlay, muted, loop, controls, onEnded, title, className }) {
  const ref = useRef(null);

  useEffect(() => {
    if (!onEnded) return;
    const onMsg = (e) => {
      if (!/(^|\.)youtube(-nocookie)?\.com$/.test(new URL(e.origin).hostname)) return;
      if (e.source !== ref.current?.contentWindow) return;
      let d = e.data;
      try {
        if (typeof d === "string") d = JSON.parse(d);
      } catch {
        return;
      }
      const state = d?.info?.playerState ?? (d?.event === "onStateChange" ? d.info : undefined);
      if (state === 0) onEnded();
    };
    window.addEventListener("message", onMsg);
    return () => window.removeEventListener("message", onMsg);
  }, [onEnded]);

  const params = new URLSearchParams({
    autoplay: autoPlay ? "1" : "0",
    mute: muted ? "1" : "0",
    controls: controls ? "1" : "0",
    rel: "0",
    modestbranding: "1",
    playsinline: "1",
    enablejsapi: "1",
    origin: window.location.origin,
  });
  if (loop) {
    params.set("loop", "1");
    params.set("playlist", id);
  }

  return (
    <iframe
      ref={ref}
      className={`video-surface ${className}`}
      src={`https://www.youtube-nocookie.com/embed/${id}?${params.toString()}`}
      title={title}
      allow="autoplay; encrypted-media; fullscreen; picture-in-picture"
      allowFullScreen
      referrerPolicy="strict-origin-when-cross-origin"
      onLoad={() => {
        // ask YouTube to send us player events (needed to know when the video ends)
        ref.current?.contentWindow?.postMessage(JSON.stringify({ event: "listening", id: 1, channel: "widget" }), "*");
      }}
    />
  );
}
