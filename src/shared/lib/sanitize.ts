// The one place description HTML is made safe before the page renders it.

import DOMPurify from "dompurify";

/**
 * Strips from description HTML everything a page should never run.
 *
 * Description HTML reaches the preview from the editor, from showdown's
 * rendering of a record's Markdown, and from records a public repository
 * supplies, and showdown passes raw markup through. Scripts, event handlers,
 * and `javascript:` links are removed, while the formatting the editor and the
 * record produce (paragraphs, emphasis, lists, links) is kept.
 *
 * @param html - Description HTML from any of the preview's sources.
 *
 * @returns The same HTML with nothing left that can execute.
 */
export function sanitizeHtml(html: string): string {
  return DOMPurify.sanitize(html, { USE_PROFILES: { html: true } });
}
