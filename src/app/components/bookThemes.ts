export interface BookTheme {
  name: string;
  spine: string;
  coverTop: string;
  coverBottom: string;
  accent: string;
  text: string;
}

export const BOOK_THEMES: BookTheme[] = [
  { name: "Midnight", spine: "#1a1040", coverTop: "#2D1B69", coverBottom: "#1a1040", accent: "#c4a8ff", text: "#f0eaff" },
  { name: "Forest",   spine: "#0a3328", coverTop: "#0D4A3A", coverBottom: "#083322", accent: "#a8e6cf", text: "#e8f9f3" },
  { name: "Crimson",  spine: "#1a0808", coverTop: "#3b0f0f", coverBottom: "#1a0808", accent: "#ff9999", text: "#fff0f0" },
  { name: "Dusk",     spine: "#2e1c0e", coverTop: "#5c3318", coverBottom: "#2e1c0e", accent: "#f5d5a8", text: "#fef6ec" },
  { name: "Blush",    spine: "#2e0a1e", coverTop: "#6b1a3f", coverBottom: "#2e0a1e", accent: "#ffb3d1", text: "#fff0f6" },
  { name: "Indigo",   spine: "#0a1e2e", coverTop: "#1a3f6b", coverBottom: "#0a1e2e", accent: "#b3d9ff", text: "#f0f6ff" },
  { name: "Frost",    spine: "#0a1a2e", coverTop: "#0d3154", coverBottom: "#0a1a2e", accent: "#a8d8f5", text: "#eef7ff" },
  { name: "Parchment",spine: "#1a1a0a", coverTop: "#3d3d1a", coverBottom: "#1a1a0a", accent: "#e8e0a0", text: "#fdfce8" },
];

export const DEFAULT_THEME: BookTheme = {
  name: "Midnight",
  spine: "#1a1a2e",
  coverTop: "#16213e",
  coverBottom: "#0f3460",
  accent: "#e0e0ff",
  text: "#f0f0ff",
};

// ── Hex ↔ HSL helpers ────────────────────────────────────────────────────────

function hexToHSL(hex: string): { h: number; s: number; l: number } {
  const clean = hex.replace("#", "");
  const r = parseInt(clean.slice(0, 2), 16) / 255;
  const g = parseInt(clean.slice(2, 4), 16) / 255;
  const b = parseInt(clean.slice(4, 6), 16) / 255;
  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  const l = (max + min) / 2;
  let s = 0;
  let h = 0;
  if (max !== min) {
    s = l > 0.5 ? (max - min) / (2 - max - min) : (max - min) / (max + min);
    switch (max) {
      case r: h = ((g - b) / (max - min) + (g < b ? 6 : 0)) / 6; break;
      case g: h = ((b - r) / (max - min) + 2) / 6; break;
      case b: h = ((r - g) / (max - min) + 4) / 6; break;
    }
  }
  return { h: Math.round(h * 360), s: Math.round(s * 100), l: Math.round(l * 100) };
}

function hslToHex(h: number, s: number, l: number): string {
  const sl = s / 100;
  const ll = l / 100;
  const a = sl * Math.min(ll, 1 - ll);
  const f = (n: number) => {
    const k = (n + h / 30) % 12;
    const color = ll - a * Math.max(Math.min(k - 3, 9 - k, 1), -1);
    return Math.round(255 * color).toString(16).padStart(2, "0");
  };
  return `#${f(0)}${f(8)}${f(4)}`;
}

/** Derive a full BookTheme from any hex colour. */
export function hexToTheme(hex: string): BookTheme {
  const { h, s } = hexToHSL(hex);
  const sat = Math.min(Math.max(s, 25), 100);
  return {
    name: "Custom",
    spine:       hslToHex(h, sat,           12),
    coverTop:    hslToHex(h, sat,           26),
    coverBottom: hslToHex(h, sat,           16),
    accent:      hslToHex(h, Math.max(sat - 15, 20), 82),
    text:        hslToHex(h, Math.max(sat - 30, 10), 93),
  };
}

/** Returns a theme for a named preset OR a raw hex string. */
export function getTheme(colorTheme: string | undefined): BookTheme {
  if (!colorTheme) return DEFAULT_THEME;
  if (colorTheme.startsWith("#")) return hexToTheme(colorTheme);
  return BOOK_THEMES.find((t) => t.name === colorTheme) ?? DEFAULT_THEME;
}