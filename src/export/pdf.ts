// PDF export: open the rendered A4 page in a clean print window and trigger the
// browser's print dialog (→ "Save as PDF"). This yields vector text and real
// fonts: far higher quality than rasterising: with zero dependencies.

import { PAGE_DIMS, ResumeDocument } from "@/types/resume";
import { escapeHtml, getResumePageEl, googleFontHref, RESUME_PROSE_CSS } from "./shared";

export function exportPdf(doc: ResumeDocument) {
  const pageEl = getResumePageEl();
  if (!pageEl) {
    // Builder always renders the preview, so this is a defensive fallback.
    window.print();
    return;
  }

  const href = googleFontHref(doc.style);
  const size = (PAGE_DIMS[doc.style.pageFormat] ?? PAGE_DIMS.A4).css;

  const win = window.open("", "_blank", "width=900,height=1160");
  if (!win) {
    alert("Please allow pop-ups for this site to export a PDF.");
    return;
  }

  win.document.open();
  win.document.write(`<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <title>${escapeHtml(doc.name)}</title>
  ${href ? `<link rel="stylesheet" href="${href}" />` : ""}
  <style>
    @page { size: ${size}; margin: 0; }
    html, body {
      margin: 0; padding: 0; background: #fff;
      -webkit-print-color-adjust: exact; print-color-adjust: exact;
    }
    .resume-page { box-shadow: none !important; }
    ${RESUME_PROSE_CSS}
  </style>
</head>
<body>${pageEl.outerHTML}</body>
</html>`);
  win.document.close();

  // Print once, after fonts/images have had a moment to load.
  let printed = false;
  const triggerPrint = () => {
    if (printed || win.closed) return;
    printed = true;
    win.focus();
    win.print();
  };
  win.onload = () => setTimeout(triggerPrint, 350);
  win.onafterprint = () => win.close();
  setTimeout(triggerPrint, 1200); // safety net if onload never fires
}
