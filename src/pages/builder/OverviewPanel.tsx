import { Eye, EyeOff, CircleCheck, CircleDashed } from "lucide-react";
import { ResumeDocument } from "@/entities/resume";
import { cn } from "@/shared/lib";

interface OverviewPanelProps {
  doc: ResumeDocument;
  onToggleSection: (sectionId: string) => void;
}

const fmt = (iso: string) => {
  const d = new Date(iso);
  return isNaN(d.getTime())
    ? "-"
    : d.toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" });
};

/** The Overview tab: what the document contains, and quick section visibility. */
export const OverviewPanel = ({ doc, onToggleSection }: OverviewPanelProps) => {
  const visibleCount = doc.sections.filter((s) => s.visible).length;
  const entryCount = doc.sections.reduce(
    (n, s) => n + s.entries.filter((e) => !e.hidden).length,
    0
  );

  return (
    <div className="space-y-6">
      {/* Meta */}
      <div className="bg-card border border-line rounded-xl p-5">
        <div className="flex items-center gap-2 mb-3">
          <span className="text-[10px] font-bold uppercase tracking-widest px-2 py-0.5 rounded-full bg-surface text-muted">
            {doc.kind}
          </span>
          <h2 className="font-semibold text-ink">{doc.name}</h2>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-sm">
          <Stat label="Created" value={fmt(doc.createdAt)} />
          <Stat label="Last synced" value={fmt(doc.lastSyncedAt)} />
          <Stat label="Visible sections" value={`${visibleCount} / ${doc.sections.length}`} />
          <Stat label="Visible entries" value={String(entryCount)} />
        </div>
      </div>

      {/* Section checklist */}
      <div className="bg-card border border-line rounded-xl p-5">
        <h3 className="text-xs font-bold uppercase tracking-widest text-muted mb-3">
          Sections
        </h3>
        <div className="space-y-1">
          {doc.sections.map((s) => {
            const count = s.entries.filter((e) => !e.hidden).length;
            const empty = count === 0;
            return (
              <div
                key={s.id}
                className="flex items-center gap-3 px-2 py-2 rounded-lg hover:bg-surface/60"
              >
                {empty ? (
                  <CircleDashed size={15} className="text-muted flex-shrink-0" />
                ) : (
                  <CircleCheck size={15} className="text-signal flex-shrink-0" />
                )}
                <span
                  className={cn(
                    "flex-1 text-sm",
                    s.visible ? "text-ink" : "text-muted line-through"
                  )}
                >
                  {s.heading}
                </span>
                <span className="text-xs text-muted">
                  {count} {count === 1 ? "entry" : "entries"}
                </span>
                <button
                  onClick={() => onToggleSection(s.id)}
                  className="p-1.5 text-muted hover:text-ink rounded-md hover:bg-surface"
                  title={s.visible ? "Hide section" : "Show section"}
                >
                  {s.visible ? <Eye size={14} /> : <EyeOff size={14} />}
                </button>
              </div>
            );
          })}
          {doc.sections.length === 0 && (
            <p className="text-sm text-muted py-4 text-center">
              No sections yet. Add content from the Content tab.
            </p>
          )}
        </div>
      </div>
    </div>
  );
};

const Stat = ({ label, value }: { label: string; value: string }) => (
  <div>
    <p className="text-muted text-xs">{label}</p>
    <p className="text-ink font-medium mt-0.5">{value}</p>
  </div>
);
