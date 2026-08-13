// Centralized FloodWise user-preference model. Persisted to localStorage.

export type ThemeMode = "light" | "dark" | "contrast" | "system";
export type AccentId = "red" | "blue" | "amber" | "green" | "violet";
export type FontSize = "sm" | "md" | "lg" | "xl";
export type Motion = "full" | "reduced" | "off";

export interface Settings {
  theme: ThemeMode;
  accent: AccentId;
  fontSize: FontSize;
  motion: Motion;
}

export const DEFAULT_SETTINGS: Settings = {
  theme: "dark",
  accent: "red",
  fontSize: "md",
  motion: "full",
};

// Accent presets as RGB triplets (base / dark / deep) for CSS variables.
export const ACCENTS: Record<
  AccentId,
  { label: string; base: string; dark: string; deep: string; swatch: string }
> = {
  red: { label: "Signal Red", base: "240 68 56", dark: "180 35 24", deep: "122 39 26", swatch: "#f04438" },
  blue: { label: "Flood Blue", base: "14 165 233", dark: "3 105 161", deep: "12 74 110", swatch: "#0ea5e9" },
  amber: { label: "Warning Amber", base: "245 158 11", dark: "180 83 9", deep: "120 53 15", swatch: "#f59e0b" },
  green: { label: "Safe Green", base: "34 197 94", dark: "21 128 61", deep: "20 83 45", swatch: "#22c55e" },
  violet: { label: "Deep Violet", base: "139 92 246", dark: "109 40 217", deep: "76 29 149", swatch: "#8b5cf6" },
};

const KEY = "fw_settings";

export function loadSettings(): Settings {
  if (typeof window === "undefined") return DEFAULT_SETTINGS;
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return DEFAULT_SETTINGS;
    return { ...DEFAULT_SETTINGS, ...(JSON.parse(raw) as Partial<Settings>) };
  } catch {
    return DEFAULT_SETTINGS;
  }
}

export function saveSettings(s: Settings) {
  try {
    localStorage.setItem(KEY, JSON.stringify(s));
  } catch {
    /* storage unavailable — non-fatal */
  }
}

/** Resolve "system" theme to a concrete theme using the OS preference. */
export function resolveTheme(theme: ThemeMode): "light" | "dark" | "contrast" {
  if (theme !== "system") return theme;
  if (typeof window !== "undefined" && window.matchMedia) {
    return window.matchMedia("(prefers-color-scheme: light)").matches ? "light" : "dark";
  }
  return "dark";
}

/** Apply settings to the document root (data-* attributes + accent vars). */
export function applySettings(s: Settings) {
  if (typeof document === "undefined") return;
  const root = document.documentElement;
  root.setAttribute("data-theme", resolveTheme(s.theme));
  root.setAttribute("data-fontsize", s.fontSize);
  root.setAttribute("data-motion", s.motion);
  const a = ACCENTS[s.accent];
  root.style.setProperty("--brand", a.base);
  root.style.setProperty("--brand-dark", a.dark);
  root.style.setProperty("--brand-deep", a.deep);
}
