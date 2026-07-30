// Word export: a STRUCTURAL renderer over the document model, not a DOM
// clone. Word's HTML import ignores flexbox, grid, and transforms, so the
// layout is rebuilt from the export layout contract (src/export/layout.ts)
// using primitives Word honors: tables for right-aligned dates and columns,
// paragraph borders for heading decorations, shaded table cells for the
// sidebar rail, and an mso footer for the footer line and page numbers.
// docs/export-parity.md carries the full mapping.

import { ResumeDocument, ResumeEntry, ResumeSection, ResumeStyle } from "@/types/resume";
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
} from "./layout";
import { cssFontStack, downloadFile, escapeHtml, RESUME_PROSE_CSS, slugify } from "./shared";

// ── small helpers ───────────────────────────────────────────────────────────

const dateRange = (s: string | undefined, e: string | undefined, style: ResumeStyle) => {
  const f = (d: string | undefined) => fmtResumeDate(d, style.dateFormat, style.language);
  if (!s && !e) return "";
  if (s && e) return `${f(s)} – ${f(e)}`;
  if (s && !e) return `${f(s)} – ${presentWord(style.language)}`;
  return f(e);
};

const items = (e: ResumeEntry): string[] => (e.meta?.items as string[] | undefined) || [];

const link = (href: string | undefined, text: string, style: ResumeStyle, colors: ColorPlan) => {
  if (!href) return text;
  const deco = style.linkUnderline ? "underline" : "none";
  const color = style.linkColored ? colors.accent : "inherit";
  return `<a href="${escapeHtml(href)}" style="color:${color};text-decoration:${deco}">${text}</a>`;
};

/** A full-width single-row table: Word's reliable way to right-align. */
const leftRight = (left: string, right: string) =>
  `<table width="100%" cellpadding="0" cellspacing="0" style="border-collapse:collapse"><tr>` +
  `<td valign="baseline">${left}</td>` +
  `<td valign="baseline" align="right" style="white-space:nowrap">${right}</td>` +
  `</tr></table>`;

// ── headings ────────────────────────────────────────────────────────────────

function headingHtml(section: ResumeSection, colors: ColorPlan, spec: HeadingSpec, headingPt: number): string {
  let text = escapeHtml(section.heading);
  if (spec.uppercase) text = text.toUpperCase();
  const color = spec.accentText ? colors.accent : "inherit";
  const base = `font-size:${headingPt}pt;font-weight:bold;color:${color};margin:6pt 0 3pt`;
  switch (spec.deco) {
    case "rule":
      return `<p style="${base};border-bottom:1.5pt solid ${spec.lineColor};padding-bottom:2pt">${text}</p>`;
    case "tab":
      return `<p style="${base}">${text}</p><div style="border-bottom:2pt solid ${spec.lineColor};width:60pt;margin:-2pt 0 3pt"></div>`;
    case "plain":
      return `<p style="${base}">${text}</p>`;
    case "frame":
      return `<p style="${base};border-top:1pt solid ${spec.lineColor};border-bottom:1pt solid ${spec.lineColor};padding:2pt 0">${text}</p>`;
    case "fill":
      return `<p style="${base};background:${colors.accentTint};padding:2pt 5pt">${text}</p>`;
    case "edge":
      return `<p style="${base};border-left:2.5pt solid ${colors.accent};padding-left:5pt">${text}</p>`;
  }
}

// ── entries ─────────────────────────────────────────────────────────────────

function subtitleHtml(e: ResumeEntry, style: ResumeStyle, inlineSep: boolean): string {
  if (!e.subtitle) return "";
  const weight = style.subtitleStyle === "bold" ? "font-weight:bold;" : "";
  const italic = style.subtitleStyle === "italic" ? "font-style:italic;" : "";
  return `${inlineSep ? " · " : ""}<span style="${weight}${italic}">${escapeHtml(e.subtitle)}</span>`;
}

