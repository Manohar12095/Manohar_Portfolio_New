import { useEffect, useId, useState } from "react";
import { ArrowDown, ArrowUp, ChevronDown, Cloud, Copy, Loader2, Plus, Trash2, Upload, X } from "lucide-react";
import { HEX } from "../lib/color";
import { parseVideo, safeUrl, toImageUrl, videoLabel } from "../lib/url";
import { slugify } from "../lib/shape";
import { MediaPicker } from "./MediaLibrary";
import { uploadToCloudStorage } from "../lib/cloudStorage";

/* Generic form building blocks. Every editor screen is described as data in
   schemas.js and drawn by <SchemaForm>, so adding a field is a one-line change. */

const URL_ERROR = "Use a link that starts with https:// (or a path on your site such as /images/photo.jpg).";

export function Field({ label, help, error, htmlFor, children, className = "" }) {
  return (
    <div className={`adm-field ${className}`}>
      {label && <label htmlFor={htmlFor}>{label}</label>}
      {children}
      {error ? <p className="adm-err">{error}</p> : help ? <p className="adm-help">{help}</p> : null}
    </div>
  );
}

/** Text input that only reports valid values (used for hex colours and font names). */
export function CommitInput({ value, onCommit, validate, className = "", ...rest }) {
  const [draft, setDraft] = useState(null);
  const shown = draft ?? value;
  const bad = draft !== null && validate && !validate(draft);
  return (
    <input
      type="text"
      {...rest}
      className={`${className}${bad ? " is-bad" : ""}`}
      value={shown}
      aria-invalid={bad || undefined}
      onChange={(e) => {
        const v = e.target.value;
        setDraft(v);
        if (!validate || validate(v)) onCommit(v);
      }}
      onBlur={() => setDraft(null)}
    />
  );
}

export function ColorField({ label, help, value, onChange }) {
  const id = useId();
  const ok = HEX.test(value || "");
  return (
    <Field label={label} help={help} htmlFor={id} className="adm-field-color">
      <div className="adm-color">
        <input type="color" aria-label={`${label} colour picker`} value={ok ? value : "#000000"} onChange={(e) => onChange(e.target.value)} />
        <CommitInput id={id} value={value || ""} onCommit={(v) => onChange(v.toLowerCase())} validate={(v) => HEX.test(v)} maxLength={7} spellCheck={false} />
      </div>
    </Field>
  );
}

function MediaField({ field, value, onChange }) {
  const id = useId();
  const kind = field.type === "image" ? "image" : "video";
  const url = value || "";
  const bad = !!url && !safeUrl(url);
  const [imgErr, setImgErr] = useState(false);
  useEffect(() => setImgErr(false), [url]);
  const isDrive = /drive\.google\.com|docs\.google\.com/.test(url);
  const [picking, setPicking] = useState(false);
  const [uploading, setUploading] = useState(false);

  const handleDirectUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    try {
      const res = await uploadToCloudStorage(file, kind === "video" ? "videos" : "images");
      if (res?.url) {
        onChange(res.url);
      }
    } catch (err) {
      alert("Upload failed: " + err.message);
    } finally {
      setUploading(false);
      e.target.value = "";
    }
  };

  let help = field.help;
  if (!help) {
    help =
      kind === "image"
        ? "Upload directly from your computer, choose from Media Library, or paste any direct/Drive link."
        : "Upload video directly, choose from Media Library, or paste any .mp4/.webm/YouTube link.";
  }
  if (isDrive) help = "Google Drive link detected. It is converted automatically. Make sure sharing is set to “Anyone with the link”.";

  return (
    <Field label={field.label} help={help} error={bad ? URL_ERROR : ""} htmlFor={id}>
      <div className="adm-media">
        <input
          id={id}
          type="text"
          value={url}
          placeholder={field.placeholder || (kind === "image" ? "https://… or /images/photo.jpg" : "https://… or /videos/clip.mp4")}
          onChange={(e) => onChange(e.target.value)}
          spellCheck={false}
        />
        <div className="adm-thumb" aria-hidden="true">
          {kind === "image" ? (
            url && !bad && !imgErr ? (
              <img src={toImageUrl(url)} alt="" referrerPolicy="no-referrer" onError={() => setImgErr(true)} />
            ) : (
              <span>{url ? (bad ? "Invalid link" : "Can’t load") : "No image"}</span>
            )
          ) : (
            <span>{parseVideo(url) ? videoLabel(url) : "No video"}</span>
          )}
        </div>
      </div>
      <div style={{ display: "flex", gap: "8px", flexWrap: "wrap", marginTop: "8px" }}>
        <label
          className="adm-btn adm-btn-sm adm-btn-primary"
          style={{ cursor: uploading ? "not-allowed" : "pointer", display: "inline-flex", alignItems: "center", gap: "6px" }}
        >
          {uploading ? <Loader2 size={14} className="adm-spin" /> : <Upload size={14} />}
          {uploading ? "Uploading…" : kind === "image" ? "Upload Photo" : "Upload Video"}
          <input
            type="file"
            accept={kind === "image" ? "image/jpeg,image/png,image/webp,image/gif,image/avif" : "video/mp4,video/webm,video/quicktime"}
            hidden
            disabled={uploading}
            onChange={handleDirectUpload}
          />
        </label>
        <button type="button" className="adm-btn adm-btn-sm adm-media-pick" onClick={() => setPicking(true)}>
          <Cloud size={15} aria-hidden="true" /> Media Library
        </button>
      </div>
      {picking && (
        <MediaPicker
          kind={kind}
          onClose={() => setPicking(false)}
          onPick={(link) => {
            onChange(link);
            setPicking(false);
          }}
        />
      )}
    </Field>
  );
}

