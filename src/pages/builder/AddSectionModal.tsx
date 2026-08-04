import { m, AnimatePresence } from "framer-motion";
import { X, Plus } from "lucide-react";
import { SECTION_CATALOG, SectionKind } from "@/entities/resume";
import { iconByName } from "@/shared/lib";

interface AddSectionModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAdd: (kind: SectionKind) => void;
  existingKinds: SectionKind[];
}

// Order shown in the grid; "custom" is rendered last as a dashed card.
const GRID_ORDER: SectionKind[] = [
  "summary", "experience", "education", "skills", "languages", "certificates",
  "interests", "projects", "courses", "awards", "organizations", "publications",
  "speaking", "volunteering", "blog", "garden", "references", "declaration",
];

/** The picker for adding a section, offering only kinds not already present. */
export const AddSectionModal = ({ isOpen, onClose, onAdd, existingKinds }: AddSectionModalProps) => {
  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <m.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4"
        onClick={onClose}
      >
        <m.div
          initial={{ opacity: 0, scale: 0.95, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 20 }}
          onClick={(e) => e.stopPropagation()}
          className="bg-card w-full max-w-3xl rounded-2xl shadow-2xl border border-line flex flex-col max-h-[85vh]"
        >
          <div className="flex items-center justify-between p-5 border-b border-line">
            <h2 className="text-lg font-bold text-ink">Add content</h2>
            <button onClick={onClose} className="p-2 hover:bg-surface rounded-full">
              <X size={18} className="text-muted" />
            </button>
          </div>

          <div className="p-5 overflow-y-auto grid grid-cols-2 sm:grid-cols-3 gap-3">
            {GRID_ORDER.map((kind) => {
              const meta = SECTION_CATALOG[kind];
              const Icon = iconByName(meta.icon);
              const used = existingKinds.includes(kind);
              return (
                <button
                  key={kind}
                  onClick={() => {
                    onAdd(kind);
                    onClose();
                  }}
                  className="text-left p-3 rounded-xl border border-line hover:border-signal hover:bg-field/10 transition-colors"
                >
                  <div className="flex items-center gap-2 mb-1">
                    <Icon size={16} className="text-muted" />
                    <span className="text-sm font-semibold text-ink">{meta.label}</span>
                    {used && (
                      <span className="ml-auto text-[9px] uppercase tracking-wide text-muted opacity-60">
                        added
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-muted leading-snug">{meta.subtitle}</p>
                </button>
              );
            })}

            {/* Custom: dashed card */}
            <button
              onClick={() => {
                onAdd("custom");
                onClose();
              }}
              className="text-left p-3 rounded-xl border border-dashed border-line-strong hover:border-signal transition-colors"
            >
              <div className="flex items-center gap-2 mb-1">
                <Plus size={16} className="text-muted" />
                <span className="text-sm font-semibold text-ink">Custom</span>
              </div>
              <p className="text-xs text-muted leading-snug">
                {SECTION_CATALOG.custom.subtitle}
              </p>
            </button>
          </div>
        </m.div>
      </m.div>
    </AnimatePresence>
  );
};