function entryHtml(e: ResumeEntry, style: ResumeStyle, colors: ColorPlan, entryPt: number): string {
  const spec = resolveEntry(style);
  const dates = dateRange(e.startDate, e.endDate, style);
  const title = e.title
    ? `<span style="font-size:${entryPt}pt;font-weight:bold">${link(e.link, escapeHtml(e.title), style, colors)}</span>`
    : "";
  const dateSpan = dates
    ? `<span style="font-size:0.85em;color:${style.accentApply.dates ? colors.accent : "#4b5563"}">${escapeHtml(dates)}</span>`
    : "";
  const location = e.location
    ? `<p style="margin:0;font-size:0.85em;color:#6b7280">${escapeHtml(e.location)}</p>`
    : "";
  const desc = e.description ? `<div class="resume-prose" style="font-size:0.92em">${e.description}</div>` : "";

  if (spec.layout === 3) {
    const loc = e.location ? `<span style="font-size:0.85em;color:#6b7280"> · ${escapeHtml(e.location)}</span>` : "";
    return `<div style="margin-bottom:${style.elementSpacing}px">` +
      `<p style="margin:0">${title}${subtitleHtml(e, style, true)}${loc}${dates ? ` — ${dateSpan}` : ""}</p>${desc}</div>`;
  }

  const firstLine = spec.subtitleInline ? `${title}${subtitleHtml(e, style, true)}` : title;
  const subLine = !spec.subtitleInline && e.subtitle ? `<p style="margin:0">${subtitleHtml(e, style, false)}</p>` : "";

  if (spec.layout === 2) {
    return `<div style="margin-bottom:${style.elementSpacing}px">` +
      `<p style="margin:0">${firstLine}</p>${subLine}` +
      (dates ? `<p style="margin:0">${dateSpan}</p>` : "") +
      `${location}${desc}</div>`;
  }

  // Layout 1: date pushed to the right edge.
  return `<div style="margin-bottom:${style.elementSpacing}px">` +
    `${leftRight(firstLine, dateSpan)}${subLine}${location}${desc}</div>`;
}

// ── section bodies ──────────────────────────────────────────────────────────

const chip = (text: string, bg: string, border?: string) =>
  `<span style="background:${bg};${border ? `border:0.75pt solid ${border};` : ""}padding:1pt 6pt;font-size:0.85em">${escapeHtml(text)}</span>`;

