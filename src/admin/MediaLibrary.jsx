import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { Link } from "react-router-dom";
import { AlertTriangle, Check, Cloud, ExternalLink, Film, RefreshCw, Unplug, Upload, X } from "lucide-react";
import { useContent } from "../context/ContentContext";
import {
  ACCEPT,
  clearDriveConfig,
  connect,
  driveThumbUrl,
  driveViewUrl,
  isConnected,
  isValidScriptUrl,
  listFiles,
  matchFiles,
  saveDriveConfig,
  uploadFile,
  useDriveConfig,
  useDriveListing,
} from "./drive";

const acceptFor = (kind) =>
  kind === "all"
    ? ACCEPT
    : ACCEPT.split(",")
        .filter((t) => t.startsWith(kind + "/"))
        .join(",");
const mb = (n) => (n >= 1048576 ? `${(n / 1048576).toFixed(1)} MB` : `${Math.max(1, Math.round(n / 1024))} KB`);

/* -------------------------------- connection -------------------------------- */

function ConnectPanel() {
  const cfg = useDriveConfig();
  const listing = useDriveListing();
  const [url, setUrl] = useState(cfg.url);
  const [key, setKey] = useState(cfg.key);
  const [remember, setRemember] = useState(cfg.remember);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState("");

  async function submit(e) {
    e.preventDefault();
    setErr("");
    const u = url.trim();
    if (!isValidScriptUrl(u))
      return setErr("That does not look like the Web app address. It starts with https://script.google.com/macros/s/ and ends with /exec.");
    if (key.length < 12) return setErr("The admin key is at least 12 characters. Use the same one you set as ADMIN_KEY in the script.");
    setBusy(true);
    try {
      await connect({ url: u, key });
      saveDriveConfig({ url: u, key, remember });
      await listFiles({ url: u, key });
    } catch (x) {
      setErr(x.message);
    } finally {
      setBusy(false);
    }
  }

  if (isConnected(cfg)) {
    return (
      <div className="adm-drive-state">
        <p className="adm-ok" role="status">
          <Check size={15} aria-hidden="true" /> Connected to Drive folder <strong>{listing?.folder?.name || "…"}</strong>
        </p>
        <div className="adm-inline">
          {listing?.folder?.url && (
            <a className="adm-btn adm-btn-sm" href={listing.folder.url} target="_blank" rel="noopener noreferrer">
              <ExternalLink size={15} /> Open folder in Drive
            </a>
          )}
          <button type="button" className="adm-btn adm-btn-sm" onClick={clearDriveConfig}>
            <Unplug size={15} /> Disconnect
          </button>
        </div>
      </div>
    );
  }

  return (
    <form className="adm-form adm-narrow" onSubmit={submit} noValidate>
      <p className="adm-note">
        One-time setup: deploy the small script from <code>apps-script/Code.gs</code> (steps in <code>docs/DRIVE.md</code>), then paste its address and your key
        here.
      </p>
      <div className="adm-field">
        <label htmlFor="drv-url">Web app address</label>
        <input
          id="drv-url"
          type="text"
          inputMode="url"
          spellCheck={false}
          placeholder="https://script.google.com/macros/s/…/exec"
          value={url}
          onChange={(e) => setUrl(e.target.value)}
        />
      </div>
      <div className="adm-field">
        <label htmlFor="drv-key">Admin key</label>
        <input id="drv-key" type="password" autoComplete="off" spellCheck={false} value={key} onChange={(e) => setKey(e.target.value)} />
        <p className="adm-help">The key you set as ADMIN_KEY in the script. It is kept in this browser only and sent only to the address above.</p>
      </div>
      <div className="adm-field adm-toggle">
        <input id="drv-rem" type="checkbox" checked={remember} onChange={(e) => setRemember(e.target.checked)} />
        <label htmlFor="drv-rem">
          Remember on this device
          <small>Leave this off on a shared computer. Without it you reconnect each time you close the tab.</small>
        </label>
      </div>
      {err && (
        <p className="adm-err" role="alert">
          {err}
        </p>
      )}
      <button type="submit" className="adm-btn adm-btn-primary" disabled={busy}>
        <Cloud size={16} /> {busy ? "Connecting…" : "Connect"}
      </button>
    </form>
  );
}

/* ---------------------------------- library --------------------------------- */

function Thumb({ file }) {
  const [bad, setBad] = useState(false);
  return bad ? (
    <span className="adm-drv-ph">
      <Film size={22} aria-hidden="true" />
    </span>
  ) : (
    <img src={driveThumbUrl(file.id, 320)} alt="" loading="lazy" referrerPolicy="no-referrer" onError={() => setBad(true)} />
  );
}

