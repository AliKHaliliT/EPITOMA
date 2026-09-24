// The notice that names a saved document store the builder could not read.

import { useState } from "react";
import { m } from "framer-motion";
import { X } from "lucide-react";
import type { RefusedCopy } from "@/entities/resume";

/**
 * Tells the owner that the saved documents could not be read, which key still
 * holds them, and that the next save here replaces them. A browser whose store
 * reads cleanly renders nothing.
 *
 * @param props - The stores the builder could not read, from `useResumes`.
 *
 * @returns The notice, or nothing when every store read cleanly or it was dismissed.
 */
export const StoredDocumentsNotice = ({ refused }: { refused: RefusedCopy[] }) => {
  const [dismissed, setDismissed] = useState(false);
  if (refused.length === 0 || dismissed) return null;

  return (
    <m.aside
      role="status"
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.2, ease: "easeOut" }}
      className="fixed inset-x-4 bottom-4 z-40 mx-auto max-w-xl rounded-card border border-signal bg-card p-4 shadow-lift"
    >
      <div className="mb-2 flex items-center justify-between gap-3">
        <p className="font-mono text-eyebrow uppercase text-signal">Saved documents set aside</p>
        <button
          onClick={() => setDismissed(true)}
          className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-muted transition-colors hover:bg-surface hover:text-ink"
          title="Dismiss"
          aria-label="Dismiss"
        >
          <X size={16} />
        </button>
      </div>
      <ul className="space-y-3">
        {refused.map((copy) => (
          <li key={copy.key} className="text-sm leading-relaxed text-ink">
            Your saved documents could not be read, so the builder shows none. They are still in
            this browser under <code className="font-mono text-[12px] text-signal">{copy.key}</code>,
            and the first document you create or import here replaces them, so copy that key's
            value somewhere safe first if you want them back.
            <span className="mt-1 block break-words font-mono text-[11px] text-muted">{copy.reason}</span>
          </li>
        ))}
      </ul>
    </m.aside>
  );
};
