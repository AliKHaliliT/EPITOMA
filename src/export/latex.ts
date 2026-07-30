// LaTeX export: a STRUCTURAL renderer over the document model, built on the
// export layout contract (src/export/layout.ts) so it makes the same layout
// decisions as the preview and the Word export: geometry, colors, heading
// decorations, entry composition, section shapes, and columns. Compiles with
// pdflatex out of the box; exact webfonts need xelatex (a ready-made fontspec
// block is emitted, commented). docs/export-parity.md carries the mapping.

import { PAGE_DIMS, ResumeDocument, ResumeEntry, ResumeSection, ResumeStyle } from "@/types/resume";
import { fmtResumeDate, presentWord } from "@/lib/resumeDates";
import {
  proficiencyDots,
  resolveColors,
  resolveEntry,
  resolveGeometry,
  resolveHeading,
  resolveType,
  sectionShape,
  splitRegions,
  type ColorPlan,
  type HeadingSpec,
  type TypeScale,
} from "./layout";
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
    switch (el.tagName.toLowerCase()) {
      case "strong":
      case "b":
        return `\\textbf{${inner}}`;
      case "em":
      case "i":
        return `\\textit{${inner}}`;
      case "u":
        return `\\underline{${inner}}`;
      case "a": {
        return texHref(el.getAttribute("href") || "", inner);
      }
      case "br":
        return "\\\\\n";
      case "ul":
        return `\n\\begin{itemize}\n${inner}\\end{itemize}\n`;
      case "ol":
        return `\n\\begin{enumerate}\n${inner}\\end{enumerate}\n`;
      case "li":
        return `  \\item ${inner.trim()}\n`;
      case "p":
      case "div":
        return `${inner}\n\n`;
      case "h1":
      case "h2":
      case "h3":
      case "h4":
      case "h5":
      case "h6":
        return `\\textbf{${inner}}\n\n`;
      default:
        return inner;
    }
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

function entryTex(e: ResumeEntry, style: ResumeStyle): string {
  const spec = resolveEntry(style);
  const dates = dateRange(e.startDate, e.endDate, style.dateFormat);
  const titleCore = e.title ? escapeLatex(e.title) : "";
  const title = e.title ? `{\\entrysize\\bfseries ${texHref(e.link, titleCore)}}` : "";
  const sub = subtitleTex(e, style);
  const loc = e.location ? `{\\small\\color{muted}${escapeLatex(e.location)}}` : "";
  const body = htmlToLatex(e.description);
  const lines: string[] = [];

  if (spec.layout === 3) {
    const inline = [title, sub, loc].filter(Boolean).join(" \\,·\\, ");
    lines.push(dates ? `${inline} --- ${dateTex(dates, style)}\\\\` : `${inline}\\\\`);
  } else if (spec.layout === 2) {
    if (spec.subtitleInline && sub) lines.push(`${title} \\,·\\, ${sub}\\\\`);
    else {
      lines.push(`${title}\\\\`);
      if (sub) lines.push(`${sub}\\\\`);
    }
    if (dates) lines.push(`${dateTex(dates, style)}\\\\`);
    if (loc) lines.push(`${loc}\\\\`);
  } else {
    const left = spec.subtitleInline && sub ? `${title} \\,·\\, ${sub}` : title;
    lines.push(dates ? `${left}\\hfill ${dateTex(dates, style)}\\\\` : `${left}\\\\`);
    if (!spec.subtitleInline && sub) lines.push(`${sub}\\\\`);
    if (loc) lines.push(`${loc}\\\\`);
  }

  if (body) lines.push(body);
  return `${lines.join("\n")}\n\\vspace{${Math.max(2, Math.round(style.elementSpacing * 0.6))}pt}\n`;
}

// ── section bodies ──────────────────────────────────────────────────────────

