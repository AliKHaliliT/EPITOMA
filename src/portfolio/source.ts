// The builder's only content source: an imported portfolio.json snapshot,
// persisted per browser. There is deliberately NO live-site fallback: the
// builder consumes the same file here as it will once it lives in its own
// repo. Export the file from the site's Admin → Settings → Portfolio export.

import { safeSetItem } from "../lib/storage";
import { applyPalette, clearPalette, isPalette, savePalette } from "../lib/palette";
import { isPortfolioSnapshot, type PortfolioSnapshot } from "../types/portfolio";

const STORAGE_KEY = "os_resume_portfolio";

export function currentSnapshot(): PortfolioSnapshot | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const parsed: unknown = JSON.parse(raw);
    return isPortfolioSnapshot(parsed) ? parsed : null;
  } catch {
    return null;
  }
}

/** Parse + validate + persist an uploaded portfolio.json. */
export function importSnapshotFile(text: string): PortfolioSnapshot {
  let parsed: unknown;
  try {
    parsed = JSON.parse(text);
  } catch {
    throw new Error("That file isn't valid JSON.");
  }
  if (!isPortfolioSnapshot(parsed)) {
    throw new Error(
      'That file isn\'t a portfolio export: download portfolio.json from the site\'s Admin → Settings → "Portfolio export".'
    );
  }
  safeSetItem(STORAGE_KEY, JSON.stringify(parsed));
  // Adopt the owner's chosen look when the snapshot carries one, so the
  // builder chrome matches the site it serves. Older exports without a
  // palette leave the current look alone.
  if (isPalette(parsed.palette)) {
    savePalette(parsed.palette);
    applyPalette(parsed.palette);
  }
  return parsed;
}

export function clearImportedSnapshot() {
  localStorage.removeItem(STORAGE_KEY);
  clearPalette();
}
