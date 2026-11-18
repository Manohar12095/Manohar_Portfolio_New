/* ============================================================================
   THEMES
   Each theme is just data: colours, fonts, corner roundness and 3D-scene colours.
   The 13 presets below are read-only. In /admin → Themes you can copy any preset
   (or build one from scratch), edit it, and switch between them.
   ========================================================================== */
import { HEX } from "../lib/color";

export const COLOR_FIELDS = [
  { key: "bg1", label: "Background (top & bottom)", help: "Page background, first colour of the gradient." },
  { key: "bg2", label: "Background (middle)", help: "Second colour of the page gradient." },
  { key: "bg3", label: "Background (lower)", help: "Third colour of the page gradient." },
  { key: "surface", label: "Cards & buttons", help: "Solid colour used for cards, pills and outline buttons." },
  { key: "ink", label: "Main text", help: "Headings and body text." },
  { key: "inkSoft", label: "Soft text", help: "Paragraphs and descriptions." },
  { key: "accent", label: "Accent", help: "Primary buttons, active states, timeline." },
  { key: "accent2", label: "Accent 2", help: "Second colour of the heading gradient and small highlights." },
  { key: "accentText", label: "Accent (as text)", help: "Accent colour used for text on cards. Must be readable on the card colour." },
  { key: "accent2Text", label: "Accent 2 (as text)", help: "Accent 2 used for small text. Must be readable on the card colour." },
  { key: "onAccent", label: "Text on accent", help: "Text colour inside primary buttons." },
];

export const FONT_SUGGESTIONS = [
  "Space Grotesk", "Inter", "JetBrains Mono", "Playfair Display", "Lora", "Source Serif 4", "DM Sans",
  "Manrope", "Poppins", "Sora", "IBM Plex Sans", "IBM Plex Mono", "Fraunces", "Outfit",
  "Bricolage Grotesque", "Merriweather", "Montserrat", "Raleway", "Nunito", "Fira Code", "Space Mono",
];

const SERIF = new Set(["Playfair Display", "Lora", "Source Serif 4", "Merriweather", "Fraunces"]);
const WEIGHTS = { Merriweather: "400;700", "Space Mono": "400;700" };
const BUILT_IN_FONTS = new Set(["Space Grotesk", "Inter", "JetBrains Mono"]); // already linked in index.html
export const FONT_NAME = /^[A-Za-z0-9][A-Za-z0-9 .+-]{0,58}$/;

const scene = (palette, density = "normal") => ({ enabled: true, palette, density });

