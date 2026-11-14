import { expect, test } from "vitest";
import { makeMovementBundle } from "../movement/fixture";
import { SUMMARY_ROWS, summaryModel } from "./summary";
import type { EntrySide, Feeling, NotebookEntry } from "./types";

const b = makeMovementBundle();
const now = new Date(2026, 10, 14, 9, 30);
const e = (id: string, day: number, feeling: Feeling, side: EntrySide = "l", movement = "hip-external-rotation"): NotebookEntry => ({
  id,
  createdAt: day,
  date: `2026-10-${String(day).padStart(2, "0")}`,
  pick: { kind: "movement", id: movement },
  pose: {},
  feeling,
  side,
  note: "",
});

test("keeps the 12 newest per table and counts the rest", () => {
  const entries = Array.from({ length: 15 }, (_, i) => e(`p${i}`, i + 1, "painful"));
  const m = summaryModel(entries, b, now, true);
  expect(SUMMARY_ROWS).toBe(12);
  expect(m.painful).toHaveLength(12);
  expect(m.painfulMore).toBe(3);
  expect(m.painful[0].id).toBe("p14");
  expect(m.fine).toHaveLength(0);
  expect(m.fineMore).toBe(0);
});

test("the range runs from the oldest to the newest date", () => {
  const m = summaryModel([e("a", 9, "fine"), e("b", 3, "painful"), e("c", 20, "painful")], b, now, true);
  expect(m.from).toBe("2026-10-03");
  expect(m.to).toBe("2026-10-20");
  expect(m.printedOn).toBe("2026-11-14");
});

test("no entries gives null range and empty tables", () => {
  const m = summaryModel([], b, now, true);
  expect(m.from).toBeNull();
  expect(m.to).toBeNull();
  expect(m.painful).toEqual([]);
  expect(m.fine).toEqual([]);
  expect(m.comparisons).toEqual([]);
});

test("with the comparison off there are no comparisons", () => {
  expect(summaryModel([e("a", 1, "painful")], b, now, false).comparisons).toEqual([]);
});

test("only sides with a painful entry get a comparison", () => {
  const m = summaryModel([e("a", 1, "painful", "l"), e("b", 2, "fine", "r")], b, now, true);
  expect(m.comparisons.map((c) => c.side)).toEqual(["l"]);
});
