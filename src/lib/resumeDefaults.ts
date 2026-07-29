// Catalog, builders, and defaults for the resume/CV builder.
//
// SECTION_CATALOG describes every section kind (label, icon, where its data
// comes from). buildEntries() turns an imported portfolio snapshot into
// ResumeEntry[] for a given kind. DEFAULT_SECTIONS defines the starting
// section set per document kind. DEFAULT_STYLE / TEMPLATE_PRESETS /
// FONT_OPTIONS drive the Customize tab.

import Showdown from "showdown";
import {
  PortfolioAward,
  PortfolioBlogPost,
  PortfolioCertificate,
  PortfolioCourse,
  PortfolioEducation,
  PortfolioExperience,
  PortfolioGardenPost,
  PortfolioInterest,
  PortfolioItem,
  PortfolioOrganization,
  PortfolioProject,
  PortfolioPublication,
  PortfolioReference,
  PortfolioSettings,
  PortfolioSnapshot,
  PortfolioSpeaking,
  PortfolioVolunteering,
} from "../types/portfolio";
import {
  ResumeDocument,
  ResumeEntry,
  ResumeSection,
  ResumeStyle,
  SectionKind,
  DocumentKind,
  SectionLayout,
} from "../types/resume";

const md = new Showdown.Converter({ noHeaderId: true, simplifiedAutoLink: true });

/** Markdown → HTML for seeding entry descriptions (empty-safe). */
export const mdToHtml = (s?: string): string => (s ? md.makeHtml(s) : "");

/** Parse "Category: a, b, c" newline-delimited text (skills / languages). */
export const parseKeyValue = (raw?: string): { category: string; items: string[] }[] => {
  if (!raw) return [];
  return raw
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean)
    .map((line) => {
      const colon = line.indexOf(":");
      if (colon === -1) return null;
      const category = line.slice(0, colon).trim();
      const items = line
        .slice(colon + 1)
        .split(",")
        .map((s) => s.trim())
        .filter(Boolean);
      return { category, items };
    })
    .filter(Boolean) as { category: string; items: string[] }[];
};

let entrySeq = 0;
/** Stable-ish id for a generated entry (no Date.now/random at module scope). */
const entryId = (prefix: string) => `${prefix}-${entrySeq++}`;

const absUrl = (path: string, website?: string): string => {
  if (!website) return path;
  return `${website.replace(/\/$/, "")}${path}`;
};

// ── Section catalog ───────────────────────────────────────────────────────

export interface CatalogMeta {
  label: string;
  icon: string; // lucide icon name
  defaultHeading: string;
  /** Where the data comes from: a portfolio collection, the settings object, or none. */
  source: string | "settings" | "none";
  /** Default per-section display layout. */
  layout?: SectionLayout;
  subtitle: string; // short description for the Add Content modal
}

export const SECTION_CATALOG: Record<SectionKind, CatalogMeta> = {
  summary: { label: "Summary", icon: "AlignLeft", defaultHeading: "Summary", source: "settings", subtitle: "A short professional summary or objective." },
  experience: { label: "Experience", icon: "Briefcase", defaultHeading: "Experience", source: "experience", subtitle: "Roles, companies, and what you did." },
  education: { label: "Education", icon: "GraduationCap", defaultHeading: "Education", source: "education", subtitle: "Degrees and formal study." },
  courses: { label: "Courses", icon: "BookOpen", defaultHeading: "Courses", source: "courses", subtitle: "Courses and online certifications." },
  awards: { label: "Awards", icon: "Trophy", defaultHeading: "Awards", source: "awards", subtitle: "Honors, scholarships, and grants." },
  publications: { label: "Publications", icon: "BookMarked", defaultHeading: "Selected Publications", source: "publications", subtitle: "Papers, theses, and articles." },
  speaking: { label: "Speaking", icon: "Mic2", defaultHeading: "Talks & Speaking", source: "speaking", subtitle: "Talks, panels, and podcasts." },
  volunteering: { label: "Volunteering", icon: "Heart", defaultHeading: "Volunteering", source: "volunteering", subtitle: "Community and open-source work." },
  certificates: { label: "Certificates", icon: "BadgeCheck", defaultHeading: "Selected Certificates", source: "certificates", layout: "rows", subtitle: "Professional certifications." },
  organizations: { label: "Organizations", icon: "Building2", defaultHeading: "Organizations", source: "organizations", subtitle: "Memberships and affiliations." },
  references: { label: "References", icon: "Users", defaultHeading: "References", source: "references", subtitle: "Professional references." },
  projects: { label: "Projects", icon: "FolderOpen", defaultHeading: "Selected Projects", source: "projects", subtitle: "Portfolio and side projects." },
  interests: { label: "Interests", icon: "Smile", defaultHeading: "Interests", source: "interests", layout: "bubble", subtitle: "Hobbies and personal interests." },
  skills: { label: "Skills", icon: "Wrench", defaultHeading: "Software & Programming Skills", source: "settings", layout: "compact", subtitle: "Grouped skill list." },
  languages: { label: "Languages", icon: "Globe", defaultHeading: "Languages", source: "settings", layout: "rows", subtitle: "Languages and proficiency." },
  blog: { label: "Blog", icon: "FileText", defaultHeading: "Writing", source: "blog", layout: "rows", subtitle: "Blog posts as linked titles." },
  garden: { label: "Garden", icon: "Sprout", defaultHeading: "Notes", source: "posts", layout: "rows", subtitle: "Digital garden notes as links." },
  declaration: { label: "Declaration", icon: "PenLine", defaultHeading: "Declaration", source: "settings", subtitle: "End-of-document statement." },
  custom: { label: "Custom", icon: "Puzzle", defaultHeading: "Custom Section", source: "none", subtitle: "Add a custom section for anything else." },
};

