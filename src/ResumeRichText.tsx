// Rich-text editor for resume entry descriptions. Unlike the site's
// RichTextEditor (which round-trips through Markdown), this stores HTML directly
// so text alignment and underline survive: Markdown can't represent them.

import ReactQuill from "react-quill-new";
import "react-quill-new/dist/quill.snow.css";

interface ResumeRichTextProps {
  value: string; // HTML
  onChange: (html: string) => void;
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
