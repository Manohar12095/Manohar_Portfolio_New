import { useEffect, useState } from "react";
import { ImageIcon } from "lucide-react";
import { IS_DEV } from "../hooks/helpers";
import { toImageUrl } from "../lib/url";

/**
 * Shows the image at `src`. If the file is missing (or src is empty or unsafe) it shows a
 * labelled placeholder so you can see exactly where an image belongs.
 * Google Drive share links are converted to direct image links automatically.
 */
export default function SmartImage({ src, alt = "", label = "Add image", className = "", eager = false }) {
  const url = toImageUrl(src);
  const [failed, setFailed] = useState(!url);

  // a new link gets a fresh try
  useEffect(() => setFailed(!url), [url]);

  if (failed) {
    return (
      <div className={`ph ${className}`} role="img" aria-label={alt || label}>
        <ImageIcon size={26} strokeWidth={1.6} />
        <span className="ph-label">{label}</span>
        {IS_DEV && src ? <code className="ph-path">{src}</code> : null}
      </div>
    );
  }
  return (
    <img
      className={className}
      src={url}
      alt={alt}
      loading={eager ? "eager" : "lazy"}
      decoding="async"
      referrerPolicy="no-referrer"
      onError={() => setFailed(true)}
    />
  );
}
