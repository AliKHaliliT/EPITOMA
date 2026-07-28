import { ResumeBuilder } from "@/resume/ResumeBuilder";

/**
 * EPITOMA is one page: the builder. It brings its own LazyMotion (domMax,
 * for the Reorder drag lists), so the shell only provides the page ground
 * and the reading rail.
 */
export default function App() {
  return (
    <div className="min-h-screen bg-[var(--color-background)] font-sans text-[var(--color-text-primary)]">
      <main className="mx-auto min-h-screen max-w-[1180px] border-[var(--color-border)] px-5 pb-10 pt-8 md:border-x md:border-dashed">
        <ResumeBuilder />
      </main>
    </div>
  );
}
