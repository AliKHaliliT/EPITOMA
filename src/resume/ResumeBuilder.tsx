import { useState } from "react";
import { LazyMotion, domMax } from "framer-motion";
import { LayoutGrid, FileBadge, FileText, Wand2 } from "lucide-react";
import { cn } from "@/resume/lib/utils";
import { useResumes } from "./useResumes";
import { usePortfolio } from "./portfolio/usePortfolio";
import { DocumentBar } from "./DocumentBar";
import { OverviewPanel } from "./OverviewPanel";
import { ContentPanel } from "./ContentPanel";
import { CustomizePanel } from "./CustomizePanel";
import { ResumePreview } from "./preview/ResumePreview";

type WorkspaceTab = "overview" | "content" | "customize";

const TABS: { id: WorkspaceTab; label: string; icon: typeof FileText }[] = [
  { id: "overview", label: "Overview", icon: LayoutGrid },
  { id: "content", label: "Content", icon: FileText },
  { id: "customize", label: "Customize", icon: Wand2 },
];

/**
 * The resume/CV builder: a standalone app routed at /resume (future separate
 * repo; imports nothing from the rest of src/). Content arrives exclusively
 * via an imported portfolio.json (exported from the site's admin). The nested
 * LazyMotion loads domMax: the drag/layout features the builder's Reorder
 * lists need, which the host page's domAnimation set doesn't include.
 */
export const ResumeBuilder = () => {
  const rs = useResumes();
  const portfolio = usePortfolio();
  const [tab, setTab] = useState<WorkspaceTab>("overview");

  const toggleSection = (sectionId: string) =>
    rs.update((d) => ({
      ...d,
      sections: d.sections.map((s) =>
        s.id === sectionId ? { ...s, visible: !s.visible } : s
      ),
    }));

  return (
    <LazyMotion features={domMax} strict>
    <div className="space-y-8 pb-12">
      <div>
        <div className="flex items-center gap-3 mb-2">
          <div className="p-2 bg-[var(--color-background)] rounded-lg">
            <FileBadge size={22} className="text-[var(--color-text-primary)]" />
          </div>
          <h1 className="text-3xl font-bold text-[var(--color-text-primary)]">
            Resume builder
          </h1>
        </div>
        <p className="text-[var(--color-text-secondary)] ml-12">
          Build resumes and CVs from an imported portfolio: export one from Admin → Settings
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
        onSync={rs.sync}
        snapshot={portfolio.snapshot}
        onImportPortfolio={portfolio.importFile}
        onClearPortfolio={portfolio.clear}
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
              <code className="font-mono text-xs">portfolio.json</code>: download it from
              the site's <strong>Admin → Settings → Portfolio export</strong>. You can also
              create a blank document and fill it in by hand.
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
          <div className="grid grid-cols-1 xl:grid-cols-[minmax(0,1fr)_minmax(0,1.1fr)] gap-4">
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
                  onStyleChange={(style) => rs.update((d) => ({ ...d, style }))}
                  sections={rs.activeDoc.sections}
                  onSectionsChange={(sections) => rs.update((d) => ({ ...d, sections }))}
                />
              )}
            </div>

            <div className="min-w-0">
              <div className="xl:sticky xl:top-4">
                <ResumePreview doc={rs.activeDoc} />
              </div>
            </div>
          </div>
        </>
      )}
      </div>
    </div>
    </LazyMotion>
  );
};
