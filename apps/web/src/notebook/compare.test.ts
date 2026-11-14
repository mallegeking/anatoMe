import { describe, expect, test } from "vitest";
import { makeMovementBundle } from "../movement/fixture";
import { compare, isKnown, loadedBy } from "./compare";
import type { EntrySide, Feeling, NotebookEntry } from "./types";

const b = makeMovementBundle();
const e = (id: string, movement: string, feeling: Feeling, side: EntrySide, flexion = 0): NotebookEntry => ({
  id,
  createdAt: 0,
  date: "2026-11-13",
  pick: { kind: "movement", id: movement },
  pose: { "hip.flexion": flexion },
  feeling,
  side,
  note: "",
});

describe("compare", () => {
  test("what a painful movement loads is a candidate", () => {
    const c = compare([e("1", "hip-external-rotation", "painful", "l")], b, "l");
    expect(c.candidates.map((x) => x.sid)).toEqual(["gluteus-maximus", "obturator-externus", "piriformis"]);
    expect(c.painfulCount).toBe(1);
    expect(c.fineCount).toBe(0);
  });
  test("a fine movement that loads a structure rules it out", () => {
    const c = compare([e("1", "hip-external-rotation", "painful", "l"), e("2", "hip-extension", "fine", "l")], b, "l");
    expect(c.candidates.map((x) => x.sid)).toEqual(["obturator-externus", "piriformis"]);
    expect(c.ruledOut).toEqual(["gluteus-maximus"]);
  });
  test("more painful entries raise a structure's count", () => {
    const c = compare([e("1", "hip-external-rotation", "painful", "l"), e("2", "hip-internal-rotation", "painful", "l", 90)], b, "l");
    expect(c.candidates.find((x) => x.sid === "piriformis")).toEqual({ sid: "piriformis", painful: 2, evidence: ["m1", "m2"] });
    expect(c.candidates.map((x) => x.sid)).toEqual(["gluteus-maximus", "ischiofemoral-ligament", "obturator-externus", "piriformis"]);
  });
  test("the stored angle decides which rows count", () =>
    expect(compare([e("1", "hip-external-rotation", "painful", "l", 50)], b, "l").candidates.map((x) => x.sid)).toEqual([
      "gluteus-maximus",
      "obturator-externus",
    ]));
  test("fine on the right does not rule out the left", () => {
    const c = compare([e("1", "hip-external-rotation", "painful", "l"), e("2", "hip-external-rotation", "fine", "r")], b, "l");
    expect(c.candidates).toHaveLength(3);
    expect(c.fineCount).toBe(0);
  });
  test("an entry for both sides counts on each side", () => {
    const entries = [e("1", "hip-external-rotation", "painful", "both")];
    for (const side of ["l", "r"] as const) {
      const c = compare(entries, b, side);
      expect(c.painfulCount).toBe(1);
      expect(c.candidates).toHaveLength(3);
    }
  });
  test("an unknown movement is counted apart and ignored", () => {
    const c = compare([e("1", "hip-wiggle", "painful", "l")], b, "l");
    expect(c).toMatchObject({ painfulCount: 0, unknownCount: 1, candidates: [] });
  });
  test("waiting rows for a logged movement mark the list incomplete", () =>
    expect(compare([e("1", "knee-flexion", "painful", "l")], b, "l").incomplete).toBe(true));
  test("an exercise phase uses its effort", () => {
    const entry: NotebookEntry = {
      ...e("1", "x", "painful", "l"),
      pick: { kind: "exercise", id: "squat", phase: "lowering" },
      pose: { "hip.flexion": 50, "knee.flexion": 55 },
    };
    expect(compare([entry], b, "l").candidates.map((x) => x.sid)).toEqual(["gluteus-maximus"]);
  });
  test("an unknown exercise or phase is unknown with an empty map", () => {
    const entry: NotebookEntry = { ...e("1", "x", "painful", "l"), pick: { kind: "exercise", id: "squat", phase: "nope" } };
    expect(isKnown(entry, b)).toBe(false);
    expect(loadedBy(entry, b).size).toBe(0);
  });
});