function bodyHtml(section: ResumeSection, style: ResumeStyle, colors: ColorPlan, entryPt: number): string {
  const visible = section.entries.filter((e) => !e.hidden);
  if (visible.length === 0) return "";

  switch (sectionShape(section)) {
    case "prose":
      return `<div class="resume-prose">${visible[0]?.description || ""}</div>`;

    case "skill-groups":
      return visible
        .map((e) => `<p style="margin:0 0 2pt"><b>${escapeHtml(e.title || "")}:</b> ${items(e).map(escapeHtml).join(", ")}</p>`)
        .join("");

    case "skill-chips":
      return `<p style="margin:0;line-height:1.9">${visible
        .flatMap((e) => (items(e).length ? items(e) : [e.title || ""]))
        .map((it) => chip(it, colors.accentTint))
        .join(" ")}</p>`;

    case "lang-dots":
      return visible
        .map((e) => {
          const n = proficiencyDots(e.subtitle);
          const dots = Array.from({ length: 5 }, (_, i) =>
            `<span style="color:${colors.accent}">${i < n ? "●" : "○"}</span>`
          ).join("");
          return leftRight(`<b>${escapeHtml(e.title || "")}</b>`, `<span title="${escapeHtml(e.subtitle || "")}">${dots}</span>`);
        })
        .join("");

    case "lang-grid": {
      const cells = visible.map(
        (e) => `<b>${escapeHtml(e.title || "")}</b>${e.subtitle ? ` · ${escapeHtml(e.subtitle)}` : ""}`
      );
      let rows = "";
      for (let i = 0; i < cells.length; i += 2) {
        rows += `<tr><td width="50%" style="padding:0 0 2pt">${cells[i]}</td><td width="50%" style="padding:0 0 2pt">${cells[i + 1] ?? ""}</td></tr>`;
      }
      return `<table width="100%" cellpadding="0" cellspacing="0">${rows}</table>`;
    }

    case "lang-list":
      return `<p style="margin:0">${visible
        .map((e) => `<b>${escapeHtml(e.title || "")}</b>${e.subtitle ? ` · ${escapeHtml(e.subtitle)}` : ""}`)
        .join("&nbsp;&nbsp;&nbsp;&nbsp;")}</p>`;

    case "chips":
      return `<p style="margin:0;line-height:1.9">${visible
        .map((e) => chip(e.title || "", "transparent", "#d1d5db"))
        .join(" ")}</p>`;

    case "plain-rows":
      return visible
        .map((e) => `<p style="margin:0 0 2pt"><b>${escapeHtml(e.title || "")}</b>${e.meta?.category ? ` · ${escapeHtml(String(e.meta.category))}` : ""}</p>`)
        .join("");

    case "linked-list":
      return visible
        .map((e) => {
          const d = e.startDate ? fmtResumeDate(e.startDate, style.dateFormat, style.language) : "";
          return leftRight(
            link(e.link, escapeHtml(e.title || ""), style, colors),
            d ? `<span style="font-size:0.85em;color:#4b5563">${escapeHtml(d)}</span>` : ""
          );
        })
        .join("");

    case "ref-cards": {
      const card = (e: ResumeEntry) =>
        `<p style="margin:0 0 6pt"><b style="font-size:${entryPt}pt">${escapeHtml(e.title || "")}</b>` +
        (e.subtitle ? `<br/><span style="font-size:0.9em">${escapeHtml(e.subtitle)}</span>` : "") +
        (e.meta?.organization ? `<br/><span style="font-size:0.85em;color:#6b7280">${escapeHtml(String(e.meta.organization))}</span>` : "") +
        (e.meta?.email ? `<br/><span style="font-size:0.85em;color:#6b7280">${escapeHtml(String(e.meta.email))}</span>` : "") +
        `</p>`;
      if (section.layout === "rows") return visible.map(card).join("");
      let rows = "";
      for (let i = 0; i < visible.length; i += 2) {
        rows += `<tr><td width="50%" valign="top">${card(visible[i])}</td><td width="50%" valign="top">${visible[i + 1] ? card(visible[i + 1]) : ""}</td></tr>`;
      }
      return `<table width="100%" cellpadding="0" cellspacing="0">${rows}</table>`;
    }

    case "entry-rows":
      return visible
        .map((e) =>
          leftRight(
            `<span style="font-size:${entryPt}pt;font-weight:bold">${link(e.link, escapeHtml(e.title || ""), style, colors)}</span>${subtitleHtml(e, style, true)}`,
            `<span style="font-size:0.85em;color:#4b5563">${escapeHtml(dateRange(e.startDate, e.endDate, style))}</span>`
          )
        )
        .join("");

    case "entry-grid": {
      let rows = "";
      for (let i = 0; i < visible.length; i += 2) {
        rows += `<tr><td width="50%" valign="top" style="padding-right:8pt">${entryHtml(visible[i], style, colors, entryPt)}</td>` +
          `<td width="50%" valign="top">${visible[i + 1] ? entryHtml(visible[i + 1], style, colors, entryPt) : ""}</td></tr>`;
      }
      return `<table width="100%" cellpadding="0" cellspacing="0">${rows}</table>`;
    }

    case "entries":
      return visible.map((e) => entryHtml(e, style, colors, entryPt)).join("");
  }
}

function sectionHtml(section: ResumeSection, style: ResumeStyle, colors: ColorPlan, spec: HeadingSpec, headingPt: number, entryPt: number): string {
  const body = bodyHtml(section, style, colors, entryPt);
  if (!body) return "";
  return `${headingHtml(section, colors, spec, headingPt)}${body}`;
}