/**
 * The file grid with upload. In the Media tab, a click copies the link. Inside the picker (onPick given), a click chooses the file.
 */
function Library({ kind = "all", onPick }) {
  const cfg = useDriveConfig();
  const listing = useDriveListing();
  const [filter, setFilter] = useState(kind);
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState("");
  const [queue, setQueue] = useState([]);
  const [copied, setCopied] = useState("");
  const [over, setOver] = useState(false);
  const inputRef = useRef(null);

  const refresh = useCallback(async () => {
    setLoading(true);
    setErr("");
    try {
      await listFiles(cfg);
    } catch (x) {
      setErr(x.message);
    } finally {
      setLoading(false);
    }
  }, [cfg]);

  useEffect(() => {
    if (isConnected(cfg) && !listing) refresh();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [cfg.url, cfg.key]);

  const shown = useMemo(() => (listing?.files || []).filter((f) => filter === "all" || f.kind === filter), [listing, filter]);

  const patch = (id, p) => setQueue((q) => q.map((x) => (x.id === id ? { ...x, ...p } : x)));

  async function upload(fileList) {
    const picked = [...fileList];
    if (!picked.length) return;
    const items = picked.map((f, i) => ({ id: `${Date.now()}-${i}`, file: f, name: f.name, progress: 0, state: "wait", msg: "" }));
    setQueue((q) => [...items, ...q].slice(0, 12));
    for (const it of items) {
      patch(it.id, { state: "busy" });
      try {
        const done = await uploadFile(cfg, it.file, { onProgress: (p) => patch(it.id, { progress: p }) });
        patch(it.id, {
          state: done.shared ? "ok" : "warn",
          progress: 1,
          msg: done.shared
            ? "Uploaded"
            : "Uploaded, but Google would not make it public. Share it in Drive as “Anyone with the link”, or visitors will not see it.",
        });
        if (onPick && picked.length === 1 && done.shared) onPick(driveViewUrl(done.id));
      } catch (x) {
        patch(it.id, { state: "err", msg: x.message });
      }
    }
  }

  async function copy(f) {
    try {
      await navigator.clipboard.writeText(driveViewUrl(f.id));
      setCopied(f.id);
      setTimeout(() => setCopied((c) => (c === f.id ? "" : c)), 1600);
    } catch {
      setErr("This browser blocked copying.");
    }
  }

  if (!isConnected(cfg)) {
    return (
      <p className="adm-empty">
        Drive is not connected yet. Open the <Link to="/admin#media">Media</Link> tab to connect it.
      </p>
    );
  }

  return (
    <div className="adm-drv">
      <div
        className={`adm-drop${over ? " is-over" : ""}`}
        onDragOver={(e) => (e.preventDefault(), setOver(true))}
        onDragLeave={() => setOver(false)}
        onDrop={(e) => {
          e.preventDefault();
          setOver(false);
          upload(e.dataTransfer.files);
        }}
      >
        <Upload size={20} aria-hidden="true" />
        <span>Drop {kind === "image" ? "photos" : kind === "video" ? "videos" : "photos or videos"} here, or</span>
        <button type="button" className="adm-btn adm-btn-sm" onClick={() => inputRef.current?.click()}>
          Choose files
        </button>
        <input ref={inputRef} type="file" accept={acceptFor(kind)} multiple hidden onChange={(e) => (upload(e.target.files), (e.target.value = ""))} />
        <small>
          {kind !== "video" && "JPG, PNG, WebP, GIF or AVIF up to 20 MB (big photos are shrunk first). "}
          {kind !== "image" && "MP4, WebM or MOV up to 20 MB."}
        </small>
      </div>

      {queue.length > 0 && (
        <ul className="adm-queue" aria-live="polite">
          {queue.map((q) => (
            <li key={q.id} className={`is-${q.state}`}>
              <span className="adm-q-name">{q.name}</span>
              {q.state === "busy" || q.state === "wait" ? (
                <progress value={q.progress} max="1" aria-label={`Uploading ${q.name}`} />
              ) : (
                <span className="adm-q-msg">{q.msg}</span>
              )}
            </li>
          ))}
        </ul>
      )}

      <div className="adm-drv-bar">
        {kind === "all" ? (
          <div className="adm-seg" role="group" aria-label="Show">
            {[
              ["all", "All"],
              ["image", "Photos"],
              ["video", "Videos"],
            ].map(([v, l]) => (
              <button key={v} type="button" aria-pressed={filter === v} className={filter === v ? "is-on" : ""} onClick={() => setFilter(v)}>
                {l}
              </button>
            ))}
          </div>
        ) : null}
        <span className="adm-help">
          {listing ? `${shown.length} shown` : ""}
          {listing && listing.total > listing.files.length ? ` (newest ${listing.files.length} of ${listing.total})` : ""}
        </span>
        <button type="button" className="adm-btn adm-btn-sm" onClick={refresh} disabled={loading}>
          <RefreshCw size={15} className={loading ? "adm-spin" : ""} /> {loading ? "Loading…" : "Refresh"}
        </button>
      </div>

      {err && (
        <p className="adm-err" role="alert">
          {err}
        </p>
      )}
      {listing && shown.length === 0 && !loading && (
        <p className="adm-empty">{listing.files.length ? "No files of this kind." : "The folder has no photos or videos yet. Upload some above."}</p>
      )}

      <ul className="adm-drv-grid">
        {shown.map((f) => (
          <li key={f.id}>
            <button
              type="button"
              className="adm-drv-item"
              onClick={() => (onPick ? onPick(driveViewUrl(f.id)) : copy(f))}
              aria-label={onPick ? `Use ${f.name}` : `Copy link to ${f.name}`}
            >
              <span className="adm-drv-img">
                <Thumb file={f} />
                {f.kind === "video" && (
                  <span className="adm-drv-badge">
                    <Film size={12} aria-hidden="true" /> Video
                  </span>
                )}
              </span>
              <span className="adm-drv-name">{f.name}</span>
              <small>{copied === f.id ? "Link copied" : `${mb(f.size)}${onPick ? "" : " · click to copy link"}`}</small>
            </button>
          </li>
        ))}
      </ul>
    </div>
  );
}

/* ---------------------------------- picker ---------------------------------- */

/** A dialog that opens from “Choose from Drive” on an image or video field. */
export function MediaPicker({ kind, onPick, onClose }) {
  const ref = useRef(null);
  const host = typeof document !== "undefined" ? document.querySelector("[data-adm]") || document.body : null;

  useEffect(() => {
    const opener = document.activeElement;
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    ref.current?.focus();
    return () => {
      document.body.style.overflow = prevOverflow;
      opener?.focus?.();
    };
  }, []);

  function onKey(e) {
    if (e.key === "Escape") {
      e.stopPropagation();
      return onClose();
    }
    if (e.key !== "Tab") return;
    const nodes = [...ref.current.querySelectorAll('button:not(:disabled), a[href], input:not([hidden]), [tabindex="0"]')].filter(
      (n) => n.offsetParent !== null,
    );
    if (!nodes.length) return;
    const first = nodes[0];
    const last = nodes[nodes.length - 1];
    if (e.shiftKey && document.activeElement === first) (e.preventDefault(), last.focus());
    else if (!e.shiftKey && document.activeElement === last) (e.preventDefault(), first.focus());
  }

  const title = kind === "video" ? "Choose a video from Drive" : "Choose a photo from Drive";
  return createPortal(
    <div className="adm-modal" onMouseDown={(e) => e.target === e.currentTarget && onClose()}>
      <div className="adm-modal-card" role="dialog" aria-modal="true" aria-labelledby="adm-pick-title" tabIndex={-1} ref={ref} onKeyDown={onKey}>
        <header>
          <h3 id="adm-pick-title">{title}</h3>
          <button type="button" className="adm-btn adm-btn-sm" onClick={onClose} aria-label="Close">
            <X size={16} />
          </button>
        </header>
        <div className="adm-modal-body">
          <Library kind={kind} onPick={onPick} />
        </div>
      </div>
    </div>,
    host,
  );
}

/* ----------------------------- match files to cards ---------------------------- */

function MatchPanel() {
  const { content, updateAt } = useContent();
  const listing = useDriveListing();
  const [skip, setSkip] = useState(() => new Set());
  const [done, setDone] = useState("");

  const targets = useMemo(() => {
    const j = (content.journey?.items || []).map((it, i) => ({
      id: `journey:${i}`,
      area: "journey",
      i,
      label: it.title,
      slug: it.slug,
      keys: [it.slug, it.title],
      empty: !it.cover,
      hasGallery: (it.gallery || []).length > 0,
    }));
    const p = (content.projects?.items || []).map((it, i) => ({
      id: `projects:${i}`,
      area: "projects",
      i,
      label: it.title,
      slug: it.slug,
      keys: [it.slug, it.title],
      empty: !it.cover,
    }));
    return [...j, ...p];
  }, [content]);

  const matches = useMemo(
    () =>
      matchFiles(
        listing?.files,
        targets.filter((t) => t.empty),
      ),
    [listing, targets],
  );
  const rows = targets.filter((t) => matches[t.id]);
  const apply = rows.filter((t) => !skip.has(t.id));
  const noMatch = targets.filter((t) => t.empty && !matches[t.id]).length;

  function run() {
    for (const t of apply) {
      const f = matches[t.id];
      updateAt([t.area, "items", t.i, "cover"], driveViewUrl(f[0].id));
      if (t.area === "journey" && !t.hasGallery && f.length > 1)
        updateAt(
          ["journey", "items", t.i, "gallery"],
          f.slice(1, 9).map((x) => driveViewUrl(x.id)),
        );
    }
    setDone(`Filled ${apply.length} card${apply.length === 1 ? "" : "s"}. Press Save to keep them.`);
    setSkip(new Set());
  }

  if (!listing) return <p className="adm-empty">Connect Drive above and the matches will appear here.</p>;

  return (
    <div className="adm-match">
      <p className="adm-note">
        Name your Drive files after the card, for example <code>ncc.jpg</code>, <code>ncc-2.jpg</code> (more photos for the same page) or{" "}
        <code>aquasentinel-ai.png</code>. This finds them and fills in cards that have no cover yet. Nothing is changed until you press the button.
      </p>
      {rows.length === 0 ? (
        <p className="adm-empty">
          No file names match a card without a cover.{" "}
          {noMatch ? `${noMatch} card${noMatch === 1 ? " has" : "s have"} no cover.` : "Every card already has a cover."}
        </p>
      ) : (
        <ul className="adm-match-list">
          {rows.map((t) => (
            <li key={t.id}>
              <label>
                <input
                  type="checkbox"
                  checked={!skip.has(t.id)}
                  onChange={(e) =>
                    setSkip((s) => {
                      const n = new Set(s);
                      e.target.checked ? n.delete(t.id) : n.add(t.id);
                      return n;
                    })
                  }
                />
                <span className="adm-match-main">
                  <strong>{t.label}</strong>
                  <small>
                    {t.area === "journey" ? "Journey" : "Project"} · {matches[t.id][0].name}
                    {matches[t.id].length > 1 && t.area === "journey" ? ` + ${matches[t.id].length - 1} more` : ""}
                  </small>
                </span>
              </label>
            </li>
          ))}
        </ul>
      )}
      <div className="adm-inline">
        <button type="button" className="adm-btn adm-btn-primary" disabled={!apply.length} onClick={run}>
          <Check size={16} /> Use {apply.length} match{apply.length === 1 ? "" : "es"}
        </button>
        {noMatch > 0 && rows.length > 0 && (
          <span className="adm-help">
            {noMatch} card{noMatch === 1 ? "" : "s"} without a match. Use “Choose from Drive” on them.
          </span>
        )}
      </div>
      {done && (
        <p className="adm-ok" role="status">
          {done}
        </p>
      )}
      <details className="adm-names">
        <summary>File names it looks for</summary>
        <ul>
          {targets.map((t) => (
            <li key={t.id}>
              <code>{t.slug}</code> <small>{t.empty ? t.label : `${t.label} (already has a cover)`}</small>
            </li>
          ))}
        </ul>
      </details>
    </div>
  );
}

/* ------------------------------------ tab ----------------------------------- */

export default function MediaTab() {
  const cfg = useDriveConfig();
  const connected = isConnected(cfg);
  return (
    <>
      <section className="adm-block" aria-label="Google Drive connection">
        <h3 className="adm-block-title">Google Drive connection</h3>
        <ConnectPanel />
        <p className="adm-note adm-drv-note">
          <AlertTriangle size={15} aria-hidden="true" /> The admin key and the passcode only keep casual visitors out. Files you upload become viewable by
          anyone who has the link, which is what lets your website show them.
        </p>
      </section>
      {connected && (
        <>
          <section className="adm-block" aria-label="Media library">
            <h3 className="adm-block-title">Media library</h3>
            <Library />
          </section>
          <section className="adm-block" aria-label="Match files to cards">
            <h3 className="adm-block-title">Match files to Journey and Project cards</h3>
            <MatchPanel />
          </section>
        </>
      )}
    </>
  );
}