// ── Entry builders ──────────────────────────────────────────────────────────

const yearOf = (d?: string) => (d ? new Date(d).getFullYear() || d : "");

/** Build entries for a synced section from an imported portfolio snapshot.
 *  A null snapshot yields empty sections (blank document). */
export function buildEntries(
  kind: SectionKind,
  snapshot: PortfolioSnapshot | null
): ResumeEntry[] {
  const settings: PortfolioSettings = snapshot?.settings ?? {};
  const all = <T extends PortfolioItem>(t: string) =>
    (snapshot?.content?.[t] ?? []) as T[];
  const website = settings.website;

  switch (kind) {
    case "summary": {
      const text = settings.bio || settings.body || "";
      return text ? [{ id: entryId("summary"), sourceId: "settings", description: mdToHtml(text) }] : [];
    }
    case "experience":
      return all<PortfolioExperience>("experience").map((i) => ({
        id: entryId("exp"), sourceId: i.id, title: i.title, subtitle: i.company,
        location: i.location, startDate: i.startDate, endDate: i.endDate,
        link: i.link, description: mdToHtml(i.body),
      }));
    case "education":
      return all<PortfolioEducation>("education").map((i) => ({
        id: entryId("edu"), sourceId: i.id, title: i.title, subtitle: i.institution,
        location: i.location, startDate: i.startDate, endDate: i.endDate, link: i.link,
        description: mdToHtml(i.body), meta: { degree: i.degree, field: i.field, gpa: i.gpa },
      }));
    case "courses":
      return all<PortfolioCourse>("courses").map((i) => ({
        id: entryId("crs"), sourceId: i.id, title: i.title, subtitle: i.provider,
        startDate: i.date, link: i.link, description: mdToHtml(i.body),
      }));
    case "awards":
      return all<PortfolioAward>("awards").map((i) => ({
        id: entryId("awd"), sourceId: i.id, title: i.title, subtitle: i.issuer,
        startDate: i.date, link: i.link, description: mdToHtml(i.body),
        meta: { amount: i.amount, awardType: i.awardType },
      }));
    case "publications":
      return all<PortfolioPublication>("publications").map((i) => ({
        id: entryId("pub"), sourceId: i.id, title: i.title,
        subtitle: [i.venue, i.year].filter(Boolean).join(", "),
        link: i.link || (i.doi ? `https://doi.org/${i.doi}` : undefined),
        description: mdToHtml(i.body), meta: { authors: i.authors, doi: i.doi, year: i.year },
      }));
    case "speaking":
      return all<PortfolioSpeaking>("speaking").map((i) => ({
        id: entryId("spk"), sourceId: i.id, title: i.title, subtitle: i.event,
        location: i.location, startDate: i.date, link: i.link || i.video || i.slides,
        description: mdToHtml(i.body),
      }));
    case "volunteering":
      return all<PortfolioVolunteering>("volunteering").map((i) => ({
        id: entryId("vol"), sourceId: i.id, title: i.title, subtitle: i.organization,
        location: i.location, startDate: i.startDate, endDate: i.endDate, link: i.link,
        description: mdToHtml(i.body),
      }));
    case "certificates":
      return all<PortfolioCertificate>("certificates").map((i) => ({
        id: entryId("cert"), sourceId: i.id, title: i.title, subtitle: i.issuer,
        startDate: i.date, link: i.link, description: mdToHtml(i.body),
        meta: { credentialId: i.credentialId, certType: i.certType },
      }));
    case "organizations":
      return all<PortfolioOrganization>("organizations").map((i) => ({
        id: entryId("org"), sourceId: i.id, title: i.title, subtitle: i.role,
        location: i.location, startDate: i.startDate, endDate: i.endDate,
        link: i.website, description: mdToHtml(i.body), meta: { memberType: i.memberType },
      }));
    case "references":
      return all<PortfolioReference>("references").map((i) => ({
        id: entryId("ref"), sourceId: i.id, title: i.name, subtitle: i.title || i.role,
        link: i.link, description: mdToHtml(i.body),
        meta: { organization: i.organization, relationship: i.relationship, email: i.email, phone: i.phone },
      }));
    case "projects":
      return all<PortfolioProject>("projects").map((i) => ({
        id: entryId("prj"), sourceId: i.id, title: i.title, subtitle: i.role,
        startDate: i.year, link: i.link, description: mdToHtml(i.desc || i.body),
        meta: { stats: i.stats },
      }));
    case "interests":
      return all<PortfolioInterest>("interests").map((i) => ({
        id: entryId("int"), sourceId: i.id, title: i.title, meta: { category: i.category },
      }));
    case "skills":
      return parseKeyValue(settings.skills).map((g) => ({
        id: entryId("skl"), sourceId: `skill-${g.category}`, title: g.category,
        meta: { items: g.items },
      }));
    case "languages":
      return parseKeyValue(settings.languages).map((g) => ({
        id: entryId("lng"), sourceId: `lang-${g.category}`, title: g.category,
        subtitle: g.items[0] || "", meta: { items: g.items },
      }));
    case "blog":
      return all<PortfolioBlogPost>("blog").map((i) => ({
        id: entryId("blg"), sourceId: i.id, title: i.title,
        link: i.externalUrl || absUrl(`/blog/${i.slug}`, website), startDate: i.date,
        description: mdToHtml(i.excerpt),
      }));
    case "garden":
      return all<PortfolioGardenPost>("posts").map((i) => ({
        id: entryId("grd"), sourceId: i.id, title: i.title,
        link: absUrl(`/garden/${i.slug}`, website), description: mdToHtml(i.desc),
      }));
    case "declaration": {
      const text = settings.declaration || "";
      return text ? [{ id: entryId("dec"), sourceId: "settings", description: mdToHtml(text) }] : [];
    }
    case "custom":
      return [];
    default:
      return [];
  }
}

