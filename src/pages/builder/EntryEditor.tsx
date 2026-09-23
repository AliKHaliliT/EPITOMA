import { useState, type Dispatch, type SetStateAction } from "react";
import { Link2, X } from "lucide-react";
import { ResumeEntry, SectionKind } from "@/entities/resume";
import { MonthField, ResumeRichText } from "@/shared/ui";

interface EntryEditorProps {
  entry: ResumeEntry;
  kind: SectionKind;
  onChange: (entry: ResumeEntry) => void;
  onClose: () => void;
}

const inputCls =
  "w-full px-3 py-2 bg-well border border-line rounded-lg text-sm text-ink";
const labelCls = "text-xs font-medium text-muted";

/** The entry, its two writers, and the link toggle, as every kind's form reads them. */
interface FormParts {
  entry: ResumeEntry;
  set: (patch: Partial<ResumeEntry>) => void;
  setMeta: (patch: Record<string, unknown>) => void;
  onClose: () => void;
  showLink: boolean;
  setShowLink: Dispatch<SetStateAction<boolean>>;
}

/** The editor for one entry, showing the fields its section kind actually uses. */
export const EntryEditor = ({ entry, kind, onChange, onClose }: EntryEditorProps) => {
  const [showLink, setShowLink] = useState(!!entry.link);
  const set = (patch: Partial<ResumeEntry>) => onChange({ ...entry, ...patch });
  const setMeta = (patch: Record<string, unknown>) =>
    onChange({ ...entry, meta: { ...entry.meta, ...patch } });

  const form = KIND_FORMS.get(kind) ?? entryForm;
  return form({ entry, set, setMeta, onClose, showLink, setShowLink });
};

// Summary / declaration: just a body.
function bodyForm({ entry, set, onClose }: FormParts) {
  return (
    <div className="space-y-3 p-4 border border-line rounded-lg bg-well/40">
      <Field label="Text">
        <ResumeRichText value={entry.description || ""} onChange={(v) => set({ description: v })} />
      </Field>
      <DoneBar onClose={onClose} />
    </div>
  );
}

// Skills: a category + comma-separated items.
function skillsForm({ entry, set, setMeta, onClose }: FormParts) {
  const items = (entry.meta?.items as string[] | undefined) || [];
  return (
    <div className="space-y-3 p-4 border border-line rounded-lg bg-well/40">
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
function languagesForm({ entry, set, onClose }: FormParts) {
  return (
    <div className="space-y-3 p-4 border border-line rounded-lg bg-well/40">
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
function interestsForm({ entry, set, onClose }: FormParts) {
  return (
    <div className="space-y-3 p-4 border border-line rounded-lg bg-well/40">
      <Field label="Interest">
        <input className={inputCls} value={entry.title || ""} onChange={(e) => set({ title: e.target.value })} placeholder="Photography" />
      </Field>
      <DoneBar onClose={onClose} />
    </div>
  );
}

// References: name + role + contact details.
function referencesForm({ entry, set, setMeta, onClose }: FormParts) {
  const m = entry.meta || {};
  return (
    <div className="space-y-3 p-4 border border-line rounded-lg bg-well/40">
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
function linkedForm({ entry, set, onClose }: FormParts) {
  return (
    <div className="space-y-3 p-4 border border-line rounded-lg bg-well/40">
      <Field label="Title">
        <input className={inputCls} value={entry.title || ""} onChange={(e) => set({ title: e.target.value })} />
      </Field>
      <div className="grid grid-cols-2 gap-3">
        <Field label="Link">
          <input className={inputCls} value={entry.link || ""} onChange={(e) => set({ link: e.target.value })} placeholder="https://…" />
        </Field>
        <Field label="Date">
          <MonthField label="Date" value={entry.startDate || ""} onChange={(v) => set({ startDate: v })} />
        </Field>
      </div>
      <DoneBar onClose={onClose} />
    </div>
  );
}

// The title with its link toggle, beside the subtitle.
function titleRow({ entry, set, showLink, setShowLink }: FormParts) {
  return (
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
                : "border-line text-muted"
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
  );
}

// Default entry: title (+ link), subtitle, dates, location, description.
function entryForm(parts: FormParts) {
  const { entry, set, onClose, showLink } = parts;
  return (
    <div className="space-y-3 p-4 border border-line rounded-lg bg-well/40">
      {titleRow(parts)}

      {(showLink || entry.link) && (
        <Field label="Link URL">
          <input className={inputCls} value={entry.link || ""} onChange={(e) => set({ link: e.target.value })} placeholder="https://…" />
        </Field>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <Field label="Start date">
          <MonthField label="Start date" value={entry.startDate || ""} onChange={(v) => set({ startDate: v })} />
        </Field>
        <Field label="End date">
          <MonthField label="End date" value={entry.endDate || ""} onChange={(v) => set({ endDate: v })} />
        </Field>
      </div>

      <Field label="Location">
        <input className={inputCls} value={entry.location || ""} onChange={(e) => set({ location: e.target.value })} />
      </Field>

      <Field label="Description">
        <ResumeRichText value={entry.description || ""} onChange={(v) => set({ description: v })} />
      </Field>

      <DoneBar onClose={onClose} />
    </div>
  );
}

// The kinds with a form of their own; every other kind gets the default entry form.
const KIND_FORMS = new Map<string, (parts: FormParts) => React.ReactNode>([
  ["summary", bodyForm],
  ["declaration", bodyForm],
  ["skills", skillsForm],
  ["languages", languagesForm],
  ["interests", interestsForm],
  ["references", referencesForm],
  ["blog", linkedForm],
  ["garden", linkedForm],
]);

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
      className="flex items-center gap-1.5 px-4 py-1.5 bg-ink text-surface rounded-lg text-sm font-medium hover:opacity-90"
    >
      <X size={14} /> Done
    </button>
  </div>
);
