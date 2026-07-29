import { useLayoutEffect, useMemo, useRef, useState } from "react";
import { Reorder, useDragControls } from "framer-motion";
import {
  Minus, Plus, GripVertical, Check as CheckIcon, Eye, RotateCcw,
  Link2, ExternalLink, MapPin, Image as ImageIcon, Square,
} from "lucide-react";
import { ResumeSection, ResumeStyle } from "@/types/resume";
import { DEFAULT_STYLE, TEMPLATE_PRESETS, FONT_OPTIONS, sampleDocument, type TemplatePreset } from "@/lib/resumeDefaults";
import { ResumeSheet } from "@/preview/ResumePreview";
import { cn } from "@/lib/utils";

interface CustomizePanelProps {
  style: ResumeStyle;
  onStyleChange: (style: ResumeStyle) => void;
  sections: ResumeSection[];
  onSectionsChange: (sections: ResumeSection[]) => void;
  /** When on, the live preview typesets the sample document instead of the record. */
  sampleMode: boolean;
  onSampleModeChange: (on: boolean) => void;
}

type Pane =
  | "document" | "templates" | "layout" | "fontsize" | "spacing" | "entries"
  | "headings" | "font" | "colors" | "header" | "photo" | "links" | "footer" | "sections";

const NAV: { group: string; items: { id: Pane; label: string }[] }[] = [
  {
    group: "Page",
    items: [
      { id: "templates", label: "Templates" },
      { id: "document", label: "Document" },
      { id: "layout", label: "Layout" },
    ],
  },
  {
    group: "Type",
    items: [
      { id: "font", label: "Fonts" },
      { id: "fontsize", label: "Sizes" },
      { id: "spacing", label: "Spacing" },
    ],
  },
  {
    group: "Structure",
    items: [
      { id: "entries", label: "Entries" },
      { id: "headings", label: "Headings" },
      { id: "sections", label: "Sections" },
    ],
  },
  {
    group: "Identity",
    items: [
      { id: "colors", label: "Colors" },
      { id: "header", label: "Header" },
      { id: "photo", label: "Photo" },
      { id: "links", label: "Links" },
    ],
  },
  {
    group: "Finish",
    items: [{ id: "footer", label: "Footer" }],
  },
];

const PANE_HINTS: Record<Pane, string> = {
  templates: "Start from a look, then tune anything below.",
  document: "Language, dates, and the physical sheet.",
  layout: "Columns and the order sections appear in.",
  font: "The document's typefaces.",
  fontsize: "Point sizes; the deltas ride on the base.",
  spacing: "Breathing room, from line height to margins.",
  entries: "How each job, degree, and item lays out.",
  headings: "The section titles' shape and case.",
  sections: "Per-section layout options, where a section has them.",
  colors: "The accent, where it lands, and the page treatment.",
  header: "The name block at the top of the sheet.",
  photo: "The portrait, when the document carries one.",
  links: "How hyperlinks read on paper and screen.",
  footer: "The last line of every page.",
};

/** Which style fields each pane owns, so its Reset restores exactly those. */
const PANE_FIELDS: Partial<Record<Pane, (keyof ResumeStyle)[]>> = {
  document: ["language", "dateFormat", "pageFormat"],
  layout: ["columns"],
  font: ["bodyFont", "nameFont"],
  fontsize: ["baseFontSize", "nameFontSize", "headingFontSize", "entryHeaderFontSize"],
  spacing: ["lineHeight", "elementSpacing", "marginX", "marginY"],
  entries: ["entryLayout", "subtitleStyle", "subtitlePlacement", "indentBody", "listStyle"],
  headings: ["headingStyle", "headingCase", "headingIcons", "headingIconSize"],
  colors: ["colorScope", "palette", "accentColor", "headerFillColor", "backgroundImage", "accentApply"],
  header: ["headerAlign", "headerDetails"],
  photo: ["showPhoto", "photoShape", "photoSize"],
  links: ["linkUnderline", "linkColored", "linkIcon", "linkIconStyle"],
  footer: ["footerText", "showPageNumbers"],
};

