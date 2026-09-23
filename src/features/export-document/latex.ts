// LaTeX export: a STRUCTURAL renderer over the document model, built on the
// export layout contract (src/export/layout.ts) so it makes the same layout
// decisions as the preview and the Word export: geometry, colors, heading
// decorations, entry composition, section shapes, and columns. Compiles with
// pdflatex out of the box; exact webfonts need xelatex (a ready-made fontspec
// block is emitted, commented). docs/export-parity.md carries the mapping.

import { PAGE_DIMS, PersonalDetails, ResumeDocument, ResumeEntry, ResumeSection, ResumeStyle, fmtResumeDate, presentWord, proficiencyDots, resolveColors, resolveEntry, resolveGeometry, resolveHeading, resolveType, sectionShape, splitRegions, type ColorPlan, type EntrySpec, type Geometry, type HeadingSpec, type RegionSplit, type SectionShape, type TypeScale } from "@/entities/resume";
import { downloadFile, slugify } from "./shared";

// ── text / html escaping ────────────────────────────────────────────────────

function escapeLatex(text: string): string {
  return text
    .replace(/\\/g, "\\textbackslash{}")
    .replace(/([&%$#_{}])/g, "\\$1")
    .replace(/~/g, "\\textasciitilde{}")
    .replace(/\^/g, "\\textasciicircum{}");
}

/** A safe \href: placeholder targets ("#", empty) render as plain text, and
 *  real URLs get their %, #, and & escaped. A raw # inside \href's argument
 *  is an "Illegal parameter number" compile error. */
function texHref(url: string | undefined, text: string): string {
  const u = (url || "").trim();
  if (!u || u === "#" || u.startsWith("#")) return text;
  return `\\href{${u.replace(/([%#&])/g, "\\$1")}}{${text}}`;
}

// The forms more than one description tag shares.
const texBold = (inner: string) => `\\textbf{${inner}}`;
const texItalic = (inner: string) => `\\textit{${inner}}`;
const texParagraph = (inner: string) => `${inner}\n\n`;
const texHeading = (inner: string) => `\\textbf{${inner}}\n\n`;

// The LaTeX each description tag becomes, given its converted contents; any
// other tag passes its contents through.
const TEX_TAGS = new Map<string, (inner: string, el: HTMLElement) => string>([
  ["strong", texBold], ["b", texBold],
  ["em", texItalic], ["i", texItalic],
  ["u", (inner) => `\\underline{${inner}}`],
  ["a", (inner, el) => texHref(el.getAttribute("href") || "", inner)],
  ["br", () => "\\\\\n"],
  ["ul", (inner) => `\n\\begin{itemize}\n${inner}\\end{itemize}\n`],
  ["ol", (inner) => `\n\\begin{enumerate}\n${inner}\\end{enumerate}\n`],
  ["li", (inner) => `  \\item ${inner.trim()}\n`],
  ["p", texParagraph], ["div", texParagraph],
  ["h1", texHeading], ["h2", texHeading], ["h3", texHeading],
  ["h4", texHeading], ["h5", texHeading], ["h6", texHeading],
]);

/** Convert the HTML produced by ResumeRichText into LaTeX. */
function htmlToLatex(html?: string): string {
  if (!html) return "";
  let root: Document;
  try {
    root = new DOMParser().parseFromString(`<body>${html}</body>`, "text/html");
  } catch {
    return escapeLatex(html.replace(/<[^>]+>/g, ""));
  }

  const walk = (node: Node): string => {
    if (node.nodeType === Node.TEXT_NODE) {
      return escapeLatex(node.textContent || "");
    }
    if (node.nodeType !== Node.ELEMENT_NODE) return "";

    const el = node as HTMLElement;
    const inner = Array.from(el.childNodes).map(walk).join("");
    const tex = TEX_TAGS.get(el.tagName.toLowerCase());
    return tex ? tex(inner, el) : inner;
  };

  return walk(root.body).replace(/\n{3,}/g, "\n\n").trim();
}

// ── dates ─────────────────────────────────────────────────────────────────

// The document's language, set once per export so every date helper renders
// month names and the open-ended range word in it.
let currentLanguage = "English";
const fmtDate = (d: string | undefined, fmt: string) =>
  fmtResumeDate(d, fmt, currentLanguage);

function dateRange(s: string | undefined, e: string | undefined, fmt: string): string {
  if (!s && !e) return "";
  if (s && e) return `${fmtDate(s, fmt)} -- ${fmtDate(e, fmt)}`;
  if (s && !e) return `${fmtDate(s, fmt)} -- ${presentWord(currentLanguage)}`;
  return fmtDate(e, fmt);
}

// ── color plumbing ──────────────────────────────────────────────────────────

function hexNoHash(hex: string): string {
  const m = /^#?([0-9a-fA-F]{6})$/.exec(hex);
  return m ? m[1].toUpperCase() : "2563EB";
}

// ── entries ─────────────────────────────────────────────────────────────────

const items = (e: ResumeEntry): string[] => (e.meta?.items as string[] | undefined) || [];

function subtitleTex(e: ResumeEntry, style: ResumeStyle): string {
  if (!e.subtitle) return "";
  const s = escapeLatex(e.subtitle);
  if (style.subtitleStyle === "bold") return `\\textbf{${s}}`;
  if (style.subtitleStyle === "italic") return `\\textit{${s}}`;
  return s;
}

const dateTex = (dates: string, style: ResumeStyle) =>
  dates ? `{\\small\\color{${style.accentApply.dates ? "accent" : "muted"}}${escapeLatex(dates)}}` : "";

/** An entry's heading pieces, already in LaTeX, for a layout to arrange into lines. */
interface EntryParts {
  spec: EntrySpec;
  style: ResumeStyle;
  title: string;
  sub: string;
  loc: string;
  dates: string;
}

// Layout 3, everything inline with the date trailing.
function oneLineTex({ style, title, sub, loc, dates }: EntryParts): string[] {
  const inline = [title, sub, loc].filter(Boolean).join(" \\,·\\, ");
  return [dates ? `${inline} --- ${dateTex(dates, style)}\\\\` : `${inline}\\\\`];
}

// Layout 2, stacked, the date and location each on a line of their own.
function stackedTex({ spec, style, title, sub, loc, dates }: EntryParts): string[] {
  const lines: string[] = [];
  if (spec.subtitleInline && sub) lines.push(`${title} \\,·\\, ${sub}\\\\`);
  else {
    lines.push(`${title}\\\\`);
    if (sub) lines.push(`${sub}\\\\`);
  }
  if (dates) lines.push(`${dateTex(dates, style)}\\\\`);
  if (loc) lines.push(`${loc}\\\\`);
  return lines;
}

// Layout 1, the date pushed right of the title line.
function dateRightTex({ spec, style, title, sub, loc, dates }: EntryParts): string[] {
  const lines: string[] = [];
  const left = spec.subtitleInline && sub ? `${title} \\,·\\, ${sub}` : title;
  lines.push(dates ? `${left}\\hfill ${dateTex(dates, style)}\\\\` : `${left}\\\\`);
  if (!spec.subtitleInline && sub) lines.push(`${sub}\\\\`);
  if (loc) lines.push(`${loc}\\\\`);
  return lines;
}

function entryTex(e: ResumeEntry, style: ResumeStyle): string {
  const spec = resolveEntry(style);
  const dates = dateRange(e.startDate, e.endDate, style.dateFormat);
  const titleCore = e.title ? escapeLatex(e.title) : "";
  const title = e.title ? `{\\entrysize\\bfseries ${texHref(e.link, titleCore)}}` : "";
  const sub = subtitleTex(e, style);
  const loc = e.location ? `{\\small\\color{muted}${escapeLatex(e.location)}}` : "";
  const body = htmlToLatex(e.description);
  const parts: EntryParts = { spec, style, title, sub, loc, dates };
  let lines: string[];

  if (spec.layout === 3) {
    lines = oneLineTex(parts);
  } else if (spec.layout === 2) {
    lines = stackedTex(parts);
  } else {
    lines = dateRightTex(parts);
  }

  if (body) lines.push(body);
  return `${lines.join("\n")}\n\\vspace{${Math.max(2, Math.round(style.elementSpacing * 0.6))}pt}\n`;
}

// ── section bodies ──────────────────────────────────────────────────────────

/** The pieces every section body is rendered from. */
interface BodyArgs {
  section: ResumeSection;
  visible: ResumeEntry[];
  style: ResumeStyle;
}

// One body per section shape, rendering only the visible entries.
const SECTION_TEX: Record<SectionShape, (a: BodyArgs) => string> = {
  prose: ({ visible }) => htmlToLatex(visible[0]?.description),

  "skill-groups": ({ visible }) =>
    visible
      .map((e) => `\\textbf{${escapeLatex(e.title || "")}:} ${items(e).map(escapeLatex).join(", ")}\\\\`)
      .join("\n"),

  "skill-chips": ({ visible }) =>
    `\\raggedright\n${visible
      .flatMap((e) => (items(e).length ? items(e) : [e.title || ""]))
      .map((it) => `\\colorbox{accenttint}{\\small ${escapeLatex(it)}}`)
      .join("\n\\,")}\\par`,

  "lang-dots": ({ visible }) =>
    visible
      .map((e) => {
        const n = proficiencyDots(e.subtitle);
        const dots = `{\\color{accent}${"$\\bullet$".repeat(n)}${"$\\circ$".repeat(5 - n)}}`;
        return `\\textbf{${escapeLatex(e.title || "")}}\\hfill ${dots}\\\\`;
      })
      .join("\n"),

  "lang-grid": ({ visible }) => {
    const cell = (e?: ResumeEntry) =>
      e ? `\\textbf{${escapeLatex(e.title || "")}}${e.subtitle ? ` \\,·\\, ${escapeLatex(e.subtitle)}` : ""}` : "";
    const rows: string[] = [];
    for (let i = 0; i < visible.length; i += 2) {
      rows.push(`${cell(visible[i])} & ${cell(visible[i + 1])}\\\\`);
    }
    return `\\begin{tabular}{@{}p{.47\\linewidth}p{.47\\linewidth}@{}}\n${rows.join("\n")}\n\\end{tabular}`;
  },

  "lang-list": ({ visible }) =>
    visible
      .map((e) => `\\textbf{${escapeLatex(e.title || "")}}${e.subtitle ? ` \\,·\\, ${escapeLatex(e.subtitle)}` : ""}`)
      .join(" \\quad "),

  chips: ({ visible }) =>
    `\\raggedright\n${visible
      .map((e) => `\\fcolorbox{chipline}{white}{\\small ${escapeLatex(e.title || "")}}`)
      .join("\n\\,")}\\par`,

  "plain-rows": ({ visible }) =>
    visible
      .map((e) => `\\textbf{${escapeLatex(e.title || "")}}${e.meta?.category ? ` \\,·\\, ${escapeLatex(String(e.meta.category))}` : ""}\\\\`)
      .join("\n"),

  "linked-list": ({ visible, style }) =>
    `\\begin{itemize}\n${visible
      .map((e) => {
        const t = escapeLatex(e.title || "");
        const l = texHref(e.link, t);
        const d = e.startDate ? ` \\hfill {\\small\\color{muted}${escapeLatex(fmtDate(e.startDate, style.dateFormat))}}` : "";
        return `  \\item ${l}${d}`;
      })
      .join("\n")}\n\\end{itemize}`,

  "ref-cards": ({ section, visible }) => {
    const card = (e: ResumeEntry) =>
      [
        e.title ? `{\\entrysize\\bfseries ${escapeLatex(e.title)}}` : "",
        e.subtitle ? `{\\small ${escapeLatex(e.subtitle)}}` : "",
        e.meta?.organization ? `{\\small\\color{muted}${escapeLatex(String(e.meta.organization))}}` : "",
        e.meta?.email ? `{\\small\\color{muted}${escapeLatex(String(e.meta.email))}}` : "",
      ]
        .filter(Boolean)
        .join("\\\\\n");
    if (section.layout === "rows") return visible.map((e) => `${card(e)}\\\\[4pt]`).join("\n");
    const rows: string[] = [];
    for (let i = 0; i < visible.length; i += 2) {
      rows.push(
        `\\begin{minipage}[t]{.47\\linewidth}${card(visible[i])}\\end{minipage}\\hfill` +
          (visible[i + 1] ? `\\begin{minipage}[t]{.47\\linewidth}${card(visible[i + 1])}\\end{minipage}` : "") +
          "\\\\[6pt]"
      );
    }
    return rows.join("\n");
  },

  "entry-rows": ({ visible, style }) =>
    visible
      .map((e) => {
        const t = e.title ? `{\\entrysize\\bfseries ${texHref(e.link, escapeLatex(e.title))}}` : "";
        const sub = subtitleTex(e, style);
        const d = dateRange(e.startDate, e.endDate, style.dateFormat);
        return `${[t, sub].filter(Boolean).join(" \\,·\\, ")}${d ? `\\hfill ${dateTex(d, style)}` : ""}\\\\`;
      })
      .join("\n"),

  "entry-grid": ({ visible, style }) => {
    const rows: string[] = [];
    for (let i = 0; i < visible.length; i += 2) {
      rows.push(
        `\\begin{minipage}[t]{.47\\linewidth}${entryTex(visible[i], style)}\\end{minipage}\\hfill` +
          (visible[i + 1] ? `\\begin{minipage}[t]{.47\\linewidth}${entryTex(visible[i + 1], style)}\\end{minipage}` : "") +
          "\\\\"
      );
    }
    return rows.join("\n");
  },

  entries: ({ visible, style }) => visible.map((e) => entryTex(e, style)).join("\n"),
};

function bodyTex(section: ResumeSection, style: ResumeStyle): string {
  const visible = section.entries.filter((e) => !e.hidden);
  if (visible.length === 0) return "";
  return SECTION_TEX[sectionShape(section)]({ section, visible, style });
}

function sectionTex(section: ResumeSection, style: ResumeStyle, spec: HeadingSpec): string {
  const body = bodyTex(section, style);
  if (!body) return "";
  const raw = spec.uppercase ? escapeLatex(section.heading).toUpperCase() : escapeLatex(section.heading);
  return `\\ressection{${raw}}\n${body}\n`;
}

// ── header ──────────────────────────────────────────────────────────────────

/** The header's name and job title lines, each only when it is set. */
function nameLinesTex(personal: PersonalDetails, style: ResumeStyle, colors: ColorPlan, t: TypeScale): string[] {
  const lines: string[] = [];

  // On a dark band the band ink wins over an accent-colored name (legibility
  // beats decoration; same rule in the preview and Word).
  if (personal.name) {
    const color = colors.headerInk ? "\\color{headerink}" : style.accentApply.name ? "\\color{accent}" : "";
    lines.push(`{\\fontsize{${t.namePt}}{${Math.round(t.namePt * 1.15)}}\\selectfont\\bfseries ${color}${escapeLatex(personal.name)}}\\\\[2pt]`);
  }
  if (personal.title) {
    const color = colors.headerInk ? "\\color{headerink}" : style.accentApply.jobTitle ? "\\color{accent}" : "";
    lines.push(`{\\large ${color}${escapeLatex(personal.title)}}\\\\[3pt]`);
  }
  return lines;
}

/** The header's contact line and detail chip line, each only when it has content. */
function detailLinesTex(personal: PersonalDetails, style: ResumeStyle): string[] {
  const lines: string[] = [];
  const sep = style.headerDetails === "bar" ? " \\,\\textbar\\, " : " \\,·\\, ";
  const contacts: string[] = [];
  if (personal.location) contacts.push(escapeLatex(personal.location));
  if (personal.email) contacts.push(texHref(`mailto:${personal.email}`, escapeLatex(personal.email)));
  if (personal.phone) contacts.push(escapeLatex(personal.phone));
  personal.links?.forEach((l) => contacts.push(texHref(l.url, escapeLatex(l.label))));
  if (contacts.length) lines.push(`{\\small ${contacts.join(sep)}}\\\\`);

  const extras = Object.entries(personal.extra || {}).filter(([, v]) => v);
  if (extras.length) {
    lines.push(`{\\footnotesize ${extras.map(([k, v]) => `${escapeLatex(k)}: ${escapeLatex(v)}`).join(" \\quad ")}}\\\\`);
  }
  return lines;
}

function headerTex(doc: ResumeDocument, colors: ColorPlan, t: TypeScale): string {
  const { personal, style } = doc;
  const center = style.headerAlign === "center";
  const lines = [...nameLinesTex(personal, style, colors, t), ...detailLinesTex(personal, style)];

  const env = center ? "center" : "flushleft";
  const inner = `\\begin{${env}}\n${lines.join("\n")}\n\\end{${env}}`;

  // With the "header" color scope, the block sits on its band. LaTeX cannot
  // paint the page margins from here, so the band spans the text block.
  if (colors.headerBg) {
    const ink = colors.headerInk ? "\\color{headerink}" : "";
    return `\\noindent\\colorbox{headerbg}{\\parbox{\\dimexpr\\linewidth-2\\fboxsep}{${ink}${inner}}}\n\\vspace{4pt}`;
  }
  return inner;
}

// ── document assembly ───────────────────────────────────────────────────────

/** \ressection: the six heading decorations, defined once per document. */
function sectionCommand(spec: HeadingSpec, t: TypeScale): string {
  const head = `\\fontsize{${t.headingPt}}{${Math.round(t.headingPt * 1.2)}}\\selectfont\\bfseries${spec.accentText ? "\\color{accent}" : ""}`;
  const gap = "\\vspace{6pt}";
  switch (spec.deco) {
    case "rule":
      return `\\newcommand{\\ressection}[1]{${gap}\\par{${head} #1}\\\\[-0.65em]{\\color{hline}\\rule{\\linewidth}{1.1pt}}\\vspace{2pt}\\par}`;
    case "tab":
      return `\\newcommand{\\ressection}[1]{${gap}\\par{${head} #1}\\\\[-0.7em]{\\color{hline}\\rule{2.4em}{1.6pt}}\\vspace{2pt}\\par}`;
    case "plain":
      return `\\newcommand{\\ressection}[1]{${gap}\\par{${head} #1}\\vspace{2pt}\\par}`;
    case "frame":
      return `\\newcommand{\\ressection}[1]{${gap}\\par{\\color{hline}\\rule{\\linewidth}{0.7pt}}\\\\[-0.35em]{${head} #1}\\\\[-0.65em]{\\color{hline}\\rule{\\linewidth}{0.7pt}}\\vspace{2pt}\\par}`;
    case "fill":
      return `\\newcommand{\\ressection}[1]{${gap}\\par\\noindent\\colorbox{accenttint}{\\parbox{\\dimexpr\\linewidth-2\\fboxsep}{${head} #1}}\\vspace{2pt}\\par}`;
    case "edge":
      return `\\newcommand{\\ressection}[1]{${gap}\\par{\\color{accent}\\rule[-2pt]{2.5pt}{11pt}}\\hspace{5pt}{${head} #1}\\vspace{2pt}\\par}`;
  }
}

/** pdflatex-safe font substitution + a ready xelatex block for exact fonts. */
function fontSetup(t: TypeScale): string {
  const serif = ["Merriweather", "Lora", "Source Serif 4"].includes(t.bodyFont);
  const sub = serif
    ? "\\usepackage{charter} % closest stock serif to the document's webfont"
    : "\\usepackage[scaled=0.95]{helvet}\n\\renewcommand{\\familydefault}{\\sfdefault} % closest stock sans to the document's webfont";
  return `${sub}
% Exact fonts: compile with xelatex or lualatex instead and swap the block
% above for the two lines below (the fonts are free; install from Google Fonts).
% \\usepackage{fontspec}
% \\setmainfont{${t.bodyFont}}`;
}

/** The page style and the running footer, set up only when a footer line exists. */
function footerTex(style: ResumeStyle): string {
  const footerParts: string[] = [];
  if (style.footerText) footerParts.push(escapeLatex(style.footerText));
  if (style.showPageNumbers) footerParts.push("\\thepage\\,/\\,\\pageref{LastPage}");
  const footer = footerParts.length
    ? `\\fancyfoot[C]{\\footnotesize\\color{muted}${footerParts.join(" \\,·\\, ")}}`
    : "";
  return `${footer ? "\\usepackage{fancyhdr}\n\\pagestyle{fancy}\n\\fancyhf{}\n\\renewcommand{\\headrulewidth}{0pt}" : "\\pagestyle{empty}"}
${footer}`;
}

/** Every color the document names, the optional ones left as empty lines when unused. */
function colorsTex(colors: ColorPlan, spec: HeadingSpec): string {
  return `\\definecolor{accent}{HTML}{${hexNoHash(colors.accent)}}
\\definecolor{accenttint}{HTML}{${hexNoHash(colors.accentTint)}}
\\definecolor{hline}{HTML}{${hexNoHash(spec.lineColor)}}
\\definecolor{muted}{HTML}{4B5563}
\\definecolor{chipline}{HTML}{D1D5DB}
${colors.pageBg ? `\\definecolor{pagetint}{HTML}{${hexNoHash(colors.pageBg)}}\n\\pagecolor{pagetint}` : ""}
${colors.headerBg ? `\\definecolor{headerbg}{HTML}{${hexNoHash(colors.headerBg)}}` : ""}
${colors.headerInk ? `\\definecolor{headerink}{HTML}{${hexNoHash(colors.headerInk)}}` : ""}
${colors.railInk ? `\\definecolor{railink}{HTML}{${hexNoHash(colors.railInk)}}` : ""}`;
}

/** The sidebar body, the rail set as a shaded second paracol column. */
function paracolTex(regions: RegionSplit, g: Geometry, colors: ColorPlan, renderAll: (list: ResumeSection[]) => string): string {
  const frac = (g.railWmm / g.contentWmm).toFixed(3);
  const railInk = colors.railInk ? "\\color{railink}" : "";
  return `\\columnratio{${(1 - g.railWmm / g.contentWmm - 0.02).toFixed(3)},${frac}}
\\setlength{\\columnsep}{${g.railGapMm}mm}
\\begin{paracol}{2}
\\backgroundcolor{c[1]}[HTML]{${hexNoHash(colors.railBg)}}
${renderAll(regions.main)}
\\switchcolumn
${railInk}${renderAll(regions.side)}
\\end{paracol}`;
}

/** The two-column body, set with multicols. */
function multicolTex(regions: RegionSplit, renderAll: (list: ResumeSection[]) => string): string {
  // Mix keeps its prose sections at full width, like the preview.
  const spanning = regions.mode === "mix"
    ? regions.main.filter((s) => s.kind === "summary" || s.kind === "declaration")
    : [];
  const cols = regions.main.filter((s) => !spanning.includes(s));
  const pre = spanning.filter((s) => s.kind === "summary");
  const post = spanning.filter((s) => s.kind === "declaration");
  return `${renderAll(pre)}
\\begin{multicols}{2}
${renderAll(cols)}
\\end{multicols}
${renderAll(post)}`;
}

/**
 * Renders a document as a compilable LaTeX source file.
 *
 * @param doc - The document to render.
 *
 * @returns A complete `.tex` document, compilable with pdflatex and needing
 *   no external class file.
 */
export function documentToLatex(doc: ResumeDocument): string {
  const { style } = doc;
  currentLanguage = style.language;
  const g = resolveGeometry(style);
  const t = resolveType(style);
  const colors = resolveColors(style);
  const spec = resolveHeading(style);
  const ptClass = t.basePt <= 10 ? 10 : t.basePt >= 12 ? 12 : 11;

  const regions = splitRegions(style, doc.sections);
  const renderAll = (list: ResumeSection[]) =>
    list.map((s) => sectionTex(s, style, spec)).filter(Boolean).join("\n");

  let bodyTexStr: string;
  const usesParacol = regions.mode === "sidebar";
  const usesMulticol = regions.mode === "two" || regions.mode === "mix";

  if (usesParacol) {
    bodyTexStr = paracolTex(regions, g, colors, renderAll);
  } else if (usesMulticol) {
    bodyTexStr = multicolTex(regions, renderAll);
  } else {
    bodyTexStr = renderAll(regions.main);
  }

  return `% Generated by EPITOMA, the resume builder.
% Compile with: pdflatex "${slugify(doc.name)}.tex"  (twice, for page totals)
\\documentclass[${ptClass}pt,${(PAGE_DIMS[style.pageFormat] ?? PAGE_DIMS.A4).latex}]{article}
\\usepackage[T1]{fontenc}
\\usepackage[utf8]{inputenc}
\\usepackage[top=${g.marginY}mm,bottom=${g.marginY}mm,left=${g.marginX}mm,right=${g.marginX}mm]{geometry}
\\usepackage{enumitem}
\\usepackage{xcolor}
\\usepackage{lastpage}
${usesParacol ? "\\usepackage{paracol}" : ""}${usesMulticol ? "\\usepackage{multicol}\n\\setlength{\\columnsep}{10mm}" : ""}
\\usepackage[hidelinks]{hyperref}
${fontSetup(t)}
${footerTex(style)}

${colorsTex(colors, spec)}
\\newcommand{\\entrysize}{\\fontsize{${t.entryPt}}{${Math.round(t.entryPt * 1.25)}}\\selectfont}
${sectionCommand(spec, t)}
\\setlist{nosep, topsep=2pt, leftmargin=1.3em}
\\setlength{\\parindent}{0pt}
\\renewcommand{\\baselinestretch}{${t.lineHeight}}

\\begin{document}
${headerTex(doc, colors, t)}

${bodyTexStr}
\\end{document}
`;
}

/**
 * Renders a document to LaTeX and hands it to the browser as a download.
 *
 * @param doc - The document to export; its name becomes the filename.
 *
 * @returns Nothing.
 */
export function exportLatex(doc: ResumeDocument) {
  downloadFile(`${slugify(doc.name)}.tex`, "application/x-tex", documentToLatex(doc));
}
