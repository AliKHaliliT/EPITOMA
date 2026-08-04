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

export const OverviewPanel = ({ doc, onToggleSection }: OverviewPanelProps) => {
  const visibleCount = doc.sections.filter((s) => s.visible).length;
  const entryCount = doc.sections.reduce(
    (n, s) => n + s.entries.filter((e) => !e.hidden).length,
    0
  );

  return (
    <div className="space-y-6">
      {/* Meta */}
      <div className="bg-[var(--color-card)] border border-[var(--color-border)] rounded-xl p-5">
        <div className="flex items-center gap-2 mb-3">
          <span className="text-[10px] font-bold uppercase tracking-widest px-2 py-0.5 rounded-full bg-[var(--color-background)] text-[var(--color-text-secondary)]">
            {doc.kind}
          </span>
          <h2 className="font-semibold text-[var(--color-text-primary)]">{doc.name}</h2>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-sm">
          <Stat label="Created" value={fmt(doc.createdAt)} />
          <Stat label="Last synced" value={fmt(doc.lastSyncedAt)} />
          <Stat label="Visible sections" value={`${visibleCount} / ${doc.sections.length}`} />
          <Stat label="Visible entries" value={String(entryCount)} />
        </div>
      </div>

      {/* Section checklist */}
      <div className="bg-[var(--color-card)] border border-[var(--color-border)] rounded-xl p-5">
        <h3 className="text-xs font-bold uppercase tracking-widest text-[var(--color-text-secondary)] mb-3">
          Sections
        </h3>
        <div className="space-y-1">
          {doc.sections.map((s) => {
            const count = s.entries.filter((e) => !e.hidden).length;
            const empty = count === 0;
            return (
              <div
                key={s.id}
                className="flex items-center gap-3 px-2 py-2 rounded-lg hover:bg-[var(--color-background)]/60"
              >
                {empty ? (
                  <CircleDashed size={15} className="text-[var(--color-text-secondary)] flex-shrink-0" />
                ) : (
                  <CircleCheck size={15} className="text-signal flex-shrink-0" />
                )}
                <span
                  className={cn(
                    "flex-1 text-sm",
                    s.visible ? "text-[var(--color-text-primary)]" : "text-[var(--color-text-secondary)] line-through"
                  )}
                >
                  {s.heading}
                </span>
                <span className="text-xs text-[var(--color-text-secondary)]">
                  {count} {count === 1 ? "entry" : "entries"}
                </span>
                <button
                  onClick={() => onToggleSection(s.id)}
                  className="p-1.5 text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)] rounded-md hover:bg-[var(--color-background)]"
                  title={s.visible ? "Hide section" : "Show section"}
                >
                  {s.visible ? <Eye size={14} /> : <EyeOff size={14} />}
                </button>
              </div>
            );
          })}
          {doc.sections.length === 0 && (
            <p className="text-sm text-[var(--color-text-secondary)] py-4 text-center">
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
    <p className="text-[var(--color-text-secondary)] text-xs">{label}</p>
    <p className="text-[var(--color-text-primary)] font-medium mt-0.5">{value}</p>
  </div>
);
