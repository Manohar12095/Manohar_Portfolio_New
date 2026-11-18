/* Google Drive media client for the admin page.
   Talks to the small Apps Script web app in /apps-script/Code.gs, which reads and writes ONE Drive folder.
   Only links are stored in the portfolio's content. The files themselves stay in Drive.

   The connection (script URL + admin key) lives in this browser only. The key is kept for this tab
   unless "Remember on this device" is ticked. */

import { useSyncExternalStore } from "react";

const STORE_KEY = "portfolio.drive.v1";

/* ------------------------------- connection ------------------------------- */

// The admin key is sent to this address, so only accept Google's script hosts (or localhost for testing).
const SCRIPT_URL = /^https:\/\/script\.google\.com\/(?:macros\/s\/[\w-]+|a\/macros\/[\w.-]+\/s\/[\w-]+)\/exec$/;
const LOCAL_URL = /^http:\/\/(?:localhost|127\.0\.0\.1)(?::\d{2,5})?(?:\/[\w./-]*)?$/;

export function isValidScriptUrl(u) {
  const s = String(u || "").trim();
  return SCRIPT_URL.test(s) || LOCAL_URL.test(s);
}

const EMPTY = Object.freeze({ url: "", key: "", remember: false });
let cfg = EMPTY;
let files = null; // cached listing: { folder, files, total, at }
const listeners = new Set();