export const PRESET_THEMES = [
  {
    id: "sky", name: "Sky", mode: "light",
    description: "Soft sky blue with cobalt. The default look.",
    colors: { bg1: "#dbe8ff", bg2: "#e8f1ff", bg3: "#d5e5ff", surface: "#ffffff", ink: "#0b1530", inkSoft: "#3b4766", accent: "#2158e8", accent2: "#0aa5d6", accentText: "#1a47c2", accent2Text: "#0b7391", onAccent: "#ffffff" },
    fonts: { display: "Space Grotesk", body: "Inter", mono: "JetBrains Mono" }, roundness: 1, pills: true,
    scene: scene(["#4f86ff", "#7fb0ff", "#22b8e8", "#a9c6ff", "#c6dbff"]),
  },
  {
    id: "professional", name: "Professional", mode: "light",
    description: "Clean slate and navy. Calm, corporate, easy to read.",
    colors: { bg1: "#eef1f5", bg2: "#f6f8fa", bg3: "#e8ecf1", surface: "#ffffff", ink: "#111827", inkSoft: "#4b5563", accent: "#1e3a8a", accent2: "#0f766e", accentText: "#1e3a8a", accent2Text: "#0f766e", onAccent: "#ffffff" },
    fonts: { display: "Inter", body: "Inter", mono: "IBM Plex Mono" }, roundness: 0.6, pills: false,
    scene: scene(["#1e3a8a", "#64748b", "#0f766e", "#94a3b8", "#cbd5e1"], "low"),
  },
  {
    id: "classic", name: "Classic", mode: "light",
    description: "Ivory paper, serif headings, burgundy and antique gold.",
    colors: { bg1: "#f3ecde", bg2: "#f8f3e8", bg3: "#ede4d1", surface: "#fffdf7", ink: "#2a1f14", inkSoft: "#5c4b3a", accent: "#7a1f2b", accent2: "#a3761a", accentText: "#7a1f2b", accent2Text: "#7d5a12", onAccent: "#fffdf7" },
    fonts: { display: "Playfair Display", body: "Lora", mono: "IBM Plex Mono" }, roundness: 0.35, pills: false,
    scene: scene(["#7a1f2b", "#b4905a", "#a3761a", "#d9c7a3", "#e8dcc4"], "low"),
  },
  {
    id: "midnight", name: "Midnight", mode: "dark",
    description: "Deep navy with electric blue and cyan.",
    colors: { bg1: "#0a1020", bg2: "#0d1630", bg3: "#080d1a", surface: "#131c36", ink: "#e8eeff", inkSoft: "#a4b1d3", accent: "#4d7cff", accent2: "#22d3ee", accentText: "#8fb0ff", accent2Text: "#67e8f9", onAccent: "#040b1f" },
    fonts: { display: "Space Grotesk", body: "Inter", mono: "JetBrains Mono" }, roundness: 1, pills: true,
    scene: scene(["#4d7cff", "#22d3ee", "#7c8cff", "#2a3a7a", "#6aa0ff"]),
  },
  {
    id: "graphite", name: "Graphite", mode: "dark",
    description: "Neutral near-black with a single lime highlight.",
    colors: { bg1: "#0f1012", bg2: "#15161a", bg3: "#0b0b0d", surface: "#1a1b20", ink: "#f2f3f5", inkSoft: "#a3a7b0", accent: "#e5e7eb", accent2: "#a3e635", accentText: "#e5e7eb", accent2Text: "#bef264", onAccent: "#0f1012" },
    fonts: { display: "Sora", body: "Inter", mono: "JetBrains Mono" }, roundness: 0.8, pills: true,
    scene: scene(["#e5e7eb", "#9ca3af", "#a3e635", "#4b5563", "#d1d5db"], "low"),
  },
  {
    id: "forest", name: "Forest", mode: "light",
    description: "Fresh sage greens with a warm amber spark.",
    colors: { bg1: "#e3efe3", bg2: "#eef6ee", bg3: "#d8e8da", surface: "#fbfffb", ink: "#10261a", inkSoft: "#3f5a49", accent: "#1f7a4d", accent2: "#b7791f", accentText: "#17613c", accent2Text: "#8a5a12", onAccent: "#ffffff" },
    fonts: { display: "DM Sans", body: "DM Sans", mono: "IBM Plex Mono" }, roundness: 1, pills: true,
    scene: scene(["#1f7a4d", "#4aa37a", "#b7791f", "#9ccfb2", "#c9e6d4"]),
  },
  {
    id: "sunset", name: "Sunset", mode: "light",
    description: "Warm peach with orange and pink.",
    colors: { bg1: "#ffe6d5", bg2: "#fff1e6", bg3: "#fddcc6", surface: "#fffaf6", ink: "#3a1620", inkSoft: "#6b3c47", accent: "#d1431b", accent2: "#c2185b", accentText: "#b53a17", accent2Text: "#a3144f", onAccent: "#ffffff" },
    fonts: { display: "Outfit", body: "Outfit", mono: "JetBrains Mono" }, roundness: 1.2, pills: true,
    scene: scene(["#ff8a5b", "#ff6b9a", "#ffb37a", "#ffd0b0", "#f7a8c4"]),
  },
  {
    id: "ocean", name: "Ocean", mode: "light",
    description: "Cool aqua and teal with a blue accent.",
    colors: { bg1: "#d6f0f2", bg2: "#e6f7f8", bg3: "#cbe9ed", surface: "#ffffff", ink: "#062a30", inkSoft: "#31555c", accent: "#0e7c86", accent2: "#2563eb", accentText: "#0b6068", accent2Text: "#1d4ed8", onAccent: "#ffffff" },
    fonts: { display: "Manrope", body: "Manrope", mono: "JetBrains Mono" }, roundness: 1, pills: true,
    scene: scene(["#14a3b0", "#5cc8d2", "#3b82f6", "#a5e3e9", "#7fb4ff"]),
  },
  {
    id: "royal", name: "Royal", mode: "dark",
    description: "Deep violet with gold. Rich and formal.",
    colors: { bg1: "#150f2b", bg2: "#1c1438", bg3: "#100a22", surface: "#231a45", ink: "#f3eeff", inkSoft: "#b9acd9", accent: "#f5c451", accent2: "#b18cff", accentText: "#f5c451", accent2Text: "#cdb3ff", onAccent: "#1c1438" },
    fonts: { display: "Fraunces", body: "Inter", mono: "IBM Plex Mono" }, roundness: 0.9, pills: true,
    scene: scene(["#f5c451", "#b18cff", "#7c5cff", "#4b3a8c", "#ffd98a"]),
  },
  {
    id: "paper", name: "Paper Mono", mode: "light",
    description: "Black on off-white, square corners, red highlights.",
    colors: { bg1: "#f2f2f0", bg2: "#f7f7f5", bg3: "#ebebe8", surface: "#ffffff", ink: "#0a0a0a", inkSoft: "#444444", accent: "#0a0a0a", accent2: "#ff3b30", accentText: "#0a0a0a", accent2Text: "#c4201a", onAccent: "#ffffff" },
    fonts: { display: "Space Grotesk", body: "IBM Plex Sans", mono: "IBM Plex Mono" }, roundness: 0, pills: false,
    scene: scene(["#0a0a0a", "#6b6b6b", "#ff3b30", "#bdbdbd", "#e4e4e0"], "low"),
  },
  {
    id: "rose", name: "Rose", mode: "light",
    description: "Soft pink with magenta and violet.",
    colors: { bg1: "#fde4ee", bg2: "#fff0f5", bg3: "#fad5e4", surface: "#fffafc", ink: "#3a0f24", inkSoft: "#6b3a52", accent: "#c2185b", accent2: "#7c3aed", accentText: "#a3144f", accent2Text: "#6d28d9", onAccent: "#ffffff" },
    fonts: { display: "Poppins", body: "Poppins", mono: "JetBrains Mono" }, roundness: 1.3, pills: true,
    scene: scene(["#ec5f9a", "#f58bb7", "#a78bfa", "#f9c0d8", "#d4bffc"]),
  },
  {
    id: "neon", name: "Neon Night", mode: "dark",
    description: "Dark purple with hot pink and electric cyan.",
    colors: { bg1: "#0b0714", bg2: "#120a22", bg3: "#07040e", surface: "#1a1030", ink: "#f5ecff", inkSoft: "#b7a6d6", accent: "#ff3db0", accent2: "#19f0ff", accentText: "#ff7ac6", accent2Text: "#6ff5ff", onAccent: "#0b0714" },
    fonts: { display: "Sora", body: "Inter", mono: "JetBrains Mono" }, roundness: 1.1, pills: true,
    scene: scene(["#ff3db0", "#19f0ff", "#8b5cf6", "#3b1d6e", "#ff8ad1"], "high"),
  },
  {
    id: "sand", name: "Sand", mode: "light",
    description: "Warm neutrals with a deep teal accent.",
    colors: { bg1: "#ece4d6", bg2: "#f3ede2", bg3: "#e4dac8", surface: "#fffdf8", ink: "#1f1b16", inkSoft: "#5a5247", accent: "#0f766e", accent2: "#c2410c", accentText: "#0b5f58", accent2Text: "#9a3412", onAccent: "#ffffff" },
    fonts: { display: "Bricolage Grotesque", body: "Inter", mono: "JetBrains Mono" }, roundness: 0.9, pills: true,
    scene: scene(["#0f766e", "#5eaaa3", "#c2410c", "#d8c8a8", "#b7d3cf"], "low"),
  },
  {
    id: "manohar", name: "Manohar", mode: "dark",
    description: "Deep obsidian slate with electric cyan and royal indigo. Manohar's signature theme.",
    colors: { bg1: "#0a0e17", bg2: "#111827", bg3: "#070a10", surface: "#151f32", ink: "#f1f5f9", inkSoft: "#94a3b8", accent: "#38bdf8", accent2: "#818cf8", accentText: "#38bdf8", accent2Text: "#a5b4fc", onAccent: "#090d16" },
    fonts: { display: "Space Grotesk", body: "Inter", mono: "JetBrains Mono" }, roundness: 0.85, pills: true,
    scene: scene(["#38bdf8", "#818cf8", "#0284c7", "#6366f1", "#0ea5e9"], "normal"),
  },
];

