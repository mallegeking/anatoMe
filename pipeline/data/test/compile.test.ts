import { fileURLToPath } from "node:url";
import { expect, test } from "vitest";
import { compileRegion } from "../src/compile.ts";

const fx = (name: string) => fileURLToPath(new URL(`./fixtures/${name}`, import.meta.url));
const realDataDir = fileURLToPath(new URL("../../../data", import.meta.url));

test("normal mode drops unchecked rows", () => expect(compileRegion(fx("valid"), "hip", "normal").actions.every(a => !a.draft)).toBe(true));
test("normal mode keeps the checked row", () => expect(compileRegion(fx("valid"), "hip", "normal").actions.map(a => a.id)).toEqual(["gluteus-maximus-hip-extension"]));
test("normal mode counts pending rows per structure", () => expect(compileRegion(fx("valid"), "hip", "normal").pendingByStructure["piriformis"]).toBe(1));
test("normal mode drops review notes", () => expect(JSON.stringify(compileRegion(fx("valid"), "hip", "normal"))).not.toContain("review_note"));
test("normal mode drops unchecked attachments", () => expect(compileRegion(fx("valid"), "hip", "normal").attachments.every(a => !a.draft)).toBe(true));
test("review mode keeps drafts", () => expect(compileRegion(fx("valid"), "hip", "review").actions.some(a => a.draft)).toBe(true));
test("review mode keeps the review note", () => expect(compileRegion(fx("valid"), "hip", "review").actions.find(a => a.draft)?.review_note).toBeTruthy());
test("only used citations are included", () => expect(compileRegion(fx("valid"), "hip", "normal").citations.map(c => c.id)).toEqual(["used-source"]));
test("the real data compiles with no drafts in normal mode", () => expect(compileRegion(realDataDir, "hip", "normal").actions.some(a => a.draft)).toBe(false));
test("a dropped row's own citation is not in normal mode", () => expect(compileRegion(fx("valid"), "hip", "normal").citations.map(c => c.id)).not.toContain("draft-only-source"));
test("review mode includes the draft row's citation", () => expect(compileRegion(fx("valid"), "hip", "review").citations.map(c => c.id)).toContain("draft-only-source"));
test("normal mode keeps exactly the checked attachments", () => expect(compileRegion(fx("valid"), "hip", "normal").attachments.map(a => a.id)).toEqual(["gluteus-maximus-insertion-femur"]));

test("paired is false for a midline structure and true otherwise", () => {
  const byId = new Map(compileRegion(realDataDir, "hip", "normal").structures.map((s) => [s.id, s.paired]));
  expect(byId.get("sacrum")).toBe(false);
  expect(byId.get("femur")).toBe(true);
});

test("normal mode drops an unchecked exercise and counts it", () => {
  const b = compileRegion(fx("valid"), "hip", "normal");
  expect(b.exercises.map((e) => e.id)).toEqual(["bodyweight-squat"]);
  expect(b.exercises.some((e) => e.draft)).toBe(false);
  expect(b.pendingExercises).toBe(1);
});
test("review mode keeps it as a draft with its review note", () => {
  const e = compileRegion(fx("valid"), "hip", "review").exercises.find((x) => x.id === "goblet-squat");
  expect(e?.draft).toBe(true);
  expect(e?.review_note).toBe("A question about the goblet squat.");
});
test("an exercise for another region is left out", () => {
  const b = compileRegion(fx("exercise-other-region"), "hip", "review");
  expect(b.exercises.map((e) => e.id)).toEqual(["goblet-squat"]);
  expect(b.pendingExercises).toBe(1);
});
test("pendingByMovement counts unchecked action rows per movement", () =>
  expect(compileRegion(fx("valid"), "hip", "normal").pendingByMovement).toEqual({ "hip-internal-rotation": 1 }));
test("a checked exercise keeps its citation in the bundle", () => {
  const b = compileRegion(fx("valid"), "hip", "normal");
  expect(b.citations.map((c) => c.id)).toContain("used-source");
  expect(b.exercises[0].citations[0].ref).toBe("used-source");
  expect(JSON.stringify(b)).not.toContain("review_note");
});

test("gap is passed through to the bundle", () => {
  const byId = new Map(compileRegion(fx("valid"), "hip", "normal").structures.map((s) => [s.id, s]));
  expect(byId.get("gluteus-maximus")?.gap).toBe("test-gap");
  // A structure without a gap gets no gap field at all.
  expect(byId.get("piriformis")).not.toHaveProperty("gap");
});
