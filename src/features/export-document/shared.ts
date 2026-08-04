// Shared helpers for resume/CV export (PDF / LaTeX / Word).
//
// No new dependencies: PDF reuses the already-rendered `.resume-page` DOM node
// (its computed inline styles travel with it), LaTeX is plain string templating,
// and Word uses the well-known Word-compatible-HTML (.doc) trick.

import { fontStack } from "@/entities/resume";

export const cssFontStack = (label: string): string => fontStack(label);

/** Filesystem-safe slug for the download filename. */
export const slugify = (s: string): string =>
  s
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "") || "document";

/** Escape text for safe injection into an HTML attribute / element. */
export function escapeHtml(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

/** Trigger a client-side file download from a string or Blob. */
export function downloadFile(filename: string, mime: string, content: string | Blob) {
  const blob =
    content instanceof Blob ? content : new Blob([content], { type: `${mime};charset=utf-8` });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

/** Self-contained copy of the `.resume-prose` rules from index.css, so exported
 *  documents render entry descriptions (lists, alignment, underline) correctly
 *  outside the app's stylesheet. Kept compact and in sync with index.css. */
export const RESUME_PROSE_CSS = `
.resume-prose ul { list-style: disc; padding-left: 1.1em; margin: 0.15em 0; }
.resume-prose ol { list-style: decimal; padding-left: 1.2em; margin: 0.15em 0; }
.resume-prose li { margin: 0.05em 0; }
.resume-prose p { margin: 0.15em 0; }
.resume-prose h1, .resume-prose h2, .resume-prose h3,
.resume-prose h4, .resume-prose h5, .resume-prose h6 {
  font-size: 1em; font-weight: 600; margin: 0.2em 0 0.05em; line-height: inherit;
  text-transform: none; letter-spacing: normal; border: none; padding: 0; color: inherit;
}
.resume-prose h1 { font-size: 1.05em; }
.resume-prose a, .resume-prose u { text-decoration: underline; }
.resume-prose .ql-align-center { text-align: center; }
.resume-prose .ql-align-right { text-align: right; }
.resume-prose .ql-align-justify { text-align: justify; }
.resume-prose.list-hyphen ul { list-style: none; padding-left: 0.9em; }
.resume-prose.list-hyphen ul li::before { content: "– "; margin-left: -0.9em; }
`;
