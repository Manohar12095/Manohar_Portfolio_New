import { useEffect, useId, useRef, useState } from "react";
import { ArrowLeft, Check, Copy, Pencil, Plus, Trash2 } from "lucide-react";
import { useContent } from "../context/ContentContext";
import { COLOR_FIELDS, FONT_NAME, FONT_SUGGESTIONS, ensureFonts, newCustomTheme, themeVars } from "../data/themes";
import { contrast } from "../lib/color";
import { ColorField, CommitInput, Field, ToggleField } from "./fields";

/* ------------------------------ live preview ------------------------------ */
/** A small mock of the site drawn with the theme's own variables (no effect on the admin). */
export function ThemePreview({ theme }) {
  useEffect(() => {
    ensureFonts(theme);
  }, [theme]);
  const p = theme.scene?.palette || [];
  return (
    <div className="theme-scope tp" data-mode={theme.mode} style={themeVars(theme)} role="img" aria-label={`Preview of the ${theme.name} theme`}>
      <div className="tp-bg" />
      {theme.scene?.enabled !== false && (
        <>
          <i className="tp-orb tp-orb-a" style={{ background: p[0] }} />
          <i className="tp-orb tp-orb-b" style={{ background: p[2] }} />
        </>
      )}
      <div className="tp-body">
        <div className="tp-nav">
          <b className="tp-logo">M</b>
          <span className="tp-pill">Home</span>
          <span className="tp-pill tp-pill-on">Work</span>
          <span className="tp-pill">Contact</span>
        </div>
        <p className="tp-badge">Available for internships</p>
        <h4 className="tp-title">
          Building ideas
          <br />
          <span>into products</span>
        </h4>
        <p className="tp-text">A short line of body text so you can judge size and contrast.</p>
        <div className="tp-actions">
          <span className="tp-btn tp-btn-primary">Primary</span>
          <span className="tp-btn">Outline</span>
        </div>
        <div className="tp-card">
          <b>Card title</b>
          <small>Accent text on a card</small>
          <small className="tp-accent2">Second accent text</small>
        </div>
      </div>
    </div>
  );
}

/* ------------------------------ editor pieces ----------------------------- */
function FontInput({ label, help, value, onChange }) {
  const id = useId();
  const listId = useId();
  return (
    <Field label={label} help={help} htmlFor={id}>
      <CommitInput id={id} list={listId} value={value} onCommit={onChange} validate={(v) => FONT_NAME.test(v.trim())} spellCheck={false} />
      <datalist id={listId}>
        {FONT_SUGGESTIONS.map((f) => (
          <option key={f} value={f} />
        ))}
      </datalist>
    </Field>
  );
}

const CONTRAST_CHECKS = [
  { id: "ink", label: "Main text on page background", fg: "ink", bg: "bg1" },
  { id: "soft", label: "Soft text on page background", fg: "inkSoft", bg: "bg1" },
  { id: "acc", label: "Accent text on cards", fg: "accentText", bg: "surface" },
  { id: "acc2", label: "Accent 2 text on cards", fg: "accent2Text", bg: "surface" },
  { id: "btn", label: "Button text on accent", fg: "onAccent", bg: "accent" },
];

function ContrastReport({ colors }) {
  return (
    <ul className="adm-contrast" aria-label="Readability checks">
      {CONTRAST_CHECKS.map((c) => {
        const r = contrast(colors[c.fg], colors[c.bg]);
        const ok = r >= 4.5;
        return (
          <li key={c.id} className={ok ? "is-ok" : "is-low"}>
            <span className="adm-swatch-pair" style={{ background: colors[c.bg], color: colors[c.fg] }} aria-hidden="true">
              Aa
            </span>
            <span className="adm-contrast-label">{c.label}</span>
            <strong>{r.toFixed(1)}:1</strong>
            <em>{ok ? "Readable" : "Hard to read"}</em>
          </li>
        );
      })}
    </ul>
  );
}

const COLOR_GROUPS = [
  { title: "Page background", keys: ["bg1", "bg2", "bg3"] },
  { title: "Cards and text", keys: ["surface", "ink", "inkSoft"] },
  { title: "Accents", keys: ["accent", "accent2", "accentText", "accent2Text", "onAccent"] },
];