export const DEFAULT_THEME_ID = "sky";

/** Repairs a theme loaded from storage / a database so it can never inject bad CSS. */
export function sanitizeTheme(t, fallback = PRESET_THEMES[0]) {
  const src = t && typeof t === "object" ? t : {};
  const colors = {};
  for (const f of COLOR_FIELDS) {
    const v = src.colors?.[f.key];
    colors[f.key] = typeof v === "string" && HEX.test(v) ? v : fallback.colors[f.key];
  }
  const font = (v, d) => (typeof v === "string" && FONT_NAME.test(v.trim()) ? v.trim() : d);
  const palette = Array.from({ length: 5 }, (_, i) => {
    const v = src.scene?.palette?.[i];
    return typeof v === "string" && HEX.test(v) ? v : fallback.scene.palette[i];
  });
  const r = Number(src.roundness);
  return {
    id: typeof src.id === "string" && src.id ? src.id.slice(0, 40) : `custom-${Date.now().toString(36)}`,
    name: typeof src.name === "string" && src.name.trim() ? src.name.trim().slice(0, 40) : "Custom theme",
    description: typeof src.description === "string" ? src.description.slice(0, 120) : "Custom theme",
    mode: src.mode === "dark" ? "dark" : "light",
    custom: true,
    colors,
    fonts: {
      display: font(src.fonts?.display, fallback.fonts.display),
      body: font(src.fonts?.body, fallback.fonts.body),
      mono: font(src.fonts?.mono, fallback.fonts.mono),
    },
    roundness: Number.isFinite(r) ? Math.min(2, Math.max(0, r)) : 1,
    pills: src.pills !== false,
    scene: {
      enabled: src.scene?.enabled !== false,
      density: ["low", "normal", "high"].includes(src.scene?.density) ? src.scene.density : "normal",
      palette,
    },
  };
}