function TextField({ field, value, onChange }) {
  const id = useId();
  const listId = useId();
  const v = value ?? "";
  const bad = field.type === "url" && !!v && !safeUrl(v);

  if (field.type === "slug") {
    return (
      <Field label={field.label} help={field.help || "Used in the page address. Lowercase letters, numbers and dashes."} htmlFor={id}>
        <input
          id={id}
          type="text"
          value={v}
          spellCheck={false}
          onChange={(e) => onChange(e.target.value.toLowerCase().replace(/[^a-z0-9-]+/g, "-"))}
          onBlur={() => onChange(slugify(v) || `item-${Math.random().toString(36).slice(2, 6)}`)}
        />
      </Field>
    );
  }
  if (field.type === "textarea") {
    return (
      <Field label={field.label} help={field.help} htmlFor={id}>
        <textarea id={id} rows={field.rows || 4} value={v} onChange={(e) => onChange(e.target.value)} />
      </Field>
    );
  }
  return (
    <Field label={field.label} help={field.help} error={bad ? URL_ERROR : ""} htmlFor={id}>
      <input
        id={id}
        type="text"
        inputMode={field.type === "url" ? "url" : undefined}
        value={v}
        placeholder={field.placeholder}
        list={field.suggestions ? listId : undefined}
        spellCheck={field.type === "url" ? false : undefined}
        onChange={(e) => onChange(e.target.value)}
      />
      {field.suggestions && (
        <datalist id={listId}>
          {field.suggestions.map((s) => (
            <option key={s} value={s} />
          ))}
        </datalist>
      )}
    </Field>
  );
}

function NumberField({ field, value, onChange }) {
  const id = useId();
  return (
    <Field label={field.label} help={field.help} htmlFor={id}>
      <input
        id={id}
        type="number"
        min={field.min}
        max={field.max}
        step={field.step}
        value={value ?? ""}
        onChange={(e) => onChange(e.target.value === "" ? "" : Number(e.target.value))}
      />
    </Field>
  );
}

function SelectField({ field, value, onChange }) {
  const id = useId();
  return (
    <Field label={field.label} help={field.help} htmlFor={id}>
      <select id={id} value={value ?? ""} onChange={(e) => onChange(e.target.value)}>
        {field.options.map((o) => {
          const opt = typeof o === "string" ? { value: o, label: o } : o;
          return (
            <option key={opt.value} value={opt.value}>
              {opt.label}
            </option>
          );
        })}
      </select>
    </Field>
  );
}

export function ToggleField({ label, help, value, onChange }) {
  const id = useId();
  return (
    <div className="adm-field adm-toggle">
      <input id={id} type="checkbox" checked={!!value} onChange={(e) => onChange(e.target.checked)} />
      <label htmlFor={id}>
        {label}
        {help && <small>{help}</small>}
      </label>
    </div>
  );
}

