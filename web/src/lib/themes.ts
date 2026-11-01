// Three visual directions for the same site. Each lives under its own URL prefix (/a, /b, /c) so they
// can be compared side by side; the theme only changes presentation, never the data.
export const THEMES = {
  a: { name: "Bengal Bazaar", blurb: "Kalighat & Jamini Roy: painted panels, thick outlines" },
  b: { name: "Mithila Wall", blurb: "Madhubani: patterned borders around every stamp" },
  c: { name: "Bold Poster", blurb: "Poster geometry and heavy type" },
} as const;

export type ThemeKey = keyof typeof THEMES;
export const THEME_KEYS = Object.keys(THEMES) as ThemeKey[];
export const isTheme = (v: string): v is ThemeKey => v in THEMES;
