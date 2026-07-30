// The export layout contract: every layout decision a renderer needs, resolved
// from the document model in ONE place. The preview, the Word renderer, and
// the LaTeX renderer all consume these helpers (or implement exactly this
// spec), so a style setting cannot mean different things in different
// formats. docs/export-parity.md carries the format-by-format mapping table.

import { PAGE_DIMS, ResumeSection, ResumeStyle } from "@/types/resume";
import { sectionRegion } from "@/lib/resumeDefaults";
import { RAIL_FRAC, luminance, railColors, tint } from "@/preview/previewStyles";

// ── geometry ────────────────────────────────────────────────────────────────

export interface Geometry {
  pageWmm: number;
  pageHmm: number;
  marginX: number;
  marginY: number;
  /** Content width between the margins. */
  contentWmm: number;
  /** Sidebar mode: rail column width and the gap beside it. */
  railWmm: number;
  railGapMm: number;
  mainWmm: number;
}

export function resolveGeometry(style: ResumeStyle): Geometry {
  const d = PAGE_DIMS[style.pageFormat] ?? PAGE_DIMS.A4;
  const contentWmm = d.w - style.marginX * 2;
  const railWmm = contentWmm * RAIL_FRAC;
  const railGapMm = 7;
  return {
    pageWmm: d.w,
    pageHmm: d.h,
    marginX: style.marginX,
    marginY: style.marginY,
    contentWmm,
    railWmm,
    railGapMm,
    mainWmm: contentWmm - railWmm - railGapMm,
  };
}

// ── type scale ──────────────────────────────────────────────────────────────

export interface TypeScale {
  basePt: number;
  namePt: number;
  headingPt: number;
  entryPt: number;
  lineHeight: number;
  bodyFont: string;
  nameFont: string; // resolved: falls back to bodyFont
}

export function resolveType(style: ResumeStyle): TypeScale {
  return {
    basePt: style.baseFontSize,
    namePt: style.baseFontSize + style.nameFontSize,
    headingPt: style.baseFontSize + style.headingFontSize,
    entryPt: style.baseFontSize + style.entryHeaderFontSize,
    lineHeight: style.lineHeight,
    bodyFont: style.bodyFont,
    nameFont: style.nameFont || style.bodyFont,
  };
}

// ── color decisions ─────────────────────────────────────────────────────────

export interface ColorPlan {
  accent: string;
  /** Solid page tint when colorScope === "page", else null. */
  pageBg: string | null;
  /** The header band's fill when colorScope === "header", else null. */
  headerBg: string | null;
  /** Header band ink when the fill is dark, else null (inherit). */
  headerInk: string | null;
  /** Left border color when colorScope === "border", else null. */
  edge: string | null;
  /** Sidebar rail fill/ink (rail modes only; bg always resolved). */
  railBg: string;
  railInk: string | null;
  /** Opaque light tint of the accent (chip fills, style-5 headings). */
  accentTint: string;
}

export function resolveColors(style: ResumeStyle): ColorPlan {
  const rail = railColors(style);
  const headerBg = style.colorScope === "header" ? style.headerFillColor || tint(style.accentColor) : null;
  return {
    accent: style.accentColor,
    pageBg: style.colorScope === "page" ? tint(style.accentColor) : null,
    headerBg,
    headerInk: headerBg && luminance(headerBg) < 0.55 ? "#f8fafc" : null,
    edge: style.colorScope === "border" ? style.accentColor : null,
    railBg: rail.bg,
    railInk: rail.ink ?? null,
    accentTint: tint(style.accentColor, 0.12),
  };
}

// ── headings ────────────────────────────────────────────────────────────────

export type HeadingDeco = "rule" | "tab" | "plain" | "frame" | "fill" | "edge";

export interface HeadingSpec {
  deco: HeadingDeco;
  uppercase: boolean;
  /** Heading text takes the accent color. */
  accentText: boolean;
  /** Decoration lines take the accent (else a neutral gray). */
  lineColor: string;
}

