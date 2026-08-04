import { m, AnimatePresence } from "framer-motion";
import { Moon, Sun } from "lucide-react";
import { useTheme } from "./theme";

/** The house theme switch: same control as the VITA site's TopBar. */
export const ThemeToggle = () => {
  const { isDark, toggleTheme } = useTheme();
  return (
    <button
      onClick={toggleTheme}
      className="flex h-8 w-8 items-center justify-center overflow-hidden rounded-full border border-[var(--color-border-strong)] text-[var(--color-text-secondary)] transition-[color,border-color,transform] duration-150 hover:border-signal hover:text-signal active:scale-90"
      aria-label={isDark ? "Switch to light mode" : "Switch to dark mode"}
    >
      <AnimatePresence mode="wait" initial={false}>
        <m.span
          key={isDark ? "sun" : "moon"}
          initial={{ rotate: -50, opacity: 0, scale: 0.5 }}
          animate={{ rotate: 0, opacity: 1, scale: 1 }}
          exit={{ rotate: 50, opacity: 0, scale: 0.5 }}
          transition={{ duration: 0.18, ease: [0.2, 0.7, 0.2, 1] }}
          className="flex"
        >
          {isDark ? <Sun size={14} /> : <Moon size={14} />}
        </m.span>
      </AnimatePresence>
    </button>
  );
};
