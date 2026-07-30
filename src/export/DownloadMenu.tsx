import { useEffect, useRef, useState } from "react";
import { Download, ChevronDown, FileType2, FileCode2, FileText, FileJson2 } from "lucide-react";
import { ResumeDocument } from "@/types/resume";
import { exportPdf } from "./pdf";
import { exportLatex } from "./latex";
import { exportWord } from "./word";
import { downloadFile, slugify } from "./shared";

type Format = "pdf" | "latex" | "word" | "json";

// Each format promises what it actually is: the PDF is the finished document,
// the others trade some fidelity for editability (docs/EXPORT-PARITY.md).
const OPTIONS: { key: Format; label: string; hint: string; icon: typeof FileType2 }[] = [
  { key: "pdf", label: "PDF", hint: "The finished document: what you send", icon: FileType2 },
  { key: "word", label: "Word (.doc)", hint: "Editable copy, closest styling", icon: FileText },
  { key: "latex", label: "LaTeX (.tex)", hint: "Source code, closest styling", icon: FileCode2 },
  { key: "json", label: "Document (.json)", hint: "Backup: re-import reproduces it exactly", icon: FileJson2 },
];

export const DownloadMenu = ({ doc }: { doc: ResumeDocument }) => {
  const [open, setOpen] = useState(false);
  const [busy, setBusy] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const onClick = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", onClick);
    return () => document.removeEventListener("mousedown", onClick);
  }, []);

  const run = (format: Format) => {
    setOpen(false);
    if (format === "pdf") {
      // Generated in the browser and downloaded directly; the renderer and
      // fonts load on first use, hence the brief busy state.
      setBusy(true);
      void exportPdf(doc).finally(() => setBusy(false));
    }
    else if (format === "latex") exportLatex(doc);
    else if (format === "word") exportWord(doc);
    else
      // The whole document, style and all: re-importing it reproduces the
      // exact look on any machine.
      downloadFile(
        `${slugify(doc.name)}.json`,
        "application/json",
        JSON.stringify(doc, null, 2) + "\n"
      );
  };

  return (
    <div className="relative" ref={ref}>
      <button
        onClick={() => setOpen((v) => !v)}
        disabled={busy}
        className="flex items-center gap-1.5 px-4 py-2 bg-[var(--color-text-primary)] text-[var(--color-background)] rounded-lg text-sm font-medium hover:opacity-90 transition-opacity disabled:cursor-wait disabled:opacity-70"
        title="Download this document"
      >
        <Download size={14} /> {busy ? "Preparing…" : "Download"} <ChevronDown size={13} />
      </button>
      {open && (
        <div className="absolute right-0 z-20 mt-1 w-56 bg-[var(--color-card)] border border-[var(--color-border)] rounded-lg shadow-lg py-1">
          {OPTIONS.map((o) => (
            <button
              key={o.key}
              onClick={() => run(o.key)}
              className="flex items-start gap-2.5 w-full px-3 py-2 text-left hover:bg-[var(--color-background)]"
            >
              <o.icon size={16} className="mt-0.5 shrink-0 text-[var(--color-text-secondary)]" />
              <span className="min-w-0">
                <span className="block text-sm font-medium text-[var(--color-text-primary)]">
                  {o.label}
                </span>
                <span className="block text-xs text-[var(--color-text-secondary)]">{o.hint}</span>
              </span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
};
