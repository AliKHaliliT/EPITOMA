/**
 * Regional and field presets: what a market expects a CV to carry.
 *
 * A résumé that is right in Calgary is wrong in Munich, and the difference is
 * a handful of settled conventions rather than taste: whether a photo belongs,
 * which personal details are expected or must be absent, the sheet size, the
 * date form, and whether the document closes with a signature. Each preset
 * turns the knobs the Customize panel already owns, as a starting point the
 * owner can still override, and carries the guidance a foreign applicant would
 * otherwise have to know. Field overlays cut across regions: academia wants
 * the long CV with every publication, industry the short résumé.
 */

import type { ResumeDocument, ResumeSection, ResumeStyle, SectionKind } from "./model";
import { DEFAULT_SECTION_SPECS } from "./defaults";
import { localizeHeading, placeDateLine, relocalizeSections } from "./headings";

/** One market's conventions, applied to the style, the header chips, and the closing. */
export interface RegionPreset {
  key: string;
  label: string;
  description: string;
  /** The page knobs the region settles. */
  style: Partial<Pick<ResumeStyle, "pageFormat" | "language" | "dateFormat" | "showPhoto">>;
  /** Header chips the region expects; added empty when missing so the owner fills them. */
  addChips: string[];
  /** Header chips employers in the region must not be shown; removed from the header. */
  dropChips: string[];
  /** Whether the document closes with a place, date, and signature block. */
  signature: boolean;
  /** What the applicant should know, shown beside the preset. */
  notes: string[];
}

/** One field's expectations, applied to section order, entry limits, and headings. */
export interface FieldOverlay {
  key: string;
  label: string;
  description: string;
  /** Section kinds in the order this field reads them; kinds not listed keep their place after. */
  order: SectionKind[];
  /** Kinds whose every entry shows, limits lifted. */
  unlimited: SectionKind[];
  /** Whether entries fall back to the résumé's default limits. */
  limited: boolean;
  /** Headings this field prefers over the catalog defaults. */
  headings: Partial<Record<SectionKind, string>>;
  notes: string[];
}

/** Chips North American and British employers must not be handed, by law or custom. */
const PROTECTED_CHIPS = [
  "Date of Birth",
  "Nationality",
  "Gender / Pronouns",
  "Passport / ID",
  "Disability",
  "Expected Salary",
];

/** The stable id of the closing signature block, so re-applying never duplicates it. */
export const SIGNATURE_SECTION_ID = "sec-region-signature";

/** The markets a preset exists for; the owner's own overrides always win afterwards. */
export const REGION_PRESETS: RegionPreset[] = [
  {
    key: "canada",
    label: "Canada",
    description: "Short résumé, no photo, no personal data, Letter paper.",
    style: { pageFormat: "Letter", language: "English", dateFormat: "MMM YYYY", showPhoto: false },
    addChips: [],
    dropChips: PROTECTED_CHIPS,
    signature: false,
    notes: [
      "One to two pages. The word is résumé, and CV means the long academic document.",
      "No photo, birth date, nationality, marital status, or gender. Human-rights law protects these grounds and recruiters discard résumés that volunteer them.",
      "Achievement bullets with results, reverse-chronological, on Letter paper.",
      "References go on a separate sheet, offered on request rather than printed.",
    ],
  },
  {
    key: "united-states",
    label: "United States",
    description: "Short résumé, no photo, no personal data, Letter paper.",
    style: { pageFormat: "Letter", language: "English", dateFormat: "MMM YYYY", showPhoto: false },
    addChips: [],
    dropChips: PROTECTED_CHIPS,
    signature: false,
    notes: [
      "One page early in a career, two at most. CV means the long academic document.",
      "No photo, age, nationality, marital status, or gender; equal-opportunity law makes recruiters wary of all of them.",
      "Quantified achievement bullets, reverse-chronological, on Letter paper. Many employers screen with software, so a single column and plain headings travel best.",
      "References are supplied separately when asked, never printed.",
    ],
  },
  {
    key: "united-kingdom",
    label: "United Kingdom",
    description: "Two-page CV, no photo, personal statement up top, A4.",
    style: { pageFormat: "A4", language: "English (UK)", dateFormat: "MMM YYYY", showPhoto: false },
    addChips: [],
    dropChips: PROTECTED_CHIPS,
    signature: false,
    notes: [
      "Two pages is the norm, and the document is called a CV even when it is short.",
      "No photo, birth date, nationality, or marital status; the Equality Act makes them unwelcome.",
      "Open with a short personal statement (the Summary section), then reverse-chronological experience and education, on A4.",
      "Close with references available on request rather than names and numbers.",
    ],
  },
  {
    key: "germany",
    label: "Germany",
    description: "Tabular Lebenslauf with photo, birth date, and a signed closing, A4.",
    style: { pageFormat: "A4", language: "German", dateFormat: "MM/YYYY", showPhoto: true },
    addChips: ["Date of Birth", "Nationality"],
    dropChips: [],
    signature: true,
    notes: [
      "The Lebenslauf is tabular and factual, one to two pages, on A4, with dates as MM/YYYY.",
      "A professional photo is customary, and birth date and nationality are usually stated. Fill the chips the preset added, or remove them.",
      "It closes with place, date, and a handwritten signature. The added closing block holds the line, and you sign the print.",
      "The CV travels inside a Bewerbungsmappe with a cover letter (Anschreiben) and copies of degree certificates and references (Zeugnisse).",
    ],
  },
];