// ── header ──────────────────────────────────────────────────────────────────

function headerHtml(doc: ResumeDocument, colors: ColorPlan): string {
  const { personal, style } = doc;
  const t = resolveType(style);
  const center = style.headerAlign === "center";
  const align = center ? "center" : "left";
  const ink = colors.headerInk;

  const photo =
    personal.photo && style.showPhoto
      ? `<img src="${personal.photo}" width="${Math.round(style.photoSize * 0.75)}" height="${Math.round(style.photoSize * 0.75)}" style="border-radius:${style.photoShape === "circle" ? "50%" : style.photoShape === "rounded" ? "6pt" : "0"}"/><br/>`
      : "";

  // On a dark band the band ink wins over an accent-colored name (legibility
  // beats decoration; same rule in the preview and LaTeX).
  const name = personal.name
    ? `<p style="margin:0;font-family:${cssFontStack(t.nameFont)};font-size:${t.namePt}pt;font-weight:bold;color:${ink || (style.accentApply.name ? colors.accent : "inherit")}">${escapeHtml(personal.name)}</p>`
    : "";
  const title = personal.title
    ? `<p style="margin:0;font-size:0.95em;color:${ink || (style.accentApply.jobTitle ? colors.accent : "inherit")}">${escapeHtml(personal.title)}</p>`
    : "";

  const sep = style.headerDetails === "bar" ? " | " : " • ";
  const contacts: string[] = [];
  if (personal.location) contacts.push(escapeHtml(personal.location));
  if (personal.email) contacts.push(link(`mailto:${personal.email}`, escapeHtml(personal.email), style, colors));
  if (personal.phone) contacts.push(escapeHtml(personal.phone));
  personal.links?.forEach((l) => contacts.push(link(l.url, escapeHtml(l.label), style, colors)));
  const contactLine = contacts.length
    ? `<p style="margin:2pt 0 0;font-size:0.8em;color:${ink || "#4b5563"}">${contacts.join(sep)}</p>`
    : "";

  const extras = Object.entries(personal.extra || {}).filter(([, v]) => v);
  const extraLine = extras.length
    ? `<p style="margin:1pt 0 0;font-size:0.75em;color:${ink || "#6b7280"}">${extras.map(([k, v]) => `${escapeHtml(k)}: ${escapeHtml(v)}`).join(" &nbsp; ")}</p>`
    : "";

  const inner = `${photo}${name}${title}${contactLine}${extraLine}`;
  // With the "header" color scope, the block sits on its band (a shaded
  // full-width table cell; Word cannot paint the page margins).
  if (colors.headerBg) {
    return `<table width="100%" cellpadding="0" cellspacing="0"><tr>` +
      `<td align="${align}" style="background:${colors.headerBg};padding:8pt 10pt;${ink ? `color:${ink}` : ""}">${inner}</td>` +
      `</tr></table><p style="margin:0 0 ${style.elementSpacing}px"></p>`;
  }
  return `<div align="${align}" style="margin-bottom:${style.elementSpacing}px">${inner}</div>`;
}

// ── document assembly ───────────────────────────────────────────────────────

