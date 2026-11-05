import type { BundleStructure, RegionBundle } from "../data/bundle";
import type { Selection } from "../viewer/pick";

const MAX_RESULTS = 8;

// Lower case and no accents, so "GLUTÉUS" finds "Gluteus".
function fold(text: string): string {
  return text.normalize("NFD").replace(/\p{Diacritic}/gu, "").toLowerCase();
}

function wordsOf(text: string): string[] {
  return fold(text).split(/[^\p{L}\p{N}]+/u).filter(Boolean);
}

// Every query word must be the start of some word in the name.
function matches(queryWords: string[], name: string | undefined): boolean {
  if (!name) return false;
  const words = wordsOf(name);
  return queryWords.every((q) => words.some((w) => w.startsWith(q)));
}

// English name matches come first, then Latin only matches. Each group is in alphabetical order.
export function searchStructures(query: string, structures: BundleStructure[]): BundleStructure[] {
  const queryWords = wordsOf(query);
  if (queryWords.length === 0) return [];
  const byName = (a: BundleStructure, b: BundleStructure) => a.english.localeCompare(b.english);
  const english = structures.filter((s) => matches(queryWords, s.english)).sort(byName);
  const latinOnly = structures.filter((s) => !matches(queryWords, s.english) && matches(queryWords, s.latin)).sort(byName);
  return [...english, ...latinOnly].slice(0, MAX_RESULTS);
}

// Structures on the midline have no left and right copy. In the hip models that is only the sacrum.
const UNPAIRED = new Set(["sacrum"]);

// A search result has no side of its own, so paired structures open on the left.
export function selectBySearch(id: string, bundle: RegionBundle): Selection {
  const known = bundle.structures.some((s) => s.id === id);
  return { sid: id, side: known && UNPAIRED.has(id) ? "" : "l" };
}
