// Resume / CV builder document model.
//
// A document is (structure + style + content-snapshot). It is built from website
// content via ContentService, then edited locally. "Sync from website" refreshes
// only the synced content; structure and style persist. See resumeService.ts.

export type DocumentKind = "resume" | "cv";

export type SectionKind =
  | "summary"
  | "experience"
  | "education"
  | "courses"
  | "awards"
  | "publications"
  | "speaking"
  | "volunteering"
  | "certificates"
  | "organizations"
  | "references"
  | "projects"
  | "interests"
  | "skills"
  | "languages"
  | "blog"
  | "garden"
  | "declaration"
  | "custom";

/** A single rendered line-item within a section (a job, a degree, a link, …). */
export interface ResumeEntry {
  id: string;
  /** Links back to the website item id, so sync can remap edits/visibility. */
  sourceId?: string | number;
  hidden?: boolean;
  title?: string;
  subtitle?: string;
  startDate?: string;
  endDate?: string;
  location?: string;
  link?: string;
  /** HTML: preserves alignment/underline (see ResumeRichText). */
  description?: string;
  /** Type-specific extras, e.g. skills/languages groups, declaration text. */
  meta?: Record<string, unknown>;
}

export type SectionLayout = "list" | "grid" | "rows" | "compact" | "bubble" | "dots";

export interface ResumeSection {
  id: string;
  kind: SectionKind;
  /** Editable display label. */
  heading: string;
  /** lucide icon name. */
  icon?: string;
  visible: boolean;
  source: "synced" | "custom";
  /** Custom sections render either as normal entries or as a skill chip group. */
  customType?: "normal" | "skill";
  layout?: SectionLayout;
  /** Sidebar column assignment; unset falls back to a per-kind default. */
  region?: "main" | "side";
  /** Per-section structural options (titleSubtitleOrder, groupPromotions, …). */
  options?: Record<string, unknown>;
  entries: ResumeEntry[];
}

export interface PersonalLink {
  /** Stable list key; optional because links saved before it existed lack one. */
  id?: string;
  label: string;
  url: string;
  icon: string; // lucide icon name
}

/** The resume header: all settings-derived, plus document-local extra chips. */
export interface PersonalDetails {
  name?: string;
  title?: string;
  location?: string;
  email?: string;
  phone?: string;
  photo?: string;
  links?: PersonalLink[];
  /** Free-text detail chips: nationality, dob, availability, workMode, visa, … */
  extra?: Record<string, string>;
}

// ── Style ───────────────────────────────────────────────────────────────────

export type ColumnMode = "one" | "two" | "mix" | "sidebar";
export type PaletteMode = "single" | "image";
export type ColorScope = "page" | "header" | "border";
export type HeadingCase = "capitalize" | "uppercase";
export type HeadingIcons = "none" | "outline" | "filled";
export type SubtitleStyle = "normal" | "bold" | "italic";
export type SubtitlePlacement = "same" | "next";
export type ListStyle = "bullet" | "hyphen";
export type HeaderAlign = "left" | "center";
export type HeaderDetails = "icon" | "bullet" | "bar";
export type LinkIconStyle = "chain" | "external";
export type PhotoShape = "circle" | "square" | "rounded";
export type PageFormat = "A3" | "A4" | "A5" | "Letter" | "Legal";

/** One source of truth for physical page sizes; every renderer and exporter
 *  reads from here so the preview's page cuts match the printed sheet. */
export const PAGE_DIMS: Record<
  PageFormat,
  { w: number; h: number; css: string; latex: string }
> = {
  A3: { w: 297, h: 420, css: "A3", latex: "a3paper" },
  A4: { w: 210, h: 297, css: "A4", latex: "a4paper" },
  A5: { w: 148, h: 210, css: "A5", latex: "a5paper" },
  Letter: { w: 216, h: 279, css: "letter", latex: "letterpaper" },
  Legal: { w: 216, h: 356, css: "legal", latex: "legalpaper" },
};

export interface AccentApply {
  name: boolean;
  jobTitle: boolean;
  headings: boolean;
  headingsLine: boolean;
  headerIcons: boolean;
  dates: boolean;
  subtitle: boolean;
  linkIcons: boolean;
}

export interface ResumeStyle {
  // Document
  language: string;
  dateFormat: string; // e.g. "MMM YYYY", "MMM DD, YYYY", "MM/YYYY"
  pageFormat: PageFormat;
  template: string; // preset key

  // Layout
  columns: ColumnMode;

  // Font size (pt; deltas are relative to base)
  baseFontSize: number;
  nameFontSize: number; // delta
  headingFontSize: number; // delta
  entryHeaderFontSize: number; // delta

  // Spacing
  lineHeight: number;
  elementSpacing: number; // px between elements
  marginX: number; // mm
  marginY: number; // mm

  // Entries
  entryLayout: 1 | 2 | 3;
  subtitleStyle: SubtitleStyle;
  subtitlePlacement: SubtitlePlacement;
  indentBody: boolean;
  listStyle: ListStyle;

  // Headings
  headingStyle: 1 | 2 | 3 | 4 | 5 | 6;
  headingCase: HeadingCase;
  headingIcons: HeadingIcons;
  headingIconSize: number; // px

  // Font
  bodyFont: string;
  nameFont: string; // "" = same as body

  // Colors
  colorScope: ColorScope;
  palette: PaletteMode;
  accentColor: string;
  /** Header band fill when colorScope is "header"; "" derives from accent. */
  headerFillColor: string;
  backgroundImage?: string; // when palette === "image"
  accentApply: AccentApply;

  // Header
  headerAlign: HeaderAlign;
  headerDetails: HeaderDetails;

  // Photo
  showPhoto: boolean;
  photoShape: PhotoShape;
  photoSize: number; // px

  // Links
  linkUnderline: boolean;
  linkColored: boolean;
  linkIcon: boolean;
  linkIconStyle: LinkIconStyle;

  // Footer
  footerText: string;
  showPageNumbers: boolean;
}

export interface ResumeDocument {
  id: string;
  name: string;
  kind: DocumentKind;
  createdAt: string;
  updatedAt: string;
  lastSyncedAt: string;
  personal: PersonalDetails;
  sections: ResumeSection[]; // order is significant
  style: ResumeStyle;
}

/** Loose shape check for an exported document (.json) being re-imported.
 *  Structural: an export from any machine or version qualifies as long as it
 *  carries the load-bearing parts, style included. */
export function isResumeDocumentFile(value: unknown): value is ResumeDocument {
  if (typeof value !== "object" || value === null) return false;
  const v = value as Record<string, unknown>;
  return (
    typeof v.name === "string" &&
    typeof v.personal === "object" && v.personal !== null &&
    Array.isArray(v.sections) &&
    typeof v.style === "object" && v.style !== null
  );
}
