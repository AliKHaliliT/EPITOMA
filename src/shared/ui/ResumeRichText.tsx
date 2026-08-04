// Rich-text editor for resume entry descriptions. Unlike the site's
// RichTextEditor (which round-trips through Markdown), this stores HTML directly
// so text alignment and underline survive: Markdown can't represent them.

import ReactQuill from "react-quill-new";
import "react-quill-new/dist/quill.snow.css";

interface ResumeRichTextProps {
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

/** A small rich-text field for an entry description, storing HTML. */
export const ResumeRichText = ({ value, onChange, placeholder }: ResumeRichTextProps) => {
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
