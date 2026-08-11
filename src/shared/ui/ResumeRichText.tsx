// The lazy door for the resume rich-text field: the Quill editor is heavy and
// only matters once someone edits a description, so it loads on first render
// of the field rather than riding the first paint.

import { Suspense, lazy } from "react";

const ResumeRichTextEditor = lazy(() => import("./ResumeRichTextEditor"));

interface ResumeRichTextProps {
  /** The current body, as HTML rather than Markdown. */
  value: string;
  /** Called with the new HTML, already normalized when the editor is empty. */
  onChange: (html: string) => void;
  /** Shown while the editor holds nothing. */
  placeholder?: string;
}

/** A small rich-text field for an entry description, storing HTML. */
export const ResumeRichText = (props: ResumeRichTextProps) => (
  <Suspense
    fallback={
      <div className="resume-quill h-48 rounded border border-line bg-well" aria-busy="true" />
    }
  >
    <ResumeRichTextEditor {...props} />
  </Suspense>
);