export { yearOf };

// ── Default section sets per document kind ────────────────────────────────

/** Section kinds populated by default, in order, per document kind.
 *  `limit` marks how many entries stay visible (rest start hidden). */
interface DefaultSpec {
  kind: SectionKind;
  limit?: number;
}

const CV_SECTIONS: DefaultSpec[] = [
  { kind: "summary" },
  { kind: "experience" },
  { kind: "education" },
  { kind: "publications" },
  { kind: "speaking" },
  { kind: "projects" },
  { kind: "awards" },
  { kind: "certificates" },
  { kind: "organizations" },
  { kind: "volunteering" },
  { kind: "courses" },
  { kind: "blog" },
  { kind: "garden" },
  { kind: "skills" },
  { kind: "languages" },
  { kind: "interests" },
  { kind: "references" },
  { kind: "declaration" },
];

const RESUME_SECTIONS: DefaultSpec[] = [
  { kind: "summary" },
  { kind: "experience", limit: 4 },
  { kind: "education", limit: 3 },
  { kind: "skills" },
  { kind: "projects", limit: 3 },
  { kind: "certificates", limit: 4 },
  { kind: "awards", limit: 3 },
  { kind: "languages" },
];

export const DEFAULT_SECTION_SPECS: Record<DocumentKind, DefaultSpec[]> = {
  cv: CV_SECTIONS,
  resume: RESUME_SECTIONS,
};

let sectionSeq = 0;
const sectionId = () => `sec-${sectionSeq++}`;