function read(storage) {
  try {
    const raw = storage.getItem(STORE_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}
function write(storage, v) {
  try {
    if (v) storage.setItem(STORE_KEY, JSON.stringify(v));
    else storage.removeItem(STORE_KEY);
  } catch {
    /* storage can be blocked (private window); the connection then lasts until the page closes */
  }
}

function load() {
  const local = read(window.localStorage);
  const session = read(window.sessionStorage);
  const src = session || local;
  if (src && isValidScriptUrl(src.url) && typeof src.key === "string") {
    cfg = Object.freeze({ url: src.url, key: src.key, remember: !!local && !session });
  }
}
try {
  load();
} catch {
  /* no window (tests) */
}

function emit() {
  listeners.forEach((fn) => fn());
}

export function getDriveConfig() {
  return cfg;
}
export function useDriveConfig() {
  return useSyncExternalStore(
    (fn) => {
      listeners.add(fn);
      return () => listeners.delete(fn);
    },
    () => cfg,
    () => EMPTY
  );
}
export function isConnected(c = cfg) {
  return !!c.url && !!c.key;
}

export function saveDriveConfig({ url, key, remember }) {
  const next = Object.freeze({ url: String(url).trim(), key: String(key), remember: !!remember });
  cfg = next;
  // the script address is not secret, the key is: it goes to localStorage only if asked to
  write(window.sessionStorage, remember ? null : { url: next.url, key: next.key });
  write(window.localStorage, remember ? { url: next.url, key: next.key } : null);
  emit();
}
export function clearDriveConfig() {
  cfg = EMPTY;
  write(window.sessionStorage, null);
  write(window.localStorage, null);
  files = null;
  emit();
}

/* --------------------------------- requests -------------------------------- */

export class DriveError extends Error {
  constructor(message, code) {
    super(message);
    this.code = code;
  }
}

const FRIENDLY = {
  "bad-key": "The admin key is not right. Check ADMIN_KEY in the script's Script properties.",
  "bad-type": "That file type is not allowed. Use JPG, PNG, WebP, GIF, AVIF, MP4, WebM or MOV.",
  "too-big": "That file is too large to upload here. Put it in the Drive folder yourself, then refresh.",
};

/**
 * POSTs JSON as text/plain. That is a "simple" request, so the browser skips the CORS pre-check
 * that Apps Script cannot answer. XMLHttpRequest is used because fetch can't report upload progress.
 */
export function call(config, payload, { onProgress, timeout = 120000 } = {}) {
  return new Promise((resolve, reject) => {
    if (!isValidScriptUrl(config?.url)) return reject(new DriveError("The script address is not valid. It should look like https://script.google.com/macros/s/…/exec", "bad-url"));
    const xhr = new XMLHttpRequest();
    xhr.open("POST", config.url);
    xhr.timeout = timeout;
    xhr.setRequestHeader("Content-Type", "text/plain;charset=utf-8");
    if (onProgress && xhr.upload) xhr.upload.onprogress = (e) => e.lengthComputable && onProgress(e.loaded / e.total);
    xhr.onload = () => {
      let data;
      try {
        data = JSON.parse(xhr.responseText);
      } catch {
        // Google answers with a sign-in or error web page when the deployment is not open to "Anyone"
        return reject(new DriveError("Google did not answer with data. In the script, redeploy with “Who has access: Anyone”, then paste the new /exec address.", "not-json"));
      }
      if (!data || data.ok !== true) {
        const code = data?.error || "server";
        return reject(new DriveError(FRIENDLY[code] || data?.message || "Something went wrong in the script.", code));
      }
      resolve(data);
    };
    xhr.onerror = () => reject(new DriveError("Could not reach the script. Check the address and your internet connection.", "network"));
    xhr.ontimeout = () => reject(new DriveError("The script took too long to answer. Try a smaller file.", "timeout"));
    xhr.send(JSON.stringify({ ...payload, key: config.key }));
  });
}

/* ------------------------------ files and links ----------------------------- */

export const driveViewUrl = (id) => `https://drive.google.com/file/d/${id}/view`;
export const driveThumbUrl = (id, w = 320) => `https://drive.google.com/thumbnail?id=${id}&sz=w${w}`;

export function cachedListing() {
  return files;
}
export function useDriveListing() {
  return useSyncExternalStore(
    (fn) => {
      listeners.add(fn);
      return () => listeners.delete(fn);
    },
    () => files,
    () => null
  );
}

export async function connect(config) {
  const res = await call(config, { action: "ping" }, { timeout: 30000 });
  return res.folder;
}

export async function listFiles(config) {
  const res = await call(config, { action: "list" }, { timeout: 60000 });
  files = { folder: res.folder, files: res.files || [], total: res.total ?? (res.files || []).length, at: Date.now() };
  emit();
  return files;
}

/* -------------------------------- uploading -------------------------------- */

const MAX_EDGE = 2000; // photos are shrunk to this size before upload: faster site, smaller upload
const SHRINK_ABOVE = 1.5 * 1024 * 1024;

function toBase64(blob) {
  return new Promise((resolve, reject) => {
    const r = new FileReader();
    r.onload = () => resolve(String(r.result).split(",")[1] || "");
    r.onerror = () => reject(new DriveError("The file could not be read.", "read"));
    r.readAsDataURL(blob);
  });
}

/** Downsizes big JPEG/WebP/PNG photos. Anything else (GIF, AVIF, video) is sent untouched. */
async function prepareImage(file) {
  const shrinkable = /^image\/(jpeg|png|webp)$/.test(file.type);
  if (!shrinkable || typeof createImageBitmap !== "function") return file;
  try {
    const bmp = await createImageBitmap(file);
    const scale = Math.min(1, MAX_EDGE / Math.max(bmp.width, bmp.height));
    if (scale === 1 && file.size <= SHRINK_ABOVE) return file;
    const w = Math.round(bmp.width * scale);
    const h = Math.round(bmp.height * scale);
    const canvas = document.createElement("canvas");
    canvas.width = w;
    canvas.height = h;
    const ctx = canvas.getContext("2d");
    const keepAlpha = file.type === "image/png";
    if (!keepAlpha) {
      ctx.fillStyle = "#fff";
      ctx.fillRect(0, 0, w, h);
    }
    ctx.drawImage(bmp, 0, 0, w, h);
    bmp.close?.();
    const type = keepAlpha ? "image/png" : "image/jpeg";
    const blob = await new Promise((res) => canvas.toBlob(res, type, 0.86));
    // only use it if it really is smaller
    if (!blob || blob.type !== type || blob.size >= file.size) return file;
    const ext = keepAlpha ? "png" : "jpg";
    return new File([blob], file.name.replace(/\.\w+$/, "") + "." + ext, { type });
  } catch {
    return file;
  }
}

export const ACCEPT = "image/jpeg,image/png,image/webp,image/gif,image/avif,video/mp4,video/webm,video/quicktime";
const OK_TYPES = new Set(ACCEPT.split(","));

export async function uploadFile(config, file, { onProgress, maxBytes = 20 * 1024 * 1024 } = {}) {
  if (!OK_TYPES.has(file.type)) throw new DriveError(`“${file.name}” is not a supported type. Use JPG, PNG, WebP, GIF, AVIF, MP4, WebM or MOV.`, "bad-type");
  const prepared = file.type.startsWith("image/") ? await prepareImage(file) : file;
  if (prepared.size > maxBytes) {
    throw new DriveError(`“${file.name}” is ${(prepared.size / 1048576).toFixed(1)} MB. The limit here is ${Math.round(maxBytes / 1048576)} MB. Put big videos in the Drive folder yourself, then refresh.`, "too-big");
  }
  const data = await toBase64(prepared);
  const res = await call(config, { action: "upload", name: prepared.name, mime: prepared.type, data }, { onProgress, timeout: 300000 });
  if (files) {
    files = { ...files, files: [res.file, ...files.files.filter((f) => f.id !== res.file.id)], total: files.total + 1 };
    emit();
  }
  return { ...res.file, shared: res.shared !== false };
}

/* --------------------------- matching files to cards -------------------------- */

const norm = (s) =>
  String(s || "")
    .toLowerCase()
    .replace(/\.[a-z0-9]{2,5}$/, "")
    .replace(/\s*\(\d+\)$/, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");

/** "ncc-2" or "ncc (2)" -> { stem: "ncc", n: 2 }. So ncc.jpg, ncc-1.jpg, ncc-2.jpg all belong to "ncc". */
function split(name) {
  const copy = String(name || "").match(/\((\d{1,2})\)\s*(?:\.[A-Za-z0-9]{2,5})?$/);
  const m = norm(name).match(/^(.*?)(?:-(\d{1,2}))?$/);
  return { stem: m[1] || norm(name), n: copy ? Number(copy[1]) : m[2] ? Number(m[2]) : 0 };
}

/**
 * Suggests which Drive images belong to which card.
 * targets: [{ id, keys: ["slug", "title"...] }]. A file matches when its name (without a trailing number) is the same as a key,
 * or starts with the key followed by a dash ("ncc-camp" for "ncc"). Exact matches win. Returns { [id]: [files...] }, best first.
 * Videos are never matched: only images fill cover and gallery slots.
 */
export function matchFiles(fileList, targets) {
  const images = (fileList || []).filter((f) => f.kind === "image");
  const out = {};
  for (const t of targets) {
    const keys = [...new Set((t.keys || []).map(norm).filter(Boolean))];
    const scored = [];
    for (const f of images) {
      const { stem, n } = split(f.name);
      let best = 0;
      for (const k of keys) {
        if (stem === k) best = Math.max(best, 100);
        else if (stem.startsWith(k + "-")) best = Math.max(best, 60);
        else if (stem.includes("-" + k + "-") || stem.endsWith("-" + k)) best = Math.max(best, 40);
      }
      if (best) scored.push({ f, best, n });
    }
    // an exact-name group beats loose matches. Within a group: the plain name first, then -1, -2 …
    const top = scored.reduce((m, s) => Math.max(m, s.best), 0);
    const picked = scored
      .filter((s) => s.best === top)
      .sort((a, b) => a.n - b.n || a.f.name.localeCompare(b.f.name, undefined, { numeric: true }))
      .map((s) => s.f);
    if (picked.length) out[t.id] = picked;
  }
  return out;
}
