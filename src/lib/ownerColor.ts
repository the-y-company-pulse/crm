// Partner identity colours are stored as hex on the user. The brand navy
// (#2b394f) disappears on the dark theme's navy cards, so it is rendered via
// a theme variable: navy in light mode, brand steel in dark (see globals.css).
const BRAND_NAVY = "#2b394f";
const NAVY_BG = "rgb(var(--c-owner-navy))";

export function ownerBg(color?: string | null, fallback = "#888"): string {
  if (!color) return fallback;
  return color.toLowerCase() === BRAND_NAVY ? NAVY_BG : color;
}

export function ownerText(color?: string | null): string {
  const c = color?.toLowerCase();
  if (c === "#deff00") return "#0a1420";
  if (c === BRAND_NAVY || color === NAVY_BG) return "rgb(var(--c-owner-navy-text))";
  return "white";
}