/** Build the ordered, populated section list for a new document. */
export function buildSections(
  kind: DocumentKind,
  snapshot: PortfolioSnapshot | null
): ResumeSection[] {
  return DEFAULT_SECTION_SPECS[kind].map((spec) => {
    const meta = SECTION_CATALOG[spec.kind];
    const entries = buildEntries(spec.kind, snapshot);
    if (spec.limit !== undefined) {
      entries.forEach((e, idx) => {
        if (idx >= spec.limit!) e.hidden = true;
      });
    }
    return {
      id: sectionId(),
      kind: spec.kind,
      heading: meta.defaultHeading,
      icon: meta.icon,
      visible: true,
      source: "synced",
      layout: meta.layout,
      entries,
    };
  });
}

/** Build a single section (used by the Add Content modal). */
export function buildSection(
  kind: SectionKind,
  snapshot: PortfolioSnapshot | null
): ResumeSection {
  const meta = SECTION_CATALOG[kind];
  return {
    id: sectionId(),
    kind,
    heading: meta.defaultHeading,
    icon: meta.icon,
    visible: true,
    source: kind === "custom" ? "custom" : "synced",
    customType: kind === "custom" ? "normal" : undefined,
    layout: meta.layout,
    entries: buildEntries(kind, snapshot),
  };
}

// ── Default style + presets ──────────────────────────────────────────────

export const DEFAULT_STYLE: ResumeStyle = {
  language: "English",
  dateFormat: "MMM YYYY",
  pageFormat: "A4",
  template: "classic",

  columns: "one",

  baseFontSize: 10,
  nameFontSize: 14,
  headingFontSize: 3,
  entryHeaderFontSize: 1,

  lineHeight: 1.35,
  elementSpacing: 9,
  marginX: 16,
  marginY: 16,

  entryLayout: 1,
  columnWidth: "auto",
  subtitleStyle: "bold",
  subtitlePlacement: "same",
  indentBody: false,
  listStyle: "bullet",

  headingStyle: 1,
  headingCase: "uppercase",
  headingIcons: "none",

  bodyFont: "Inter",
  nameFont: "",

  colorScope: "header",
  palette: "single",
  accentColor: "#2563eb",
  accentApply: {
    name: true,
    jobTitle: false,
    headings: true,
    headingsLine: true,
    headerIcons: true,
    dotsBars: false,
    dates: false,
    subtitle: false,
    linkIcons: true,
  },

  headerAlign: "center",
  headerDetails: "icon",
  headerIconStyle: 1,

  showPhoto: true,
  photoShape: "circle",
  photoSize: 96,

  linkUnderline: false,
  linkColored: true,
  linkIcon: true,
  linkIconStyle: "external",

  footerText: "",
  showPageNumbers: false,
};

export interface TemplatePreset {
  key: string;
  label: string;
  description: string;
  style: Partial<ResumeStyle>;
}