function CustomThemeEditor({ theme, isActive, onBack }) {
  const { upsertTheme, setActiveTheme } = useContent();
  const [draft, setDraft] = useState(theme);
  const latest = useRef(theme);

  // edit a copy, keep what is typed in the form, and send the repaired version to the site
  const change = (fn) => {
    const next = fn(structuredClone(latest.current));
    latest.current = next;
    setDraft(next);
    upsertTheme(next);
  };
  const setColor = (k, v) => change((d) => ((d.colors[k] = v), d));
  const setFont = (k, v) => change((d) => ((d.fonts[k] = v.trim()), d));

  // load typed font names after a short pause so a half-typed name is never requested
  useEffect(() => {
    const t = setTimeout(() => ensureFonts(draft), 700);
    return () => clearTimeout(t);
  }, [draft.fonts.display, draft.fonts.body, draft.fonts.mono]); // eslint-disable-line react-hooks/exhaustive-deps

  const palette = draft.scene.palette;

  return (
    <div className="adm-theme-editor">
      <div className="adm-theme-editor-head">
        <button type="button" className="adm-btn adm-btn-sm" onClick={onBack}>
          <ArrowLeft size={15} /> All themes
        </button>
        <button
          type="button"
          className={`adm-btn adm-btn-sm ${isActive ? "" : "adm-btn-primary"}`}
          disabled={isActive}
          onClick={() => setActiveTheme(draft.id)}
        >
          <Check size={15} /> {isActive ? "In use on the site" : "Use this theme"}
        </button>
      </div>

      <div className="adm-theme-editor-grid">
        <div className="adm-theme-editor-form">
          <fieldset className="adm-group">
            <legend>Basics</legend>
            <div className="adm-form">
              <Field label="Theme name" htmlFor="th-name">
                <input id="th-name" type="text" maxLength={40} value={draft.name} onChange={(e) => change((d) => ((d.name = e.target.value), d))} />
              </Field>
              <Field label="Short description" htmlFor="th-desc">
                <input id="th-desc" type="text" maxLength={120} value={draft.description} onChange={(e) => change((d) => ((d.description = e.target.value), d))} />
              </Field>
              <Field label="Light or dark" help="Light themes use dark text. Dark themes use light text. This also styles scrollbars and form fields." htmlFor="th-mode">
                <select id="th-mode" value={draft.mode} onChange={(e) => change((d) => ((d.mode = e.target.value === "dark" ? "dark" : "light"), d))}>
                  <option value="light">Light</option>
                  <option value="dark">Dark</option>
                </select>
              </Field>
            </div>
          </fieldset>

          {COLOR_GROUPS.map((g) => (
            <fieldset className="adm-group" key={g.title}>
              <legend>{g.title}</legend>
              <div className="adm-form adm-colors">
                {g.keys.map((k) => {
                  const f = COLOR_FIELDS.find((x) => x.key === k);
                  return <ColorField key={k} label={f.label} help={f.help} value={draft.colors[k]} onChange={(v) => setColor(k, v)} />;
                })}
              </div>
            </fieldset>
          ))}

          <fieldset className="adm-group">
            <legend>Fonts</legend>
            <div className="adm-form">
              <FontInput label="Headings" help="Any font name from fonts.google.com." value={draft.fonts.display} onChange={(v) => setFont("display", v)} />
              <FontInput label="Body text" value={draft.fonts.body} onChange={(v) => setFont("body", v)} />
              <FontInput label="Small labels (monospace)" value={draft.fonts.mono} onChange={(v) => setFont("mono", v)} />
              <p className="adm-help">If a name is not on Google Fonts the site falls back to a system font, so nothing breaks.</p>
            </div>
          </fieldset>

          <fieldset className="adm-group">
            <legend>Shape</legend>
            <div className="adm-form">
              <Field label={`Corner roundness (${draft.roundness.toFixed(1)}×)`} htmlFor="th-round" help="0 is square. 1 is the default. Higher is rounder.">
                <input
                  id="th-round"
                  type="range"
                  min="0"
                  max="1.6"
                  step="0.1"
                  value={draft.roundness}
                  onChange={(e) => change((d) => ((d.roundness = Number(e.target.value)), d))}
                />
              </Field>
              <ToggleField
                label="Pill-shaped buttons and menu"
                help="Off uses the corner roundness above instead of fully round ends."
                value={draft.pills}
                onChange={(v) => change((d) => ((d.pills = v), d))}
              />
            </div>
          </fieldset>

          <fieldset className="adm-group">
            <legend>3D background</legend>
            <div className="adm-form">
              <ToggleField label="Show the 3D shapes" value={draft.scene.enabled} onChange={(v) => change((d) => ((d.scene.enabled = v), d))} />
              <Field label="How many shapes" htmlFor="th-density">
                <select id="th-density" value={draft.scene.density} onChange={(e) => change((d) => ((d.scene.density = e.target.value), d))}>
                  <option value="low">Few</option>
                  <option value="normal">Normal</option>
                  <option value="high">Many</option>
                </select>
              </Field>
              <div className="adm-colors">
                {palette.map((c, i) => (
                  <ColorField key={i} label={`Shape colour ${i + 1}`} value={c} onChange={(v) => change((d) => ((d.scene.palette[i] = v), d))} />
                ))}
              </div>
            </div>
          </fieldset>
        </div>

        <aside className="adm-theme-editor-side" aria-label="Live preview">
          <h3 className="adm-block-title">Live preview</h3>
          <ThemePreview theme={draft} />
          <h3 className="adm-block-title">Readability</h3>
          <p className="adm-help">Text should reach 4.5:1 to be comfortable to read.</p>
          <ContrastReport colors={draft.colors} />
        </aside>
      </div>
    </div>
  );
}