/** The fields a preset exists for; each cuts across every region. */
export const FIELD_OVERLAYS: FieldOverlay[] = [
  {
    key: "academic",
    label: "Academic",
    description: "The long CV: education first, every publication and talk listed.",
    order: [
      "summary", "education", "experience", "publications", "awards", "speaking", "projects",
      "organizations", "volunteering", "certificates", "courses", "skills", "languages",
      "blog", "garden", "interests", "references", "declaration", "custom",
    ],
    unlimited: ["publications", "speaking", "awards", "experience", "education", "projects", "certificates"],
    limited: false,
    headings: { publications: "Publications", projects: "Research Projects", certificates: "Certificates" },
    notes: [
      "Length is not a constraint; completeness is. Every publication, talk, grant, and award is listed.",
      "Education leads, then research posts, then the publication list in one consistent citation form.",
      "Teaching, supervision, grants, and service each earn a custom section when you have them.",
    ],
  },
  {
    key: "industry",
    label: "Industry",
    description: "The short résumé: experience and skills first, the rest trimmed.",
    order: [
      "summary", "experience", "skills", "projects", "education", "certificates", "awards",
      "languages", "volunteering", "organizations", "courses", "interests", "references",
      "publications", "speaking", "blog", "garden", "declaration", "custom",
    ],
    unlimited: [],
    limited: true,
    headings: { publications: "Selected Publications", projects: "Selected Projects", certificates: "Selected Certificates" },
    notes: [
      "One to two pages, experience and skills leading, education after them once you have work history.",
      "Each section shows its most relevant handful. The preset re-applies the résumé's default limits, and you can unhide more per entry.",
      "Quantify outcomes where the record allows, and keep publications and talks to a line or two unless the role is research.",
    ],
  },
];

const withoutKeys = (extra: Record<string, string>, keys: string[]): Record<string, string> =>
  Object.fromEntries(Object.entries(extra).filter(([k]) => !keys.includes(k)));

/** The closing block a signature region expects: place and date, then the signature. */
const signatureSection = (language?: string): ResumeSection => ({
  id: SIGNATURE_SECTION_ID,
  kind: "declaration",
  heading: localizeHeading("Signature", language),
  icon: "PenLine",
  visible: true,
  source: "custom",
  entries: [{ id: `${SIGNATURE_SECTION_ID}-line`, description: `<p>${placeDateLine(language)}</p>` }],
});

/**
 * Applies a region's conventions to a document.
 *
 * @param doc - The document to adjust; never mutated.
 * @param preset - The market whose conventions to adopt.
 *
 * @returns A new document with the region's page knobs set, protected chips
 *   dropped or expected chips added empty, and the signature block present
 *   exactly once or absent.
 */
export function applyRegion(doc: ResumeDocument, preset: RegionPreset): ResumeDocument {
  const extra = withoutKeys(doc.personal.extra ?? {}, preset.dropChips);
  for (const chip of preset.addChips) if (!(chip in extra)) extra[chip] = "";
  const language = preset.style.language ?? doc.style.language;
  const sections = relocalizeSections(
    doc.sections.filter((s) => s.id !== SIGNATURE_SECTION_ID),
    language
  );
  if (preset.signature) sections.push(signatureSection(language));
  return {
    ...doc,
    personal: { ...doc.personal, extra },
    sections,
    style: { ...doc.style, ...preset.style, region: preset.key },
  };
}

/**
 * Applies a field's expectations to a document's sections.
 *
 * @param doc - The document to adjust; never mutated.
 * @param overlay - The field whose reading order and limits to adopt.
 *
 * @returns A new document with sections reordered, entry limits lifted or
 *   re-applied, and the field's preferred headings set.
 */
export function applyField(doc: ResumeDocument, overlay: FieldOverlay): ResumeDocument {
  const rank = (s: ResumeSection) => {
    const i = overlay.order.indexOf(s.kind);
    return i === -1 ? overlay.order.length : i;
  };
  const limits = new Map(
    DEFAULT_SECTION_SPECS.resume
      .filter((s) => s.limit !== undefined)
      .map((s) => [s.kind, s.limit as number] as const)
  );
  const sections = doc.sections
    .map((s, i) => ({ s, i }))
    .sort((a, b) => rank(a.s) - rank(b.s) || a.i - b.i)
    .map(({ s }) => {
      const preferred = overlay.headings[s.kind];
      const heading = preferred ? localizeHeading(preferred, doc.style.language) : s.heading;
      const limit = overlay.limited ? limits.get(s.kind) : undefined;
      const lift = overlay.unlimited.includes(s.kind);
      const entries =
        lift || limit !== undefined
          ? s.entries.map((e, idx) => ({ ...e, hidden: lift ? false : idx >= (limit as number) }))
          : s.entries;
      return { ...s, heading, entries };
    });
  return { ...doc, sections, style: { ...doc.style, field: overlay.key } };
}
