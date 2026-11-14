import type { BundleStructure, RegionBundle } from "../data/bundle";
import type { Lang } from "../i18n/lang";
import { nameOf } from "../i18n/names";
import type { Selection } from "../viewer/pick";

const MAX_RESULTS = 8;

// Lower case and no accents, so "GLUTÉUS" finds "Gluteus". The dots of ä, ö and ü go too, so "huft"
// finds "Hüft", and ß becomes ss.
function fold(text: string): string {
  return text.normalize("NFD").replace(/\p{Diacritic}/gu, "").toLowerCase().replace(/ß/g, "ss");
}

function wordsOf(text: string): string[] {
  return fold(text).split(/[^\p{L}\p{N}]+/u).filter(Boolean);
}

// The words of a name as it can be typed: with the umlauts as plain vowels, and with ae, oe and ue for them,
// so "hueft" finds "Hüft" as well.
function nameWords(name: string): string[] {
  const withE = name.normalize("NFC").replace(/[äöüÄÖÜ]/g, (c) => c.normalize("NFD")[0] + "e");
  return [...new Set([...wordsOf(name), ...wordsOf(withE)])];
}

// Every query word must be the start of some word in the name.
function matches(queryWords: string[], name: string | undefined): boolean {
  if (!name) return false;
  const words = nameWords(name);
  return queryWords.every((q) => words.some((w) => w.startsWith(q)));
}

// Matches by the name in the current language come first, then matches by the English name only,
// then by the Latin name only. A structure is in the first group it matches, so it appears once.
// Each group is in alphabetical order of the name the app shows (nameOf).
export function searchStructures(query: string, structures: BundleStructure[], lang: Lang): BundleStructure[] {
  const queryWords = wordsOf(query);
  if (queryWords.length === 0) return [];
  const groups: BundleStructure[][] = [[], [], []];
  for (const s of structures) {
    const names = [lang === "de" ? s.german : s.english, s.english, s.latin];
    const group = names.findIndex((name) => matches(queryWords, name));
    if (group >= 0) groups[group].push(s);
  }
  const byName = (a: BundleStructure, b: BundleStructure) => nameOf(a, lang).localeCompare(nameOf(b, lang), lang);
  return groups.flatMap((g) => g.sort(byName)).slice(0, MAX_RESULTS);
}

// A search result has no side of its own, so paired structures open on the left.
export function selectBySearch(id: string, bundle: RegionBundle): Selection {
  const structure = bundle.structures.find((s) => s.id === id);
  return { sid: id, side: structure && !structure.paired ? "" : "l" };
}