/* --------------------------------- the tab -------------------------------- */
function ThemeCard({ theme, active, onUse, onCopy, onEdit, onDelete }) {
  const [armed, setArmed] = useState(false);
  return (
    <li className={`adm-theme${active ? " is-active" : ""}`}>
      <ThemePreview theme={theme} />
      <div className="adm-theme-info">
        <div className="adm-theme-name">
          <h4>{theme.name}</h4>
          {active && <span className="adm-badge">Active</span>}
          <span className="adm-badge adm-badge-quiet">{theme.mode === "dark" ? "Dark" : "Light"}</span>
          {theme.custom && <span className="adm-badge adm-badge-quiet">Yours</span>}
        </div>
        <p>{theme.description}</p>
        <div className="adm-swatches" aria-hidden="true">
          {[theme.colors.bg1, theme.colors.surface, theme.colors.ink, theme.colors.accent, theme.colors.accent2].map((c, i) => (
            <i key={i} style={{ background: c }} />
          ))}
        </div>
        <div className="adm-theme-actions">
          <button type="button" className={`adm-btn adm-btn-sm ${active ? "" : "adm-btn-primary"}`} disabled={active} onClick={onUse}>
            {active ? "In use" : "Use theme"}
          </button>
          <button type="button" className="adm-btn adm-btn-sm" onClick={onCopy}>
            <Copy size={14} /> Customize a copy
          </button>
          {theme.custom && (
            <>
              <button type="button" className="adm-btn adm-btn-sm" onClick={onEdit}>
                <Pencil size={14} /> Edit
              </button>
              {armed ? (
                <>
                  <button type="button" className="adm-btn adm-btn-sm adm-btn-danger" onClick={onDelete}>
                    Delete theme
                  </button>
                  <button type="button" className="adm-btn adm-btn-sm" onClick={() => setArmed(false)}>
                    Keep
                  </button>
                </>
              ) : (
                <button type="button" className="adm-btn adm-btn-sm" aria-label={`Delete ${theme.name}`} onClick={() => setArmed(true)}>
                  <Trash2 size={14} />
                </button>
              )}
            </>
          )}
        </div>
      </div>
    </li>
  );
}

export default function ThemesTab() {
  const { themes, setActiveTheme, upsertTheme, deleteTheme } = useContent();
  const [editingId, setEditingId] = useState(null);
  const editing = themes.custom.find((t) => t.id === editingId);

  // the theme being edited was removed (for example by Discard)
  useEffect(() => {
    if (editingId && !editing) setEditingId(null);
  }, [editingId, editing]);

  const presets = themes.all.filter((t) => !t.custom);
  const mine = themes.custom;

  const copyOf = (t, name) => {
    const c = newCustomTheme(t, name);
    upsertTheme(c);
    setEditingId(c.id);
  };

  if (editing) {
    return <CustomThemeEditor key={editing.id} theme={editing} isActive={themes.activeId === editing.id} onBack={() => setEditingId(null)} />;
  }

  const card = (t) => (
    <ThemeCard
      key={t.id}
      theme={t}
      active={themes.activeId === t.id}
      onUse={() => setActiveTheme(t.id)}
      onCopy={() => copyOf(t, `${t.name} copy`)}
      onEdit={() => setEditingId(t.id)}
      onDelete={() => deleteTheme(t.id)}
    />
  );

  return (
    <div className="adm-themes">
      <div className="adm-block">
        <div className="adm-objects-head">
          <h3 className="adm-block-title">Your themes</h3>
          <button type="button" className="adm-btn adm-btn-primary adm-btn-sm" onClick={() => copyOf(themes.active, "My theme")}>
            <Plus size={15} /> New theme
          </button>
        </div>
        {mine.length === 0 ? (
          <p className="adm-empty">
            No custom themes yet. “New theme” starts from the theme you are using now. You can also press “Customize a copy” on any theme below.
          </p>
        ) : (
          <ul className="adm-theme-grid">{mine.map(card)}</ul>
        )}
      </div>

      <div className="adm-block">
        <h3 className="adm-block-title">Built-in themes ({presets.length})</h3>
        <p className="adm-help">Built-in themes cannot be changed, but you can customize a copy of any of them.</p>
        <ul className="adm-theme-grid">{presets.map(card)}</ul>
      </div>
    </div>
  );
}
