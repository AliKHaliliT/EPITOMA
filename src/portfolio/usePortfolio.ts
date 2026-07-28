import { useCallback, useState } from "react";
import { clearImportedSnapshot, currentSnapshot, importSnapshotFile } from "./source";
import type { PortfolioSnapshot } from "../types/portfolio";

/** React view of the imported portfolio snapshot (the builder's content source). */
export function usePortfolio() {
  const [snapshot, setSnapshot] = useState<PortfolioSnapshot | null>(currentSnapshot);

  const importFile = useCallback(async (file: File) => {
    const snap = importSnapshotFile(await file.text());
    setSnapshot(snap);
    return snap;
  }, []);

  const clear = useCallback(() => {
    clearImportedSnapshot();
    setSnapshot(null);
  }, []);

  return { snapshot, importFile, clear };
}
