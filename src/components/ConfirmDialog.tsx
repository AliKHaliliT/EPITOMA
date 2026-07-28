// The builder's own copy of the house confirm dialog (the resume app is
// self-contained: no imports from the rest of src/).

import { useEffect } from "react";
import { m, AnimatePresence } from "framer-motion";

export const ConfirmDialog = ({
  open,
  title = "Are you sure?",
  message,
  confirmLabel = "Confirm",
  cancelLabel = "Cancel",
  danger = false,
  onConfirm,
  onCancel,
}: {
  open: boolean;
  title?: string;
  message: string;
  confirmLabel?: string;
  cancelLabel?: string;
  danger?: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}) => {
  useEffect(() => {
    if (!open) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onCancel();
    };
    document.addEventListener("keydown", onKey);
    return () => {
      document.body.style.overflow = prev;
      document.removeEventListener("keydown", onKey);
    };
  }, [open, onCancel]);

  return (
    <AnimatePresence>
      {open && (
        <m.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.15 }}
          className="fixed inset-0 z-[60] flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm"
          onClick={onCancel}
        >
          <m.div
            role="alertdialog"
            aria-modal="true"
            aria-label={title}
            initial={{ opacity: 0, scale: 0.96, y: 8 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.96, y: 8 }}
            transition={{ duration: 0.16, ease: [0.2, 0.7, 0.2, 1] }}
            className="w-full max-w-sm rounded-xl border border-[var(--color-border)] bg-[var(--color-card)] p-6 shadow-xl"
            onClick={(e) => e.stopPropagation()}
          >
            <p className="m-0 mb-2 font-mono text-[10.5px] font-medium uppercase tracking-[0.14em] text-[var(--color-text-secondary)]">
              {danger ? "Confirm · destructive" : "Confirm"}
            </p>
            <h2 className="m-0 mb-2 font-serif text-lg font-semibold leading-snug text-[var(--color-text-primary)]">
              {title}
            </h2>
            <p className="m-0 mb-6 text-sm leading-relaxed text-[var(--color-text-secondary)]">
              {message}
            </p>
            <div className="flex justify-end gap-2">
              <button
                onClick={onCancel}
                autoFocus
                className="rounded-full border border-[var(--color-border)] px-4 py-2 text-sm font-medium text-[var(--color-text-secondary)] transition-colors hover:text-[var(--color-text-primary)]"
              >
                {cancelLabel}
              </button>
              <button
                onClick={onConfirm}
                className={
                  danger
                    ? "rounded-full bg-red-600 px-4 py-2 text-sm font-medium text-white transition-opacity hover:opacity-90"
                    : "rounded-full bg-[var(--color-text-primary)] px-4 py-2 text-sm font-medium text-[var(--color-background)] transition-opacity hover:opacity-90"
                }
              >
                {confirmLabel}
              </button>
            </div>
          </m.div>
        </m.div>
      )}
    </AnimatePresence>
  );
};