/* ----------------------------- list of strings ---------------------------- */
function StringsField({ field, value, onChange }) {
  const items = Array.isArray(value) ? value : [];
  const set = (i, v) => onChange(items.map((x, k) => (k === i ? v : x)));
  const move = (i, d) => {
    const j = i + d;
    if (j < 0 || j >= items.length) return;
    const a = [...items];
    [a[i], a[j]] = [a[j], a[i]];
    onChange(a);
  };
  const kind = field.itemType || "text";

  return (
    <div className="adm-field adm-strings">
      <span className="adm-label">
        {field.label} <em>{items.length}</em>
      </span>
      {field.help && <p className="adm-help">{field.help}</p>}
      {items.length === 0 && <p className="adm-empty">Nothing here yet.</p>}
      <ul>
        {items.map((v, i) => (
          <li key={i}>
            <div className="adm-str-main">
              {kind === "textarea" ? (
                <textarea rows={3} value={v} aria-label={`${field.label} ${i + 1}`} onChange={(e) => set(i, e.target.value)} />
              ) : kind === "image" ? (
                <MediaField field={{ type: "image", label: `${field.itemLabel || "Image"} ${i + 1}` }} value={v} onChange={(x) => set(i, x)} />
              ) : (
                <input type="text" value={v} aria-label={`${field.label} ${i + 1}`} onChange={(e) => set(i, e.target.value)} />
              )}
            </div>
            <div className="adm-row-actions">
              <button type="button" aria-label="Move up" disabled={i === 0} onClick={() => move(i, -1)}>
                <ArrowUp size={15} />
              </button>
              <button type="button" aria-label="Move down" disabled={i === items.length - 1} onClick={() => move(i, 1)}>
                <ArrowDown size={15} />
              </button>
              <button type="button" aria-label="Remove" className="is-danger" onClick={() => onChange(items.filter((_, k) => k !== i))}>
                <X size={15} />
              </button>
            </div>
          </li>
        ))}
      </ul>
      <button type="button" className="adm-btn adm-btn-sm" onClick={() => onChange([...items, ""])}>
        <Plus size={15} /> {field.addLabel || "Add"}
      </button>
    </div>
  );
}

/* ----------------------------- list of objects ---------------------------- */
function duplicates(list) {
  const seen = new Set();
  const dup = new Set();
  list.forEach((x) => {
    if (!x) return;
    if (seen.has(x)) dup.add(x);
    seen.add(x);
  });
  return [...dup];
}

