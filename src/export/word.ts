// Word export: emit a Word-compatible HTML document saved as .doc. Microsoft
// Word (and LibreOffice) open this natively. It reuses the rendered A4 page so
// content, links, and most inline styling carry over: layout is best-effort,
// which is the accepted trade-off for a dependency-free Word export.

import { ResumeDocument } from "@/types/resume";
import {
  cssFontStack,
  downloadFile,
  escapeHtml,
  getResumePageEl,
  RESUME_PROSE_CSS,
  slugify,
} from "./shared";

export function documentToWordHtml(doc: ResumeDocument): string {
  const pageEl = getResumePageEl();
  const inner = pageEl ? pageEl.outerHTML : "<p>(open the builder preview to export)</p>";
  const { style } = doc;
  const pageSize = style.pageFormat === "Letter" ? "8.5in 11.0in" : "595.3pt 841.9pt";

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
      size: ${pageSize};
      margin: ${style.marginY}mm ${style.marginX}mm;
    }
    div.WordSection1 { page: WordSection1; }
    body {
      font-family: ${cssFontStack(style.bodyFont)};
      font-size: ${style.baseFontSize}pt;
      line-height: ${style.lineHeight};
      color: #1f2937;
    }
    .resume-page { width: auto !important; min-height: 0 !important; box-shadow: none !important; padding: 0 !important; }
    ${RESUME_PROSE_CSS}
  </style>
</head>
<body><div class="WordSection1">${inner}</div></body>
</html>`;
}

export function exportWord(doc: ResumeDocument) {
  downloadFile(`${slugify(doc.name)}.doc`, "application/msword", documentToWordHtml(doc));
}
