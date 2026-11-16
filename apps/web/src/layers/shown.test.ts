import { expect, test } from "vitest";
import type { Highlight } from "../movement/roles";
import { makeMovementBundle } from "../movement/fixture";
import { hideStructure, initialLayers, peel, toggleTissue } from "./layers";
import { makeIsShown } from "./shown";

const structures = makeMovementBundle().structures;
const hi = new Map<string, Highlight>([["piriformis", "primary"]]);

test("without highlights the layers decide", () => {
  const shown = makeIsShown(structures, peel(initialLayers(), structures), null);
  expect(shown("gluteus-maximus", "l")).toBe(false);
  expect(shown("piriformis", "l")).toBe(true);
  expect(shown("not-in-the-data", "")).toBe(true);
});
test("an involved structure shows even when it is hidden, peeled and its tissue is off", () => {
  let layers = hideStructure(initialLayers(), "piriformis", "l");
  layers = toggleTissue(peel(peel(layers, structures), structures), "muscle");
  const shown = makeIsShown(structures, layers, hi);
  expect(shown("piriformis", "l")).toBe(true);
  expect(shown("piriformis", "r")).toBe(true);
});
test("uninvolved muscles and soft tissue are hidden, bones stay", () => {
  const shown = makeIsShown(structures, initialLayers(), hi);
  expect(shown("gluteus-maximus", "l")).toBe(false);
  expect(shown("ischiofemoral-ligament", "r")).toBe(false);
  expect(shown("femur", "l")).toBe(true);
});
test("bones still follow the bone switch", () =>
  expect(makeIsShown(structures, toggleTissue(initialLayers(), "bone"), hi)("femur", "l")).toBe(false));
