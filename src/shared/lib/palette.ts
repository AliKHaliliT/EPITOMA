// The builder's own minimal palette runtime. EPITOMA does not edit palettes
// (that is the admin panel's job); it ADOPTS the one carried inside an
// imported portfolio.json, so the builder chrome matches whatever look the
// owner chose for their site. The adopted palette persists per browser and
// re-applies on boot, and clearing the imported portfolio clears it too.
// The `.resume-page` preview stays token-independent either way.

import { generatePaletteCss, type Palette } from "./paletteCss";
import { safeSetItem } from "./storage";

const STORAGE_KEY = "os_palette";
const STYLE_TAG_ID = "os-palette-override";

export type { Palette };

export function isPalette(value: unknown): value is Palette {
  if (typeof value !== "object" || value === null) return false;
  const v = value as Record<string, unknown>;
  return (
    typeof v.light === "object" && v.light !== null &&
    typeof v.dark === "object" && v.dark !== null &&
    typeof (v.light as Record<string, unknown>).background === "string" &&
    typeof (v.dark as Record<string, unknown>).background === "string"
  );
}

export function savePalette(p: Palette): void {
  safeSetItem(STORAGE_KEY, JSON.stringify(p));
}

export function clearPalette(): void {
  try {
    localStorage.removeItem(STORAGE_KEY);
  } catch {
    // removal failing is harmless: the override tag is cleared regardless
  }
  if (typeof document === "undefined") return; // node tests have no DOM
  document.getElementById(STYLE_TAG_ID)?.remove();
}

/** Inject (or refresh) the override style tag; appended to <head>, so it
 *  lands after index.css and wins at equal specificity. */
export function applyPalette(p: Palette): void {
  if (typeof document === "undefined") return; // node tests have no DOM
  let tag = document.getElementById(STYLE_TAG_ID) as HTMLStyleElement | null;
  if (!tag) {
    tag = document.createElement("style");
    tag.id = STYLE_TAG_ID;
    document.head.appendChild(tag);
  }
  tag.textContent = generatePaletteCss(p);
}

/** Re-apply the adopted palette, if any, before first paint. */
export function bootPalette(): void {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return;
    const parsed: unknown = JSON.parse(raw);
    if (isPalette(parsed)) applyPalette(parsed);
  } catch {
    // an unreadable palette just means the default look
  }
}
