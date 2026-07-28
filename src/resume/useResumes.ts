// Builder state: holds the document list + active document, wraps
// ResumeService, and auto-persists on change. Content comes from the
// imported portfolio snapshot (portfolio/source.ts).

import { useCallback, useEffect, useRef, useState } from "react";
import { ResumeService } from "@/resume/services/resumeService";
import { DocumentKind, ResumeDocument } from "@/resume/types/resume";
import { currentSnapshot } from "@/resume/portfolio/source";
import { safeSetItem } from "@/resume/lib/storage";

const ACTIVE_KEY = "os_resumes_active";

export function useResumes() {
  const [docs, setDocs] = useState<ResumeDocument[]>(() => ResumeService.list());
  const [activeId, setActiveId] = useState<string | null>(
    () => localStorage.getItem(ACTIVE_KEY) || ResumeService.list()[0]?.id || null
  );

  // Persist the whole collection whenever it changes.
  const first = useRef(true);
  useEffect(() => {
    if (first.current) {
      first.current = false;
      return;
    }
    ResumeService.saveAll(docs);
  }, [docs]);

  useEffect(() => {
    if (activeId) safeSetItem(ACTIVE_KEY, activeId);
  }, [activeId]);

  const activeDoc = docs.find((d) => d.id === activeId) || null;

  /** Mutate the active document immutably. */
  const update = useCallback(
    (mutator: (doc: ResumeDocument) => ResumeDocument) => {
      setDocs((prev) =>
        prev.map((d) =>
          d.id === activeId
            ? { ...mutator(d), updatedAt: new Date().toISOString() }
            : d
        )
      );
    },
    [activeId]
  );

  const create = useCallback((kind: DocumentKind) => {
    const doc = ResumeService.createDocument(
      kind,
      new Date().toISOString(),
      currentSnapshot()
    );
    setDocs((prev) => [doc, ...prev]);
    setActiveId(doc.id);
    return doc;
  }, []);

  // Clone from React state, not ResumeService.list(): localStorage can lag
  // behind `docs` (the persist effect hasn't flushed), so a storage read here
  // could resurrect stale data and drop in-memory edits.
  const duplicate = useCallback(() => {
    const src = docs.find((d) => d.id === activeId);
    if (!src) return;
    const copy = ResumeService.cloneDocument(src, new Date().toISOString());
    setDocs((prev) => [copy, ...prev]);
    setActiveId(copy.id);
  }, [docs, activeId]);

  const remove = useCallback(
    (id: string) => {
      setDocs((prev) => {
        const next = prev.filter((d) => d.id !== id);
        if (id === activeId) setActiveId(next[0]?.id || null);
        return next;
      });
    },
    [activeId]
  );

  const rename = useCallback(
    (name: string) => update((d) => ({ ...d, name })),
    [update]
  );

  const sync = useCallback(() => {
    const snapshot = currentSnapshot();
    if (!snapshot) return; // UI disables Sync until a portfolio is imported
    update((d) => ResumeService.syncFromPortfolio(d, new Date().toISOString(), snapshot));
  }, [update]);

  return {
    docs,
    activeDoc,
    activeId,
    setActiveId,
    update,
    create,
    duplicate,
    remove,
    rename,
    sync,
  };
}
