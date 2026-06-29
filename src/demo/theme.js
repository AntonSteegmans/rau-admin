// src/demo/theme.js
// Light/dark palette tokens for the Raú demo app.
// Keys cover the union of all C.xxx references in RauAdmin.jsx and RauClient.jsx.

export const DARK = {
  // Backgrounds
  bg:           "#080808",
  panel:        "#0f0f0f",
  panelBorder:  "rgba(255,255,255,0.06)",
  surface:      "#161616",
  surfaceHover: "#1c1c1c",

  // Gold / accent
  gold:         "#8a9a6e",
  goldBright:   "#a0b27e",
  goldSubtle:   "rgba(138,154,110,0.08)",
  goldDim:      "rgba(138,154,110,0.35)",

  // Text  (white = primary "light ink" token — dark in light mode)
  white:        "#e8e8e4",
  text:         "#b0b0a8",
  textMuted:    "#6a6a64",
  textDark:     "#3e3e3a",

  // Semantic colours
  green:        "#7a9e6a",
  greenBg:      "rgba(122,158,106,0.1)",
  greenBorder:  "rgba(122,158,106,0.3)",
  blue:         "#6a8eaa",
  blueBg:       "rgba(106,142,170,0.1)",
  orange:       "#b08a5a",
  orangeBg:     "rgba(176,138,90,0.1)",
  orangeDim:    "rgba(176,138,90,0.12)",
  red:          "#c45050",
  redBg:        "rgba(196,80,80,0.06)",

  // Admin-only aliases
  accent:       "#8a9a6e",
  purple:       "#8a7aaa",
  purpleDim:    "rgba(138,122,170,0.12)",

  // Generic border-line and hover-background tokens
  // These replace the hardcoded rgba(255,255,255,0.0x) values so they
  // invert correctly in light mode. DARK values equal the original literals.
  line:         "rgba(255,255,255,0.06)",
  hover:        "rgba(255,255,255,0.04)",
};

export const LIGHT = {
  // Backgrounds
  bg:           "#f4f2ee",
  panel:        "#ffffff",
  panelBorder:  "rgba(0,0,0,0.10)",
  surface:      "#ecebe6",
  surfaceHover: "#e2e0da",

  // Gold / accent (warm muted gold for light background)
  gold:         "#8a7d4a",
  goldBright:   "#6f6535",
  goldSubtle:   "rgba(138,125,74,0.10)",
  goldDim:      "rgba(138,125,74,0.4)",

  // Text (inverted — white token becomes near-black ink)
  white:        "#1c1c1a",
  text:         "#3a3a36",
  textMuted:    "#7a7a72",
  textDark:     "#a8a89f",

  // Semantic colours
  green:        "#5f7d4f",
  greenBg:      "rgba(95,125,79,0.12)",
  greenBorder:  "rgba(95,125,79,0.35)",
  blue:         "#4a6a86",
  blueBg:       "rgba(74,106,134,0.12)",
  orange:       "#9a6a2a",
  orangeBg:     "rgba(154,106,42,0.12)",
  orangeDim:    "rgba(154,106,42,0.12)",
  red:          "#b04444",
  redBg:        "rgba(176,68,68,0.10)",

  // Admin-only aliases
  accent:       "#8a7d4a",
  purple:       "#7a6a9a",
  purpleDim:    "rgba(122,106,154,0.12)",

  // Generic tokens
  line:         "rgba(0,0,0,0.08)",
  hover:        "rgba(0,0,0,0.04)",
};

const THEME_KEY = "rau-theme";

/** Returns "dark" (default) or "light" from localStorage. */
export function getTheme() {
  try { return localStorage.getItem(THEME_KEY) || "dark"; } catch { return "dark"; }
}

/** Persists the chosen theme key to localStorage. */
export function setTheme(t) {
  try { localStorage.setItem(THEME_KEY, t); } catch {}
}
