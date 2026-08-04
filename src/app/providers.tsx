/**
 * The provider stack the builder renders inside.
 *
 * Cross-cutting wiring is tied here and nowhere else: the motion runtime and
 * the reduced-motion contract.
 */

import { LazyMotion, MotionConfig, domMax } from "framer-motion";
import type { ReactNode } from "react";

/**
 * Wraps a subtree in the providers it needs.
 *
 * The feature set is `domMax` rather than the sisters' `domAnimation`, because
 * the builder's reorderable section lists need the drag and layout features;
 * `strict` throws if a plain `motion.` component slips back in.
 *
 * @param props - Standard children; the subtree to wrap.
 *
 * @returns The children wrapped in the builder's providers.
 */
export const AppProviders = ({ children }: { children: ReactNode }) => (
  <LazyMotion features={domMax} strict>
    <MotionConfig reducedMotion="user">{children}</MotionConfig>
  </LazyMotion>
);