const DECOS: Record<number, HeadingDeco> = {
  1: "rule", 2: "tab", 3: "plain", 4: "frame", 5: "fill", 6: "edge",
};

export function resolveHeading(style: ResumeStyle): HeadingSpec {
  return {
    deco: DECOS[style.headingStyle] ?? "rule",
    uppercase: style.headingCase === "uppercase",
    accentText: style.accentApply.headings,
    lineColor: style.accentApply.headingsLine ? style.accentColor : "#cbd5e1",
  };
}

// ── entry composition ───────────────────────────────────────────────────────
// The three entry layouts, spelled out once:
//   1 "date right":  [title (· subtitle when same-line)] ......... [date]
//                    subtitle on its own line when placement is "next";
//                    location on its own line; description under.
//   2 "stacked":     title / subtitle (same rules) / date line / location.
//   3 "one line":    title · subtitle · location — date, all inline.

export interface EntrySpec {
  layout: 1 | 2 | 3;
  subtitleInline: boolean;
  subtitleStyle: "normal" | "bold" | "italic";
}

export function resolveEntry(style: ResumeStyle): EntrySpec {
  return {
    layout: style.entryLayout,
    subtitleInline: style.subtitlePlacement === "same" || style.entryLayout === 3,
    subtitleStyle: style.subtitleStyle,
  };
}

// ── section shapes ──────────────────────────────────────────────────────────

export type SectionShape =
  | "prose"        // summary, declaration
  | "skill-groups" // Category: a, b, c rows
  | "skill-chips"  // every item as a chip
  | "lang-list"    // Language · Level, wrapping row
  | "lang-grid"    // two-column grid
  | "lang-dots"    // Language + 1–5 rating dots
  | "chips"        // interests
  | "linked-list"  // blog / garden: linked titles + date
  | "ref-cards"    // references: name/role/org/email cards
  | "entries"      // default: full entry rows
  | "entry-rows"   // compact one-line rows (no body)
  | "entry-grid";  // entry rows in a two-column grid

export function sectionShape(section: ResumeSection): SectionShape {
  const kind = section.customType === "skill" ? "skills" : section.kind;
  const layout = section.layout || "list";
  switch (kind) {
    case "summary":
    case "declaration":
      return "prose";
    case "skills":
      return layout === "bubble" ? "skill-chips" : "skill-groups";
    case "languages":
      return layout === "dots" ? "lang-dots" : layout === "grid" ? "lang-grid" : "lang-list";
    case "interests":
      return "chips";
    case "blog":
    case "garden":
      return "linked-list";
    case "references":
      return "ref-cards";
    default:
      return layout === "grid" ? "entry-grid" : layout === "rows" ? "entry-rows" : "entries";
  }
}

// ── column regions ──────────────────────────────────────────────────────────

export interface RegionSplit {
  mode: ResumeStyle["columns"];
  main: ResumeSection[];
  side: ResumeSection[];
}

export function splitRegions(style: ResumeStyle, sections: ResumeSection[]): RegionSplit {
  const visible = sections.filter((s) => s.visible);
  if (style.columns !== "sidebar") return { mode: style.columns, main: visible, side: [] };
  return {
    mode: "sidebar",
    main: visible.filter((s) => sectionRegion(s) === "main"),
    side: visible.filter((s) => sectionRegion(s) === "side"),
  };
}

// ── proficiency dots (languages "dots" layout) ──────────────────────────────

/** Map a free-text proficiency ("Fluent", "B2", "Native…") to a 1–5 rating.
 *  Unknown words read as a solid 3. */
export function proficiencyDots(subtitle?: string): number {
  const s = (subtitle || "").toLowerCase();
  if (/native|mother|bilingual|c2/.test(s)) return 5;
  if (/fluent|advanced|proficien|c1/.test(s)) return 4;
  if (/intermediate|conversational|b2/.test(s)) return 3;
  if (/elementary|basic|b1|a2/.test(s)) return 2;
  if (/beginner|a1/.test(s)) return 1;
  return 3;
}
