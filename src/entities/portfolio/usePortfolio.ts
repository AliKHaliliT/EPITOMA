import { useCallback, useState } from "react";
import { clearImportedSnapshot, currentSnapshot, importSnapshotFile } from "./source";
import { clearRepoRef, fetchRepoSnapshot, loadRepoRef, saveRepoRef, type RepoRef } from "./repoSource";
import type { PortfolioSnapshot } from "@/shared/contract";

/** React view of the portfolio snapshot (the builder's content source) and
 *  the optional public repo it can be refreshed from. */
export function usePortfolio() {
  const [snapshot, setSnapshot] = useState<PortfolioSnapshot | null>(currentSnapshot);
  const [repoRef, setRepoRef] = useState<RepoRef | null>(loadRepoRef);

  const importFile = useCallback(async (file: File) => {
    const snap = importSnapshotFile(await file.text());
    setSnapshot(snap);
    return snap;
  }, []);

  const importText = useCallback(async (text: string) => {
    const snap = importSnapshotFile(text);
    setSnapshot(snap);
    return snap;
  }, []);

  /** Point at a public VITA repo: fetch once now, remember it for refreshes. */
  const connectRepo = useCallback(async (ref: RepoRef) => {
    const snap = importSnapshotFile(JSON.stringify(await fetchRepoSnapshot(ref)));
    saveRepoRef(ref);
    setRepoRef(ref);
    setSnapshot(snap);
    return snap;
  }, []);

  /** Re-fetch from the connected repo; the fresh snapshot replaces the stored one. */
  const refreshFromRepo = useCallback(async () => {
    if (!repoRef) return null;
    const snap = importSnapshotFile(JSON.stringify(await fetchRepoSnapshot(repoRef)));
    setSnapshot(snap);
    return snap;
  }, [repoRef]);

  const disconnectRepo = useCallback(() => {
    clearRepoRef();
    setRepoRef(null);
  }, []);

  const clear = useCallback(() => {
    clearImportedSnapshot();
    clearRepoRef();
    setSnapshot(null);
    setRepoRef(null);
  }, []);

  return { snapshot, repoRef, importFile, importText, connectRepo, refreshFromRepo, disconnectRepo, clear };
}
