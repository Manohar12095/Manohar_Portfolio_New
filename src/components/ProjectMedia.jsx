import { useState } from "react";
import { Github, Globe } from "lucide-react";
import { cleanLink } from "../lib/url";
import SmartImage from "./SmartImage";

function extractGitHubPath(url) {
  try {
    const parsed = new URL(url);
    if (!parsed.hostname.includes("github.com")) return null;
    const parts = parsed.pathname.split("/").filter(Boolean);
    if (parts.length >= 2) {
      return `${parts[0]}/${parts[1]}`;
    }
  } catch {}
  return null;
}

function cleanDomain(url) {
  try {
    const parsed = new URL(url);
    return parsed.hostname.replace(/^www\./, "");
  } catch {
    return url;
  }
}

export default function ProjectMedia({ project, statusText, statusKey }) {
  const [iframeError, setIframeError] = useState(false);
  const [useIframe, setUseIframe] = useState(false);

  const live = cleanLink(project.links?.live);
  const git = cleanLink(project.links?.github);
  const ghRepo = git ? extractGitHubPath(git) : null;
  const previewType = project.previewType || "auto";

  // Case 1: Explicitly requested static image or custom cover chosen
  if (previewType === "image" && project.cover) {
    return (
      <div className="project-media">
        <SmartImage src={project.cover} alt="" label={project.title} />
        {statusKey && <span className={`status status-${statusKey}`}>{statusText}</span>}
      </div>
    );
  }

  // Case 2: Live website preview (auto or live)
  if ((previewType === "auto" || previewType === "live") && live) {
    const domain = cleanDomain(live);
    const mshotUrl = `https://s0.wp.com/mshots/v1/${encodeURIComponent(live)}?w=800`;

    return (
      <div className="project-media project-media-live">
        <div className="project-browser-bar">
          <div className="project-browser-dots">
            <span />
            <span />
            <span />
          </div>
          <span className="project-browser-url">{domain}</span>
          <span className="project-browser-live-badge">
            <span className="pulse-dot" /> LIVE
          </span>
        </div>

        {useIframe && !iframeError ? (
          <iframe
            src={live}
            title={project.title}
            className="project-live-frame"
            sandbox="allow-scripts allow-same-origin allow-forms"
            onError={() => setIframeError(true)}
          />
        ) : (
          <div
            className="project-live-preview-wrap"
            onClick={() => setUseIframe(true)}
            title="Click to interact with live site"
          >
            <img
              src={mshotUrl}
              alt={project.title}
              className="project-live-shot"
              loading="lazy"
              onError={() => setIframeError(true)}
            />
            <div className="project-live-overlay">
              <span className="project-live-view-btn">
                <Globe size={13} /> Click for Live Preview
              </span>
            </div>
          </div>
        )}

        {statusKey && <span className={`status status-${statusKey}`}>{statusText}</span>}
      </div>
    );
  }

  // Case 3: GitHub repository live preview card
  if ((previewType === "auto" || previewType === "github") && ghRepo) {
    const ogImg = `https://opengraph.githubassets.com/1/${ghRepo}`;
    return (
      <div className="project-media project-media-github">
        <div className="project-gh-banner">
          <Github size={14} />
          <span className="project-gh-name">{ghRepo}</span>
        </div>
        <img
          src={ogImg}
          alt={project.title}
          className="project-gh-og"
          loading="lazy"
          onError={(e) => {
            e.currentTarget.style.display = "none";
          }}
        />
        {statusKey && <span className={`status status-${statusKey}`}>{statusText}</span>}
      </div>
    );
  }

  // Fallback: SmartImage (displays cover image if provided, or striped placeholder)
  return (
    <div className="project-media">
      <SmartImage src={project.cover} alt="" label={project.title} />
      {statusKey && <span className={`status status-${statusKey}`}>{statusText}</span>}
    </div>
  );
}
