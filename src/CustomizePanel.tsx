import { useLayoutEffect, useMemo, useRef, useState } from "react";
import { Reorder, useDragControls } from "framer-motion";
import {
  Minus, Plus, GripVertical, Check as CheckIcon, Eye, RotateCcw,
  Link2, ExternalLink, MapPin, Image as ImageIcon, Square,
} from "lucide-react";
import { DocumentKind, ResumeSection, ResumeStyle } from "@/types/resume";
import { DEFAULT_STYLE, SECTION_CATALOG, TEMPLATE_PRESETS, FONT_OPTIONS, sampleDocument, sectionRegion, type TemplatePreset } from "@/lib/resumeDefaults";
import { ResumeSheet } from "@/preview/ResumePreview";
import { ConfirmDialog } from "./components/ConfirmDialog";
import { cn } from "@/lib/utils";

interface CustomizePanelProps {
  style: ResumeStyle;
  /** The active document's kind; templates are offered per kind. */
  docKind: DocumentKind;
  onStyleChange: (style: ResumeStyle) => void;
  sections: ResumeSection[];
  onSectionsChange: (sections: ResumeSection[]) => void;
  /** When on, the live preview typesets the sample document instead of the record. */
  sampleMode: boolean;
  onSampleModeChange: (on: boolean) => void;
}

// Eight dense panes instead of fourteen thin ones: each pane owns a whole
// concern and fills its canvas, clustered under mono micro-headers.
type Pane =
  | "templates" | "page" | "type" | "entries"
  | "headings" | "colors" | "header" | "finish";

const NAV: { group: string; items: { id: Pane; label: string }[] }[] = [
  { group: "Page", items: [{ id: "templates", label: "Templates" }, { id: "page", label: "Page" }] },
  { group: "Type", items: [{ id: "type", label: "Type" }] },
  { group: "Structure", items: [{ id: "entries", label: "Entries" }, { id: "headings", label: "Headings" }] },
  { group: "Identity", items: [{ id: "colors", label: "Colors" }, { id: "header", label: "Header" }] },
  { group: "Finish", items: [{ id: "finish", label: "Finish" }] },
];

const PANE_HINTS: Record<Pane, string> = {
  templates: "Start from a look, then tune anything below.",
  page: "The physical sheet: language, dates, size, and the column plan.",
  type: "The whole typographic spec: faces, sizes, and rhythm.",
  entries: "How each item lays out, and each section's body shape.",
  headings: "The section titles: decoration, case, and icons.",
  colors: "The accent, where it lands, and the page treatment.",
  header: "The name block: alignment, details, and the portrait.",
  finish: "Links on paper, the running footer, page numbers.",
};

/** Which style fields each pane owns, so its Reset restores exactly those. */
const PANE_FIELDS: Record<Pane, (keyof ResumeStyle)[]> = {
  templates: [],
  page: ["language", "dateFormat", "pageFormat", "columns"],
  type: ["bodyFont", "nameFont", "baseFontSize", "nameFontSize", "headingFontSize", "entryHeaderFontSize", "lineHeight", "elementSpacing", "marginX", "marginY"],
  entries: ["entryLayout", "subtitleStyle", "subtitlePlacement", "indentBody", "listStyle"],
  headings: ["headingStyle", "headingCase", "headingIcons", "headingIconSize"],
  colors: ["colorScope", "palette", "accentColor", "headerFillColor", "backgroundImage", "accentApply"],
  header: ["headerAlign", "headerDetails", "showPhoto", "photoShape", "photoSize"],
  finish: ["linkUnderline", "linkColored", "linkIcon", "linkIconStyle", "footerText", "showPageNumbers"],
};

const SWATCHES = [
  "#2563eb", "#7c3aed", "#0f766e", "#be123c", "#ea580c", "#16a34a",
  "#0891b2", "#4f46e5", "#db2777", "#374151", "#111827", "#a16207",
];

