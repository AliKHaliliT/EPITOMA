import { useState } from "react";
import { Plus, X, ChevronDown, ChevronUp } from "lucide-react";
import { PersonalDetails, PersonalLink } from "@/entities/resume";

interface PersonalDetailsEditorProps {
  personal: PersonalDetails;
  onChange: (personal: PersonalDetails) => void;
}

const inputCls =
  "w-full px-3 py-2 bg-[var(--color-input-bg)] border border-[var(--color-border)] rounded-lg text-sm text-[var(--color-text-primary)]";
const labelCls = "text-xs font-medium text-[var(--color-text-secondary)]";

// Detail chips. Site-derived ones prefill on sync; the rest are document-local.
const BASIC_CHIPS = ["Nationality", "Date of Birth", "Availability", "Work Mode"];
const MORE_CHIPS = ["Gender / Pronouns", "Visa", "Passport / ID", "Disability", "Expected Salary"];

export const PersonalDetailsEditor = ({ personal, onChange }: PersonalDetailsEditorProps) => {
  const [showMore, setShowMore] = useState(false);
  const set = (patch: Partial<PersonalDetails>) => onChange({ ...personal, ...patch });

  const extra = personal.extra || {};
  const setExtra = (key: string, value: string) => set({ extra: { ...extra, [key]: value } });
  const addChip = (key: string) => set({ extra: { ...extra, [key]: "" } });
  const removeChip = (key: string) => {
    const next = { ...extra };
    delete next[key];
    set({ extra: next });
  };

  const links = personal.links || [];
  const setLink = (idx: number, patch: Partial<PersonalLink>) =>
    set({ links: links.map((l, i) => (i === idx ? { ...l, ...patch } : l)) });
  const addLink = () =>
    set({ links: [...links, { id: crypto.randomUUID(), label: "Link", url: "", icon: "Link2" }] });
  const removeLink = (idx: number) => set({ links: links.filter((_, i) => i !== idx) });

  const availableChips = [...BASIC_CHIPS, ...(showMore ? MORE_CHIPS : [])].filter(
    (c) => !(c in extra)
  );

  return (
    <div className="space-y-5 border-t border-[var(--color-border)] pt-4 mt-2">
      {/* Basic fields */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <Field label="Full name">
          <input className={inputCls} value={personal.name || ""} onChange={(e) => set({ name: e.target.value })} />
        </Field>
        <Field label="Professional title">
          <input className={inputCls} value={personal.title || ""} onChange={(e) => set({ title: e.target.value })} />
        </Field>
        <Field label="Location">
          <input className={inputCls} value={personal.location || ""} onChange={(e) => set({ location: e.target.value })} />
        </Field>
        <Field label="Phone">
          <input className={inputCls} value={personal.phone || ""} onChange={(e) => set({ phone: e.target.value })} />
        </Field>
        <Field label="Email">
          <input className={inputCls} value={personal.email || ""} onChange={(e) => set({ email: e.target.value })} />
        </Field>
        <Field label="Photo URL">
          <input className={inputCls} value={personal.photo || ""} onChange={(e) => set({ photo: e.target.value })} placeholder="https://…" />
        </Field>
      </div>

      {/* Links */}
      <div className="space-y-2">
        <label className={labelCls}>Profile links</label>
        {links.map((l, i) => (
          <div key={l.id ?? i} className="flex gap-2">
            <input
              className={inputCls + " max-w-[140px]"}
              value={l.label}
              onChange={(e) => setLink(i, { label: e.target.value })}
              placeholder="Label"
            />
            <input
              className={inputCls}
              value={l.url}
              onChange={(e) => setLink(i, { url: e.target.value })}
              placeholder="https://…"
            />
            <button onClick={() => removeLink(i)} className="p-2 text-[var(--color-text-secondary)] hover:text-red-600 rounded-lg" title="Remove">
              <X size={15} />
            </button>
          </div>
        ))}
        <button
          onClick={addLink}
          className="flex items-center gap-1.5 px-3 py-1.5 text-sm text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)] border border-dashed border-[var(--color-border)] rounded-lg"
        >
          <Plus size={14} /> Add link
        </button>
      </div>

      {/* Detail chips in use */}
      {Object.keys(extra).length > 0 && (
        <div className="space-y-2">
          <label className={labelCls}>Details</label>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {Object.entries(extra).map(([key, value]) => (
              <div key={key} className="space-y-1">
                <div className="flex items-center justify-between">
                  <span className="text-xs text-[var(--color-text-secondary)]">{key}</span>
                  <button onClick={() => removeChip(key)} className="text-[var(--color-text-secondary)] hover:text-red-600" title="Remove">
                    <X size={13} />
                  </button>
                </div>
                <input className={inputCls} value={value} onChange={(e) => setExtra(key, e.target.value)} />
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Add details chips */}
      <div className="space-y-2">
        <label className={labelCls}>Add details</label>
        <div className="flex flex-wrap gap-2">
          {availableChips.map((c) => (
            <button
              key={c}
              onClick={() => addChip(c)}
              className="flex items-center gap-1 px-2.5 py-1 text-xs font-medium rounded-full border border-[var(--color-border)] text-[var(--color-text-secondary)] hover:border-signal hover:text-signal"
            >
              <Plus size={12} /> {c}
            </button>
          ))}
          <button
            onClick={() => setShowMore((v) => !v)}
            className="flex items-center gap-1 px-2.5 py-1 text-xs font-medium rounded-full text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)]"
          >
            {showMore ? <ChevronUp size={12} /> : <ChevronDown size={12} />}
            {showMore ? "Show less" : "Show more"}
          </button>
        </div>
      </div>
    </div>
  );
};

const Field = ({ label, children }: { label: string; children: React.ReactNode }) => (
  <div className="space-y-1">
    <label className={labelCls}>{label}</label>
    {children}
  </div>
);
