// Point the builder at a public VITA repository. Read-only by design: the
// builder only ever fetches seed files, so unlike the admin panel there is
// no token to paste and nothing here can write to the repo.

import { useEffect, useState } from "react";
import { m, AnimatePresence } from "framer-motion";
import { BookMarked, Loader2, Unlink } from "lucide-react";
import type { RepoRef } from "@/entities/portfolio";

const INPUT =
  "w-full px-3 py-2 bg-well border border-line rounded-lg text-sm text-ink outline-none focus:border-signal";

interface RepoDialogProps {
  open: boolean;
  repoRef: RepoRef | null;
  onConnect: (ref: RepoRef) => Promise<unknown>;
  onDisconnect: () => void;
  onClose: () => void;
}

/** The form mounts fresh each time the dialog opens (AnimatePresence unmounts
 *  it when closed), so its state initializers pick the connection up cleanly. */
const RepoForm = ({ repoRef, onConnect, onDisconnect, onClose }: Omit<RepoDialogProps, "open">) => {
  const [owner, setOwner] = useState(repoRef?.owner ?? "");
  const [repo, setRepo] = useState(repoRef?.repo ?? "");
  const [branch, setBranch] = useState(repoRef?.branch ?? "main");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [onClose]);

  const connect = async () => {
    if (!owner.trim() || !repo.trim() || !branch.trim() || busy) return;
    setBusy(true);
    setError(null);
    try {
      await onConnect({ owner: owner.trim(), repo: repo.trim(), branch: branch.trim() });
      onClose();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Could not reach the repository.");
    } finally {
      setBusy(false);
    }
  };

  return (
    <m.div
      role="dialog"
      aria-modal="true"
      aria-label="Connect a portfolio repository"
      initial={{ opacity: 0, scale: 0.96, y: 8 }}
      animate={{ opacity: 1, scale: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.96, y: 8 }}
      transition={{ duration: 0.16, ease: [0.2, 0.7, 0.2, 1] }}
      className="w-full max-w-sm rounded-xl border border-line bg-card p-6 shadow-xl"
      onClick={(e) => e.stopPropagation()}
    >
            <p className="m-0 mb-2 flex items-center gap-1.5 font-mono text-[10.5px] font-medium uppercase tracking-[0.14em] text-muted">
              <BookMarked size={12} /> Portfolio repository
            </p>
            <h2 className="m-0 mb-2 font-serif text-lg font-semibold leading-snug text-ink">
              {repoRef ? "Connected repository" : "Connect a repository"}
            </h2>
            <p className="m-0 mb-4 text-sm leading-relaxed text-muted">
              Point at a public VITA site repository and Sync pulls the profile and
              content straight from it. Read-only, so no token is needed.
            </p>

            <div className="space-y-3">
              <div className="grid grid-cols-2 gap-2">
                <div className="space-y-1">
                  <label className="block font-mono text-[10px] uppercase tracking-[0.12em] text-muted" htmlFor="repo-owner">Owner</label>
                  <input id="repo-owner" className={INPUT} value={owner} onChange={(e) => setOwner(e.target.value)} placeholder="username" />
                </div>
                <div className="space-y-1">
                  <label className="block font-mono text-[10px] uppercase tracking-[0.12em] text-muted" htmlFor="repo-name">Repository</label>
                  <input id="repo-name" className={INPUT} value={repo} onChange={(e) => setRepo(e.target.value)} placeholder="my-site" />
                </div>
              </div>
              <div className="space-y-1">
                <label className="block font-mono text-[10px] uppercase tracking-[0.12em] text-muted" htmlFor="repo-branch">Branch</label>
                <input id="repo-branch" className={INPUT} value={branch} onChange={(e) => setBranch(e.target.value)} placeholder="main" />
              </div>
            </div>

            {error && (
              <p role="alert" className="m-0 mt-3 rounded-lg border border-red-300 bg-red-50 px-3 py-2 text-sm text-red-700 dark:border-red-900 dark:bg-red-900/20 dark:text-red-400">
                {error}
              </p>
            )}

            <div className="mt-5 flex items-center justify-end gap-2">
              {repoRef && (
                <button
                  onClick={() => {
                    onDisconnect();
                    onClose();
                  }}
                  className="mr-auto flex items-center gap-1.5 rounded-full border border-line px-4 py-2 text-sm font-medium text-muted transition-colors hover:border-red-400 hover:text-red-600"
                >
                  <Unlink size={13} /> Disconnect
                </button>
              )}
              <button
                onClick={onClose}
                className="rounded-full border border-line px-4 py-2 text-sm font-medium text-muted transition-colors hover:text-ink"
              >
                Cancel
              </button>
              <button
                onClick={connect}
                disabled={busy || !owner.trim() || !repo.trim() || !branch.trim()}
                className="flex items-center gap-1.5 rounded-full bg-ink px-4 py-2 text-sm font-medium text-surface transition-opacity hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-45"
              >
                {busy && <Loader2 size={13} className="animate-spin" />}
                {busy ? "Fetching…" : repoRef ? "Reconnect" : "Connect & fetch"}
              </button>
            </div>
    </m.div>
  );
};

/** The dialog for pointing the builder at a site repository to read seeds from. */
export const RepoConnectDialog = ({ open, repoRef, onConnect, onDisconnect, onClose }: RepoDialogProps) => (
  <AnimatePresence>
    {open && (
      <m.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.15 }}
        className="fixed inset-0 z-[60] flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm"
        onClick={onClose}
      >
        <RepoForm repoRef={repoRef} onConnect={onConnect} onDisconnect={onDisconnect} onClose={onClose} />
      </m.div>
    )}
  </AnimatePresence>
);