function bodyTex(section: ResumeSection, style: ResumeStyle): string {
  const visible = section.entries.filter((e) => !e.hidden);
  if (visible.length === 0) return "";

  switch (sectionShape(section)) {
    case "prose":
      return htmlToLatex(visible[0]?.description);

    case "skill-groups":
      return visible
        .map((e) => `\\textbf{${escapeLatex(e.title || "")}:} ${items(e).map(escapeLatex).join(", ")}\\\\`)
        .join("\n");

    case "skill-chips":
      return `\\raggedright\n${visible
        .flatMap((e) => (items(e).length ? items(e) : [e.title || ""]))
        .map((it) => `\\colorbox{accenttint}{\\small ${escapeLatex(it)}}`)
        .join("\n\\,")}\\par`;

    case "lang-dots":
      return visible
        .map((e) => {
          const n = proficiencyDots(e.subtitle);
          const dots = `{\\color{accent}${"$\\bullet$".repeat(n)}${"$\\circ$".repeat(5 - n)}}`;
          return `\\textbf{${escapeLatex(e.title || "")}}\\hfill ${dots}\\\\`;
        })
        .join("\n");

    case "lang-grid": {
      const cell = (e?: ResumeEntry) =>
        e ? `\\textbf{${escapeLatex(e.title || "")}}${e.subtitle ? ` \\,·\\, ${escapeLatex(e.subtitle)}` : ""}` : "";
      const rows: string[] = [];
      for (let i = 0; i < visible.length; i += 2) {
        rows.push(`${cell(visible[i])} & ${cell(visible[i + 1])}\\\\`);
      }
      return `\\begin{tabular}{@{}p{.47\\linewidth}p{.47\\linewidth}@{}}\n${rows.join("\n")}\n\\end{tabular}`;
    }

    case "lang-list":
      return visible
        .map((e) => `\\textbf{${escapeLatex(e.title || "")}}${e.subtitle ? ` \\,·\\, ${escapeLatex(e.subtitle)}` : ""}`)
        .join(" \\quad ");

    case "chips":
      return `\\raggedright\n${visible
        .map((e) => `\\fcolorbox{chipline}{white}{\\small ${escapeLatex(e.title || "")}}`)
        .join("\n\\,")}\\par`;

    case "plain-rows":
      return visible
        .map((e) => `\\textbf{${escapeLatex(e.title || "")}}${e.meta?.category ? ` \\,·\\, ${escapeLatex(String(e.meta.category))}` : ""}\\\\`)
        .join("\n");

    case "linked-list":
      return `\\begin{itemize}\n${visible
        .map((e) => {
          const t = escapeLatex(e.title || "");
          const l = texHref(e.link, t);
          const d = e.startDate ? ` \\hfill {\\small\\color{muted}${escapeLatex(fmtDate(e.startDate, style.dateFormat))}}` : "";
          return `  \\item ${l}${d}`;
        })
        .join("\n")}\n\\end{itemize}`;

    case "ref-cards": {
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
            `\\\\[6pt]`
        );
      }
      return rows.join("\n");
    }

    case "entry-rows":
      return visible
        .map((e) => {
          const t = e.title ? `{\\entrysize\\bfseries ${texHref(e.link, escapeLatex(e.title))}}` : "";
          const sub = subtitleTex(e, style);
          const d = dateRange(e.startDate, e.endDate, style.dateFormat);
          return `${[t, sub].filter(Boolean).join(" \\,·\\, ")}${d ? `\\hfill ${dateTex(d, style)}` : ""}\\\\`;
        })
        .join("\n");

    case "entry-grid": {
      const rows: string[] = [];
      for (let i = 0; i < visible.length; i += 2) {
        rows.push(
          `\\begin{minipage}[t]{.47\\linewidth}${entryTex(visible[i], style)}\\end{minipage}\\hfill` +
            (visible[i + 1] ? `\\begin{minipage}[t]{.47\\linewidth}${entryTex(visible[i + 1], style)}\\end{minipage}` : "") +
            `\\\\`
        );
      }
      return rows.join("\n");
    }

    case "entries":
      return visible.map((e) => entryTex(e, style)).join("\n");
  }
}

function sectionTex(section: ResumeSection, style: ResumeStyle, spec: HeadingSpec): string {
  const body = bodyTex(section, style);
  if (!body) return "";
  const raw = spec.uppercase ? escapeLatex(section.heading).toUpperCase() : escapeLatex(section.heading);
  return `\\ressection{${raw}}\n${body}\n`;
}

// ── header ──────────────────────────────────────────────────────────────────

function headerTex(doc: ResumeDocument, colors: ColorPlan, t: TypeScale): string {
  const { personal, style } = doc;
  const center = style.headerAlign === "center";
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
    const frac = (g.railWmm / g.contentWmm).toFixed(3);
    const railInk = colors.railInk ? "\\color{railink}" : "";
    bodyTexStr = `\\columnratio{${(1 - g.railWmm / g.contentWmm - 0.02).toFixed(3)},${frac}}
\\setlength{\\columnsep}{${g.railGapMm}mm}
\\begin{paracol}{2}
\\backgroundcolor{c[1]}[HTML]{${hexNoHash(colors.railBg)}}
${renderAll(regions.main)}
\\switchcolumn
${railInk}${renderAll(regions.side)}
\\end{paracol}`;
  } else if (usesMulticol) {
    // Mix keeps its prose sections at full width, like the preview.
    const spanning = regions.mode === "mix"
      ? regions.main.filter((s) => s.kind === "summary" || s.kind === "declaration")
      : [];
    const cols = regions.main.filter((s) => !spanning.includes(s));
    const pre = spanning.filter((s) => s.kind === "summary");
    const post = spanning.filter((s) => s.kind === "declaration");
    bodyTexStr = `${renderAll(pre)}
\\begin{multicols}{2}
${renderAll(cols)}
\\end{multicols}
${renderAll(post)}`;
  } else {
    bodyTexStr = renderAll(regions.main);
  }

  const footerParts: string[] = [];
  if (style.footerText) footerParts.push(escapeLatex(style.footerText));
  if (style.showPageNumbers) footerParts.push("\\thepage\\,/\\,\\pageref{LastPage}");
  const footer = footerParts.length
    ? `\\fancyfoot[C]{\\footnotesize\\color{muted}${footerParts.join(" \\,·\\, ")}}`
    : "";

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
${footer ? "\\usepackage{fancyhdr}\n\\pagestyle{fancy}\n\\fancyhf{}\n\\renewcommand{\\headrulewidth}{0pt}" : "\\pagestyle{empty}"}
${footer}

\\definecolor{accent}{HTML}{${hexNoHash(colors.accent)}}
\\definecolor{accenttint}{HTML}{${hexNoHash(colors.accentTint)}}
\\definecolor{hline}{HTML}{${hexNoHash(spec.lineColor)}}
\\definecolor{muted}{HTML}{4B5563}
\\definecolor{chipline}{HTML}{D1D5DB}
${colors.pageBg ? `\\definecolor{pagetint}{HTML}{${hexNoHash(colors.pageBg)}}\n\\pagecolor{pagetint}` : ""}
${colors.headerBg ? `\\definecolor{headerbg}{HTML}{${hexNoHash(colors.headerBg)}}` : ""}
${colors.headerInk ? `\\definecolor{headerink}{HTML}{${hexNoHash(colors.headerInk)}}` : ""}
${colors.railInk ? `\\definecolor{railink}{HTML}{${hexNoHash(colors.railInk)}}` : ""}
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

export function exportLatex(doc: ResumeDocument) {
  downloadFile(`${slugify(doc.name)}.tex`, "application/x-tex", documentToLatex(doc));
}
