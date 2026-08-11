// Rich-text editor for resume entry descriptions. Unlike the site's
// RichTextEditor (which round-trips through Markdown), this stores HTML directly
// so text alignment and underline survive: Markdown can't represent them.
//
// This module carries the Quill dependency and loads through ResumeRichText's
// lazy door, so the editor's weight stays out of the first paint.

import ReactQuill from "react-quill-new";
import "react-quill-new/dist/quill.snow.css";

interface ResumeRichTextEditorProps {
  /** The current body, as HTML rather than Markdown. */
  value: string;
  /** Called with the new HTML, already normalized when the editor is empty. */
  onChange: (html: string) => void;
  /** Shown while the editor holds nothing. */
  placeholder?: string;
}

const modules = {
  toolbar: [
    ["bold", "italic", "underline"],
    [{ list: "bullet" }, { list: "ordered" }],
    [{ align: "" }, { align: "center" }, { align: "right" }, { align: "justify" }],
    ["link"],
    ["clean"],
  ],
};

/** The Quill-backed editor behind ResumeRichText's lazy door. */
const ResumeRichTextEditor = ({ value, onChange, placeholder }: ResumeRichTextEditorProps) => {
  // Quill emits empty editors as "<p><br></p>"; normalize that to "".
  const handleChange = (html: string) => {
    onChange(html === "<p><br></p>" ? "" : html);
  };

  return (
    <div className="resume-quill h-48 flex flex-col">
      <ReactQuill
        theme="snow"
        value={value || ""}
        onChange={handleChange}
        modules={modules}
        className="h-full flex flex-col"
        placeholder={placeholder || "Description…"}
      />
    </div>
  );
};

export default ResumeRichTextEditor;
