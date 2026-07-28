import { useState } from "react";
import { Reorder, useDragControls } from "framer-motion";
import { Minus, Plus, GripVertical, Check as CheckIcon } from "lucide-react";
import { ResumeSection, ResumeStyle } from "@/types/resume";
import { TEMPLATE_PRESETS, FONT_OPTIONS } from "@/lib/resumeDefaults";
import { cn } from "@/lib/utils";

interface CustomizePanelProps {
  style: ResumeStyle;
  onStyleChange: (style: ResumeStyle) => void;
  sections: ResumeSection[];
  onSectionsChange: (sections: ResumeSection[]) => void;
}

type Pane =
  | "document" | "templates" | "layout" | "fontsize" | "spacing" | "entries"
  | "headings" | "font" | "colors" | "header" | "photo" | "links" | "footer" | "sections";

const NAV: { id: Pane; label: string }[] = [
  { id: "document", label: "Document" },
  { id: "templates", label: "Templates" },
  { id: "layout", label: "Layout" },
  { id: "fontsize", label: "Font Size" },
  { id: "spacing", label: "Spacing" },
  { id: "entries", label: "Entries" },
  { id: "headings", label: "Headings" },
  { id: "font", label: "Font" },
  { id: "colors", label: "Colors" },
  { id: "header", label: "Header" },
  { id: "photo", label: "Photo" },
  { id: "links", label: "Links" },
  { id: "footer", label: "Footer" },
  { id: "sections", label: "Sections" },
];

const SWATCHES = [
  "#2563eb", "#7c3aed", "#0f766e", "#be123c", "#ea580c", "#16a34a",
  "#0891b2", "#4f46e5", "#db2777", "#374151", "#111827", "#a16207",
];

