// The export layout contract: every layout decision a renderer needs, resolved
// from the document model in ONE place. The preview, the Word renderer, and
// the LaTeX renderer all consume these helpers (or implement exactly this
// spec), so a style setting cannot mean different things in different
// formats. docs/export-parity.md carries the format-by-format mapping table.

import { PAGE_DIMS, ResumeSection, ResumeStyle } from "./model";
import { sectionRegion } from "./defaults";
import { RAIL_FRAC, luminance, railColors, tint } from "./previewStyles";

// ── geometry ────────────────────────────────────────────────────────────────

/** The sheet's measurements in millimetres, margins and columns included. */
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

/**
 * Works out the sheet geometry for a style.
 *
 * @param style - The document style, which names the page format and margins.
 *
 * @returns Every measurement in millimetres, with an unknown page format falling back to A4.
 */
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

/** Every type size a renderer needs, resolved from the style's base size and offsets. */
export interface TypeScale {
  basePt: number;
  namePt: number;
  headingPt: number;
  entryPt: number;
  lineHeight: number;
  bodyFont: string;
  nameFont: string; // resolved: falls back to bodyFont
}

/**
 * Works out every type size from the style's base size and its offsets.
 *
 * @param style - The document style carrying the base size and per-element offsets.
 *
 * @returns The resolved scale, with the name font falling back to the body font.
 */
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

/** Which color each element actually gets, after the accent switches are applied. */
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

/**
 * Decides the color of each element from the accent and its switches.
 *
 * @param style - The document style carrying the accent and where it may apply.
 *
 * @returns One color per element, so no renderer re-derives them.
 */
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

/** The rule or fill a section heading is drawn with. */
export type HeadingDeco = "rule" | "tab" | "plain" | "frame" | "fill" | "edge";

/** A section heading's full presentation: casing, glyph, decoration, spacing. */
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

/**
 * Works out how section headings are drawn.
 *
 * @param style - The document style carrying heading casing, glyphs, and decoration.
 *
 * @returns The heading presentation every format must reproduce.
 */
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
//   3 "one line":    title · subtitle · location · date, all inline.

/** How one entry stacks its title, subtitle, dates, and description. */
export interface EntrySpec {
  layout: 1 | 2 | 3;
  subtitleInline: boolean;
  subtitleStyle: "normal" | "bold" | "italic";
}

/**
 * Works out how one entry stacks its parts.
 *
 * @param style - The document style carrying subtitle placement and list form.
 *
 * @returns The entry presentation every format must reproduce.
 */
export function resolveEntry(style: ResumeStyle): EntrySpec {
  return {
    layout: style.entryLayout,
    subtitleInline: style.subtitlePlacement === "same" || style.entryLayout === 3,
    subtitleStyle: style.subtitleStyle,
  };
}

// ── section shapes ──────────────────────────────────────────────────────────

/** A section's arrangement, including how a chip group wraps. */
export type SectionShape =
  | "prose"        // summary, declaration
  | "skill-groups" // Category: a, b, c rows
  | "skill-chips"  // every item as a chip
  | "lang-list"    // Language · Level, wrapping row
  | "lang-grid"    // two-column grid
  | "lang-dots"    // Language + 1–5 rating dots
  | "chips"        // interests
  | "plain-rows"   // interests as stacked titles
  | "linked-list"  // blog / garden: linked titles + date
  | "ref-cards"    // references: name/role/org/email cards
  | "entries"      // default: full entry rows
  | "entry-rows"   // compact one-line rows (no body)
  | "entry-grid";  // entry rows in a two-column grid

/**
 * Works out one section's arrangement.
 *
 * @param section - The section being drawn, whose layout may override the default.
 * @param style - The document style, which supplies the fallback layout.
 *
 * @returns The arrangement the renderers follow for this section.
 */
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
      return layout === "rows" ? "plain-rows" : "chips";
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

/** Sections divided into the main column and the side rail. */
export interface RegionSplit {
  mode: ResumeStyle["columns"];
  main: ResumeSection[];
  side: ResumeSection[];
}

/**
 * Divides visible sections between the main column and the side rail.
 *
 * @param sections - Every section of the document, in document order.
 * @param style - The document style, which decides whether a rail exists at all.
 *
 * @returns The two ordered lists; in single-column mode the rail comes back empty.
 */
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