const SWATCHES = [
  "#2563eb", "#7c3aed", "#0f766e", "#be123c", "#ea580c", "#16a34a",
  "#0891b2", "#4f46e5", "#db2777", "#374151", "#111827", "#a16207",
];

export const CustomizePanel = ({ style, onStyleChange, sections, onSectionsChange, sampleMode, onSampleModeChange }: CustomizePanelProps) => {
  const [pane, setPane] = useState<Pane>("templates");
  const set = (patch: Partial<ResumeStyle>) => onStyleChange({ ...style, ...patch });
  const setAccent = (patch: Partial<ResumeStyle["accentApply"]>) =>
    set({ accentApply: { ...style.accentApply, ...patch } });

  const paneLabel = NAV.flatMap((g) => g.items).find((i) => i.id === pane)?.label ?? "";

  const resetPane = () => {
    const fields = PANE_FIELDS[pane];
    if (!fields) return;
    const patch: Partial<ResumeStyle> = {};
    for (const f of fields) {
      (patch as Record<string, unknown>)[f] = structuredClone(DEFAULT_STYLE[f]);
    }
    set(patch);
  };

  return (
    <div className="bg-[var(--color-card)] border border-[var(--color-border)] rounded-xl flex min-h-[420px]">
      {/* Sub-nav: grouped like the document itself. */}
      <nav className="w-32 flex-shrink-0 border-r border-dashed border-[var(--color-border)] py-2 overflow-y-auto">
        {NAV.map((g) => (
          <div key={g.group} className="mb-1.5">
            <p className="m-0 px-3 pb-1 pt-2 font-mono text-[9.5px] uppercase tracking-[0.14em] text-[var(--color-text-secondary)] opacity-70">
              {g.group}
            </p>
            {g.items.map((n) => (
              <button
                key={n.id}
                onClick={() => setPane(n.id)}
                className={cn(
                  "block w-full border-l-2 px-3 py-1.5 text-left text-[13px] transition-colors",
                  pane === n.id
                    ? "border-signal bg-[var(--color-background)] font-medium text-[var(--color-text-primary)]"
                    : "border-transparent text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)]"
                )}
              >
                {n.label}
              </button>
            ))}
          </div>
        ))}
      </nav>

      {/* Pane */}
      <div className="flex-1 overflow-y-auto p-5">
        <div className="mb-4 flex items-start justify-between gap-3 border-b border-dashed border-[var(--color-border)] pb-3">
          <div>
            <h3 className="m-0 text-sm font-semibold text-[var(--color-text-primary)]">{paneLabel}</h3>
            <p className="m-0 mt-0.5 text-xs text-[var(--color-text-secondary)]">{PANE_HINTS[pane]}</p>
          </div>
          {PANE_FIELDS[pane] && (
            <button
              onClick={resetPane}
              className="flex shrink-0 items-center gap-1 rounded-md border border-[var(--color-border)] px-2 py-1 font-mono text-[9.5px] uppercase tracking-[0.08em] text-[var(--color-text-secondary)] transition-colors hover:border-signal hover:text-signal"
              title={`Reset the ${paneLabel} settings to their defaults`}
            >
              <RotateCcw size={11} /> Reset
            </button>
          )}
        </div>

        <div className="space-y-5">
        {pane === "document" && (
          <>
            <Select label="Language" value={style.language} onChange={(v) => set({ language: v })}
              options={["Azerbaijani", "English", "English (UK)", "French", "German", "Spanish", "Turkish"]} />
            <Select label="Date format" value={style.dateFormat} onChange={(v) => set({ dateFormat: v })}
              options={["MMM YYYY", "MMM DD, YYYY", "MM/YYYY", "YYYY"]} />
            <Segmented label="Page size" value={style.pageFormat} onChange={(v) => set({ pageFormat: v as ResumeStyle["pageFormat"] })}
              options={[
                { value: "A3", label: "A3" }, { value: "A4", label: "A4" }, { value: "A5", label: "A5" },
                { value: "Letter", label: "Letter" }, { value: "Legal", label: "Legal" },
              ]} />
            <p className="m-0 text-xs text-[var(--color-text-secondary)]">
              The preview cuts the sheet with dashed guides wherever a printed page ends.
            </p>
          </>
        )}

        {pane === "templates" && (
          <>
          <button
            onClick={() => onSampleModeChange(!sampleMode)}
            className={cn(
              "flex w-full items-center gap-2 rounded-lg border px-3 py-2 text-left text-sm transition-colors",
              sampleMode
                ? "border-signal bg-[var(--color-background)] text-[var(--color-text-primary)]"
                : "border-[var(--color-border)] text-[var(--color-text-secondary)] hover:border-[var(--color-border-strong)] hover:text-[var(--color-text-primary)]"
            )}
          >
            <Eye size={15} className={sampleMode ? "text-signal" : undefined} />
            <span className="flex-1">
              Preview with sample data
              <span className="block text-[11px] leading-snug opacity-80">
                The big sheet typesets the sample record while you browse; your document is untouched.
              </span>
            </span>
            <span className={cn(
              "font-mono text-[9.5px] uppercase tracking-[0.1em]",
              sampleMode ? "text-signal" : "opacity-60"
            )}>
              {sampleMode ? "on" : "off"}
            </span>
          </button>
          <div className="grid grid-cols-2 gap-3">
            {TEMPLATE_PRESETS.map((t) => (
              <button
                key={t.key}
                onClick={() => set({ ...t.style, template: t.key })}
                className={cn(
                  "rounded-lg border p-2.5 text-left transition-colors",
                  style.template === t.key
                    ? "border-signal ring-1 ring-signal/40"
                    : "border-[var(--color-border)] hover:border-[var(--color-border-strong)]"
                )}
              >
                <TemplateThumb preset={t} />
                <span className="mt-2 block text-sm font-medium text-[var(--color-text-primary)]">{t.label}</span>
                <span className="mt-0.5 block text-[11px] leading-snug text-[var(--color-text-secondary)]">
                  {t.description}
                </span>
              </button>
            ))}
          </div>
          </>
        )}

        {pane === "layout" && (
          <>
            <Segmented label="Columns" value={style.columns} onChange={(v) => set({ columns: v as ResumeStyle["columns"] })}
              options={[
                { value: "one", label: "One", glyph: <ColumnsGlyph mode="one" /> },
                { value: "two", label: "Two", glyph: <ColumnsGlyph mode="two" /> },
                { value: "mix", label: "Mix", glyph: <ColumnsGlyph mode="mix" /> },
              ]} />
            <p className="m-0 text-xs text-[var(--color-text-secondary)]">
              Mix keeps two columns but lets the summary and declaration span the full width.
            </p>
            <div className="space-y-1.5">
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
              options={[
                { value: "1", label: "Date right", glyph: <EntryGlyph variant={1} /> },
                { value: "2", label: "Stacked", glyph: <EntryGlyph variant={2} /> },
                { value: "3", label: "One line", glyph: <EntryGlyph variant={3} /> },
              ]} />
            <Segmented label="Subtitle style" value={style.subtitleStyle} onChange={(v) => set({ subtitleStyle: v as ResumeStyle["subtitleStyle"] })}
              options={[
                { value: "normal", label: "Normal", glyph: <span className="text-[11px] leading-none">Co</span> },
                { value: "bold", label: "Bold", glyph: <span className="text-[11px] font-bold leading-none">Co</span> },
                { value: "italic", label: "Italic", glyph: <span className="text-[11px] italic leading-none">Co</span> },
              ]} />
            <Segmented label="Subtitle placement" value={style.subtitlePlacement} onChange={(v) => set({ subtitlePlacement: v as ResumeStyle["subtitlePlacement"] })}
              options={[
                { value: "same", label: "Same line", glyph: <PlacementGlyph same /> },
                { value: "next", label: "Next line", glyph: <PlacementGlyph /> },
              ]} />
            <Check label="Indent body" checked={style.indentBody} onChange={(v) => set({ indentBody: v })} />
            <Segmented label="List style" value={style.listStyle} onChange={(v) => set({ listStyle: v as ResumeStyle["listStyle"] })}
              options={[
                { value: "bullet", label: "Bullet", glyph: <span className="font-mono text-[11px] leading-none">•</span> },
                { value: "hyphen", label: "Hyphen", glyph: <span className="font-mono text-[11px] leading-none">-</span> },
              ]} />
          </>
        )}

        {pane === "headings" && (
          <>
            <Segmented label="Style" value={String(style.headingStyle)} onChange={(v) => set({ headingStyle: Number(v) as ResumeStyle["headingStyle"] })}
              options={[1, 2, 3, 4, 5, 6].map((n) => ({
                value: String(n),
                label: HEADING_STYLE_LABELS[n - 1],
                glyph: <HeadingGlyph variant={n as 1 | 2 | 3 | 4 | 5 | 6} accent={style.accentColor} />,
              }))} />
            <Segmented label="Capitalization" value={style.headingCase} onChange={(v) => set({ headingCase: v as ResumeStyle["headingCase"] })}
              options={[
                { value: "capitalize", label: "Capitalize", glyph: <span className="text-[11px] leading-none">Aa</span> },
                { value: "uppercase", label: "Uppercase", glyph: <span className="text-[10px] font-semibold leading-none tracking-wide">AA</span> },
              ]} />
            <Segmented label="Icons" value={style.headingIcons} onChange={(v) => set({ headingIcons: v as ResumeStyle["headingIcons"] })}
              options={[
                { value: "none", label: "None", glyph: <span className="text-[11px] leading-none opacity-40">×</span> },
                { value: "outline", label: "Outline", glyph: <Square size={11} /> },
                { value: "filled", label: "Filled", glyph: <Square size={11} fill="currentColor" /> },
              ]} />
            {style.headingIcons !== "none" && (
              <Stepper label="Icon size" value={style.headingIconSize || 13} min={9} max={22} step={1} suffix="px" onChange={(v) => set({ headingIconSize: v })} />
            )}
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
              options={[
                { value: "page", label: "Full page", glyph: <ScopeGlyph mode="page" accent={style.accentColor} /> },
                { value: "header", label: "Header", glyph: <ScopeGlyph mode="header" accent={style.accentColor} /> },
                { value: "border", label: "Border", glyph: <ScopeGlyph mode="border" accent={style.accentColor} /> },
              ]} />
            {style.colorScope === "header" && (
              <div className="space-y-1.5">
                <Label>Header fill</Label>
                <div className="flex items-center gap-2">
                  <input
                    type="color"
                    value={style.headerFillColor || "#eef2fb"}
                    onChange={(e) => set({ headerFillColor: e.target.value })}
                    aria-label="Header band color"
                    className="h-7 w-9 cursor-pointer rounded-md border border-[var(--color-border-strong)] bg-transparent p-0.5"
                  />
                  <button
                    onClick={() => set({ headerFillColor: "" })}
                    className={cn(
                      "rounded-md border px-2.5 py-1 text-xs font-medium transition-colors",
                      !style.headerFillColor
                        ? "border-signal text-signal"
                        : "border-[var(--color-border)] text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)]"
                    )}
                  >
                    Auto (from accent)
                  </button>
                </div>
              </div>
            )}
            <Segmented label="Palette" value={style.palette} onChange={(v) => set({ palette: v as ResumeStyle["palette"] })}
              options={[
                { value: "single", label: "Single", glyph: <span className="block h-3 w-3 rounded-sm" style={{ background: style.accentColor }} /> },
                { value: "image", label: "Image", glyph: <ImageIcon size={12} /> },
              ]} />
            {style.palette === "image" && (
              <div className="space-y-1.5">
                <Label>Background image URL</Label>
                <input className={INPUT} value={style.backgroundImage || ""} onChange={(e) => set({ backgroundImage: e.target.value })} placeholder="https://…" />
              </div>
            )}
            <div className="space-y-1.5">
              <Label>Accent color</Label>
              <div className="flex flex-wrap items-center gap-2">
                {SWATCHES.map((c) => (
                  <button
                    key={c}
                    onClick={() => set({ accentColor: c })}
                    aria-label={`Accent ${c}`}
                    className={cn(
                      "h-6 w-6 rounded-full border transition-transform hover:scale-110",
                      style.accentColor === c
                        ? "ring-2 ring-signal ring-offset-2 ring-offset-[var(--color-card)]"
                        : "border-[var(--color-border-strong)]"
                    )}
                    style={{ background: c }}
                  />
                ))}
                <input type="color" value={style.accentColor} onChange={(e) => set({ accentColor: e.target.value })}
                  className="h-7 w-7 cursor-pointer rounded-full bg-transparent" title="Custom color" />
              </div>
            </div>
            <div className="space-y-1.5">
              <Label>Apply accent to</Label>
              <div className="grid grid-cols-2 gap-1.5">
                {([
                  ["name", "Name"], ["jobTitle", "Job title"], ["headings", "Headings"],
                  ["headingsLine", "Headings line"], ["headerIcons", "Header icons"],
                  ["dates", "Dates"], ["subtitle", "Subtitle"],
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
              options={[
                { value: "left", label: "Left", glyph: <AlignGlyph /> },
                { value: "center", label: "Center", glyph: <AlignGlyph center /> },
              ]} />
            <Segmented label="Details arrangement" value={style.headerDetails} onChange={(v) => set({ headerDetails: v as ResumeStyle["headerDetails"] })}
              options={[
                { value: "icon", label: "Icon", glyph: <span className="flex items-center gap-0.5 text-[9px] leading-none"><MapPin size={9} /> a</span> },
                { value: "bullet", label: "Bullet", glyph: <span className="font-mono text-[10px] leading-none">a•b</span> },
                { value: "bar", label: "Bar", glyph: <span className="font-mono text-[10px] leading-none">a|b</span> },
              ]} />
          </>
        )}

        {pane === "photo" && (
          <>
            <Check label="Show photo" checked={style.showPhoto} onChange={(v) => set({ showPhoto: v })} />
            <Segmented label="Shape" value={style.photoShape} onChange={(v) => set({ photoShape: v as ResumeStyle["photoShape"] })}
              options={[
                { value: "circle", label: "Circle", glyph: <span className="block h-3.5 w-3.5 rounded-full bg-current opacity-60" /> },
                { value: "rounded", label: "Rounded", glyph: <span className="block h-3.5 w-3.5 rounded bg-current opacity-60" /> },
                { value: "square", label: "Square", glyph: <span className="block h-3.5 w-3.5 bg-current opacity-60" /> },
              ]} />
            <Stepper label="Size" value={style.photoSize} min={48} max={160} step={4} suffix="px" onChange={(v) => set({ photoSize: v })} />
            <p className="m-0 text-xs text-[var(--color-text-secondary)]">
              The image itself lives in the header's personal details, synced from the
              portfolio's avatar or set per document.
            </p>
          </>
        )}

        {pane === "links" && (
          <>
            <Check label="Underline" checked={style.linkUnderline} onChange={(v) => set({ linkUnderline: v })} />
            <Check label="Colored" checked={style.linkColored} onChange={(v) => set({ linkColored: v })} />
            <Check label="Link icon" checked={style.linkIcon} onChange={(v) => set({ linkIcon: v })} />
            <Segmented label="Icon style" value={style.linkIconStyle} onChange={(v) => set({ linkIconStyle: v as ResumeStyle["linkIconStyle"] })}
              options={[
                { value: "chain", label: "Chain", glyph: <Link2 size={11} /> },
                { value: "external", label: "External", glyph: <ExternalLink size={11} /> },
              ]} />
          </>
        )}

        {pane === "footer" && (
          <>
            <div className="space-y-1.5">
              <Label>Footer text</Label>
              <input className={INPUT} value={style.footerText} onChange={(e) => set({ footerText: e.target.value })} placeholder="e.g. References available on request" />
              <p className="m-0 text-xs text-[var(--color-text-secondary)]">
                Pinned to the bottom of the final page, wherever the content ends.
              </p>
            </div>
            <Check label="Show page numbers" checked={style.showPageNumbers} onChange={(v) => set({ showPageNumbers: v })} />
          </>
        )}

        {pane === "sections" && (
          <div className="space-y-3">
            {sections.filter((s) => SECTION_LAYOUTS[s.customType === "skill" ? "skills" : s.kind]).length === 0 && (
              <p className="text-sm text-[var(--color-text-secondary)]">
                No sections with layout options. Skills, languages, certificates, and interests support grid, rows, compact, and bubble layouts.
              </p>
            )}
            {sections.map((s) => {
              const opts = SECTION_LAYOUTS[s.customType === "skill" ? "skills" : s.kind];
              if (!opts) return null;
              return (
                <div key={s.id} className="space-y-1.5">
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

const HEADING_STYLE_LABELS = ["Rule", "Tab", "Plain", "Framed", "Filled", "Edge"];

// ── option glyphs: tiny honest previews of what each choice does ────────────

const Bar = ({ w, faint }: { w: string; faint?: boolean }) => (
  <span className={cn("block h-[3px] rounded-full bg-current", w, faint ? "opacity-40" : "opacity-70")} />
);

function ColumnsGlyph({ mode }: { mode: "one" | "two" | "mix" }) {
  if (mode === "one")
    return (
      <span className="flex w-7 flex-col gap-[2px]">
        <Bar w="w-full" /><Bar w="w-5/6" /><Bar w="w-full" />
      </span>
    );
  if (mode === "two")
    return (
      <span className="grid w-7 grid-cols-2 gap-x-[3px] gap-y-[2px]">
        <Bar w="w-full" /><Bar w="w-full" /><Bar w="w-5/6" /><Bar w="w-4/6" />
      </span>
    );
  return (
    <span className="flex w-7 flex-col gap-[2px]">
      <Bar w="w-full" />
      <span className="grid grid-cols-2 gap-x-[3px] gap-y-[2px]">
        <Bar w="w-full" /><Bar w="w-5/6" />
      </span>
    </span>
  );
}

function EntryGlyph({ variant }: { variant: 1 | 2 | 3 }) {
  if (variant === 1)
    return (
      <span className="flex w-9 flex-col gap-[2px]">
        <span className="flex items-center justify-between"><Bar w="w-4" /><Bar w="w-2" faint /></span>
        <Bar w="w-6" faint />
      </span>
    );
  if (variant === 2)
    return (
      <span className="flex w-9 flex-col gap-[2px]">
        <Bar w="w-4" />
        <Bar w="w-6" faint />
        <Bar w="w-2" faint />
      </span>
    );
  return (
    <span className="flex w-9 items-center gap-[3px]">
      <Bar w="w-3" /><Bar w="w-2" faint /><Bar w="w-2" faint />
    </span>
  );
}

function PlacementGlyph({ same }: { same?: boolean }) {
  if (same)
    return (
      <span className="flex w-8 items-center gap-[3px]"><Bar w="w-3" /><Bar w="w-3" faint /></span>
    );
  return (
    <span className="flex w-8 flex-col gap-[2px]"><Bar w="w-4" /><Bar w="w-3" faint /></span>
  );
}

function AlignGlyph({ center }: { center?: boolean }) {
  return (
    <span className={cn("flex w-8 flex-col gap-[2px]", center ? "items-center" : "items-start")}>
      <Bar w="w-5" /><Bar w="w-3" faint />
    </span>
  );
}

function HeadingGlyph({ variant, accent }: { variant: 1 | 2 | 3 | 4 | 5 | 6; accent: string }) {
  const text = <span className="text-[10px] font-semibold leading-none">Aa</span>;
  switch (variant) {
    case 1:
      return <span className="block border-b pb-[2px] px-1" style={{ borderColor: accent }}>{text}</span>;
    case 2:
      return <span className="inline-block border-b-2 pb-px" style={{ borderColor: accent }}>{text}</span>;
    case 3:
      return text;
    case 4:
      return <span className="border-y py-[2px]" style={{ borderColor: accent }}>{text}</span>;
    case 5:
      return <span className="rounded-sm px-1 py-[2px]" style={{ background: `${accent}26` }}>{text}</span>;
    case 6:
      return <span className="border-l-2 pl-1" style={{ borderColor: accent }}>{text}</span>;
  }
}

function ScopeGlyph({ mode, accent }: { mode: "page" | "header" | "border"; accent: string }) {
  return (
    <span
      className="block h-4 w-6 overflow-hidden rounded-[2px] border border-[var(--color-border-strong)]"
      style={{
        background: mode === "page" ? `${accent}2e` : "#fff",
        borderLeft: mode === "border" ? `3px solid ${accent}` : undefined,
      }}
    >
      {mode === "header" && <span className="block h-[6px] w-full" style={{ background: `${accent}55` }} />}
    </span>
  );
}

// ── template thumbnail ──────────────────────────────────────────────────────

/** A real typeset miniature: the actual sheet renderer at small scale, fed
 *  a fixed sample document, so choosing a template means seeing it set. */
function TemplateThumb({ preset }: { preset: TemplatePreset }) {
  const ref = useRef<HTMLDivElement>(null);
  const [scale, setScale] = useState(0.26);
  const doc = useMemo(
    () => sampleDocument({ ...preset.style, template: preset.key, pageFormat: "A4" }),
    [preset]
  );

  // Fit the 210mm sheet to whatever width the card actually has.
  useLayoutEffect(() => {
    const el = ref.current;
    if (!el) return;
    const measure = () => setScale(el.clientWidth / 794);
    measure();
    const ro = new ResizeObserver(measure);
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  return (
    <div
      ref={ref}
      className="relative h-56 w-full overflow-hidden rounded-[3px] border border-[var(--color-border)] bg-white"
      aria-hidden
    >
      <div className="pointer-events-none origin-top-left" style={{ transform: `scale(${scale})`, width: 794 }}>
        <ResumeSheet doc={doc} />
      </div>
    </div>
  );
}

// ── reusable controls ───────────────────────────────────────────────────────

const INPUT =
  "w-full px-3 py-2 bg-[var(--color-input-bg)] border border-[var(--color-border)] rounded-lg text-sm text-[var(--color-text-primary)] outline-none focus:border-signal";

const Label = ({ children }: { children: React.ReactNode }) => (
  <label className="block font-mono text-[10px] font-medium uppercase tracking-[0.12em] text-[var(--color-text-secondary)]">
    {children}
  </label>
);

function Stepper({ label, value, min, max, step, suffix, prefix, onChange }: {
  label: string; value: number; min: number; max: number; step: number;
  suffix?: string; prefix?: string; onChange: (v: number) => void;
}) {
  const clamp = (v: number) => Math.min(max, Math.max(min, Math.round(v / step) * step));
  return (
    <div className="select-none space-y-1.5">
      <div className="flex items-baseline justify-between">
        <Label>{label}</Label>
        <span className="font-mono text-[11px] text-[var(--color-text-primary)]">
          {prefix}{Number.isInteger(value) ? value : value.toFixed(2).replace(/0+$/, "").replace(/\.$/, "")}{suffix}
        </span>
      </div>
      <div className="flex items-center gap-2">
        <button
          onClick={() => onChange(clamp(value - step))}
          onMouseDown={(e) => e.preventDefault()}
          aria-label={`Decrease ${label}`}
          className="rounded-md border border-[var(--color-border)] p-1 text-[var(--color-text-secondary)] transition-colors hover:border-signal hover:text-signal"
        >
          <Minus size={13} />
        </button>
        {/* A real range input: draggable, keyboard-accessible, smooth. */}
        <input
          type="range"
          min={min}
          max={max}
          step={step}
          value={value}
          onChange={(e) => onChange(clamp(Number(e.target.value)))}
          aria-label={label}
          className="h-1 flex-1 cursor-pointer accent-signal"
        />
        <button
          onClick={() => onChange(clamp(value + step))}
          onMouseDown={(e) => e.preventDefault()}
          aria-label={`Increase ${label}`}
          className="rounded-md border border-[var(--color-border)] p-1 text-[var(--color-text-secondary)] transition-colors hover:border-signal hover:text-signal"
        >
          <Plus size={13} />
        </button>
      </div>
    </div>
  );
}

function Segmented({ label, value, options, onChange }: {
  label?: string;
  value: string;
  options: { value: string; label: string; glyph?: React.ReactNode }[];
  onChange: (v: string) => void;
}) {
  const hasGlyphs = options.some((o) => o.glyph);
  return (
    <div className="space-y-1.5">
      {label && <Label>{label}</Label>}
      <div className="inline-flex flex-wrap overflow-hidden rounded-md border border-[var(--color-border)]">
        {options.map((o) => (
          <button
            key={o.value}
            onClick={() => onChange(o.value)}
            className={cn(
              "border-r border-[var(--color-border)] text-xs font-medium transition-colors last:border-r-0",
              hasGlyphs
                ? "flex min-w-14 flex-col items-center justify-end gap-1.5 px-2.5 py-2"
                : "px-3 py-1.5",
              value === o.value
                ? "bg-[var(--color-text-primary)] text-[var(--color-background)]"
                : "text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)]"
            )}
          >
            {o.glyph}
            <span className={hasGlyphs ? "text-[10px] leading-none" : undefined}>{o.label}</span>
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
    <div className="space-y-1.5">
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
      className={cn("group flex items-center gap-2 text-left", compact ? "text-xs" : "text-sm")}
    >
      {/* Data is square: a 3px-radius check, not a pill. */}
      <span
        className={cn(
          "flex h-4 w-4 items-center justify-center rounded-[3px] border transition-colors",
          checked
            ? "border-signal bg-signal text-white"
            : "border-[var(--color-border-strong)] group-hover:border-signal"
        )}
      >
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
      className="flex items-center gap-2 rounded-md border border-[var(--color-border)] bg-[var(--color-input-bg)] px-2 py-1.5">
      <button
        onPointerDown={(e) => controls.start(e)}
        aria-label={`Reorder ${section.heading}`}
        className="cursor-grab touch-none text-[var(--color-text-secondary)] hover:text-signal"
      >
        <GripVertical size={14} />
      </button>
      <span className="truncate text-sm text-[var(--color-text-primary)]">{section.heading}</span>
      {!section.visible && (
        <span className="ml-auto font-mono text-[9px] uppercase tracking-wide text-[var(--color-text-secondary)] opacity-60">
          hidden
        </span>
      )}
    </Reorder.Item>
  );
}