export function documentToWordHtml(doc: ResumeDocument): string {
  const { style } = doc;
  const g = resolveGeometry(style);
  const t = resolveType(style);
  const colors = resolveColors(style);
  const spec = resolveHeading(style);

  const regions = splitRegions(style, doc.sections);
  const renderAll = (list: ResumeSection[]) =>
    list.map((s) => sectionHtml(s, style, colors, spec, t.headingPt, t.entryPt)).filter(Boolean).join("");

  let bodyInner: string;
  if (regions.mode === "sidebar") {
    // The rail: a shaded cell spanning the content area (Word cannot bleed
    // color into the page margins, so the band stops at the margins).
    const railInkStyle = colors.railInk ? `color:${colors.railInk};` : "";
    bodyInner =
      `<table width="100%" cellpadding="0" cellspacing="0" style="border-collapse:collapse"><tr>` +
      `<td valign="top" style="padding-right:${g.railGapMm}mm">${renderAll(regions.main)}</td>` +
      `<td valign="top" width="${Math.round((g.railWmm / g.contentWmm) * 100)}%" style="background:${colors.railBg};${railInkStyle}padding:6pt 8pt">${renderAll(regions.side)}</td>` +
      `</tr></table>`;
  } else if (regions.mode === "two" || regions.mode === "mix") {
    // Word cannot flow CSS columns from HTML; the two-column modes become a
    // balanced two-cell table. Mix keeps its prose sections full width.
    const spanning = regions.mode === "mix"
      ? regions.main.filter((s) => s.kind === "summary" || s.kind === "declaration")
      : [];
    const cols = regions.main.filter((s) => !spanning.includes(s));
    const half = Math.ceil(cols.length / 2);
    const pre = spanning.filter((s) => s.kind === "summary");
    const post = spanning.filter((s) => s.kind === "declaration");
    bodyInner =
      renderAll(pre) +
      `<table width="100%" cellpadding="0" cellspacing="0" style="border-collapse:collapse"><tr>` +
      `<td width="50%" valign="top" style="padding-right:5mm">${renderAll(cols.slice(0, half))}</td>` +
      `<td width="50%" valign="top">${renderAll(cols.slice(half))}</td>` +
      `</tr></table>` +
      renderAll(post);
  } else {
    bodyInner = renderAll(regions.main);
  }

  const footerLine = style.footerText
    ? `<span>${escapeHtml(style.footerText)}</span>`
    : "";
  const pageField = style.showPageNumbers
    ? `<span style="mso-field-code:PAGE"></span> / <span style="mso-field-code:NUMPAGES"></span>`
    : "";
  const footerDiv =
    footerLine || pageField
      ? `<div style="mso-element:footer" id="f1"><p style="margin:0;text-align:center;font-size:8pt;color:#9ca3af">${footerLine}${footerLine && pageField ? " · " : ""}${pageField}</p></div>`
      : "";

  return `<!doctype html>
<html xmlns:o="urn:schemas-microsoft-com:office:office"
      xmlns:w="urn:schemas-microsoft-com:office:word"
      xmlns="http://www.w3.org/TR/REC-html40">
<head>
  <meta charset="utf-8" />
  <title>${escapeHtml(doc.name)}</title>
  <!--[if gte mso 9]><xml><w:WordDocument>
    <w:View>Print</w:View><w:Zoom>100</w:Zoom><w:DoNotOptimizeForBrowser/>
  </w:WordDocument></xml><![endif]-->
  <style>
    @page WordSection1 {
      size: ${(g.pageWmm * 2.8346).toFixed(1)}pt ${(g.pageHmm * 2.8346).toFixed(1)}pt;
      margin: ${g.marginY}mm ${g.marginX}mm;
      mso-footer: f1;
    }
    div.WordSection1 { page: WordSection1; }
    body {
      font-family: ${cssFontStack(t.bodyFont)};
      font-size: ${t.basePt}pt;
      line-height: ${t.lineHeight};
      color: #1f2937;
      ${colors.pageBg ? `background: ${colors.pageBg};` : ""}
      margin: 0;
    }
    p { line-height: ${t.lineHeight}; }
    ${RESUME_PROSE_CSS}
  </style>
</head>
<body${colors.pageBg ? ` bgcolor="${colors.pageBg}"` : ""}>
<div class="WordSection1"${colors.edge ? ` style="border-left:3pt solid ${colors.edge};padding-left:6pt"` : ""}>
${headerHtml(doc, colors)}
${bodyInner}
${footerDiv}
</div>
</body>
</html>`;
}

export function exportWord(doc: ResumeDocument) {
  downloadFile(`${slugify(doc.name)}.doc`, "application/msword", documentToWordHtml(doc));
}
