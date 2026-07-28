import { LazyMotion, MotionConfig, domMax } from "framer-motion";
import { ThemeToggle } from "@/components/ThemeToggle";
import { ResumeBuilder } from "@/ResumeBuilder";

/**
 * EPITOMA is one page: the builder. The shell provides the motion runtime
 * (domMax behind LazyMotion strict, because the builder's Reorder lists need
 * the drag and layout features), the theme switch, and the reading rail.
 */
export default function App() {
  return (
    <LazyMotion features={domMax} strict>
      <MotionConfig reducedMotion="user">
        <div className="min-h-screen bg-[var(--color-background)] font-sans text-[var(--color-text-primary)]">
          <div className="fixed right-4 top-4 z-50">
            <ThemeToggle />
          </div>
          <main className="mx-auto min-h-screen max-w-[1180px] border-[var(--color-border)] px-5 pb-10 pt-8 md:border-x md:border-dashed">
            <ResumeBuilder />
          </main>
        </div>
      </MotionConfig>
    </LazyMotion>
  );
}
