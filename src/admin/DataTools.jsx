import { useRef, useState } from "react";
import { Copy, Database, Download, KeyRound, RotateCcw, ShieldAlert, Upload } from "lucide-react";
import { useContent } from "../context/ContentContext";
import { MIN_LENGTH, setPasscode, verifyPasscode } from "./auth";

const MAX_IMPORT = 2 * 1024 * 1024; // 2 MB of text is far more than a portfolio needs

function Msg({ m }) {
  if (!m) return null;
  return (
    <p className={m.ok ? "adm-ok" : "adm-err"} role={m.ok ? "status" : "alert"}>
      {m.text}
    </p>
  );
}

/** A button that needs a second press to confirm. */
function ConfirmButton({ label, confirmLabel, onConfirm, icon }) {
  const [armed, setArmed] = useState(false);
  return armed ? (
    <span className="adm-inline">
      <button type="button" className="adm-btn adm-btn-danger" onClick={() => (onConfirm(), setArmed(false))}>
        {confirmLabel}
      </button>
      <button type="button" className="adm-btn" onClick={() => setArmed(false)}>
        Keep my data
      </button>
    </span>
  ) : (
    <button type="button" className="adm-btn" onClick={() => setArmed(true)}>
      {icon} {label}
    </button>
  );
}

export default function DataTools() {
  const { adapter, exportDoc, importDoc, resetContent, resetThemes, dirty } = useContent();
  const [exportMsg, setExportMsg] = useState(null);
  const [importMsg, setImportMsg] = useState(null);
  const [paste, setPaste] = useState("");
  const [resetMsg, setResetMsg] = useState(null);
  const fileRef = useRef(null);

  /* ------------------------------- export ------------------------------- */
  const json = () => JSON.stringify(exportDoc(), null, 2);

  function download() {
    const url = URL.createObjectURL(new Blob([json()], { type: "application/json" }));
    const a = document.createElement("a");
    a.href = url;
    a.download = `portfolio-backup-${new Date().toISOString().slice(0, 10)}.json`;
    document.body.appendChild(a);
    a.click();
    a.remove();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
    setExportMsg({ ok: true, text: "Backup downloaded." });
  }
  async function copy() {
    try {
      await navigator.clipboard.writeText(json());
      setExportMsg({ ok: true, text: "Copied to the clipboard." });
    } catch {
      setExportMsg({ ok: false, text: "This browser blocked copying. Use Download instead." });
    }
  }

  /* ------------------------------- import ------------------------------- */
  function run(text) {
    if (text.length > MAX_IMPORT) return setImportMsg({ ok: false, text: "That file is too large to be a portfolio backup." });
    let raw;
    try {
      raw = JSON.parse(text);
    } catch {
      return setImportMsg({ ok: false, text: "That is not valid JSON. Use a file made by “Download backup”." });
    }
    if (!raw || typeof raw !== "object" || Array.isArray(raw) || (!raw.content && !raw.themes)) {
      return setImportMsg({ ok: false, text: "This file does not look like a portfolio backup (no content or themes found)." });
    }
    importDoc(raw);
    setPaste("");
    setImportMsg({ ok: true, text: "Imported. Anything missing or invalid was repaired. Check the site, then press Save to keep it." });
  }
  function onFile(e) {
    const f = e.target.files?.[0];
    e.target.value = "";
    if (!f) return;
    if (f.size > MAX_IMPORT) return setImportMsg({ ok: false, text: "That file is too large to be a portfolio backup." });
    const r = new FileReader();
    r.onload = () => run(String(r.result || ""));
    r.onerror = () => setImportMsg({ ok: false, text: "Could not read that file." });
    r.readAsText(f);
  }

  /* ---------------------------- change passcode ---------------------------- */
  const [pc, setPc] = useState({ current: "", next: "", again: "" });
  const [pcMsg, setPcMsg] = useState(null);
  const [pcBusy, setPcBusy] = useState(false);
  async function changePasscode(e) {
    e.preventDefault();
    setPcMsg(null);
    if (pc.next.length < MIN_LENGTH) return setPcMsg({ ok: false, text: `Use at least ${MIN_LENGTH} characters.` });
    if (pc.next !== pc.again) return setPcMsg({ ok: false, text: "The two new passcodes do not match." });
    setPcBusy(true);
    try {
      const r = await verifyPasscode(pc.current);
      if (!r.ok) return setPcMsg({ ok: false, text: r.wait ? "Too many wrong attempts. Try again later." : "The current passcode is wrong." });
      await setPasscode(pc.next);
      setPc({ current: "", next: "", again: "" });
      setPcMsg({ ok: true, text: "Passcode changed. Use the new one next time." });
    } catch (err) {
      setPcMsg({ ok: false, text: err.message || "Could not change the passcode." });
    } finally {
      setPcBusy(false);
    }
  }

  const size = typeof adapter.sizeKb === "function" ? adapter.sizeKb() : null;

  return (
    <div className="adm-data">
      <section className="adm-block" aria-labelledby="d-store">
        <h3 className="adm-block-title" id="d-store">
          <Database size={17} /> Where your data is saved
        </h3>
        <p>
          <strong>{adapter.name || "Custom storage"}</strong>
          {size !== null && <> · {size} KB saved</>}
        </p>
        {adapter.local ? (
          <p className="adm-help">
            Right now everything is saved in this browser only, so another device or browser will show the default content until you import a backup
            or connect a database. The saved data is plain text plus image and video links, so it fits a database table easily. See{" "}
            <code>docs/DATABASE.md</code>.
          </p>
        ) : (
          <p className="adm-help">
            Your content is saved through a connected database. It stores only text and image or video links. Use “Back up” below before big changes.
          </p>
        )}
        {dirty && <p className="adm-warn">You have unsaved changes. Press Save at the top to store them.</p>}
      </section>

      <section className="adm-block" aria-labelledby="d-export">
        <h3 className="adm-block-title" id="d-export">
          <Download size={17} /> Back up
        </h3>
        <p className="adm-help">Downloads everything on this screen: content, section order and your custom themes. Keep a copy before big changes.</p>
        <div className="adm-inline">
          <button type="button" className="adm-btn adm-btn-primary" onClick={download}>
            <Download size={16} /> Download backup
          </button>
          <button type="button" className="adm-btn" onClick={copy}>
            <Copy size={16} /> Copy as text
          </button>
        </div>
        <Msg m={exportMsg} />
      </section>

      <section className="adm-block" aria-labelledby="d-import">
        <h3 className="adm-block-title" id="d-import">
          <Upload size={17} /> Restore from a backup
        </h3>
        <p className="adm-help">Replaces what you see now. Nothing is saved until you press Save, so you can look first and press Discard to undo.</p>
        <div className="adm-inline">
          <input ref={fileRef} type="file" accept="application/json,.json" onChange={onFile} hidden aria-label="Choose a backup file" />
          <button type="button" className="adm-btn" onClick={() => fileRef.current?.click()}>
            <Upload size={16} /> Choose backup file
          </button>
        </div>
        <label htmlFor="d-paste" className="adm-label-sm">
          Or paste the backup text
        </label>
        <textarea id="d-paste" rows={4} value={paste} onChange={(e) => setPaste(e.target.value)} placeholder='{ "version": 1, "content": { … } }' spellCheck={false} />
        <div className="adm-inline">
          <button type="button" className="adm-btn" disabled={!paste.trim()} onClick={() => run(paste)}>
            Import pasted text
          </button>
        </div>
        <Msg m={importMsg} />
      </section>

      <section className="adm-block" aria-labelledby="d-reset">
        <h3 className="adm-block-title" id="d-reset">
          <RotateCcw size={17} /> Reset
        </h3>
        <p className="adm-help">Goes back to the starting content from <code>src/data/content.js</code>. You still have to press Save, and “Discard” brings your old version back until then.</p>
        <div className="adm-inline">
          <ConfirmButton label="Reset all content" confirmLabel="Yes, reset content" onConfirm={() => (resetContent(), setResetMsg({ ok: true, text: "Content reset. Press Save to keep this, or Discard to undo." }))} />
          <ConfirmButton label="Reset themes" confirmLabel="Yes, reset themes" onConfirm={() => (resetThemes(), setResetMsg({ ok: true, text: "Themes reset (your custom themes are removed). Press Save to keep this, or Discard to undo." }))} />
        </div>
        <Msg m={resetMsg} />
      </section>

      <section className="adm-block" aria-labelledby="d-pass">
        <h3 className="adm-block-title" id="d-pass">
          <KeyRound size={17} /> Change passcode
        </h3>
        <form className="adm-form adm-narrow" onSubmit={changePasscode} autoComplete="off">
          <div className="adm-field">
            <label htmlFor="pc-cur">Current passcode</label>
            <input id="pc-cur" type="password" autoComplete="current-password" value={pc.current} onChange={(e) => setPc({ ...pc, current: e.target.value })} />
          </div>
          <div className="adm-field">
            <label htmlFor="pc-new">New passcode</label>
            <input id="pc-new" type="password" autoComplete="new-password" value={pc.next} onChange={(e) => setPc({ ...pc, next: e.target.value })} />
          </div>
          <div className="adm-field">
            <label htmlFor="pc-again">New passcode again</label>
            <input id="pc-again" type="password" autoComplete="new-password" value={pc.again} onChange={(e) => setPc({ ...pc, again: e.target.value })} />
          </div>
          <div className="adm-inline">
            <button className="adm-btn" disabled={pcBusy || !pc.current || !pc.next}>
              {pcBusy ? "Checking…" : "Change passcode"}
            </button>
          </div>
          <Msg m={pcMsg} />
        </form>
        <p className="adm-help">Forgot it? Clear this site’s data in your browser settings (or run <code>localStorage.removeItem("portfolio.admin.v1")</code> in the console), then create a new one. Your saved content stays unless you clear it too.</p>
      </section>

      <section className="adm-block adm-security" aria-labelledby="d-sec">
        <h3 className="adm-block-title" id="d-sec">
          <ShieldAlert size={17} /> About security (please read)
        </h3>
        <ul className="adm-bullets">
          <li>The passcode runs in the browser. It keeps casual visitors out of this screen but cannot stop someone who knows how to use developer tools.</li>
          <li>With browser storage, edits live only in this browser, so nobody else can change what other visitors see. That is why this setup is safe today.</li>
          <li>
            <strong>Once you connect a database that every visitor reads, writing to it must be protected on the server</strong> (for example Supabase Auth with
            row-level security that allows only you to write). Never rely on this passcode for that.
          </li>
          <li>Only store text and image or video links. Do not put passwords, API secrets or private details in the content.</li>
        </ul>
      </section>
    </div>
  );
}