export function ObjectsField({ field, value, onChange }) {
  const items = Array.isArray(value) ? value : [];
  const [open, setOpen] = useState(-1);
  const [armed, setArmed] = useState(-1);
  const hasSlug = field.fields.some((f) => f.key === "slug");
  const dups = hasSlug ? duplicates(items.map((i) => i.slug)) : [];

  const move = (i, d) => {
    const j = i + d;
    if (j < 0 || j >= items.length) return;
    const a = [...items];
    [a[i], a[j]] = [a[j], a[i]];
    onChange(a);
    setOpen(j);
    setArmed(-1);
  };
  const add = () => {
    onChange([...items, field.newItem()]);
    setOpen(items.length);
    setArmed(-1);
  };
  const dup = (i) => {
    const c = structuredClone(items[i]);
    if (hasSlug && c.slug) {
      let n = `${c.slug}-copy`;
      let k = 2;
      while (items.some((x) => x.slug === n)) n = `${c.slug}-copy-${k++}`;
      c.slug = n;
    }
    if (typeof c.title === "string" && c.title) c.title = `${c.title} (copy)`;
    onChange([...items.slice(0, i + 1), c, ...items.slice(i + 1)]);
    setOpen(i + 1);
    setArmed(-1);
  };
  const del = (i) => {
    onChange(items.filter((_, k) => k !== i));
    setOpen(-1);
    setArmed(-1);
  };

  return (
    <div className="adm-field adm-objects">
      <div className="adm-objects-head">
        <span className="adm-label">
          {field.label} <em className="adm-count-pill">{items.length}</em>
        </span>
        <button type="button" className="adm-btn adm-btn-primary adm-btn-add-item" onClick={add}>
          <Plus size={16} strokeWidth={2.2} /> {field.addLabel || "Add item"}
        </button>
      </div>
      {field.help && <p className="adm-help">{field.help}</p>}
      {dups.length > 0 && <p className="adm-err">Two items share the same slug ({dups.join(", ")}). Each slug must be unique.</p>}
      
      {items.length === 0 && (
        <div className="adm-empty-dropzone" onClick={add} role="button" tabIndex={0} title="Click to add new item">
          <div className="adm-empty-drop-icon">
            <Plus size={22} strokeWidth={2.2} />
          </div>
          <strong>No {field.label?.toLowerCase() || "items"} yet</strong>
          <p>Click here or use the button above to add the first one.</p>
        </div>
      )}

      <ol className="adm-cards">
        {items.map((it, i) => {
          const isOpen = open === i;
          const title = (field.itemTitle && field.itemTitle(it)) || `Untitled ${i + 1}`;
          const itemImg = it.cover || it.photo || it.poster || it.image;
          const imgUrl = itemImg ? toImageUrl(itemImg) : null;

          return (
            <li key={i} className={`adm-card-item ${isOpen ? "is-open" : ""}`}>
              <div className="adm-card-head">
                <button type="button" className="adm-card-toggle" aria-expanded={isOpen} onClick={() => setOpen(isOpen ? -1 : i)}>
                  <ChevronDown size={18} className="adm-chev" />
                  <span className="adm-item-index-badge">#{i + 1}</span>
                  {imgUrl && (
                    <img
                      src={imgUrl}
                      alt=""
                      className="adm-item-mini-thumb"
                      onError={(e) => { e.currentTarget.style.display = "none"; }}
                    />
                  )}
                  <span className="adm-card-title">{title}</span>
                  {field.itemMeta && field.itemMeta(it) ? <small className="adm-item-meta-pill">{field.itemMeta(it)}</small> : null}
                </button>
                <div className="adm-row-actions">
                  <button type="button" aria-label={`Move ${title} up`} disabled={i === 0} onClick={() => move(i, -1)} title="Move Up">
                    <ArrowUp size={15} />
                  </button>
                  <button type="button" aria-label={`Move ${title} down`} disabled={i === items.length - 1} onClick={() => move(i, 1)} title="Move Down">
                    <ArrowDown size={15} />
                  </button>
                  <button type="button" aria-label={`Duplicate ${title}`} onClick={() => dup(i)} title="Duplicate">
                    <Copy size={15} />
                  </button>
                  {armed === i ? (
                    <>
                      <button type="button" className="adm-confirm" onClick={() => del(i)}>
                        Delete
                      </button>
                      <button type="button" onClick={() => setArmed(-1)}>
                        Cancel
                      </button>
                    </>
                  ) : (
                    <button type="button" className="is-danger" aria-label={`Delete ${title}`} onClick={() => setArmed(i)} title="Delete item">
                      <Trash2 size={15} />
                    </button>
                  )}
                </div>
              </div>
              {isOpen && (
                <div className="adm-card-body">
                  <SchemaForm fields={field.fields} value={it} onChange={(v) => onChange(items.map((x, k) => (k === i ? v : x)))} />
                </div>
              )}
            </li>
          );
        })}
      </ol>
    </div>
  );
}

/* ------------------------------- dispatcher ------------------------------- */
export function FieldRenderer({ field, value, onChange }) {
  switch (field.type) {
    case "text":
    case "url":
    case "slug":
    case "textarea":
      return <TextField field={field} value={value} onChange={onChange} />;
    case "number":
      return <NumberField field={field} value={value} onChange={onChange} />;
    case "select":
      return <SelectField field={field} value={value} onChange={onChange} />;
    case "color":
      return <ColorField label={field.label} help={field.help} value={value} onChange={onChange} />;
    case "toggle":
      return <ToggleField label={field.label} help={field.help} value={value} onChange={onChange} />;
    case "image":
    case "video":
      return <MediaField field={field} value={value} onChange={onChange} />;
    case "strings":
      return <StringsField field={field} value={value} onChange={onChange} />;
    case "objects":
      return <ObjectsField field={field} value={value} onChange={onChange} />;
    case "group":
      return (
        <fieldset className="adm-group">
          <legend>{field.label}</legend>
          <SchemaForm fields={field.fields} value={value} onChange={onChange} />
        </fieldset>
      );
    case "note":
      return <p className="adm-note">{field.text}</p>;
    default:
      return null;
  }
}

export function SchemaForm({ fields, value, onChange }) {
  const v = value && typeof value === "object" ? value : {};
  return (
    <div className="adm-form">
      {fields.map((f, i) => (
        <FieldRenderer key={f.key || `note-${i}`} field={f} value={v[f.key]} onChange={(nv) => onChange({ ...v, [f.key]: nv })} />
      ))}
    </div>
  );
}