export const TEMPLATE_PRESETS: TemplatePreset[] = [
  {
    key: "classic",
    label: "Classic",
    description: "Centered header, ruled headings. The safe default for any application.",
    style: {
      columns: "one", headerAlign: "center", headingStyle: 1, headingCase: "uppercase",
      bodyFont: "Inter", accentColor: "#2563eb", colorScope: "header", showPhoto: false,
      headerDetails: "icon", elementSpacing: 8,
    },
  },
  {
    key: "modern",
    label: "Modern",
    description: "Two columns, plain headings, color on the details. Reads fast.",
    style: {
      columns: "two", headerAlign: "left", headingStyle: 3, headingCase: "capitalize",
      bodyFont: "Source Sans 3", accentColor: "#7c3aed", colorScope: "border", showPhoto: false,
      headerDetails: "bullet",
      accentApply: { ...DEFAULT_STYLE.accentApply, headings: true, subtitle: true, dates: true },
    },
  },
  {
    key: "compact",
    label: "Compact",
    description: "Small type, tight spacing. One page even with a long record.",
    style: {
      columns: "one", baseFontSize: 9, lineHeight: 1.15, elementSpacing: 5, marginX: 10, marginY: 10,
      headingStyle: 5, headingCase: "uppercase", bodyFont: "Roboto", accentColor: "#0f766e",
      showPhoto: false, headerDetails: "bar",
    },
  },
  {
    key: "twocol",
    label: "Two-Column",
    description: "Photo beside a left-set header, underlined headings, dense body.",
    style: {
      columns: "two", headerAlign: "left", headingStyle: 2, headingCase: "uppercase",
      bodyFont: "Lato", accentColor: "#be123c", colorScope: "header", showPhoto: true,
      photoShape: "rounded", photoSize: 84, headerDetails: "icon",
    },
  },
  {
    key: "portrait",
    label: "Portrait",
    description: "Photo-forward with a circle portrait and accent-barred headings.",
    style: {
      columns: "one", headerAlign: "left", headingStyle: 6, headingCase: "capitalize",
      bodyFont: "Source Sans 3", nameFont: "Merriweather", accentColor: "#0e7490",
      colorScope: "border", showPhoto: true, photoShape: "circle", photoSize: 96,
      headerDetails: "icon", elementSpacing: 9,
      accentApply: { ...DEFAULT_STYLE.accentApply, name: true, headings: true, headingsLine: true },
    },
  },
  {
    key: "executive",
    label: "Executive",
    description: "Serif headings between double rules, near-black restraint.",
    style: {
      columns: "one", headerAlign: "center", headingStyle: 4, headingCase: "uppercase",
      bodyFont: "Merriweather", accentColor: "#111827", colorScope: "page", showPhoto: false,
      headerDetails: "bar", lineHeight: 1.35, elementSpacing: 10, marginX: 22, marginY: 18,
    },
  },
  {
    key: "banner",
    label: "Banner",
    description: "Tinted header block with a square photo. Confident opener.",
    style: {
      columns: "one", headerAlign: "center", headingStyle: 1, headingCase: "capitalize",
      bodyFont: "Titillium Web", accentColor: "#1d4ed8", colorScope: "header", showPhoto: true,
      photoShape: "square", photoSize: 76, headerDetails: "icon",
      accentApply: { ...DEFAULT_STYLE.accentApply, name: true, headerIcons: true, headingsLine: true },
    },
  },
  {
    key: "ledger",
    label: "Ledger",
    description: "Lora serif, hyphen lists, understated ochre. Quietly archival.",
    style: {
      columns: "one", headerAlign: "left", headingStyle: 2, headingCase: "uppercase",
      bodyFont: "Lora", accentColor: "#a16207", colorScope: "page", showPhoto: false,
      headerDetails: "bullet", listStyle: "hyphen", lineHeight: 1.3,
      accentApply: { ...DEFAULT_STYLE.accentApply, headings: true, dates: true },
    },
  },
];

export interface FontOption {
  label: string;
  /** CSS font-family stack. */
  stack: string;
  /** Google Fonts family name to load (omit for system fonts). */
  google?: string;
}

// Every family here is libre (SIL OFL or Apache 2.0) and loads from Google
// Fonts at runtime; nothing proprietary is named, so documents render the
// same everywhere and the template stays permissively licensed end to end.
export const FONT_OPTIONS: FontOption[] = [
  { label: "Inter", stack: "'Inter', system-ui, sans-serif", google: "Inter:wght@400;500;600;700" },
  { label: "Source Sans 3", stack: "'Source Sans 3', system-ui, sans-serif", google: "Source+Sans+3:wght@400;600;700" },
  { label: "Lato", stack: "'Lato', system-ui, sans-serif", google: "Lato:wght@400;700" },
  { label: "Roboto", stack: "'Roboto', system-ui, sans-serif", google: "Roboto:wght@400;500;700" },
  { label: "Titillium Web", stack: "'Titillium Web', system-ui, sans-serif", google: "Titillium+Web:wght@400;600;700" },
  { label: "Merriweather", stack: "'Merriweather', Georgia, serif", google: "Merriweather:wght@400;700" },
  { label: "Lora", stack: "'Lora', Georgia, serif", google: "Lora:wght@400;600;700" },
  { label: "Source Serif 4", stack: "'Source Serif 4', Georgia, serif", google: "Source+Serif+4:opsz,wght@8..60,400;8..60,600;8..60,700" },
];

export const fontStack = (label: string): string =>
  FONT_OPTIONS.find((f) => f.label === label)?.stack || FONT_OPTIONS[0].stack;

// ── Template sample content ──────────────────────────────────────────────
// A tiny fictional document rendered inside each template card, so choosing
// a template means seeing it typeset, not guessing from an abstraction. The
// portrait is the ecosystem's own hand-drawn SVG (original artwork; nothing
// here carries a restrictive license).

