import { useMemo, useState } from "react";
import { LayoutGrid, FileText, Wand2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { isResumeDocumentFile } from "@/types/resume";
import { sampleDocument } from "@/lib/resumeDefaults";
import { useResumes } from "./useResumes";
import { usePortfolio } from "./portfolio/usePortfolio";
import { DocumentBar } from "./DocumentBar";
import { OverviewPanel } from "./OverviewPanel";
import { ContentPanel } from "./ContentPanel";
import { CustomizePanel } from "./CustomizePanel";
import { ResumePreview } from "./preview/ResumePreview";

type WorkspaceTab = "overview" | "content" | "customize";

/** EPITOMA's pixel mark: VITA's 3×2 mosaic read as a sheet of paper, its
 *  top-right cell dog-eared like a folded page corner (matches favicon.svg). */
const BrandMark = () => (
  <svg viewBox="0 0 32 32" className="h-9 w-9 text-[var(--color-text-primary)]" aria-hidden="true">
    <rect x="2.5" y="7.5" width="7.5" height="7.5" fill="currentColor" />
    <rect x="12.25" y="7.5" width="7.5" height="7.5" fill="#ff6b2e" />
    <path d="M22 7.5 L29.5 15 L22 15 Z" fill="currentColor" />
    <rect x="2.5" y="17" width="7.5" height="7.5" fill="currentColor" />
    <rect x="12.25" y="17" width="7.5" height="7.5" fill="currentColor" />
    <rect x="22" y="17" width="7.5" height="7.5" fill="#7fb5c9" />
  </svg>
);

const TABS: { id: WorkspaceTab; label: string; icon: typeof FileText }[] = [
  { id: "overview", label: "Overview", icon: LayoutGrid },
  { id: "content", label: "Content", icon: FileText },
  { id: "customize", label: "Customize", icon: Wand2 },
];

/**
 * The resume/CV builder, the whole of this app. Content arrives exclusively
 * via an imported portfolio.json (exported from the admin panel); the motion
 * runtime (domMax, for the Reorder drag lists) is provided by the App shell.
 */
export const ResumeBuilder = () => {
  const rs = useResumes();
  const portfolio = usePortfolio();
  const [tab, setTab] = useState<WorkspaceTab>("overview");
  // Sample mode: the live preview typesets the fixed sample document with
  // the CURRENT style, so templates can be judged full-size without the
  // real record in the way. View-only; the document is never touched.
  const [sampleMode, setSampleMode] = useState(false);
  // The sample adopts the real document's STRUCTURE (order, visibility,
  // section layouts, sidebar regions) so the Layout and Sections panes act on
  // what the sheet shows; only the content is fixed.
  const previewDoc = useMemo(
    () => (sampleMode && rs.activeDoc ? sampleDocument(rs.activeDoc.style, rs.activeDoc.sections) : rs.activeDoc),
    [sampleMode, rs.activeDoc]
  );

  // One Import button, two file kinds: a portfolio.json feeds content, an
  // exported document (.json) comes back as a new document with its styling
  // intact. Routed by shape, so no extra UI is needed.
  const handleImportFile = async (file: File) => {
    const text = await file.text();
    let parsed: unknown = null;
    try {
      parsed = JSON.parse(text);
    } catch {
      // fall through: the portfolio importer reports the JSON error
    }
    if (isResumeDocumentFile(parsed)) {
      rs.importDoc(parsed);
      return;
    }
    await portfolio.importText(text);
  };

  // Sync: with a repo connected, refresh the snapshot from it first so the
  // document is brought up to the repo's head, not last import's state.
  const handleSync = async () => {
    if (portfolio.repoRef) await portfolio.refreshFromRepo();
    rs.sync();
  };

  const toggleSection = (sectionId: string) =>
    rs.update((d) => ({
      ...d,
      sections: d.sections.map((s) =>
        s.id === sectionId ? { ...s, visible: !s.visible } : s
      ),
    }));

  return (
    <div className="space-y-8 pb-12">
      <div>
        <div className="flex items-center gap-3 mb-2">
          <BrandMark />
          <h1 className="text-3xl font-bold tracking-[0.06em] text-[var(--color-text-primary)]">
            EPITOMA
          </h1>
        </div>
        <p className="text-[var(--color-text-secondary)] ml-12">
          The resume builder: resumes and CVs typeset from a VITA portfolio
        </p>
      </div>

      <div className="space-y-4">
      <DocumentBar
        docs={rs.docs}
        activeDoc={rs.activeDoc}
        onSelect={rs.setActiveId}
        onCreate={rs.create}
        onDuplicate={rs.duplicate}
        onRemove={rs.remove}
        onRename={rs.rename}
        onSync={handleSync}
        snapshot={portfolio.snapshot}
        repoRef={portfolio.repoRef}
        onConnectRepo={portfolio.connectRepo}
        onDisconnectRepo={portfolio.disconnectRepo}
        onImportPortfolio={handleImportFile}
        onClearPortfolio={portfolio.clear}
        exportDoc={previewDoc}
      />

      {!rs.activeDoc ? (
        <div className="text-center py-20 bg-[var(--color-card)] border border-[var(--color-border)] rounded-xl">
          <p className="text-4xl mb-3">📄</p>
          <p className="font-medium text-[var(--color-text-primary)]">No documents yet.</p>
          {portfolio.snapshot ? (
            <p className="text-sm text-[var(--color-text-secondary)] mt-1">
              Click <strong>New</strong> to build a Resume or CV from your imported portfolio.
            </p>
          ) : (
            <p className="text-sm text-[var(--color-text-secondary)] mt-1 max-w-md mx-auto">
              Start by clicking <strong>Import</strong> above and choosing a{" "}
              <code className="font-mono text-xs">portfolio.json</code> from the admin
              panel, or <strong>Repo</strong> to pull straight from a public VITA
              repository. A blank document works too, filled in by hand.
            </p>
          )}
        </div>
      ) : (
        <>
          {/* Workspace tabs */}
          <div className="flex flex-wrap items-center gap-2">
            {TABS.map((t) => (
              <button
                key={t.id}
                onClick={() => setTab(t.id)}
                className={cn(
                  "flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors whitespace-nowrap",
                  tab === t.id
                    ? "bg-[var(--color-text-primary)] text-[var(--color-background)]"
                    : "bg-[var(--color-card)] border border-[var(--color-border)] text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)]"
                )}
              >
                <t.icon size={15} />
                {t.label}
              </button>
            ))}
          </div>

          {/* Split: editor + persistent preview */}
          <div className="grid grid-cols-1 xl:grid-cols-[minmax(0,2fr)_minmax(0,3fr)] gap-4">
            <div className="min-w-0">
              {tab === "overview" && (
                <OverviewPanel doc={rs.activeDoc} onToggleSection={toggleSection} />
              )}
              {tab === "content" && (
                <ContentPanel doc={rs.activeDoc} update={rs.update} />
              )}
              {tab === "customize" && (
                <CustomizePanel
                  style={rs.activeDoc.style}
                  docKind={rs.activeDoc.kind}
                  onStyleChange={(style) => rs.update((d) => ({ ...d, style }))}
                  sections={rs.activeDoc.sections}
                  onSectionsChange={(sections) => rs.update((d) => ({ ...d, sections }))}
                  sampleMode={sampleMode}
                  onSampleModeChange={setSampleMode}
                />
              )}
            </div>

            <div className="min-w-0">
              <div className="xl:sticky xl:top-4">
                <ResumePreview doc={previewDoc ?? rs.activeDoc} sample={sampleMode} onExitSample={() => setSampleMode(false)} />
              </div>
            </div>
          </div>
        </>
      )}
      </div>
    </div>
  );
};
