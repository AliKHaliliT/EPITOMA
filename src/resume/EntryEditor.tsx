import { useState } from "react";
import { Link2, X } from "lucide-react";
import { ResumeEntry, SectionKind } from "@/resume/types/resume";
import { ResumeRichText } from "./ResumeRichText";

interface EntryEditorProps {
  entry: ResumeEntry;
  kind: SectionKind;
  onChange: (entry: ResumeEntry) => void;
  onClose: () => void;
}

const inputCls =
  "w-full px-3 py-2 bg-[var(--color-input-bg)] border border-[var(--color-border)] rounded-lg text-sm text-[var(--color-text-primary)]";
const labelCls = "text-xs font-medium text-[var(--color-text-secondary)]";

export const EntryEditor = ({ entry, kind, onChange, onClose }: EntryEditorProps) => {
  const [showLink, setShowLink] = useState(!!entry.link);
  const set = (patch: Partial<ResumeEntry>) => onChange({ ...entry, ...patch });
  const setMeta = (patch: Record<string, unknown>) =>
    onChange({ ...entry, meta: { ...entry.meta, ...patch } });

  // Summary / declaration: just a body.
  if (kind === "summary" || kind === "declaration") {
    return (
      <div className="space-y-3 p-4 border border-[var(--color-border)] rounded-lg bg-[var(--color-input-bg)]/40">
        <Field label="Text">
          <ResumeRichText value={entry.description || ""} onChange={(v) => set({ description: v })} />
        </Field>
        <DoneBar onClose={onClose} />
      </div>
    );
  }

  // Skills: a category + comma-separated items.
  if (kind === "skills") {
    const items = (entry.meta?.items as string[] | undefined) || [];
    return (
      <div className="space-y-3 p-4 border border-[var(--color-border)] rounded-lg bg-[var(--color-input-bg)]/40">
        <Field label="Category">
          <input className={inputCls} value={entry.title || ""} onChange={(e) => set({ title: e.target.value })} placeholder="Languages & Frameworks" />
        </Field>
        <Field label="Items (comma-separated)">
          <input
            className={inputCls}
            value={items.join(", ")}
            onChange={(e) => setMeta({ items: e.target.value.split(",").map((s) => s.trim()).filter(Boolean) })}
            placeholder="Python, TypeScript, React"
          />
        </Field>
        <DoneBar onClose={onClose} />
      </div>
    );
  }

  // Languages: language + proficiency.
  if (kind === "languages") {
    return (
      <div className="space-y-3 p-4 border border-[var(--color-border)] rounded-lg bg-[var(--color-input-bg)]/40">
        <div className="grid grid-cols-2 gap-3">
          <Field label="Language">
            <input className={inputCls} value={entry.title || ""} onChange={(e) => set({ title: e.target.value })} placeholder="English" />
          </Field>
          <Field label="Proficiency">
            <input className={inputCls} value={entry.subtitle || ""} onChange={(e) => set({ subtitle: e.target.value })} placeholder="Native" />
          </Field>
        </div>
        <DoneBar onClose={onClose} />
      </div>
    );
  }

  // Interests: title only.
  if (kind === "interests") {
    return (
      <div className="space-y-3 p-4 border border-[var(--color-border)] rounded-lg bg-[var(--color-input-bg)]/40">
        <Field label="Interest">
          <input className={inputCls} value={entry.title || ""} onChange={(e) => set({ title: e.target.value })} placeholder="Photography" />
        </Field>
        <DoneBar onClose={onClose} />
      </div>
    );
  }

  // References: name + role + contact details.
  if (kind === "references") {
    const m = entry.meta || {};
    return (
      <div className="space-y-3 p-4 border border-[var(--color-border)] rounded-lg bg-[var(--color-input-bg)]/40">
        <div className="grid grid-cols-2 gap-3">
          <Field label="Name">
            <input className={inputCls} value={entry.title || ""} onChange={(e) => set({ title: e.target.value })} />
          </Field>
          <Field label="Title / Role">
            <input className={inputCls} value={entry.subtitle || ""} onChange={(e) => set({ subtitle: e.target.value })} />
          </Field>
          <Field label="Organization">
            <input className={inputCls} value={(m.organization as string) || ""} onChange={(e) => setMeta({ organization: e.target.value })} />
          </Field>
          <Field label="Relationship">
            <input className={inputCls} value={(m.relationship as string) || ""} onChange={(e) => setMeta({ relationship: e.target.value })} />
          </Field>
          <Field label="Email">
            <input className={inputCls} value={(m.email as string) || ""} onChange={(e) => setMeta({ email: e.target.value })} />
          </Field>
          <Field label="Phone">
            <input className={inputCls} value={(m.phone as string) || ""} onChange={(e) => setMeta({ phone: e.target.value })} />
          </Field>
        </div>
        <DoneBar onClose={onClose} />
      </div>
    );
  }

  // Blog / garden: title + link + date.
  if (kind === "blog" || kind === "garden") {
    return (
      <div className="space-y-3 p-4 border border-[var(--color-border)] rounded-lg bg-[var(--color-input-bg)]/40">
        <Field label="Title">
          <input className={inputCls} value={entry.title || ""} onChange={(e) => set({ title: e.target.value })} />
        </Field>
        <div className="grid grid-cols-2 gap-3">
          <Field label="Link">
            <input className={inputCls} value={entry.link || ""} onChange={(e) => set({ link: e.target.value })} placeholder="https://…" />
          </Field>
          <Field label="Date">
            <input type="month" className={inputCls} value={entry.startDate || ""} onChange={(e) => set({ startDate: e.target.value })} />
          </Field>
        </div>
        <DoneBar onClose={onClose} />
      </div>
    );
  }

  // Default entry: title (+ link), subtitle, dates, location, description.
  return (
    <div className="space-y-3 p-4 border border-[var(--color-border)] rounded-lg bg-[var(--color-input-bg)]/40">
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <Field label="Title">
          <div className="flex gap-1">
            <input className={inputCls} value={entry.title || ""} onChange={(e) => set({ title: e.target.value })} />
            <button
              onClick={() => setShowLink((v) => !v)}
              title="Add a link"
              className={`px-2.5 rounded-lg border text-sm ${
                showLink || entry.link
                  ? "border-signal text-signal"
                  : "border-[var(--color-border)] text-[var(--color-text-secondary)]"
              }`}
            >
              <Link2 size={15} />
            </button>
          </div>
        </Field>
        <Field label="Subtitle">
          <input className={inputCls} value={entry.subtitle || ""} onChange={(e) => set({ subtitle: e.target.value })} />
        </Field>
      </div>

      {(showLink || entry.link) && (
        <Field label="Link URL">
          <input className={inputCls} value={entry.link || ""} onChange={(e) => set({ link: e.target.value })} placeholder="https://…" />
        </Field>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <Field label="Start date">
          <input type="month" className={inputCls} value={entry.startDate || ""} onChange={(e) => set({ startDate: e.target.value })} />
        </Field>
        <Field label="End date">
          <input type="month" className={inputCls} value={entry.endDate || ""} onChange={(e) => set({ endDate: e.target.value })} />
        </Field>
        <Field label="Location">
          <input className={inputCls} value={entry.location || ""} onChange={(e) => set({ location: e.target.value })} />
        </Field>
      </div>

      <Field label="Description">
        <ResumeRichText value={entry.description || ""} onChange={(v) => set({ description: v })} />
      </Field>

      <DoneBar onClose={onClose} />
    </div>
  );
};

const Field = ({ label, children }: { label: string; children: React.ReactNode }) => (
  <div className="space-y-1">
    <label className={labelCls}>{label}</label>
    {children}
  </div>
);

const DoneBar = ({ onClose }: { onClose: () => void }) => (
  <div className="flex justify-end">
    <button
      onClick={onClose}
      className="flex items-center gap-1.5 px-4 py-1.5 bg-[var(--color-text-primary)] text-[var(--color-background)] rounded-lg text-sm font-medium hover:opacity-90"
    >
      <X size={14} /> Done
    </button>
  </div>
);
