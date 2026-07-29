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
} from "lucide-react";
import { cn } from "@/lib/utils";
import { DocumentKind, ResumeDocument } from "@/types/resume";
import { PortfolioSnapshot } from "@/types/portfolio";
import { DownloadMenu } from "./export/DownloadMenu";
import { ConfirmDialog } from "./components/ConfirmDialog";

interface DocumentBarProps {
  docs: ResumeDocument[];
  activeDoc: ResumeDocument | null;
  onSelect: (id: string) => void;
  onCreate: (kind: DocumentKind) => void;
  onDuplicate: () => void;
  onRemove: (id: string) => void;
  onRename: (name: string) => void;
  onSync: () => void;
  /** The imported portfolio.json: the builder's only content source. */
  snapshot: PortfolioSnapshot | null;
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
  onImportPortfolio,
  onClearPortfolio,
}: DocumentBarProps) => {
  const [docMenu, setDocMenu] = useState(false);
  const [pending, setPending] = useState<null | "forget" | "delete" | "sync">(null);
  const [importError, setImportError] = useState<string | null>(null);
  const [newMenu, setNewMenu] = useState(false);
  const [editingName, setEditingName] = useState(false);
  const [nameDraft, setNameDraft] = useState("");
  const wrapRef = useRef<HTMLDivElement>(null);
  const fileRef = useRef<HTMLInputElement>(null);

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
      {/* Document selector */}
      <div className="relative">
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
        {docMenu && docs.length > 0 && (
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
      <span className="hidden items-center gap-1.5 font-mono text-[10px] uppercase tracking-[0.08em] text-[var(--color-text-secondary)] md:flex">
        {snapshot ? (
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
          {/* Rename */}
          {editingName ? (
            <div className="flex items-center gap-1">
              <input
                autoFocus
                value={nameDraft}
                onChange={(e) => setNameDraft(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && commitRename()}
                className="px-2 py-1.5 bg-[var(--color-input-bg)] border border-[var(--color-border)] rounded-lg text-sm text-[var(--color-text-primary)] w-48"
              />
              <button
                onClick={commitRename}
                className="p-2 text-signal hover:bg-field/10 rounded-lg"
                title="Save name"
              >
                <Check size={15} />
              </button>
            </div>
          ) : (
            <button
              onClick={startRename}
              className="p-2 text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)] hover:bg-[var(--color-background)] rounded-lg"
              title="Rename"
            >
              <Pencil size={15} />
            </button>
          )}

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

          <div className="flex-1" />

          <span className="text-xs text-[var(--color-text-secondary)] hidden sm:block">
            Last synced {relativeDate(activeDoc.lastSyncedAt)}
          </span>
          <button
            onClick={() => setPending("sync")}
            disabled={!snapshot}
            className="flex items-center gap-1.5 px-3 py-2 border border-[var(--color-border)] rounded-lg text-sm font-medium text-[var(--color-text-primary)] hover:bg-[var(--color-background)] disabled:cursor-not-allowed disabled:opacity-45"
            title={
              snapshot
                ? "Sync from the imported portfolio"
                : "Import a portfolio.json first: Sync pulls from it"
            }
          >
            <RefreshCw size={14} /> Sync
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
        message="Synced content is overwritten with the imported portfolio's data. Custom sections, styling, and your show/hide and ordering choices are kept."
        confirmLabel="Sync"
        onConfirm={() => {
          onSync();
          setPending(null);
        }}
        onCancel={() => setPending(null)}
      />
    </div>
  );
};
