/* Small helpers for working with the content object. */

export const isObj = (v) => !!v && typeof v === "object" && !Array.isArray(v);

export function getIn(obj, path) {
  return path.reduce((o, k) => (o == null ? undefined : o[k]), obj);
}

/** Immutable "set value at path". */
export function setIn(obj, path, value) {
  if (!path.length) return value;
  const [k, ...rest] = path;
  const copy = Array.isArray(obj) ? [...obj] : { ...(obj || {}) };
  copy[k] = setIn(obj?.[k], rest, value);
  return copy;
}

export function uid() {
  return Math.random().toString(36).slice(2, 8);
}

export function slugify(s) {
  const out = String(s || "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 60);
  return out;
}

/** An "empty" value shaped like `def` (used to fill gaps in list items). */
export function blankLike(def) {
  if (Array.isArray(def)) return [];
  if (isObj(def)) return Object.fromEntries(Object.entries(def).map(([k, v]) => [k, blankLike(v)]));
  if (typeof def === "number") return 0;
  if (typeof def === "boolean") return false;
  return "";
}

/**
 * Makes `val` (from storage or a database) safe to render by shaping it like `def`
 * (the built-in defaults). Missing top-level keys fall back to defaults; missing keys
 * inside list items become empty. Wrong types are repaired instead of crashing the page.
 */
export function coerce(def, val, inArray = false) {
  if (Array.isArray(def)) {
    if (!Array.isArray(val)) return inArray ? [] : structuredClone(def);
    const tpl = def[0];
    if (tpl === undefined) return val;
    if (isObj(tpl)) return val.filter(isObj).map((el) => coerce(tpl, el, true));
    if (typeof tpl === "string") return val.map((x) => (typeof x === "string" ? x : String(x ?? "")));
    return val;
  }
  if (isObj(def)) {
    const src = isObj(val) ? val : {};
    const out = {};
    for (const k of Object.keys(def)) {
      out[k] = k in src ? coerce(def[k], src[k], inArray) : inArray ? blankLike(def[k]) : structuredClone(def[k]);
    }
    for (const k of Object.keys(src)) if (!(k in def)) out[k] = src[k];
    return out;
  }
  if (typeof def === "string") return typeof val === "string" ? val : val == null ? (inArray ? "" : def) : String(val);
  if (typeof def === "number") return typeof val === "number" && Number.isFinite(val) ? val : def;
  if (typeof def === "boolean") return typeof val === "boolean" ? val : def;
  return val ?? def;
}
