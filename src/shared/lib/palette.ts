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

/**
 * Decides whether a value carries both theme modes of a palette.
 *
 * The check is shallow on purpose. A palette arrives inside an imported
 * portfolio written by a separate application, and demanding every token would
 * reject an older export that predates one.
 *
 * @param value - The candidate, straight from parsed JSON.
 *
 * @returns True when the value can be applied as a palette.
 */
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

/**
 * Remembers an adopted palette for this browser.
 *
 * @param p - The palette to persist.
 *
 * @returns Nothing.
 */
export function savePalette(p: Palette): void {
  safeSetItem(STORAGE_KEY, JSON.stringify(p));
}

/**
 * Forgets the adopted palette and removes its override tag.
 *
 * @returns Nothing.
 */
export function clearPalette(): void {
  try {
    localStorage.removeItem(STORAGE_KEY);
  } catch {
    // removal failing is harmless: the override tag is cleared regardless
  }
  if (typeof document === "undefined") return; // node tests have no DOM
  document.getElementById(STYLE_TAG_ID)?.remove();
}

/**
 * Injects or refreshes the override style tag carrying a palette.
 *
 * The tag is appended to `<head>`, so it lands after the stylesheet and wins at
 * equal specificity.
 *
 * @param p - The palette to write into the override tag.
 *
 * @returns Nothing. Does nothing at all outside a browser, since node suites
 *   have no document to write to.
 */
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

/**
 * Re-applies the adopted palette, if any, before first paint.
 *
 * @returns Nothing. An unreadable stored palette is swallowed, because the
 *   right fallback is the default look rather than a failed boot.
 */
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