export const CustomizePanel = ({ style, onStyleChange, sections, onSectionsChange }: CustomizePanelProps) => {
  const [pane, setPane] = useState<Pane>("templates");
  const set = (patch: Partial<ResumeStyle>) => onStyleChange({ ...style, ...patch });
  const setAccent = (patch: Partial<ResumeStyle["accentApply"]>) =>
    set({ accentApply: { ...style.accentApply, ...patch } });

  return (
    <div className="bg-[var(--color-card)] border border-[var(--color-border)] rounded-xl flex min-h-[400px]">
      {/* Sub-nav */}
      <div className="w-36 flex-shrink-0 border-r border-[var(--color-border)] py-2 overflow-y-auto">
        {NAV.map((n) => (
          <button
            key={n.id}
            onClick={() => setPane(n.id)}
            className={cn(
              "block w-full text-left px-3 py-1.5 text-sm",
              pane === n.id
                ? "bg-[var(--color-background)] text-[var(--color-text-primary)] font-medium"
                : "text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)]"
            )}
          >
            {n.label}
          </button>
        ))}
      </div>

      {/* Pane */}
      <div className="flex-1 p-4 space-y-5 overflow-y-auto">
        {pane === "document" && (
          <>
            <Select label="Language" value={style.language} onChange={(v) => set({ language: v })}
              options={["English", "English (UK)", "French", "German", "Spanish"]} />
            <Select label="Date format" value={style.dateFormat} onChange={(v) => set({ dateFormat: v })}
              options={["MMM YYYY", "MMM DD, YYYY", "MM/YYYY", "YYYY"]} />
            <Segmented label="Page format" value={style.pageFormat} onChange={(v) => set({ pageFormat: v as ResumeStyle["pageFormat"] })}
              options={[{ value: "A4", label: "A4" }, { value: "Letter", label: "Letter" }]} />
          </>
        )}

        {pane === "templates" && (
          <div className="grid grid-cols-2 gap-3">
            {TEMPLATE_PRESETS.map((t) => (
              <button
                key={t.key}
                onClick={() => set({ ...t.style, template: t.key })}
                className={cn(
                  "p-3 rounded-lg border text-left",
                  style.template === t.key
                    ? "border-signal ring-1 ring-signal/40"
                    : "border-[var(--color-border)]"
                )}
              >
                <div className="h-16 rounded mb-2" style={{ background: `linear-gradient(135deg, ${t.style.accentColor || "#2563eb"} 0%, #fff 100%)` }} />
                <span className="text-sm font-medium text-[var(--color-text-primary)]">{t.label}</span>
              </button>
            ))}
          </div>
        )}

        {pane === "layout" && (
          <>
            <Segmented label="Columns" value={style.columns} onChange={(v) => set({ columns: v as ResumeStyle["columns"] })}
              options={[{ value: "one", label: "One" }, { value: "two", label: "Two" }, { value: "mix", label: "Mix" }]} />
            <div className="space-y-1">
              <Label>Section order</Label>
              <Reorder.Group axis="y" values={sections} onReorder={onSectionsChange} className="space-y-1">
                {sections.map((s) => (
                  <OrderRow key={s.id} section={s} />
                ))}
              </Reorder.Group>
            </div>
          </>
        )}

        {pane === "fontsize" && (
          <>
            <Stepper label="Base font size" value={style.baseFontSize} min={7} max={14} step={0.5} suffix="pt" onChange={(v) => set({ baseFontSize: v })} />
            <Stepper label="Full name" value={style.nameFontSize} min={0} max={24} step={1} prefix="+" suffix="pt" onChange={(v) => set({ nameFontSize: v })} />
            <Stepper label="Section headings" value={style.headingFontSize} min={0} max={12} step={1} prefix="+" suffix="pt" onChange={(v) => set({ headingFontSize: v })} />
            <Stepper label="Entry header" value={style.entryHeaderFontSize} min={0} max={8} step={1} prefix="+" suffix="pt" onChange={(v) => set({ entryHeaderFontSize: v })} />
          </>
        )}

        {pane === "spacing" && (
          <>
            <Stepper label="Line height" value={style.lineHeight} min={1} max={2} step={0.05} onChange={(v) => set({ lineHeight: v })} />
            <Stepper label="Space between elements" value={style.elementSpacing} min={0} max={24} step={1} suffix="px" onChange={(v) => set({ elementSpacing: v })} />
            <Stepper label="Left & right margin" value={style.marginX} min={4} max={30} step={1} suffix="mm" onChange={(v) => set({ marginX: v })} />
            <Stepper label="Top & bottom margin" value={style.marginY} min={4} max={30} step={1} suffix="mm" onChange={(v) => set({ marginY: v })} />
          </>
        )}

        {pane === "entries" && (
          <>
            <Segmented label="Entry layout" value={String(style.entryLayout)} onChange={(v) => set({ entryLayout: Number(v) as ResumeStyle["entryLayout"] })}
              options={[{ value: "1", label: "1" }, { value: "2", label: "2" }, { value: "3", label: "3" }, { value: "4", label: "4" }]} />
            <Segmented label="Column width" value={style.columnWidth} onChange={(v) => set({ columnWidth: v as ResumeStyle["columnWidth"] })}
              options={[{ value: "auto", label: "Auto" }, { value: "manual", label: "Manual" }]} />
            <Segmented label="Subtitle style" value={style.subtitleStyle} onChange={(v) => set({ subtitleStyle: v as ResumeStyle["subtitleStyle"] })}
              options={[{ value: "normal", label: "Normal" }, { value: "bold", label: "Bold" }, { value: "italic", label: "Italic" }]} />
            <Segmented label="Subtitle placement" value={style.subtitlePlacement} onChange={(v) => set({ subtitlePlacement: v as ResumeStyle["subtitlePlacement"] })}
              options={[{ value: "same", label: "Same line" }, { value: "next", label: "Next line" }]} />
            <Check label="Indent body" checked={style.indentBody} onChange={(v) => set({ indentBody: v })} />
            <Segmented label="List style" value={style.listStyle} onChange={(v) => set({ listStyle: v as ResumeStyle["listStyle"] })}
              options={[{ value: "bullet", label: "Bullet" }, { value: "hyphen", label: "Hyphen" }]} />
          </>
        )}

        {pane === "headings" && (
          <>
            <Segmented label="Style" value={String(style.headingStyle)} onChange={(v) => set({ headingStyle: Number(v) as ResumeStyle["headingStyle"] })}
              options={[1, 2, 3, 4, 5, 6].map((n) => ({ value: String(n), label: String(n) }))} />
            <Segmented label="Capitalization" value={style.headingCase} onChange={(v) => set({ headingCase: v as ResumeStyle["headingCase"] })}
              options={[{ value: "capitalize", label: "Capitalize" }, { value: "uppercase", label: "Uppercase" }]} />
            <Segmented label="Icons" value={style.headingIcons} onChange={(v) => set({ headingIcons: v as ResumeStyle["headingIcons"] })}
              options={[{ value: "none", label: "None" }, { value: "outline", label: "Outline" }, { value: "filled", label: "Filled" }]} />
          </>
        )}

        {pane === "font" && (
          <>
            <Select label="Body font" value={style.bodyFont} onChange={(v) => set({ bodyFont: v })}
              options={FONT_OPTIONS.map((f) => f.label)} />
            <Select label="Name font" value={style.nameFont || ""} onChange={(v) => set({ nameFont: v })}
              options={["", ...FONT_OPTIONS.map((f) => f.label)]}
              optionLabels={{ "": "Same as body font" }} />
          </>
        )}

        {pane === "colors" && (
          <>
            <Segmented label="Color scope" value={style.colorScope} onChange={(v) => set({ colorScope: v as ResumeStyle["colorScope"] })}
              options={[{ value: "page", label: "Full Page" }, { value: "header", label: "Header" }, { value: "border", label: "Border" }]} />
            <Segmented label="Palette" value={style.palette} onChange={(v) => set({ palette: v as ResumeStyle["palette"] })}
              options={[{ value: "single", label: "Single" }, { value: "multi", label: "Multi" }, { value: "image", label: "Image" }]} />
            {style.palette === "image" && (
              <div className="space-y-1">
                <Label>Background image URL</Label>
                <input className={INPUT} value={style.backgroundImage || ""} onChange={(e) => set({ backgroundImage: e.target.value })} placeholder="https://…" />
              </div>
            )}
            <div className="space-y-1">
              <Label>Accent color</Label>
              <div className="flex flex-wrap gap-2 items-center">
                {SWATCHES.map((c) => (
                  <button
                    key={c}
                    onClick={() => set({ accentColor: c })}
                    className={cn("w-6 h-6 rounded-full border", style.accentColor === c ? "ring-2 ring-offset-1 ring-gray-400" : "border-[var(--color-border-strong)]")}
                    style={{ background: c }}
                  />
                ))}
                <input type="color" value={style.accentColor} onChange={(e) => set({ accentColor: e.target.value })}
                  className="w-7 h-7 rounded cursor-pointer bg-transparent" title="Custom color" />
              </div>
            </div>
            <div className="space-y-1">
              <Label>Apply accent to</Label>
              <div className="grid grid-cols-2 gap-1.5">
                {([
                  ["name", "Name"], ["jobTitle", "Job title"], ["headings", "Headings"],
                  ["headingsLine", "Headings line"], ["headerIcons", "Header icons"],
                  ["dotsBars", "Dots / bars"], ["dates", "Dates"], ["subtitle", "Subtitle"],
                  ["linkIcons", "Link icons"],
                ] as const).map(([k, lbl]) => (
                  <Check key={k} label={lbl} checked={style.accentApply[k]} onChange={(v) => setAccent({ [k]: v })} compact />
                ))}
              </div>
            </div>
          </>
        )}

        {pane === "header" && (
          <>
            <Segmented label="Alignment" value={style.headerAlign} onChange={(v) => set({ headerAlign: v as ResumeStyle["headerAlign"] })}
              options={[{ value: "left", label: "Left" }, { value: "center", label: "Center" }]} />
            <Segmented label="Details arrangement" value={style.headerDetails} onChange={(v) => set({ headerDetails: v as ResumeStyle["headerDetails"] })}
              options={[{ value: "icon", label: "Icon" }, { value: "bullet", label: "Bullet" }, { value: "bar", label: "Bar" }]} />
          </>
        )}

        {pane === "photo" && (
          <>
            <Check label="Show photo" checked={style.showPhoto} onChange={(v) => set({ showPhoto: v })} />
            <Segmented label="Shape" value={style.photoShape} onChange={(v) => set({ photoShape: v as ResumeStyle["photoShape"] })}
              options={[{ value: "circle", label: "Circle" }, { value: "rounded", label: "Rounded" }, { value: "square", label: "Square" }]} />
            <Stepper label="Size" value={style.photoSize} min={48} max={160} step={4} suffix="px" onChange={(v) => set({ photoSize: v })} />
          </>
        )}

        {pane === "links" && (
          <>
            <Check label="Underline" checked={style.linkUnderline} onChange={(v) => set({ linkUnderline: v })} />
            <Check label="Colored" checked={style.linkColored} onChange={(v) => set({ linkColored: v })} />
            <Check label="Link icon" checked={style.linkIcon} onChange={(v) => set({ linkIcon: v })} />
            <Segmented label="Icon style" value={style.linkIconStyle} onChange={(v) => set({ linkIconStyle: v as ResumeStyle["linkIconStyle"] })}
              options={[{ value: "chain", label: "Chain" }, { value: "external", label: "External" }]} />
          </>
        )}

        {pane === "footer" && (
          <>
            <div className="space-y-1">
              <Label>Footer text</Label>
              <input className={INPUT} value={style.footerText} onChange={(e) => set({ footerText: e.target.value })} placeholder="e.g. References available on request" />
            </div>
            <Check label="Show page numbers" checked={style.showPageNumbers} onChange={(v) => set({ showPageNumbers: v })} />
          </>
        )}

        {pane === "sections" && (
          <div className="space-y-3">
            {sections.filter((s) => SECTION_LAYOUTS[s.customType === "skill" ? "skills" : s.kind]).length === 0 && (
              <p className="text-sm text-[var(--color-text-secondary)]">
                No sections with layout options. Skills, languages, certificates, and interests support grid / rows / compact / bubble layouts.
              </p>
            )}
            {sections.map((s) => {
              const opts = SECTION_LAYOUTS[s.customType === "skill" ? "skills" : s.kind];
              if (!opts) return null;
              return (
                <div key={s.id} className="space-y-1">
                  <Label>{s.heading}</Label>
                  <Segmented
                    value={s.layout || opts[0]}
                    onChange={(v) => onSectionsChange(sections.map((x) => (x.id === s.id ? { ...x, layout: v as ResumeSection["layout"] } : x)))}
                    options={opts.map((o) => ({ value: o, label: o[0].toUpperCase() + o.slice(1) }))}
                  />
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};

// Per-kind layout options offered in the Sections pane.
const SECTION_LAYOUTS: Partial<Record<string, NonNullable<ResumeSection["layout"]>[]>> = {
  skills: ["compact", "bubble"],
  languages: ["rows", "grid"],
  certificates: ["list", "rows", "grid"],
  interests: ["bubble", "rows"],
  references: ["grid", "rows"],
};

// ── reusable controls ───────────────────────────────────────────────────────

const INPUT =
  "w-full px-3 py-2 bg-[var(--color-input-bg)] border border-[var(--color-border)] rounded-lg text-sm text-[var(--color-text-primary)]";

const Label = ({ children }: { children: React.ReactNode }) => (
  <label className="text-xs font-medium text-[var(--color-text-secondary)]">{children}</label>
);

function Stepper({ label, value, min, max, step, suffix, prefix, onChange }: {
  label: string; value: number; min: number; max: number; step: number;
  suffix?: string; prefix?: string; onChange: (v: number) => void;
}) {
  const clamp = (v: number) => Math.min(max, Math.max(min, Math.round(v / step) * step));
  const pct = ((value - min) / (max - min)) * 100;
  return (
    <div className="space-y-1">
      <div className="flex justify-between">
        <Label>{label}</Label>
        <span className="text-xs text-[var(--color-text-secondary)]">{prefix}{value}{suffix}</span>
      </div>
      <div className="flex items-center gap-2">
        <button onClick={() => onChange(clamp(value - step))} className="p-1 rounded border border-[var(--color-border)] text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)]">
          <Minus size={13} />
        </button>
        <div className="flex-1 h-1.5 rounded-full bg-[var(--color-border)] relative">
          <div className="absolute inset-y-0 left-0 rounded-full bg-signal" style={{ width: `${pct}%` }} />
        </div>
        <button onClick={() => onChange(clamp(value + step))} className="p-1 rounded border border-[var(--color-border)] text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)]">
          <Plus size={13} />
        </button>
      </div>
    </div>
  );
}

function Segmented({ label, value, options, onChange }: {
  label?: string; value: string; options: { value: string; label: string }[]; onChange: (v: string) => void;
}) {
  return (
    <div className="space-y-1">
      {label && <Label>{label}</Label>}
      <div className="inline-flex flex-wrap rounded-lg border border-[var(--color-border)] overflow-hidden">
        {options.map((o) => (
          <button
            key={o.value}
            onClick={() => onChange(o.value)}
            className={cn(
              "px-3 py-1.5 text-xs font-medium border-r border-[var(--color-border)] last:border-r-0",
              value === o.value
                ? "bg-[var(--color-text-primary)] text-[var(--color-background)]"
                : "text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)]"
            )}
          >
            {o.label}
          </button>
        ))}
      </div>
    </div>
  );
}

function Select({ label, value, options, optionLabels, onChange }: {
  label: string; value: string; options: string[]; optionLabels?: Record<string, string>; onChange: (v: string) => void;
}) {
  return (
    <div className="space-y-1">
      <Label>{label}</Label>
      <select className={INPUT} value={value} onChange={(e) => onChange(e.target.value)}>
        {options.map((o) => (
          <option key={o} value={o}>{optionLabels?.[o] ?? o}</option>
        ))}
      </select>
    </div>
  );
}

function Check({ label, checked, onChange, compact }: {
  label: string; checked: boolean; onChange: (v: boolean) => void; compact?: boolean;
}) {
  return (
    <button
      onClick={() => onChange(!checked)}
      className={cn("flex items-center gap-2", compact ? "text-xs" : "text-sm")}
    >
      <span className={cn(
        "w-4 h-4 rounded border flex items-center justify-center",
        checked ? "bg-signal border-signal text-white" : "border-[var(--color-border-strong)]"
      )}>
        {checked && <CheckIcon size={11} />}
      </span>
      <span className="text-[var(--color-text-primary)]">{label}</span>
    </button>
  );
}

function OrderRow({ section }: { section: ResumeSection }) {
  const controls = useDragControls();
  return (
    <Reorder.Item value={section} dragListener={false} dragControls={controls}
      className="flex items-center gap-2 px-2 py-1.5 bg-[var(--color-input-bg)] border border-[var(--color-border)] rounded-lg">
      <button onPointerDown={(e) => controls.start(e)} className="cursor-grab text-[var(--color-text-secondary)] touch-none">
        <GripVertical size={14} />
      </button>
      <span className="text-sm text-[var(--color-text-primary)] truncate">{section.heading}</span>
      {!section.visible && <span className="ml-auto text-[10px] text-[var(--color-text-secondary)] opacity-60">hidden</span>}
    </Reorder.Item>
  );
}
