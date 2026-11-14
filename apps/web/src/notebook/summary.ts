import type { RegionBundle } from "../data/bundle";
import type { Lang } from "../i18n/lang";
import { compare, type Comparison } from "./compare";
import type { NotebookEntry } from "./types";

export const SUMMARY_ROWS = 12;

export type SummaryModel = {
  printedOn: string; // YYYY-MM-DD
  from: string | null; // oldest entry date
  to: string | null; // newest entry date
  painful: NotebookEntry[]; // the newest SUMMARY_ROWS, newest first
  painfulMore: number; // how many were left out
  fine: NotebookEntry[];
  fineMore: number;
  comparisons: Comparison[]; // sides with painful entries, empty when the comparison is off
};

const two = (n: number) => String(n).padStart(2, "0");

// Newest first, by date and then by the time it was saved.
const newestFirst = (a: NotebookEntry, b: NotebookEntry) => b.date.localeCompare(a.date) || b.createdAt - a.createdAt;

// Everything the printed page shows, worked out once so the page itself stays plain.
// lang only orders the structures in the comparison, the same way the Notebook tab does.
export function summaryModel(entries: NotebookEntry[], bundle: RegionBundle, now: Date, withComparison: boolean, lang: Lang): SummaryModel {
  const sorted = [...entries].sort(newestFirst);
  const painful = sorted.filter((x) => x.feeling === "painful");
  const fine = sorted.filter((x) => x.feeling === "fine");
  const comparisons = withComparison
    ? (["l", "r"] as const).map((side) => compare(entries, bundle, side, lang)).filter((c) => c.painfulCount > 0)
    : [];
  return {
    printedOn: `${now.getFullYear()}-${two(now.getMonth() + 1)}-${two(now.getDate())}`,
    from: sorted.length > 0 ? sorted[sorted.length - 1].date : null,
    to: sorted.length > 0 ? sorted[0].date : null,
    painful: painful.slice(0, SUMMARY_ROWS),
    painfulMore: Math.max(0, painful.length - SUMMARY_ROWS),
    fine: fine.slice(0, SUMMARY_ROWS),
    fineMore: Math.max(0, fine.length - SUMMARY_ROWS),
    comparisons,
  };
}
