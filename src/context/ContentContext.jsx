import { createContext, useCallback, useContext, useEffect, useLayoutEffect, useMemo, useRef, useState } from "react";
import { defaultContent } from "../data/content";
import { PRESET_THEMES, DEFAULT_THEME_ID, applyTheme, sanitizeTheme } from "../data/themes";
import { getAdapter } from "../data/store";
import { coerce, isObj, setIn } from "../lib/shape";

/* The one place that holds the site's content and theme.
   - `doc`   is the working copy (what the site shows right now, including unsaved admin edits)
   - `saved` is the last copy written to the storage adapter
   `dirty` is true when they differ. */

const Ctx = createContext(null);

/** Fixes anything wrong in a stored/loaded document so rendering can never crash. */
function normalize(raw) {
  const content = coerce(defaultContent, raw?.content);

  // keep every known section, in the saved order; add any new ones at the end; home first
  const known = new Set(defaultContent.sections.map((s) => s.id));
  const seen = new Set();
  let list = content.sections.filter((s) => known.has(s.id) && !seen.has(s.id) && seen.add(s.id));
  for (const d of defaultContent.sections) if (!seen.has(d.id)) list.push({ ...d });
  const home = list.find((s) => s.id === "home") || { ...defaultContent.sections[0] };
  list = [{ ...home, visible: true }, ...list.filter((s) => s.id !== "home")];
  content.sections = list.map((s) => ({ ...s, label: String(s.label || s.id).slice(0, 30), visible: s.visible !== false }));

  const customRaw = Array.isArray(raw?.themes?.custom) ? raw.themes.custom : [];
  const custom = customRaw
    .filter(isObj)
    .map((t) => sanitizeTheme(t))
    .filter((t, i, a) => a.findIndex((x) => x.id === t.id) === i)
    .filter((t) => !PRESET_THEMES.some((p) => p.id === t.id));
  const wanted = raw?.themes?.activeId;
  const activeId = [...PRESET_THEMES, ...custom].some((t) => t.id === wanted) ? wanted : DEFAULT_THEME_ID;

  return { content, themes: { activeId, custom } };
}

export function ContentProvider({ children }) {
  const adapter = getAdapter();
  const init = useRef(null);
  if (!init.current) init.current = normalize(adapter.loadSync ? adapter.loadSync() : null);

  const [doc, setDoc] = useState(init.current);
  const [savedStr, setSavedStr] = useState(() => JSON.stringify(init.current));
  const [status, setStatus] = useState({ state: "idle", msg: "" });
  const [ready, setReady] = useState(!!adapter.loadSync);

  // adapters without loadSync (a database) load after the first render
  useEffect(() => {
    if (adapter.loadSync) return;
    let alive = true;
    adapter
      .load()
      .then((d) => {
        if (!alive) return;
        const n = normalize(d);
        setDoc(n);
        setSavedStr(JSON.stringify(n));
      })
      .catch(() =>
        alive &&
        setStatus({ state: "error", msg: "Could not load saved data. Saving now would replace it with the starting content." })
      )
      .finally(() => alive && setReady(true));
    return () => {
      alive = false;
    };
  }, [adapter]);

  const docStr = useMemo(() => JSON.stringify(doc), [doc]);
  const dirty = docStr !== savedStr;

  const allThemes = useMemo(() => [...PRESET_THEMES, ...doc.themes.custom], [doc.themes.custom]);
  const activeTheme = useMemo(
    () => allThemes.find((t) => t.id === doc.themes.activeId) || PRESET_THEMES[0],
    [allThemes, doc.themes.activeId]
  );

  // apply theme before the first paint so there is no flash of the wrong colours
  useLayoutEffect(() => {
    applyTheme(activeTheme);
  }, [activeTheme]);

  // browser tab title + description
  const { seoTitle, seoDescription } = doc.content.settings;
  useEffect(() => {
    if (!window.location.pathname.startsWith("/admin") && seoTitle) document.title = seoTitle;
    if (seoDescription) document.querySelector('meta[name="description"]')?.setAttribute("content", seoDescription);
  }, [seoTitle, seoDescription]);

  /* ---------------------------- actions ---------------------------- */
  const updateAt = useCallback(
    (path, value) => setDoc((d) => ({ ...d, content: setIn(d.content, path, value) })),
    []
  );

  const setActiveTheme = useCallback(
    (id) => setDoc((d) => ({ ...d, themes: { ...d.themes, activeId: id } })),
    []
  );

  const upsertTheme = useCallback(
    (theme) =>
      setDoc((d) => {
        const t = sanitizeTheme(theme);
        const exists = d.themes.custom.some((x) => x.id === t.id);
        return {
          ...d,
          themes: {
            ...d.themes,
            custom: exists ? d.themes.custom.map((x) => (x.id === t.id ? t : x)) : [...d.themes.custom, t],
          },
        };
      }),
    []
  );

  const deleteTheme = useCallback(
    (id) =>
      setDoc((d) => ({
        ...d,
        themes: {
          activeId: d.themes.activeId === id ? DEFAULT_THEME_ID : d.themes.activeId,
          custom: d.themes.custom.filter((x) => x.id !== id),
        },
      })),
    []
  );

  const resetContent = useCallback(() => setDoc((d) => ({ ...d, content: normalize(null).content })), []);
  const resetThemes = useCallback(() => setDoc((d) => ({ ...d, themes: normalize(null).themes })), []);
  const importDoc = useCallback((raw) => setDoc(normalize(raw)), []);

  const exportDoc = useCallback(
    () => ({ version: 1, updatedAt: new Date().toISOString(), content: doc.content, themes: doc.themes }),
    [doc]
  );

  const save = useCallback(async () => {
    setStatus({ state: "saving", msg: "Saving…" });
    try {
      await adapter.save({ version: 1, updatedAt: new Date().toISOString(), content: doc.content, themes: doc.themes });
      setSavedStr(JSON.stringify(doc));
      setStatus({ state: "saved", msg: "All changes saved" });
      return true;
    } catch (e) {
      setStatus({ state: "error", msg: `Could not save: ${e?.message || "storage unavailable"}` });
      return false;
    }
  }, [adapter, doc]);

  const discard = useCallback(async () => {
    const d = adapter.loadSync ? adapter.loadSync() : await adapter.load();
    const n = normalize(d);
    setDoc(n);
    setSavedStr(JSON.stringify(n));
    setStatus({ state: "idle", msg: "" });
  }, [adapter]);

  const value = useMemo(
    () => ({
      content: doc.content,
      themes: { all: allThemes, active: activeTheme, activeId: doc.themes.activeId, custom: doc.themes.custom },
      dirty,
      status,
      ready,
      adapter,
      updateAt,
      setActiveTheme,
      upsertTheme,
      deleteTheme,
      resetContent,
      resetThemes,
      importDoc,
      exportDoc,
      save,
      discard,
    }),
    [doc, allThemes, activeTheme, dirty, status, ready, adapter, updateAt, setActiveTheme, upsertTheme, deleteTheme, resetContent, resetThemes, importDoc, exportDoc, save, discard]
  );

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function useContent() {
  const v = useContext(Ctx);
  if (!v) throw new Error("useContent must be used inside <ContentProvider>");
  return v;
}