function stack(name, kind) {
  const q = `"${name}"`;
  if (kind === "mono") return `${q}, ui-monospace, "SFMono-Regular", Menlo, monospace`;
  if (SERIF.has(name)) return `${q}, Georgia, "Times New Roman", serif`;
  return `${q}, system-ui, -apple-system, "Segoe UI", sans-serif`;
}

/** CSS variables for a theme. Applied on <html> (site) or on a wrapper (live preview). */
export function themeVars(theme) {
  const c = theme.colors;
  const r = Math.max(0, theme.roundness ?? 1);
  return {
    "--bg-1": c.bg1, "--bg-2": c.bg2, "--bg-3": c.bg3, "--surface": c.surface,
    "--ink": c.ink, "--ink-soft": c.inkSoft,
    "--accent": c.accent, "--accent-2": c.accent2,
    "--accent-text": c.accentText, "--accent-2-text": c.accent2Text, "--on-accent": c.onAccent,
    "--font-display": stack(theme.fonts.display, "display"),
    "--font-body": stack(theme.fonts.body, "body"),
    "--font-mono": stack(theme.fonts.mono, "mono"),
    "--r-xs": `${10 * r}px`, "--r-sm": `${14 * r}px`, "--r-md": `${20 * r}px`,
    "--r-lg": `${26 * r}px`, "--r-xl": `${34 * r}px`,
    "--r-pill": theme.pills === false ? `${14 * r}px` : "999px",
  };
}

const loadedFonts = new Set(BUILT_IN_FONTS);

/** Loads the theme's Google Fonts (one request per family so a typo never breaks the others). */
export function ensureFonts(theme) {
  if (typeof document === "undefined") return;
  for (const name of new Set(Object.values(theme.fonts))) {
    if (loadedFonts.has(name) || !FONT_NAME.test(name)) continue;
    loadedFonts.add(name);
    const weights = WEIGHTS[name] || (FONT_SUGGESTIONS.includes(name) ? "400;500;600;700" : "400;700");
    const link = document.createElement("link");
    link.rel = "stylesheet";
    link.dataset.themeFont = name;
    link.href = `https://fonts.googleapis.com/css2?family=${encodeURIComponent(name).replace(/%20/g, "+")}:wght@${weights}&display=swap`;
    document.head.appendChild(link);
  }
}

export function applyTheme(theme) {
  if (typeof document === "undefined") return;
  const root = document.documentElement;
  for (const [k, v] of Object.entries(themeVars(theme))) root.style.setProperty(k, v);
  root.dataset.mode = theme.mode;
  root.style.colorScheme = theme.mode;
  document.querySelector('meta[name="theme-color"]')?.setAttribute("content", theme.colors.bg1);
  ensureFonts(theme);
}

export function newCustomTheme(from, name = "My theme") {
  return {
    ...structuredClone(from),
    id: `custom-${Date.now().toString(36)}${Math.random().toString(36).slice(2, 4)}`,
    name,
    description: "Custom theme",
    custom: true,
  };
}
