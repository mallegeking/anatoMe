import { fileURLToPath } from "node:url";
import { expect, test } from "vitest";
import type { RegionBundle } from "../../../apps/web/src/data/bundle.ts";
import { bundleRegions, compileRegion, listRegions } from "../src/compile.ts";
import { WHOLE_BODY } from "../src/regions.ts";

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

test("german is passed through for structures, movements and exercises", () => {
  const b = compileRegion(fx("valid"), "hip", "normal");
  const structures = new Map(b.structures.map((s) => [s.id, s]));
  expect(structures.get("gluteus-maximus")?.german).toBe("Großer Gesäßmuskel");
  // A row without a German name gets no german field at all.
  expect(structures.get("piriformis")).not.toHaveProperty("german");
  const movements = new Map(b.movements.map((m) => [m.id, m]));
  expect(movements.get("hip-flexion")?.german).toBe("Beugung im Hüftgelenk");
  expect(movements.get("hip-extension")).not.toHaveProperty("german");
  expect(b.exercises[0].german).toBe("Kniebeuge");
  expect(b.exercises[0].phases[0].german).toBe("Abwärtsbewegung");
  // An exercise without a German name gets no german field either.
  expect(compileRegion(fx("valid"), "hip", "review").exercises.find((e) => e.id === "goblet-squat")).not.toHaveProperty("german");
});

test("a structure is in its home region and in every also_in region", () => {
  const dir = fx("multi-region");
  expect(compileRegion(dir, "hip", "normal").structures.map((s) => s.id)).toContain("tibia");
  expect(compileRegion(dir, "lower-leg", "normal").structures.map((s) => s.id).sort()).toEqual(["talus", "tibia"]);
});
test("a region gets only the movements of its own joints", () => {
  const dir = fx("multi-region");
  expect(compileRegion(dir, "hip", "normal").movements.length).toBeGreaterThan(0);
  expect(compileRegion(dir, "lower-leg", "normal").movements).toEqual([]);
});
test("listRegions lists home regions only", () => expect(listRegions(fx("multi-region"))).toEqual(["hip", "lower-leg"]));
test("also_in does not go into the bundle", () => expect(JSON.stringify(compileRegion(fx("multi-region"), "lower-leg", "normal"))).not.toContain("also_in"));

const ids = (rows: { id: string }[]) => rows.map((r) => r.id).sort();
const union = (dir: string, mode: "normal" | "review", pick: (b: RegionBundle) => { id: string }[]) =>
  [...new Set(listRegions(dir).flatMap((r) => pick(compileRegion(dir, r, mode)).map((x) => x.id)))].sort();

test("bundleRegions adds the whole body after the home regions", () =>
  expect(bundleRegions(fx("multi-region"))).toEqual(["hip", "lower-leg", "body"]));
for (const mode of ["normal", "review"] as const) {
  test(`the whole body is the union of the regions (${mode}, real data)`, () => {
    const body = compileRegion(realDataDir, WHOLE_BODY, mode);
    expect(body.region).toBe("body");
    expect(ids(body.structures)).toEqual(union(realDataDir, mode, (b) => b.structures));
    expect(ids(body.actions)).toEqual(union(realDataDir, mode, (b) => b.actions));
    expect(ids(body.attachments)).toEqual(union(realDataDir, mode, (b) => b.attachments));
    expect(ids(body.movements)).toEqual(union(realDataDir, mode, (b) => b.movements));
    expect(ids(body.exercises)).toEqual(union(realDataDir, mode, (b) => b.exercises));
    expect(ids(body.citations)).toEqual(union(realDataDir, mode, (b) => b.citations));
  }, 30_000); // it compiles the real data seven times, which can pass 5 s on a busy machine
}
test("the whole body lists each structure once", () => {
  const s = compileRegion(fx("multi-region"), WHOLE_BODY, "normal").structures.map((x) => x.id);
  expect(s.length).toBe(new Set(s).size);
});
test("the whole body has every movement of every joint", () =>
  expect(ids(compileRegion(fx("multi-region"), WHOLE_BODY, "normal").movements)).toEqual(union(fx("multi-region"), "normal", (b) => b.movements)));
test("the whole body's normal build has no drafts and counts them like the hip", () => {
  const body = compileRegion(fx("valid"), WHOLE_BODY, "normal");
  expect(body.actions.some((a) => a.draft)).toBe(false);
  expect(body.pendingByStructure).toEqual(compileRegion(fx("valid"), "hip", "normal").pendingByStructure);
  expect(body.pendingExercises).toBe(compileRegion(fx("valid"), "hip", "normal").pendingExercises);
});
