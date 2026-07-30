import { useState, useRef, useEffect } from "react";
import {
  ChevronDown,
  Plus,
  Copy,
  Trash2,
  RefreshCw,
  Pencil,
  Check,
  FileText,
  FileBadge,
  Upload,
  X,
  BookMarked,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { DocumentKind, ResumeDocument } from "@/types/resume";
import { PortfolioSnapshot } from "@/types/portfolio";
import type { RepoRef } from "./portfolio/repoSource";
import { DownloadMenu } from "./export/DownloadMenu";
import { ConfirmDialog } from "./components/ConfirmDialog";
import { RepoConnectDialog } from "./components/RepoConnectDialog";

interface DocumentBarProps {
  docs: ResumeDocument[];
  activeDoc: ResumeDocument | null;
  onSelect: (id: string) => void;
  onCreate: (kind: DocumentKind) => void;
  onDuplicate: () => void;
  onRemove: (id: string) => void;
  onRename: (name: string) => void;
  /** With a repo connected this refetches first, so it can take a moment
   *  and it can fail; the bar owns the busy state and the error strip. */
  onSync: () => Promise<unknown>;
  /** The portfolio snapshot: the builder's only content source. */
  snapshot: PortfolioSnapshot | null;
  /** The public VITA repo Sync refreshes from, when one is connected. */
  repoRef: RepoRef | null;
  onConnectRepo: (ref: RepoRef) => Promise<unknown>;
  onDisconnectRepo: () => void;
  /** Handles both file kinds: a portfolio.json (content) and an exported
   *  document .json (comes back as a new document, styling intact). */
  onImportPortfolio: (file: File) => Promise<unknown>;
  onClearPortfolio: () => void;
}

const relativeDate = (iso: string) => {
  const d = new Date(iso);
  if (isNaN(d.getTime())) return "never";
  return d.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
};

export const DocumentBar = ({
  docs,
  activeDoc,
  onSelect,
  onCreate,
  onDuplicate,
  onRemove,
  onRename,
  onSync,
  snapshot,
  repoRef,
  onConnectRepo,
  onDisconnectRepo,
  onImportPortfolio,
  onClearPortfolio,
}: DocumentBarProps) => {
  const [docMenu, setDocMenu] = useState(false);
  const [pending, setPending] = useState<null | "forget" | "delete" | "sync">(null);
  const [importError, setImportError] = useState<string | null>(null);
  const [newMenu, setNewMenu] = useState(false);
  const [editingName, setEditingName] = useState(false);
  const [nameDraft, setNameDraft] = useState("");
  const [repoDialog, setRepoDialog] = useState(false);
  const [syncing, setSyncing] = useState(false);
  const wrapRef = useRef<HTMLDivElement>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  const runSync = async () => {
    setSyncing(true);
    setImportError(null);
    try {
      await onSync();
    } catch (e) {
      setImportError(e instanceof Error ? e.message : "Sync failed.");
    } finally {
      setSyncing(false);
    }
  };

  const handleImportFile = async (file: File | undefined) => {
    if (!file) return;
    try {
      await onImportPortfolio(file);
    } catch (e) {
      setImportError(e instanceof Error ? e.message : "Import failed.");
    } finally {
      if (fileRef.current) fileRef.current.value = "";
    }
  };

  useEffect(() => {
    const onClick = (e: MouseEvent) => {
      if (wrapRef.current && !wrapRef.current.contains(e.target as Node)) {
        setDocMenu(false);
        setNewMenu(false);
      }
    };
    document.addEventListener("mousedown", onClick);
    return () => document.removeEventListener("mousedown", onClick);
  }, []);

  const startRename = () => {
    if (!activeDoc) return;
    setNameDraft(activeDoc.name);
    setEditingName(true);
  };
  const commitRename = () => {
    if (nameDraft.trim()) onRename(nameDraft.trim());
    setEditingName(false);
  };

  return (
    <div
      ref={wrapRef}
      className="flex flex-wrap items-center gap-3 p-3 bg-[var(--color-card)] border border-[var(--color-border)] rounded-xl"
    >
      {/* Document selector; renaming happens right here, in place of the
          name it changes. */}
      <div className="relative">
        {editingName ? (
          <span className="flex min-w-[200px] items-center gap-1">
            <input
              autoFocus
              value={nameDraft}
              onChange={(e) => setNameDraft(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") commitRename();
                if (e.key === "Escape") setEditingName(false);
              }}
              aria-label="Document name"
              className="w-52 rounded-lg border border-signal bg-[var(--color-input-bg)] px-3 py-2 text-sm font-medium text-[var(--color-text-primary)] outline-none"
            />
            <button onClick={commitRename} className="p-2 text-signal hover:bg-field/10 rounded-lg" title="Save name (Enter)">
              <Check size={15} />
            </button>
            <button onClick={() => setEditingName(false)} className="p-2 text-[var(--color-text-secondary)] hover:text-red-500 rounded-lg" title="Cancel (Esc)">
              <X size={15} />
            </button>
          </span>
        ) : (
        <button
          onClick={() => setDocMenu((v) => !v)}
          className="flex items-center gap-2 px-3 py-2 bg-[var(--color-input-bg)] border border-[var(--color-border)] rounded-lg text-sm font-medium text-[var(--color-text-primary)] min-w-[200px]"
        >
          {activeDoc?.kind === "cv" ? <FileBadge size={15} /> : <FileText size={15} />}
          <span className="flex-1 text-left truncate">
            {activeDoc ? activeDoc.name : "No documents"}
          </span>
          <ChevronDown size={15} className="text-[var(--color-text-secondary)]" />
        </button>
        )}
        {!editingName && docMenu && docs.length > 0 && (
          <div className="absolute z-20 mt-1 w-full bg-[var(--color-card)] border border-[var(--color-border)] rounded-lg shadow-lg max-h-72 overflow-y-auto py-1">
            {docs.map((d) => (
              <button
                key={d.id}
                onClick={() => {
                  onSelect(d.id);
                  setDocMenu(false);
                }}
                className={cn(
                  "flex items-center gap-2 w-full px-3 py-2 text-sm text-left hover:bg-[var(--color-background)]",
                  d.id === activeDoc?.id
                    ? "text-[var(--color-text-primary)] font-medium"
                    : "text-[var(--color-text-secondary)]"
                )}
              >
                {d.kind === "cv" ? <FileBadge size={14} /> : <FileText size={14} />}
                <span className="flex-1 truncate">{d.name}</span>
                <span className="text-[10px] uppercase tracking-wide opacity-60">{d.kind}</span>
              </button>
            ))}
          </div>
        )}
      </div>

      {/* New ▾ */}
      <div className="relative">
        <button
          onClick={() => setNewMenu((v) => !v)}
          className="flex items-center gap-1.5 px-3 py-2 bg-[var(--color-text-primary)] text-[var(--color-background)] rounded-lg text-sm font-medium hover:opacity-90"
        >
          <Plus size={15} /> New <ChevronDown size={13} />
        </button>
        {newMenu && (
          <div className="absolute z-20 mt-1 w-44 bg-[var(--color-card)] border border-[var(--color-border)] rounded-lg shadow-lg py-1">
            <button
              onClick={() => {
                onCreate("resume");
                setNewMenu(false);
              }}
              className="flex items-center gap-2 w-full px-3 py-2 text-sm text-left text-[var(--color-text-primary)] hover:bg-[var(--color-background)]"
            >
              <FileText size={14} /> New Resume
            </button>
            <button
              onClick={() => {
                onCreate("cv");
                setNewMenu(false);
              }}
              className="flex items-center gap-2 w-full px-3 py-2 text-sm text-left text-[var(--color-text-primary)] hover:bg-[var(--color-background)]"
            >
              <FileBadge size={14} /> New CV
            </button>
          </div>
        )}
      </div>

      {/* Portfolio source: the imported portfolio.json feeds New + Sync. */}
      <input
        ref={fileRef}
        type="file"
        accept=".json,application/json"
        className="hidden"
        onChange={(e) => handleImportFile(e.target.files?.[0] ?? undefined)}
      />
      <button
        onClick={() => fileRef.current?.click()}
        className="flex items-center gap-1.5 px-3 py-2 border border-[var(--color-border)] rounded-lg text-sm font-medium text-[var(--color-text-primary)] hover:bg-[var(--color-background)]"
        title="Import a portfolio.json from the admin panel, or bring back an exported document (.json)"
      >
        <Upload size={14} /> Import
      </button>
      <button
        onClick={() => setRepoDialog(true)}
        className={cn(
          "flex items-center gap-1.5 px-3 py-2 border rounded-lg text-sm font-medium hover:bg-[var(--color-background)]",
          repoRef
            ? "border-signal/50 text-[var(--color-text-primary)]"
            : "border-[var(--color-border)] text-[var(--color-text-primary)]"
        )}
        title={
          repoRef
            ? `Connected to ${repoRef.owner}/${repoRef.repo}; Sync refreshes from it`
            : "Connect a public VITA repository as the content source (read-only, no token)"
        }
      >
        <BookMarked size={14} className={repoRef ? "text-signal" : undefined} /> Repo
      </button>
      <span className="hidden items-center gap-1.5 font-mono text-[10px] uppercase tracking-[0.08em] text-[var(--color-text-secondary)] md:flex">
        {repoRef ? (
          <span className="max-w-44 truncate" title={`${repoRef.owner}/${repoRef.repo}@${repoRef.branch}`}>
            {repoRef.owner}/{repoRef.repo}
          </span>
        ) : snapshot ? (
          <>
            Portfolio · {relativeDate(snapshot.exportedAt)}
            <button
              onClick={() => setPending("forget")}
              className="p-0.5 hover:text-red-600"
              title="Forget imported portfolio"
              aria-label="Forget imported portfolio"
            >
              <X size={11} />
            </button>
          </>
        ) : (
          "No portfolio"
        )}
      </span>

      {activeDoc && (
        <>
          {/* While renaming, the input replaces the selector itself; the
              action cluster hides so nothing can act on a half-renamed
              document. */}
          {!editingName && (
            <>
              <button
                onClick={startRename}
                className="p-2 text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)] hover:bg-[var(--color-background)] rounded-lg"
                title="Rename"
              >
                <Pencil size={15} />
              </button>
              <button
                onClick={onDuplicate}
                className="p-2 text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)] hover:bg-[var(--color-background)] rounded-lg"
                title="Duplicate"
              >
                <Copy size={15} />
              </button>
              <button
                onClick={() => setPending("delete")}
                className="p-2 text-[var(--color-text-secondary)] hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg"
                title="Delete"
              >
                <Trash2 size={15} />
              </button>
            </>
          )}

          <div className="flex-1" />

          <span className="text-xs text-[var(--color-text-secondary)] hidden sm:block">
            Last synced {relativeDate(activeDoc.lastSyncedAt)}
          </span>
          <button
            onClick={() => setPending("sync")}
            disabled={(!snapshot && !repoRef) || syncing}
            className="flex items-center gap-1.5 px-3 py-2 border border-[var(--color-border)] rounded-lg text-sm font-medium text-[var(--color-text-primary)] hover:bg-[var(--color-background)] disabled:cursor-not-allowed disabled:opacity-45"
            title={
              repoRef
                ? `Fetch the latest from ${repoRef.owner}/${repoRef.repo}, then sync this document`
                : snapshot
                ? "Sync from the imported portfolio"
                : "Import a portfolio.json or connect a repo first: Sync pulls from it"
            }
          >
            <RefreshCw size={14} className={syncing ? "animate-spin" : undefined} />
            {syncing ? "Syncing…" : "Sync"}
          </button>
          <DownloadMenu doc={activeDoc} />
        </>
      )}

      {importError && (
        <p
          role="alert"
          className="m-0 flex w-full items-center justify-between gap-3 rounded-lg border border-red-300 bg-red-50 px-3 py-2 text-sm text-red-700 dark:border-red-900 dark:bg-red-900/20 dark:text-red-400"
        >
          {importError}
          <button
            onClick={() => setImportError(null)}
            aria-label="Dismiss"
            className="font-mono text-[10px] uppercase tracking-[0.08em] hover:opacity-70"
          >
            Dismiss
          </button>
        </p>
      )}

      <ConfirmDialog
        open={pending === "forget"}
        title="Forget the imported portfolio?"
        message="Existing documents keep their content, but Sync and new documents will need a fresh import."
        confirmLabel="Forget"
        danger
        onConfirm={() => {
          onClearPortfolio();
          setPending(null);
        }}
        onCancel={() => setPending(null)}
      />
      <ConfirmDialog
        open={pending === "delete"}
        title={activeDoc ? `Delete "${activeDoc.name}"?` : "Delete this document?"}
        message="The document and its local edits are removed. This cannot be undone."
        confirmLabel="Delete"
        danger
        onConfirm={() => {
          if (activeDoc) onRemove(activeDoc.id);
          setPending(null);
        }}
        onCancel={() => setPending(null)}
      />
      <ConfirmDialog
        open={pending === "sync"}
        title="Sync from the portfolio?"
        message={
          repoRef
            ? `The latest content is fetched from ${repoRef.owner}/${repoRef.repo} and synced sections are updated from it. Custom sections, styling, and your show/hide and ordering choices are kept.`
            : "Synced content is overwritten with the imported portfolio's data. Custom sections, styling, and your show/hide and ordering choices are kept."
        }
        confirmLabel="Sync"
        onConfirm={() => {
          setPending(null);
          void runSync();
        }}
        onCancel={() => setPending(null)}
      />
      <RepoConnectDialog
        open={repoDialog}
        repoRef={repoRef}
        onConnect={onConnectRepo}
        onDisconnect={onDisconnectRepo}
        onClose={() => setRepoDialog(false)}
      />
    </div>
  );
};