export const CustomizePanel = ({ style, docKind, onStyleChange, sections, onSectionsChange, sampleMode, onSampleModeChange }: CustomizePanelProps) => {
  const [pane, setPane] = useState<Pane>("templates");
  const [confirmResetAll, setConfirmResetAll] = useState(false);
  const set = (patch: Partial<ResumeStyle>) => onStyleChange({ ...style, ...patch });
  const setAccent = (patch: Partial<ResumeStyle["accentApply"]>) =>
    set({ accentApply: { ...style.accentApply, ...patch } });

  const paneLabel = NAV.flatMap((g) => g.items).find((i) => i.id === pane)?.label ?? "";

  /** Per-section layout overrides back to the catalog defaults. */
  const resetSectionLayouts = () =>
    onSectionsChange(
      sections.map((s) => ({
        ...s,
        layout: SECTION_CATALOG[s.customType === "skill" ? "skills" : s.kind]?.layout,
      }))
    );
  /** Sidebar region assignments back to the per-kind defaults. */
  const resetRegions = () => onSectionsChange(sections.map((s) => ({ ...s, region: undefined })));

  const resetPane = () => {
    const fields = PANE_FIELDS[pane];
    if (fields.length) {
      const patch: Partial<ResumeStyle> = {};
      for (const f of fields) {
        (patch as Record<string, unknown>)[f] = structuredClone(DEFAULT_STYLE[f]);
      }
      set(patch);
    }
    // Merged panes own their section-level overrides too.
    if (pane === "entries") resetSectionLayouts();
    if (pane === "page") resetRegions();
  };

  const resetAll = () => {
    onStyleChange(structuredClone(DEFAULT_STYLE));
    onSectionsChange(
      sections.map((s) => ({
        ...s,
        layout: SECTION_CATALOG[s.customType === "skill" ? "skills" : s.kind]?.layout,
        region: undefined,
      }))
    );
  };

  const sectionsWithLayouts = sections.filter(
    (s) => SECTION_LAYOUTS[s.customType === "skill" ? "skills" : s.kind]
  );

  return (
    <div className="bg-[var(--color-card)] border border-[var(--color-border)] rounded-xl flex min-h-[420px]">
      {/* Sub-nav: grouped like the document itself. */}
      <nav className="flex w-28 flex-shrink-0 flex-col border-r border-dashed border-[var(--color-border)] py-2 overflow-y-auto">
        {NAV.map((g) => (
          <div key={g.group} className="mb-1">
            <p className="m-0 px-3 pb-0.5 pt-2 font-mono text-[9px] uppercase tracking-[0.14em] text-[var(--color-text-secondary)] opacity-60">
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
        {/* The nuclear option: every setting in every pane back to stock. */}
        <button
          onClick={() => setConfirmResetAll(true)}
          className="mx-2 mt-auto flex items-center justify-center gap-1 rounded-md border border-[var(--color-border)] px-2 py-1.5 font-mono text-[9.5px] uppercase tracking-[0.08em] text-[var(--color-text-secondary)] transition-colors hover:border-red-400 hover:text-red-500"
          title="Reset every Customize setting to its default"
        >
          <RotateCcw size={11} /> Reset all
        </button>
      </nav>

      {/* Pane */}
      <div className="flex-1 overflow-y-auto p-4">
        <div className="mb-3 flex items-start justify-between gap-3 border-b border-dashed border-[var(--color-border)] pb-2">
          <div>
            <h3 className="m-0 text-[13px] font-semibold text-[var(--color-text-primary)]">{paneLabel}</h3>
            <p className="m-0 mt-0.5 text-[11px] text-[var(--color-text-secondary)]">{PANE_HINTS[pane]}</p>
          </div>
          {pane !== "templates" && (
            <button
              onClick={resetPane}
              className="flex shrink-0 items-center gap-1 rounded-md border border-[var(--color-border)] px-2 py-1 font-mono text-[9.5px] uppercase tracking-[0.08em] text-[var(--color-text-secondary)] transition-colors hover:border-signal hover:text-signal"
              title={`Reset the ${paneLabel} settings to their defaults`}
            >
              <RotateCcw size={11} /> Reset
            </button>
          )}
        </div>

        {pane === "templates" && (
          <div className="space-y-3">
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
              {TEMPLATE_PRESETS.filter((t) => t.kinds.includes(docKind)).map((t) => (
                <button
                  key={t.key}
                  // A template is a complete look: build it on the DEFAULTS,
                  // never on the current style, so nothing from the previous
                  // template (a dark rail fill, a photo toggle) leaks through.
                  // The Page-pane basics survive unless the preset says
                  // otherwise.
                  onClick={() =>
                    onStyleChange({
                      ...structuredClone(DEFAULT_STYLE),
                      language: style.language,
                      pageFormat: style.pageFormat,
                      dateFormat: style.dateFormat,
                      ...t.style,
                      template: t.key,
                    })
                  }
                  className={cn(
                    "rounded-lg border p-2 text-left transition-colors",
                    style.template === t.key
                      ? "border-signal ring-1 ring-signal/40"
                      : "border-[var(--color-border)] hover:border-[var(--color-border-strong)]"
                  )}
                >
                  <TemplateThumb preset={t} />
                  <span className="mt-1.5 block text-sm font-medium text-[var(--color-text-primary)]">{t.label}</span>
                  <span className="mt-0.5 block text-[11px] leading-snug text-[var(--color-text-secondary)]">
                    {t.description}
                  </span>
                </button>
              ))}
            </div>
          </div>
        )}

        {pane === "page" && (
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-x-4 gap-y-3">
              <Select label="Language" value={style.language} onChange={(v) => set({ language: v })}
                options={["Azerbaijani", "English", "English (UK)", "French", "German", "Spanish", "Turkish"]} />
              <Select label="Date format" value={style.dateFormat} onChange={(v) => set({ dateFormat: v })}
                options={["MMM YYYY", "MMM DD, YYYY", "MM/YYYY", "YYYY"]} />
            </div>
            <Tiles label="Page size" value={style.pageFormat} onChange={(v) => set({ pageFormat: v as ResumeStyle["pageFormat"] })}
              options={[
                { value: "A3", label: "A3" }, { value: "A4", label: "A4" }, { value: "A5", label: "A5" },
                { value: "Letter", label: "Letter" }, { value: "Legal", label: "Legal" },
              ]} />
            <Tiles label="Columns" value={style.columns} onChange={(v) => set({ columns: v as ResumeStyle["columns"] })}
              hint={style.columns === "sidebar"
                ? "Sidebar sets a tinted rail beside the main flow; assign each section below. The rail's fill is under Colors."
                : "Mix keeps two columns but lets the summary and declaration span the full width."}
              options={[
                { value: "one", label: "One", glyph: <ColumnsGlyph mode="one" /> },
                { value: "two", label: "Two", glyph: <ColumnsGlyph mode="two" /> },
                { value: "mix", label: "Mix", glyph: <ColumnsGlyph mode="mix" /> },
                { value: "sidebar", label: "Sidebar", glyph: <ColumnsGlyph mode="sidebar" /> },
              ]} />
            <Cluster title="Section order">
              <Reorder.Group axis="y" values={sections} onReorder={onSectionsChange} className="space-y-1">
                {sections.map((s) => (
                  <OrderRow
                    key={s.id}
                    section={s}
                    region={style.columns === "sidebar" ? sectionRegion(s) : undefined}
                    onRegionToggle={() =>
                      onSectionsChange(
                        sections.map((x) =>
                          x.id === s.id
                            ? { ...x, region: sectionRegion(x) === "side" ? "main" as const : "side" as const }
                            : x
                        )
                      )
                    }
                  />
                ))}
              </Reorder.Group>
            </Cluster>
          </div>
        )}

        {pane === "type" && (
          <div className="space-y-4">
            <Cluster title="Family">
              <div className="grid grid-cols-2 gap-x-4">
                <Select label="Body font" value={style.bodyFont} onChange={(v) => set({ bodyFont: v })}
                  options={FONT_OPTIONS.map((f) => f.label)} />
                <Select label="Name font" value={style.nameFont || ""} onChange={(v) => set({ nameFont: v })}
                  options={["", ...FONT_OPTIONS.map((f) => f.label)]}
                  optionLabels={{ "": "Same as body" }} />
              </div>
            </Cluster>
            <Cluster title="Size">
              <GaugeGroup>
                <Gauge label="Base" value={style.baseFontSize} min={7} max={14} step={0.5} suffix="pt" onChange={(v) => set({ baseFontSize: v })} />
                <Gauge label="Name" value={style.nameFontSize} min={0} max={24} step={1} prefix="+" suffix="pt" onChange={(v) => set({ nameFontSize: v })} />
                <Gauge label="Headings" value={style.headingFontSize} min={0} max={12} step={1} prefix="+" suffix="pt" onChange={(v) => set({ headingFontSize: v })} />
                <Gauge label="Entries" value={style.entryHeaderFontSize} min={0} max={8} step={1} prefix="+" suffix="pt" onChange={(v) => set({ entryHeaderFontSize: v })} />
              </GaugeGroup>
            </Cluster>
            <Cluster title="Rhythm">
              <GaugeGroup>
                <Gauge label="Leading" value={style.lineHeight} min={1} max={2} step={0.05} onChange={(v) => set({ lineHeight: v })} />
                <Gauge label="Gaps" value={style.elementSpacing} min={0} max={24} step={1} suffix="px" onChange={(v) => set({ elementSpacing: v })} />
                <Gauge label="Margin X" value={style.marginX} min={4} max={30} step={1} suffix="mm" onChange={(v) => set({ marginX: v })} />
                <Gauge label="Margin Y" value={style.marginY} min={4} max={30} step={1} suffix="mm" onChange={(v) => set({ marginY: v })} />
              </GaugeGroup>
            </Cluster>
          </div>
        )}

        {pane === "entries" && (
          <div className="space-y-4">
            <Tiles label="Entry layout" value={String(style.entryLayout)} onChange={(v) => set({ entryLayout: Number(v) as ResumeStyle["entryLayout"] })}
              options={[
                { value: "1", label: "Date right", glyph: <EntryGlyph variant={1} /> },
                { value: "2", label: "Stacked", glyph: <EntryGlyph variant={2} /> },
                { value: "3", label: "One line", glyph: <EntryGlyph variant={3} /> },
              ]} />
            <div className="grid grid-cols-2 gap-x-4 gap-y-3">
              <Tiles label="Subtitle style" value={style.subtitleStyle} onChange={(v) => set({ subtitleStyle: v as ResumeStyle["subtitleStyle"] })}
                options={[
                  { value: "normal", label: "Normal", glyph: <span className="text-[11px] leading-none">Co</span> },
                  { value: "bold", label: "Bold", glyph: <span className="text-[11px] font-bold leading-none">Co</span> },
                  { value: "italic", label: "Italic", glyph: <span className="text-[11px] italic leading-none">Co</span> },
                ]} />
              <Tiles label="Subtitle placement" value={style.subtitlePlacement} onChange={(v) => set({ subtitlePlacement: v as ResumeStyle["subtitlePlacement"] })}
                options={[
                  { value: "same", label: "Same line", glyph: <PlacementGlyph same /> },
                  { value: "next", label: "Next line", glyph: <PlacementGlyph /> },
                ]} />
              <Tiles label="List style" value={style.listStyle} onChange={(v) => set({ listStyle: v as ResumeStyle["listStyle"] })}
                options={[
                  { value: "bullet", label: "Bullet", glyph: <span className="font-mono text-[11px] leading-none">•</span> },
                  { value: "hyphen", label: "Hyphen", glyph: <span className="font-mono text-[11px] leading-none">–</span> },
                ]} />
              <div className="flex items-end pb-2.5">
                <Check label="Indent body text" checked={style.indentBody} onChange={(v) => set({ indentBody: v })} />
              </div>
            </div>
            <Cluster title="Section bodies">
              {sectionsWithLayouts.length === 0 ? (
                <p className="m-0 text-[11px] text-[var(--color-text-secondary)]">
                  No sections with body options. Skills, languages, certificates, interests, and references carry them.
                </p>
              ) : (
                <div className="divide-y divide-dashed divide-[var(--color-border)] rounded-lg border border-[var(--color-border)]">
                  {sectionsWithLayouts.map((s) => {
                    const opts = SECTION_LAYOUTS[s.customType === "skill" ? "skills" : s.kind]!;
                    return (
                      <div key={s.id} className="flex items-center justify-between gap-3 px-2.5 py-1.5">
                        <span className="truncate text-xs text-[var(--color-text-primary)]">{s.heading}</span>
                        <Tiles
                          value={s.layout || opts[0]}
                          onChange={(v) => onSectionsChange(sections.map((x) => (x.id === s.id ? { ...x, layout: v as ResumeSection["layout"] } : x)))}
                          options={opts.map((o) => ({ value: o, label: o[0].toUpperCase() + o.slice(1) }))}
                          dense
                        />
                      </div>
                    );
                  })}
                </div>
              )}
            </Cluster>
          </div>
        )}

        {pane === "headings" && (
          <div className="space-y-4">
            <Tiles label="Decoration" value={String(style.headingStyle)} onChange={(v) => set({ headingStyle: Number(v) as ResumeStyle["headingStyle"] })}
              options={[1, 2, 3, 4, 5, 6].map((n) => ({
                value: String(n),
                label: HEADING_STYLE_LABELS[n - 1],
                glyph: <HeadingGlyph variant={n as 1 | 2 | 3 | 4 | 5 | 6} accent={style.accentColor} />,
              }))} />
            <div className="grid grid-cols-2 gap-x-4 gap-y-3">
              <Tiles label="Capitalization" value={style.headingCase} onChange={(v) => set({ headingCase: v as ResumeStyle["headingCase"] })}
                options={[
                  { value: "capitalize", label: "Capitalize", glyph: <span className="text-[11px] leading-none">Aa</span> },
                  { value: "uppercase", label: "Uppercase", glyph: <span className="text-[10px] font-semibold leading-none tracking-wide">AA</span> },
                ]} />
              <Tiles label="Icons" value={style.headingIcons} onChange={(v) => set({ headingIcons: v as ResumeStyle["headingIcons"] })}
                options={[
                  { value: "none", label: "None", glyph: <span className="text-[11px] leading-none opacity-40">×</span> },
                  { value: "outline", label: "Outline", glyph: <Square size={11} /> },
                  { value: "filled", label: "Filled", glyph: <Square size={11} fill="currentColor" /> },
                ]} />
            </div>
            {style.headingIcons !== "none" && (
              <GaugeGroup>
                <Gauge label="Icon size" value={style.headingIconSize || 13} min={9} max={22} step={1} suffix="px" onChange={(v) => set({ headingIconSize: v })} />
              </GaugeGroup>
            )}
          </div>
        )}

        {pane === "colors" && (
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-x-4 gap-y-3">
              <Tiles label="Color scope" value={style.colorScope} onChange={(v) => set({ colorScope: v as ResumeStyle["colorScope"] })}
                options={[
                  { value: "page", label: "Page", glyph: <ScopeGlyph mode="page" accent={style.accentColor} /> },
                  { value: "header", label: "Header", glyph: <ScopeGlyph mode="header" accent={style.accentColor} /> },
                  { value: "border", label: "Border", glyph: <ScopeGlyph mode="border" accent={style.accentColor} /> },
                ]} />
              <Tiles label="Palette" value={style.palette} onChange={(v) => set({ palette: v as ResumeStyle["palette"] })}
                options={[
                  { value: "single", label: "Single", glyph: <span className="block h-3 w-3 rounded-[2px]" style={{ background: style.accentColor }} /> },
                  { value: "image", label: "Image", glyph: <ImageIcon size={12} /> },
                ]} />
            </div>
            {(style.colorScope === "header" || style.columns === "sidebar") && (
              <div className="flex items-center gap-2">
                <Label>{style.columns === "sidebar" ? "Rail & header fill" : "Header fill"}</Label>
                <input
                  type="color"
                  value={style.headerFillColor || "#eef2fb"}
                  onChange={(e) => set({ headerFillColor: e.target.value })}
                  aria-label="Header band color"
                  className="h-6 w-8 cursor-pointer rounded-[3px] border border-[var(--color-border-strong)] bg-transparent p-0.5"
                />
                <button
                  onClick={() => set({ headerFillColor: "" })}
                  className={cn(
                    "rounded-md border px-2 py-0.5 text-[11px] font-medium transition-colors",
                    !style.headerFillColor
                      ? "border-signal text-signal"
                      : "border-[var(--color-border)] text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)]"
                  )}
                >
                  Auto (from accent)
                </button>
              </div>
            )}
            {style.palette === "image" && (
              <div className="space-y-1.5">
                <Label>Background image URL</Label>
                <input className={INPUT} value={style.backgroundImage || ""} onChange={(e) => set({ backgroundImage: e.target.value })} placeholder="https://…" />
              </div>
            )}
            <Cluster title="Accent">
              <div className="flex flex-wrap items-center gap-1.5">
                {SWATCHES.map((c) => (
                  <button
                    key={c}
                    onClick={() => set({ accentColor: c })}
                    aria-label={`Accent ${c}`}
                    className={cn(
                      "relative h-7 w-7 rounded-[3px] border transition-transform hover:scale-105",
                      style.accentColor === c ? "border-transparent" : "border-[var(--color-border-strong)]"
                    )}
                    style={{ background: c }}
                  >
                    {style.accentColor === c && (
                      <span className="absolute inset-0 rounded-[3px] ring-2 ring-signal ring-offset-2 ring-offset-[var(--color-card)]" />
                    )}
                  </button>
                ))}
                <input type="color" value={style.accentColor} onChange={(e) => set({ accentColor: e.target.value })}
                  className="h-7 w-7 cursor-pointer rounded-[3px] bg-transparent" title="Custom color" />
              </div>
            </Cluster>
            <Cluster title="Apply accent to">
              <div className="grid grid-cols-3 gap-x-3 gap-y-1.5">
                {([
                  ["name", "Name"], ["jobTitle", "Job title"], ["headings", "Headings"],
                  ["headingsLine", "Heading line"], ["headerIcons", "Header icons"],
                  ["dates", "Dates"], ["subtitle", "Subtitle"],
                  ["linkIcons", "Link icons"],
                ] as const).map(([k, lbl]) => (
                  <Check key={k} label={lbl} checked={style.accentApply[k]} onChange={(v) => setAccent({ [k]: v })} compact />
                ))}
              </div>
            </Cluster>
          </div>
        )}

        {pane === "header" && (
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-x-4 gap-y-3">
              <Tiles label="Alignment" value={style.headerAlign} onChange={(v) => set({ headerAlign: v as ResumeStyle["headerAlign"] })}
                options={[
                  { value: "left", label: "Left", glyph: <AlignGlyph /> },
                  { value: "center", label: "Center", glyph: <AlignGlyph center /> },
                ]} />
              <Tiles label="Details" value={style.headerDetails} onChange={(v) => set({ headerDetails: v as ResumeStyle["headerDetails"] })}
                options={[
                  { value: "icon", label: "Icon", glyph: <span className="flex items-center gap-0.5 text-[9px] leading-none"><MapPin size={9} /> a</span> },
                  { value: "bullet", label: "Bullet", glyph: <span className="font-mono text-[10px] leading-none">a•b</span> },
                  { value: "bar", label: "Bar", glyph: <span className="font-mono text-[10px] leading-none">a|b</span> },
                ]} />
            </div>
            <Cluster title="Portrait">
              <div className="space-y-3">
                <div className="grid grid-cols-2 items-end gap-x-4">
                  <Tiles label="Shape" value={style.photoShape} onChange={(v) => set({ photoShape: v as ResumeStyle["photoShape"] })}
                    options={[
                      { value: "circle", label: "Circle", glyph: <span className="block h-3.5 w-3.5 rounded-full bg-current opacity-60" /> },
                      { value: "rounded", label: "Rounded", glyph: <span className="block h-3.5 w-3.5 rounded bg-current opacity-60" /> },
                      { value: "square", label: "Square", glyph: <span className="block h-3.5 w-3.5 bg-current opacity-60" /> },
                    ]} />
                  <div className="pb-2.5">
                    <Check label="Show photo" checked={style.showPhoto} onChange={(v) => set({ showPhoto: v })} />
                  </div>
                </div>
                <GaugeGroup>
                  <Gauge label="Size" value={style.photoSize} min={48} max={160} step={4} suffix="px" onChange={(v) => set({ photoSize: v })} />
                </GaugeGroup>
                <p className="m-0 text-[11px] text-[var(--color-text-secondary)]">
                  The image itself lives in the header's personal details, synced from the portfolio's avatar or set per document.
                </p>
              </div>
            </Cluster>
          </div>
        )}

        {pane === "finish" && (
          <div className="space-y-4">
            <Cluster title="Links">
              <div className="grid grid-cols-2 items-end gap-x-4 gap-y-3">
                <div className="space-y-2 pb-1">
                  <Check label="Underline" checked={style.linkUnderline} onChange={(v) => set({ linkUnderline: v })} />
                  <Check label="Accent colored" checked={style.linkColored} onChange={(v) => set({ linkColored: v })} />
                  <Check label="Show link icon" checked={style.linkIcon} onChange={(v) => set({ linkIcon: v })} />
                </div>
                <Tiles label="Icon style" value={style.linkIconStyle} onChange={(v) => set({ linkIconStyle: v as ResumeStyle["linkIconStyle"] })}
                  options={[
                    { value: "chain", label: "Chain", glyph: <Link2 size={11} /> },
                    { value: "external", label: "External", glyph: <ExternalLink size={11} /> },
                  ]} />
              </div>
            </Cluster>
            <Cluster title="Footer">
              <div className="space-y-2">
                <input className={INPUT} value={style.footerText} onChange={(e) => set({ footerText: e.target.value })} placeholder="e.g. References available on request" />
                <div className="flex items-center justify-between gap-3">
                  <Check label="Show page numbers" checked={style.showPageNumbers} onChange={(v) => set({ showPageNumbers: v })} />
                  <p className="m-0 text-[11px] text-[var(--color-text-secondary)]">
                    Runs in the bottom margin of every page.
                  </p>
                </div>
              </div>
            </Cluster>
          </div>
        )}
      </div>

      <ConfirmDialog
        open={confirmResetAll}
        title="Reset every setting?"
        message="Every Customize setting: template, fonts, colors, layout, section options, returns to its default. Your content is untouched. This cannot be undone."
        confirmLabel="Reset all"
        danger
        onConfirm={() => {
          resetAll();
          setConfirmResetAll(false);
        }}
        onCancel={() => setConfirmResetAll(false)}
      />
    </div>
  );
};

// Per-kind layout options offered under Entries → Section bodies.
const SECTION_LAYOUTS: Partial<Record<string, NonNullable<ResumeSection["layout"]>[]>> = {
  skills: ["compact", "bubble"],
  languages: ["rows", "grid", "dots"],
  certificates: ["list", "rows", "grid"],
  interests: ["bubble", "rows"],
  references: ["grid", "rows"],
};

const HEADING_STYLE_LABELS = ["Rule", "Tab", "Plain", "Framed", "Filled", "Edge"];

// ── option glyphs: tiny honest previews of what each choice does ────────────

const Bar = ({ w, faint }: { w: string; faint?: boolean }) => (
  <span className={cn("block h-[3px] rounded-full bg-current", w, faint ? "opacity-40" : "opacity-70")} />
);

function ColumnsGlyph({ mode }: { mode: "one" | "two" | "mix" | "sidebar" }) {
  if (mode === "sidebar")
    return (
      <span className="flex w-7 gap-[3px]">
        <span className="flex flex-1 flex-col gap-[2px]">
          <Bar w="w-full" /><Bar w="w-5/6" /><Bar w="w-full" />
        </span>
        <span className="block w-2 rounded-[1px] bg-current opacity-40" />
      </span>
    );
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
      className="relative h-52 w-full overflow-hidden rounded-[3px] border border-[var(--color-border)] bg-white"
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
  "w-full px-3 py-1.5 bg-[var(--color-input-bg)] border border-[var(--color-border)] rounded-lg text-sm text-[var(--color-text-primary)] outline-none focus:border-signal";

const Label = ({ children }: { children: React.ReactNode }) => (
  <label className="block font-mono text-[9.5px] font-medium uppercase tracking-[0.12em] text-[var(--color-text-secondary)]">
    {children}
  </label>
);

/** A titled cluster: mono micro-header with a dashed rule running out, so a
 *  dense pane still reads in sections instead of one undifferentiated stack. */
function Cluster({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section>
      <div className="mb-2 flex items-center gap-2">
        <span className="font-mono text-[9.5px] font-medium uppercase tracking-[0.14em] text-[var(--color-text-secondary)]">
          {title}
        </span>
        <span className="h-px flex-1 border-t border-dashed border-[var(--color-border)]" />
      </div>
      {children}
    </section>
  );
}

/** The gauge table: one bordered card, one hairline row per measure. */
function GaugeGroup({ children }: { children: React.ReactNode }) {
  return (
    <div className="divide-y divide-dashed divide-[var(--color-border)] rounded-lg border border-[var(--color-border)] bg-[var(--color-input-bg)]/50">
      {children}
    </div>
  );
}

function Gauge({ label, value, min, max, step, suffix, prefix, onChange }: {
  label: string; value: number; min: number; max: number; step: number;
  suffix?: string; prefix?: string; onChange: (v: number) => void;
}) {
  const clamp = (v: number) => Math.min(max, Math.max(min, Math.round(v / step) * step));
  const fmt = Number.isInteger(value) ? value : value.toFixed(2).replace(/0+$/, "").replace(/\.$/, "");
  return (
    <div className="flex select-none items-center gap-2 px-2.5 py-[7px]">
      <span className="w-[68px] shrink-0 truncate font-mono text-[9.5px] uppercase tracking-[0.1em] text-[var(--color-text-secondary)]" title={label}>
        {label}
      </span>
      <button
        onClick={() => onChange(clamp(value - step))}
        onMouseDown={(e) => e.preventDefault()}
        aria-label={`Decrease ${label}`}
        className="rounded-[4px] border border-[var(--color-border)] p-0.5 text-[var(--color-text-secondary)] transition-colors hover:border-signal hover:text-signal"
      >
        <Minus size={11} />
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
        className="h-1 min-w-0 flex-1 cursor-pointer accent-signal"
      />
      <button
        onClick={() => onChange(clamp(value + step))}
        onMouseDown={(e) => e.preventDefault()}
        aria-label={`Increase ${label}`}
        className="rounded-[4px] border border-[var(--color-border)] p-0.5 text-[var(--color-text-secondary)] transition-colors hover:border-signal hover:text-signal"
      >
        <Plus size={11} />
      </button>
      <span className="w-12 shrink-0 text-right font-mono text-[11px] text-[var(--color-text-primary)]">
        {prefix}{fmt}{suffix}
      </span>
    </div>
  );
}

/** Option tiles: a specimen drawer of square cells. Glyph options get tall
 *  tiles with the preview centered; text-only options get compact cells. The
 *  selected tile carries a pixel notch in its corner, the family mark's cell
 *  planted on the control. */
function Tiles({ label, value, options, onChange, hint, dense }: {
  label?: string;
  value: string;
  options: { value: string; label: string; glyph?: React.ReactNode }[];
  onChange: (v: string) => void;
  hint?: string;
  dense?: boolean;
}) {
  const hasGlyphs = options.some((o) => o.glyph);
  return (
    <div className={dense ? "" : "space-y-1.5"}>
      {label && <Label>{label}</Label>}
      <div className={cn("flex flex-wrap", dense ? "gap-1" : "gap-1.5")}>
        {options.map((o) => {
          const selected = value === o.value;
          return (
            <button
              key={o.value}
              onClick={() => onChange(o.value)}
              className={cn(
                "relative rounded-[4px] border transition-colors",
                hasGlyphs
                  ? "flex h-[3.4rem] min-w-[3.6rem] flex-col items-center justify-center gap-1.5 px-2"
                  : dense
                  ? "px-2 py-[3px]"
                  : "px-2.5 py-1.5",
                selected
                  ? "border-signal bg-signal/10 text-[var(--color-text-primary)]"
                  : "border-[var(--color-border)] text-[var(--color-text-secondary)] hover:border-[var(--color-border-strong)] hover:text-[var(--color-text-primary)]"
              )}
            >
              {selected && (
                <span aria-hidden className="absolute right-1 top-1 h-1.5 w-1.5 rounded-[1px] bg-signal" />
              )}
              {o.glyph}
              <span className={cn(
                "font-mono uppercase leading-none",
                hasGlyphs ? "text-[8.5px] tracking-[0.06em]" : dense ? "text-[9px] tracking-[0.04em]" : "text-[9.5px] tracking-[0.06em]"
              )}>
                {o.label}
              </span>
            </button>
          );
        })}
      </div>
      {hint && <p className="m-0 text-[11px] leading-snug text-[var(--color-text-secondary)]">{hint}</p>}
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

function OrderRow({ section, region, onRegionToggle }: {
  section: ResumeSection;
  /** Set only in sidebar mode: which column this section lives in. */
  region?: "main" | "side";
  onRegionToggle?: () => void;
}) {
  const controls = useDragControls();
  return (
    <Reorder.Item value={section} dragListener={false} dragControls={controls}
      className="flex items-center gap-2 rounded-md border border-[var(--color-border)] bg-[var(--color-input-bg)] px-2 py-1">
      <button
        onPointerDown={(e) => controls.start(e)}
        aria-label={`Reorder ${section.heading}`}
        className="cursor-grab touch-none text-[var(--color-text-secondary)] hover:text-signal"
      >
        <GripVertical size={13} />
      </button>
      <span className="truncate text-[13px] text-[var(--color-text-primary)]">{section.heading}</span>
      {!section.visible && (
        <span className="font-mono text-[9px] uppercase tracking-wide text-[var(--color-text-secondary)] opacity-60">
          hidden
        </span>
      )}
      {region && (
        <button
          onClick={onRegionToggle}
          className={cn(
            "ml-auto rounded-[3px] border px-1.5 py-px font-mono text-[9px] uppercase tracking-[0.08em] transition-colors",
            region === "side"
              ? "border-signal text-signal"
              : "border-[var(--color-border-strong)] text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)]"
          )}
          title="Toggle between the main column and the sidebar rail"
        >
          {region === "side" ? "rail" : "main"}
        </button>
      )}
    </Reorder.Item>
  );
}
