/**
 * Portfolio media uploader — Google Apps Script web app.
 *
 * What it does
 *   Lets the admin page (/admin → Media) list and upload images and videos
 *   into ONE Google Drive folder. Nothing else in your Drive is reachable.
 *
 * Why a script and not "Sign in with Google" in the browser
 *   A browser-only sign-in can't add files to a folder you created yourself
 *   unless it asks for access to your WHOLE Drive. This script runs as you,
 *   touches only the folder below, and needs no Google Cloud project.
 *
 * Setup (about 5 minutes) — full steps with pictures of each button are in docs/DRIVE.md
 *   1. script.google.com → New project → paste this file over Code.gs.
 *   2. Project Settings (gear) → Script properties → Add property:
 *        ADMIN_KEY = a long random password (20+ characters). You will paste the same one into /admin.
 *   3. Deploy → New deployment → type "Web app"
 *        Execute as: Me      Who has access: Anyone
 *      Authorise when asked, then copy the "Web app URL" (ends in /exec).
 *   4. Open /admin → Media → paste the Web app URL and the key → Connect.
 *
 * "Anyone" only means anyone can *reach* the URL. Every request without the right
 * ADMIN_KEY is refused, and the folder is fixed in this file, not chosen by the caller.
 *
 * After you EDIT this file, use Deploy → Manage deployments → pencil → Version: New version.
 * (Saving alone does not change the live URL.)
 */

// The Drive folder everything is read from and written to. This is the ID in the folder's link:
// https://drive.google.com/drive/folders/<THIS PART>
var FOLDER_ID = "1C5igMVCHo-VL2wOEc0RPNtWpPyTivOiT";

// Upload limits. Apps Script receives uploads as text (base64), which is about a third bigger than the file,
// so keep this modest. Larger videos: upload them in Drive itself, then pick them in the admin.
var MAX_BYTES = 20 * 1024 * 1024; // 20 MB per file
var MAX_LIST = 300; // newest files shown in the admin

// Only these types are accepted. SVG and HTML are left out on purpose (they can carry script).
var ALLOWED = {
  "image/jpeg": "jpg",
  "image/png": "png",
  "image/webp": "webp",
  "image/gif": "gif",
  "image/avif": "avif",
  "video/mp4": "mp4",
  "video/webm": "webm",
  "video/quicktime": "mov",
};

/* ------------------------------ entry points ------------------------------ */

function doGet() {
  // Opening the URL in a browser shows this and nothing else.
  return json_({ ok: true, service: "portfolio-media", hint: "Use the admin page (Media tab) to talk to this." });
}

function doPost(e) {
  try {
    var body = parse_(e);
    if (!authorised_(body.key)) {
      Utilities.sleep(400); // slows down key guessing
      return json_({ ok: false, error: "bad-key", message: "The admin key is wrong." });
    }
    switch (body.action) {
      case "ping":
        return json_(ping_());
      case "list":
        return json_(list_());
      case "upload":
        return json_(upload_(body));
      default:
        return json_({ ok: false, error: "bad-action", message: "Unknown action." });
    }
  } catch (err) {
    return json_({ ok: false, error: "server", message: String((err && err.message) || err) });
  }
}

/* --------------------------------- actions -------------------------------- */

function ping_() {
  var folder = DriveApp.getFolderById(FOLDER_ID);
  return { ok: true, folder: { id: FOLDER_ID, name: folder.getName(), url: folder.getUrl() }, maxBytes: MAX_BYTES };
}

function list_() {
  var folder = DriveApp.getFolderById(FOLDER_ID);
  var it = folder.getFiles();
  var files = [];
  while (it.hasNext()) {
    var f = it.next();
    var mime = f.getMimeType();
    if (!isMedia_(mime)) continue;
    files.push({
      id: f.getId(),
      name: f.getName(),
      mime: mime,
      kind: mime.indexOf("video/") === 0 ? "video" : "image",
      size: f.getSize(),
      modified: f.getLastUpdated().getTime(),
    });
  }
  files.sort(function (a, b) {
    return b.modified - a.modified;
  });
  var total = files.length;
  if (files.length > MAX_LIST) files = files.slice(0, MAX_LIST);
  return { ok: true, folder: { id: FOLDER_ID, name: folder.getName(), url: folder.getUrl() }, files: files, total: total };
}

