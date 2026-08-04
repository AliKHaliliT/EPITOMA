// Builder-local copy of the class-merge helper. The resume builder is a
// self-contained app (future separate repo): it imports nothing from the
// rest of src/.

import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

/**
 * Joins class values and resolves Tailwind conflicts in favor of the last one.
 *
 * @param inputs - Class values in any form clsx accepts, including
 *   conditionals and nested arrays.
 *
 * @returns One class string with competing Tailwind utilities collapsed.
 */
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}
