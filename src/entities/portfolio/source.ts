// The builder's only content source: an imported portfolio.json snapshot,
// persisted per browser. There is deliberately no live fallback; the file is
// the whole bridge. Export it from the admin panel (Site → Portfolio export).

import { safeSetItem, applyPalette, clearPalette, isPalette, savePalette } from "@/shared/lib";
import { isPortfolioSnapshot, type PortfolioSnapshot } from "@/shared/contract";

const STORAGE_KEY = "os_resume_portfolio";

/**
 * Reads the imported snapshot back out of this browser.
 *
 * The contract is re-checked on every read rather than trusted from the write,
 * because the value can be edited or left behind by an older version.
 *
 * @returns The stored snapshot, or null when nothing is imported or the stored
 *   value no longer satisfies the contract.
 */
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
      "That file isn't a portfolio export. Download portfolio.json from the admin panel (Site → Portfolio export) and try again."
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

/**
 * Forgets the imported snapshot and the palette that came with it.
 *
 * @returns Nothing.
 */
export function clearImportedSnapshot() {
  localStorage.removeItem(STORAGE_KEY);
  clearPalette();
}
