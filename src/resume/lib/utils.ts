// Builder-local copy of the class-merge helper. The resume builder is a
// self-contained app (future separate repo): it imports nothing from the
// rest of src/.

import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}
