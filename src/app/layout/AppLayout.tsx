/** The builder chrome: the theme switch and the rail around the page. */

import type { ReactNode } from "react";
import { ThemeToggle } from "./ThemeToggle";

/**
 * Draws the shell around the builder's content.
 *
 * @param props - Standard children; the page to place inside the rail.
 *
 * @returns The page frame with the given content inside the rail.
 */
export const AppLayout = ({ children }: { children: ReactNode }) => (
  <div className="min-h-screen bg-surface font-sans text-ink">
    <div className="fixed right-4 top-4 z-50">
      <ThemeToggle />
    </div>
    {/* Deliberately wider than the sisters' 1180px rail: the builder
        renders a physical sheet beside its controls and needs the room. */}
    <main className="mx-auto min-h-screen max-w-[1760px] border-line px-5 pb-10 pt-8 md:border-x md:border-dashed">
      {children}
    </main>
  </div>
);
