import { useState } from "react";
import { Reorder, useDragControls } from "framer-motion";
import {
  ChevronDown,
  ChevronRight,
  Eye,
  EyeOff,
  Trash2,
  GripVertical,
  Plus,
  UserCircle,
} from "lucide-react";
import { currentSnapshot } from "@/entities/portfolio";
import { buildSection, ResumeDocument, ResumeSection, SectionKind } from "@/entities/resume";
import { NamedIcon, cn } from "@/shared/lib";
import { SectionEditor } from "./SectionEditor";
import { PersonalDetailsEditor } from "./PersonalDetailsEditor";
import { AddSectionModal } from "./AddSectionModal";

interface ContentPanelProps {
  doc: ResumeDocument;
  update: (mutator: (doc: ResumeDocument) => ResumeDocument) => void;
}

/** The Content tab: the header details and every section, each expandable. */
export const ContentPanel = ({ doc, update }: ContentPanelProps) => {
  const [open, setOpen] = useState<string | null>("__personal__");
  const [addOpen, setAddOpen] = useState(false);

  const setSections = (sections: ResumeSection[]) => update((d) => ({ ...d, sections }));
  const patchSection = (next: ResumeSection) =>
    setSections(doc.sections.map((s) => (s.id === next.id ? next : s)));

  const addSection = (kind: SectionKind) => {
    const section = buildSection(kind, currentSnapshot());
    setSections([...doc.sections, section]);
    setOpen(section.id);
  };

  return (
    <div className="space-y-3">
      {/* Personal details */}
      <div className="bg-card border border-line rounded-xl">
        <button
          onClick={() => setOpen((id) => (id === "__personal__" ? null : "__personal__"))}
          className="flex items-center gap-3 w-full px-4 py-3"
        >
          <UserCircle size={17} className="text-muted" />
          <span className="flex-1 text-left text-sm font-semibold text-ink">
            Personal Details
          </span>
          {open === "__personal__" ? (
            <ChevronDown size={16} className="text-muted" />
          ) : (
            <ChevronRight size={16} className="text-muted" />
          )}
        </button>
        {open === "__personal__" && (
          <div className="px-4 pb-4">
            <PersonalDetailsEditor
              personal={doc.personal}
              onChange={(personal) => update((d) => ({ ...d, personal }))}
            />
          </div>
        )}
      </div>

      {/* Sections */}
      <Reorder.Group axis="y" values={doc.sections} onReorder={setSections} className="space-y-3">
        {doc.sections.map((section) => (
          <SectionRow
            key={section.id}
            section={section}
            expanded={open === section.id}
            onToggleExpand={() => setOpen((id) => (id === section.id ? null : section.id))}
            onToggleVisible={() => patchSection({ ...section, visible: !section.visible })}
            onDelete={() => {
              setSections(doc.sections.filter((s) => s.id !== section.id));
              if (open === section.id) setOpen(null);
            }}
            onChange={patchSection}
          />
        ))}
      </Reorder.Group>

      {/* Add content */}
      <button
        onClick={() => setAddOpen(true)}
        className="flex items-center justify-center gap-2 w-full px-4 py-2.5 rounded-full text-sm font-semibold text-surface bg-ink hover:opacity-90 shadow-sm"
      >
        <Plus size={16} /> Add Content
      </button>

      <AddSectionModal
        isOpen={addOpen}
        onClose={() => setAddOpen(false)}
        onAdd={addSection}
        existingKinds={doc.sections.map((s) => s.kind)}
      />
    </div>
  );
};

interface SectionRowProps {
  section: ResumeSection;
  expanded: boolean;
  onToggleExpand: () => void;
  onToggleVisible: () => void;
  onDelete: () => void;
  onChange: (section: ResumeSection) => void;
}

function SectionRow({
  section,
  expanded,
  onToggleExpand,
  onToggleVisible,
  onDelete,
  onChange,
}: SectionRowProps) {
  const controls = useDragControls();
  const count = section.entries.filter((e) => !e.hidden).length;

  return (
    <Reorder.Item
      value={section}
      dragListener={false}
      dragControls={controls}
      className="bg-card border border-line rounded-xl"
    >
      <div className={cn("flex items-center gap-2 px-3 py-3", !section.visible && "opacity-50")}>
        <button
          onPointerDown={(e) => controls.start(e)}
          className="cursor-grab text-muted hover:text-ink touch-none"
          title="Drag to reorder"
        >
          <GripVertical size={16} />
        </button>
        <NamedIcon name={section.icon} size={16} className="text-muted flex-shrink-0" />
        <button onClick={onToggleExpand} className="flex-1 flex items-center gap-2 text-left min-w-0">
          <span className="text-sm font-semibold text-ink truncate">
            {section.heading}
          </span>
          <span className="text-xs text-muted">{count}</span>
        </button>
        <button onClick={onToggleVisible} className="p-1.5 text-muted hover:text-ink rounded-md" title={section.visible ? "Hide section" : "Show section"}>
          {section.visible ? <Eye size={15} /> : <EyeOff size={15} />}
        </button>
        <button onClick={onDelete} className="p-1.5 text-muted hover:text-red-600 rounded-md" title="Remove section">
          <Trash2 size={15} />
        </button>
        <button onClick={onToggleExpand} className="p-1.5 text-muted hover:text-ink rounded-md">
          {expanded ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
        </button>
      </div>
      {expanded && (
        <div className="px-4 pb-4">
          <SectionEditor section={section} onChange={onChange} />
        </div>
      )}
    </Reorder.Item>
  );
}
