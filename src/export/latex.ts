// LaTeX export: generate a self-contained, compilable .tex document from the
// document model (not the DOM). Entry descriptions (stored as HTML) are
// converted to LaTeX. Designed to compile with pdflatex out of the box.

import { PAGE_DIMS, ResumeDocument, ResumeEntry, ResumeSection, ResumeStyle } from "@/types/resume";
import { fmtResumeDate, presentWord } from "@/lib/resumeDates";
import { downloadFile, slugify } from "./shared";

// ── text / html escaping ────────────────────────────────────────────────────

function escapeLatex(text: string): string {
  return text
    .replace(/\\/g, "\\textbackslash{}")
    .replace(/([&%$#_{}])/g, "\\$1")
    .replace(/~/g, "\\textasciitilde{}")
    .replace(/\^/g, "\\textasciicircum{}");
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
        const href = el.getAttribute("href");
        return href ? `\\href{${href}}{${inner}}` : inner;
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

// ── section rendering ───────────────────────────────────────────────────────

const items = (e: ResumeEntry): string[] => (e.meta?.items as string[] | undefined) || [];

function renderEntrySection(visible: ResumeEntry[], fmt: string): string {
  return visible
    .map((e) => {
      const lines: string[] = [];
      const dates = dateRange(e.startDate, e.endDate, fmt);
      const title = e.title ? `\\textbf{${escapeLatex(e.title)}}` : "";
      lines.push(
        dates ? `${title}\\hfill {\\small ${escapeLatex(dates)}}\\\\` : `${title}\\\\`
      );
      const subParts = [e.subtitle, e.location].filter(Boolean).map((s) => escapeLatex(s!));
      if (subParts.length) lines.push(`\\textit{${subParts.join(" -- ")}}\\\\`);
      const body = htmlToLatex(e.description);
      if (body) lines.push(body);
      return `${lines.join("\n")}\n\\vspace{4pt}\n`;
    })
    .join("\n");
}

function renderSection(section: ResumeSection, style: ResumeStyle): string {
  const visible = section.entries.filter((e) => !e.hidden);
  if (visible.length === 0) return "";

  const heading = `\\section*{${escapeLatex(section.heading)}}`;
  const kind = section.customType === "skill" ? "skills" : section.kind;
  let body = "";

  switch (kind) {
    case "summary":
    case "declaration":
      body = htmlToLatex(visible[0]?.description);
      break;

    case "skills":
      body = visible
        .map((e) => {
          const list = items(e);
          const val = list.length ? list.map(escapeLatex).join(", ") : "";
          return `\\textbf{${escapeLatex(e.title || "")}:} ${val}\\\\`;
        })
        .join("\n");
      break;

    case "languages":
      body = visible
        .map((e) => {
          const lvl = e.subtitle ? ` -- ${escapeLatex(e.subtitle)}` : "";
          return `\\textbf{${escapeLatex(e.title || "")}}${lvl}\\\\`;
        })
        .join("\n");
      break;

    case "interests":
      body = visible.map((e) => escapeLatex(e.title || "")).join(", ");
      break;

    case "blog":
    case "garden":
      body = `\\begin{itemize}\n${visible
        .map((e) => {
          const t = escapeLatex(e.title || "");
          const link = e.link ? `\\href{${e.link}}{${t}}` : t;
          const d = e.startDate ? ` \\hfill {\\small ${escapeLatex(fmtDate(e.startDate, style.dateFormat))}}` : "";
          return `  \\item ${link}${d}`;
        })
        .join("\n")}\n\\end{itemize}`;
      break;

    case "references":
      body = visible
        .map((e) => {
          const parts = [
            e.title ? `\\textbf{${escapeLatex(e.title)}}` : "",
            e.subtitle ? escapeLatex(e.subtitle) : "",
            e.meta?.organization ? escapeLatex(String(e.meta.organization)) : "",
            e.meta?.email ? escapeLatex(String(e.meta.email)) : "",
          ].filter(Boolean);
          return `${parts.join(", ")}\\\\`;
        })
        .join("\n");
      break;

    default:
      body = renderEntrySection(visible, style.dateFormat);
  }

  return `${heading}\n${body}\n`;
}

// ── document assembly ───────────────────────────────────────────────────────

function hexNoHash(hex: string): string {
  const m = /^#?([0-9a-fA-F]{6})$/.exec(hex);
  return m ? m[1].toUpperCase() : "2563EB";
}

function renderHeader(doc: ResumeDocument): string {
  const { personal, style } = doc;
  const lines: string[] = ["\\begin{center}"];
  if (personal.name) lines.push(`{\\Huge\\bfseries ${escapeLatex(personal.name)}}\\\\[2pt]`);
  if (personal.title) lines.push(`{\\large ${escapeLatex(personal.title)}}\\\\[3pt]`);

  const contacts: string[] = [];
  if (personal.location) contacts.push(escapeLatex(personal.location));
  if (personal.email) contacts.push(`\\href{mailto:${personal.email}}{${escapeLatex(personal.email)}}`);
  if (personal.phone) contacts.push(escapeLatex(personal.phone));
  personal.links?.forEach((l) => contacts.push(`\\href{${l.url}}{${escapeLatex(l.label)}}`));
  if (contacts.length) lines.push(`{\\small ${contacts.join(" \\quad\\textbar\\quad ")}}\\\\`);

  const extras = Object.entries(personal.extra || {}).filter(([, v]) => v);
  if (extras.length) {
    const txt = extras.map(([k, v]) => `${escapeLatex(k)}: ${escapeLatex(v)}`).join(" \\quad ");
    lines.push(`{\\footnotesize ${txt}}\\\\`);
  }

  lines.push("\\end{center}");
  // Accent rule under the header when the style uses an accented heading line.
  if (style.accentApply.headingsLine) lines.push("\\vspace{2pt}");
  return lines.join("\n");
}

export function documentToLatex(doc: ResumeDocument): string {
  const { style } = doc;
  currentLanguage = style.language;
  const paper = (PAGE_DIMS[style.pageFormat] ?? PAGE_DIMS.A4).latex;
  const ptClass = style.baseFontSize <= 10 ? 10 : style.baseFontSize >= 12 ? 12 : 11;
  const accent = hexNoHash(style.accentColor);

  const sections = doc.sections
    .filter((s) => s.visible)
    .map((s) => renderSection(s, style))
    .filter(Boolean)
    .join("\n");

  const footer =
    style.footerText || style.showPageNumbers
      ? `\\fancyfoot[C]{\\footnotesize ${escapeLatex(style.footerText || "")}${
          style.showPageNumbers ? "\\quad\\thepage" : ""
        }}`
      : "";

  return `% Generated by the resume builder.
% Compile with: pdflatex "${slugify(doc.name)}.tex"
\\documentclass[${ptClass}pt,${paper}]{article}
\\usepackage[T1]{fontenc}
\\usepackage[utf8]{inputenc}
\\usepackage[top=${style.marginY}mm,bottom=${style.marginY}mm,left=${style.marginX}mm,right=${style.marginX}mm]{geometry}
\\usepackage{enumitem}
\\usepackage{titlesec}
\\usepackage{xcolor}
\\usepackage[hidelinks]{hyperref}
${footer ? "\\usepackage{fancyhdr}\n\\pagestyle{fancy}\n\\fancyhf{}\n\\renewcommand{\\headrulewidth}{0pt}" : "\\pagestyle{empty}"}
${footer}

\\definecolor{accent}{HTML}{${accent}}
\\setlist{nosep, topsep=2pt, leftmargin=1.3em}
\\titleformat{\\section}{\\large\\bfseries\\color{accent}}{}{0em}{}[\\color{accent}\\titlerule]
\\titlespacing*{\\section}{0pt}{${Math.max(4, Math.round(style.elementSpacing * 0.8))}pt}{3pt}
\\setlength{\\parindent}{0pt}
\\renewcommand{\\baselinestretch}{${style.lineHeight}}

\\begin{document}
${renderHeader(doc)}

${sections}
\\end{document}
`;
}

export function exportLatex(doc: ResumeDocument) {
  downloadFile(`${slugify(doc.name)}.tex`, "application/x-tex", documentToLatex(doc));
}