function upload_(body) {
  var mime = String(body.mime || "").toLowerCase();
  if (!Object.prototype.hasOwnProperty.call(ALLOWED, mime)) {
    return { ok: false, error: "bad-type", message: "That file type is not allowed. Use JPG, PNG, WebP, GIF, AVIF, MP4, WebM or MOV." };
  }
  if (typeof body.data !== "string" || !body.data.length) {
    return { ok: false, error: "no-data", message: "The file was empty." };
  }
  // reject before decoding if it is obviously too big (base64 is 4/3 of the size)
  if (body.data.length > Math.ceil((MAX_BYTES * 4) / 3) + 8) {
    return { ok: false, error: "too-big", message: "That file is over " + Math.round(MAX_BYTES / 1048576) + " MB. Upload it in Drive itself, then pick it here." };
  }

  var bytes;
  try {
    bytes = Utilities.base64Decode(body.data);
  } catch (err) {
    return { ok: false, error: "bad-data", message: "The file could not be read." };
  }
  if (!bytes || !bytes.length) return { ok: false, error: "no-data", message: "The file was empty." };
  if (bytes.length > MAX_BYTES) {
    return { ok: false, error: "too-big", message: "That file is over " + Math.round(MAX_BYTES / 1048576) + " MB. Upload it in Drive itself, then pick it here." };
  }
  if (!matchesType_(bytes, mime)) {
    return { ok: false, error: "type-mismatch", message: "The file contents do not match its type (" + mime + ")." };
  }

  var folder = DriveApp.getFolderById(FOLDER_ID);
  var name = uniqueName_(folder, cleanName_(body.name, ALLOWED[mime]));
  var blob = Utilities.newBlob(bytes, mime, name);
  var file = folder.createFile(blob);

  // Visitors' browsers need to be able to read it. This can be blocked by a Google Workspace policy.
  var shared = true;
  try {
    file.setSharing(DriveApp.Access.ANYONE_WITH_LINK, DriveApp.Permission.VIEW);
  } catch (err) {
    shared = false;
  }

  return {
    ok: true,
    shared: shared,
    file: {
      id: file.getId(),
      name: file.getName(),
      mime: mime,
      kind: mime.indexOf("video/") === 0 ? "video" : "image",
      size: file.getSize(),
      modified: file.getLastUpdated().getTime(),
    },
  };
}

/* --------------------------------- helpers -------------------------------- */

function parse_(e) {
  var raw = e && e.postData && e.postData.contents;
  if (!raw) throw new Error("Empty request.");
  var body = JSON.parse(raw);
  if (!body || typeof body !== "object") throw new Error("Bad request.");
  return body;
}

function authorised_(key) {
  var secret = PropertiesService.getScriptProperties().getProperty("ADMIN_KEY");
  // Refuse to run at all with a missing or weak key, so a forgotten setup step is not a hole.
  if (!secret || secret.length < 12) return false;
  return typeof key === "string" && safeEqual_(key, secret);
}

/** Compares two strings in the same time no matter where they differ. */
function safeEqual_(a, b) {
  var n = Math.max(a.length, b.length);
  var diff = a.length ^ b.length;
  for (var i = 0; i < n; i++) {
    diff |= (a.charCodeAt(i) || 0) ^ (b.charCodeAt(i) || 0);
  }
  return diff === 0;
}

function isMedia_(mime) {
  return Object.prototype.hasOwnProperty.call(ALLOWED, mime);
}

/** Keeps letters, numbers, dot, dash, underscore and space. Always ends with the right extension. */
function cleanName_(name, ext) {
  var base = String(name || "upload")
    .replace(/\.(jpe?g|png|webp|gif|avif|mp4|webm|mov|m4v)$/i, "") // drop the old extension
    .replace(/[^\w .-]+/g, "-")
    .replace(/\s+/g, " ")
    .replace(/^[ .-]+|[ .-]+$/g, "")
    .slice(0, 80);
  return (base || "upload") + "." + ext;
}

function uniqueName_(folder, name) {
  if (!folder.getFilesByName(name).hasNext()) return name;
  var dot = name.lastIndexOf(".");
  var stem = name.slice(0, dot);
  var ext = name.slice(dot);
  for (var i = 2; i < 100; i++) {
    var candidate = stem + " (" + i + ")" + ext;
    if (!folder.getFilesByName(candidate).hasNext()) return candidate;
  }
  return stem + " " + new Date().getTime() + ext;
}

/** Checks the first bytes of the file really are what the type claims. Apps Script bytes are signed (-128..127). */
function matchesType_(bytes, mime) {
  var b = function (i) {
    return (bytes[i] || 0) & 255;
  };
  var ascii = function (start, text) {
    for (var i = 0; i < text.length; i++) if (b(start + i) !== text.charCodeAt(i)) return false;
    return true;
  };
  switch (mime) {
    case "image/jpeg":
      return b(0) === 0xff && b(1) === 0xd8 && b(2) === 0xff;
    case "image/png":
      return b(0) === 0x89 && ascii(1, "PNG");
    case "image/gif":
      return ascii(0, "GIF8");
    case "image/webp":
      return ascii(0, "RIFF") && ascii(8, "WEBP");
    case "image/avif":
    case "video/mp4":
    case "video/quicktime":
      return ascii(4, "ftyp");
    case "video/webm":
      return b(0) === 0x1a && b(1) === 0x45 && b(2) === 0xdf && b(3) === 0xa3;
    default:
      return false;
  }
}

function json_(obj) {
  return ContentService.createTextOutput(JSON.stringify(obj)).setMimeType(ContentService.MimeType.JSON);
}
