import type { Lang } from "./lang";

// The name to show for a structure, movement, exercise or phase. The data has an English name for
// every item and a German one only where a source gave it, so a missing German name shows the English one.
export function nameOf(item: { english: string; german?: string }, lang: Lang): string {
  return lang === "de" && item.german ? item.german : item.english;
}