export const SAMPLE_PHOTO =
  "data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHZpZXdCb3g9IjAgMCAxMjAgMTIwIj4gPHJlY3Qgd2lkdGg9IjEyMCIgaGVpZ2h0PSIxMjAiIGZpbGw9IiMyMjFiMTQiLz4gPGNpcmNsZSBjeD0iMjIiIGN5PSIyNCIgcj0iMS40IiBmaWxsPSIjZjBlN2Q4IiBvcGFjaXR5PSIwLjUiLz4gPGNpcmNsZSBjeD0iMTAyIiBjeT0iNjYiIHI9IjEuMSIgZmlsbD0iI2YwZTdkOCIgb3BhY2l0eT0iMC4zNSIvPiA8Y2lyY2xlIGN4PSIxNCIgY3k9Ijc4IiByPSIxLjIiIGZpbGw9IiNmMGU3ZDgiIG9wYWNpdHk9IjAuMyIvPiA8Y2lyY2xlIGN4PSI5NSIgY3k9IjE0IiByPSIxLjMiIGZpbGw9IiNmMGU3ZDgiIG9wYWNpdHk9IjAuNDUiLz4gPHBhdGggZD0iTTE4IDEyMCBDMTggODYgMzggNzAgNjAgNzAgQzgyIDcwIDEwMiA4NiAxMDIgMTIwIFoiIGZpbGw9IiM0YTNiMmEiLz4gPHBhdGggZD0iTTYwIDE0IEM0MCAxNCAzMCAzOCAzMiA2MCBDNDAgNTIgNTAgNDcgNjAgNDcgQzcwIDQ3IDgwIDUyIDg4IDYwIEM5MCAzOCA4MCAxNCA2MCAxNCBaIiBmaWxsPSIjNWM0YTMzIi8+IDxjaXJjbGUgY3g9IjYwIiBjeT0iNTIiIHI9IjE1IiBmaWxsPSIjMTUwZjBhIi8+IDxjaXJjbGUgY3g9IjU0IiBjeT0iNTEiIHI9IjIuNiIgZmlsbD0iI2ZmYjA2NiIvPiA8Y2lyY2xlIGN4PSI2NiIgY3k9IjUxIiByPSIyLjYiIGZpbGw9IiNmZmIwNjYiLz4gPHBhdGggZD0iTTg5IDI0IGwyLjQgNi40IDYuNCAyLjQgLTYuNCAyLjQgLTIuNCA2LjQgLTIuNCAtNi40IC02LjQgLTIuNCA2LjQgLTIuNCBaIiBmaWxsPSIjZmY4YTUwIi8+IDxjaXJjbGUgY3g9IjMxIiBjeT0iNDIiIHI9IjEuNiIgZmlsbD0iI2ZmOGE1MCIgb3BhY2l0eT0iMC43Ii8+IDwvc3ZnPg==";

export function sampleDocument(stylePatch: Partial<ResumeStyle>): ResumeDocument {
  return {
    id: "sample",
    name: "Sample",
    kind: "resume",
    createdAt: "",
    updatedAt: "",
    lastSyncedAt: "",
    personal: {
      name: "Wren Emberquill",
      title: "Artificer",
      location: "Cinderfen",
      email: "wren@example.com",
      photo: SAMPLE_PHOTO,
      links: [{ id: "l1", label: "Portfolio", url: "#", icon: "Globe" }],
    },
    sections: [
      {
        id: "s1",
        kind: "summary",
        heading: "Summary",
        visible: true,
        source: "custom",
        entries: [
          {
            id: "e0",
            description:
              "<p>Artificer of wards and golems; nine years of keeping intricate systems lit, calibrated, and shipped on time.</p>",
          },
        ],
      },
      {
        id: "s2",
        kind: "experience",
        heading: "Experience",
        visible: true,
        source: "custom",
        entries: [
          {
            id: "e1",
            title: "Guild Artificer",
            subtitle: "The Artificers' Guild",
            startDate: "2024-03",
            description:
              "<ul><li>Keeps the eastern quarter's wards lit through every storm season.</li><li>Calibrated the golem fleet to a fault rate the guild had never seen.</li></ul>",
          },
          {
            id: "e2",
            title: "Foundry Enchanter",
            subtitle: "Ironspire Foundry",
            startDate: "2022-06",
            endDate: "2024-02",
            description: "<ul><li>Runesmithing at production scale.</li></ul>",
          },
        ],
      },
      {
        id: "s3",
        kind: "education",
        heading: "Education",
        visible: true,
        source: "custom",
        entries: [
          {
            id: "e3",
            title: "Magister of Aetheric Systems",
            subtitle: "The Academy of Aetheric Studies",
            startDate: "2018-09",
            endDate: "2020-06",
          },
        ],
      },
    ],
    style: { ...DEFAULT_STYLE, ...stylePatch },
  };
}
