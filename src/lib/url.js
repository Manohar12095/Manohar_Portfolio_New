/* Link + media helpers.
   Everything that comes from content (typed in /admin or loaded from a database)
   passes through here before it reaches an href / src. That blocks dangerous
   values such as javascript: links. */

/** Returns the link if it is safe, otherwise "". Safe = relative path, #anchor, http(s), mailto, tel. */
export function safeUrl(u) {
  if (typeof u !== "string") return "";
  const s = u.trim();
  if (!s) return "";
  if (s.startsWith("/") && !s.startsWith("//")) return s;
  if (s.startsWith("#")) return s;
  try {
    const x = new URL(s);
    return ["http:", "https:", "mailto:", "tel:"].includes(x.protocol) ? s : "";
  } catch {
    return "";
  }
}

/** Like safeUrl, but also treats placeholders ("YOUR_...", "[...]") as "not set". */
export function cleanLink(u) {
  if (!u || typeof u !== "string" || /YOUR_|\[/.test(u)) return "";
  return safeUrl(u);
}

/** True for text that is still a placeholder. */
export function isPlaceholder(v) {
  return typeof v === "string" && (/YOUR_/.test(v) || /\[.*\]/.test(v));
}

function driveId(s) {
  const a = s.match(/drive\.google\.com\/file\/d\/([\w-]{10,})/);
  if (a) return a[1];
  const b = s.match(/(?:drive|docs)\.google\.com\/(?:uc|open|thumbnail)\?(?:.*&)?id=([\w-]{10,})/);
  return b ? b[1] : "";
}

/** Turns a Google Drive share link into a direct image URL. Other links pass through. */
export function toImageUrl(u) {
  const s = safeUrl(u);
  if (!s) return "";
  const id = driveId(s);
  return id ? `https://lh3.googleusercontent.com/d/${id}` : s;
}

/**
 * Works out what kind of video a link is.
 *  - file    : a direct .mp4 / .webm link or a file in /public
 *  - youtube : any youtube.com / youtu.be link
 *  - drive   : a Google Drive share link (plays in Drive's own player)
 */
export function parseVideo(u) {
  const s = safeUrl(u);
  if (!s || s.startsWith("#") || s.startsWith("mailto:") || s.startsWith("tel:")) return null;
  const yt = s.match(/(?:youtube\.com\/(?:watch\?(?:.*&)?v=|embed\/|shorts\/|live\/)|youtu\.be\/)([\w-]{11})/);
  if (yt) return { kind: "youtube", id: yt[1] };
  const id = driveId(s);
  if (id) return { kind: "drive", id };
  return { kind: "file", src: s };
}

export function videoLabel(u) {
  const v = parseVideo(u);
  if (!v) return "";
  return v.kind === "youtube" ? "YouTube video" : v.kind === "drive" ? "Google Drive video" : "Video file";
}
