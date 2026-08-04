import { useState } from "react";
import { Reorder, useDragControls } from "framer-motion";
import { Eye, EyeOff, Trash2, Pencil, Plus, GripVertical } from "lucide-react";
import { ResumeEntry, ResumeSection } from "@/entities/resume";
import { ICON_CHOICES, cn } from "@/shared/lib";
import { EntryEditor } from "./EntryEditor";

interface SectionEditorProps {
  section: ResumeSection;
  onChange: (section: ResumeSection) => void;
}

const uid = () =>
  typeof crypto !== "undefined" && "randomUUID" in crypto
    ? crypto.randomUUID()
    : `e-${Date.now()}-${Math.random().toString(36).slice(2)}`;

const inputCls =
  "w-full px-3 py-2 bg-well border border-line rounded-lg text-sm text-ink";

/** The editor for one section: its heading, its arrangement, and its entries. */
export const SectionEditor = ({ section, onChange }: SectionEditorProps) => {
  const [editingId, setEditingId] = useState<string | null>(null);

  const setEntries = (entries: ResumeEntry[]) => onChange({ ...section, entries });
  const patchEntry = (id: string, next: ResumeEntry) =>
    setEntries(section.entries.map((e) => (e.id === id ? next : e)));

  const addEntry = () => {
    const entry: ResumeEntry = { id: uid() };
    setEntries([...section.entries, entry]);
    setEditingId(entry.id);
  };

  return (
    <div className="space-y-4 border-t border-line pt-4 mt-2">
      {/* Heading + icon */}
      <div className="grid grid-cols-1 sm:grid-cols-[120px_1fr] gap-3">
        <div className="space-y-1">
          <label className="text-xs font-medium text-muted">Icon</label>
          <select
            value={section.icon || ""}
            onChange={(e) => onChange({ ...section, icon: e.target.value })}
            className={inputCls}
          >
            {ICON_CHOICES.map((name) => (
              <option key={name} value={name}>
                {name}
              </option>
            ))}
          </select>
        </div>
        <div className="space-y-1">
          <label className="text-xs font-medium text-muted">Heading</label>
          <input
            className={inputCls}
            value={section.heading}
            onChange={(e) => onChange({ ...section, heading: e.target.value })}
          />
        </div>
      </div>

      {/* Custom section type toggle */}
      {section.source === "custom" && (
        <div className="flex items-center gap-2">
          <span className="text-xs font-medium text-muted">Type</span>
          <div className="inline-flex rounded-lg border border-line overflow-hidden">
            {(["normal", "skill"] as const).map((t) => (
              <button
                key={t}
                onClick={() => onChange({ ...section, customType: t })}
                className={cn(
                  "px-3 py-1 text-xs font-medium capitalize",
                  (section.customType || "normal") === t
                    ? "bg-ink text-surface"
                    : "text-muted"
                )}
              >
                {t}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Entries */}
      <Reorder.Group axis="y" values={section.entries} onReorder={setEntries} className="space-y-2">
        {section.entries.map((entry) => (
          <EntryRow
            key={entry.id}
            entry={entry}
            kind={section.customType === "skill" ? "skills" : section.kind}
            editing={editingId === entry.id}
            onToggleEdit={() => setEditingId((id) => (id === entry.id ? null : entry.id))}
            onToggleHidden={() => patchEntry(entry.id, { ...entry, hidden: !entry.hidden })}
            onDelete={() => {
              setEntries(section.entries.filter((e) => e.id !== entry.id));
              if (editingId === entry.id) setEditingId(null);
            }}
            onChange={(next) => patchEntry(entry.id, next)}
            onClose={() => setEditingId(null)}
          />
        ))}
      </Reorder.Group>

      <button
        onClick={addEntry}
        className="flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium text-muted hover:text-ink border border-dashed border-line rounded-lg w-full justify-center"
      >
        <Plus size={14} /> Add entry
      </button>
    </div>
  );
};

interface EntryRowProps {
  entry: ResumeEntry;
  kind: ResumeSection["kind"];
  editing: boolean;
  onToggleEdit: () => void;
  onToggleHidden: () => void;
  onDelete: () => void;
  onChange: (entry: ResumeEntry) => void;
  onClose: () => void;
}

function EntryRow({
  entry,
  kind,
  editing,
  onToggleEdit,
  onToggleHidden,
  onDelete,
  onChange,
  onClose,
}: EntryRowProps) {
  const controls = useDragControls();
  const label = entry.title || (entry.description ? "(description)" : "Untitled entry");

  return (
    <Reorder.Item
      value={entry}
      dragListener={false}
      dragControls={controls}
      className="bg-card border border-line rounded-lg"
    >
      <div className={cn("flex items-center gap-2 px-3 py-2", entry.hidden && "opacity-50")}>
        <button
          onPointerDown={(e) => controls.start(e)}
          className="cursor-grab text-muted hover:text-ink touch-none"
          title="Drag to reorder"
        >
          <GripVertical size={15} />
        </button>
        <span className="flex-1 text-sm text-ink truncate">{label}</span>
        <button onClick={onToggleHidden} className="p-1.5 text-muted hover:text-ink rounded-md" title={entry.hidden ? "Show" : "Hide"}>
          {entry.hidden ? <EyeOff size={14} /> : <Eye size={14} />}
        </button>
        <button onClick={onToggleEdit} className="p-1.5 text-muted hover:text-signal rounded-md" title="Edit">
          <Pencil size={14} />
        </button>
        <button onClick={onDelete} className="p-1.5 text-muted hover:text-red-600 rounded-md" title="Delete">
          <Trash2 size={14} />
        </button>
      </div>
      {editing && (
        <div className="px-3 pb-3">
          <EntryEditor entry={entry} kind={kind} onChange={onChange} onClose={onClose} />
        </div>
      )}
    </Reorder.Item>
  );
}
