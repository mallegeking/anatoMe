import { expect, test } from "vitest";
import type { BundleStructure } from "../data/bundle";
import { hiddenKey, hideStructure, initialLayers, isVisible, peel, restore, revealFor, showStructure, tissueOf, toggleTissue } from "./layers";

const gluteusMaximus: BundleStructure = { id: "gluteus-maximus", type: "muscle", english: "Gluteus maximus", depth: 1, paired: true };
const gluteusMedius: BundleStructure = { id: "gluteus-medius", type: "muscle", english: "Gluteus medius", depth: 2, paired: true };
const piriformis: BundleStructure = { id: "piriformis", type: "muscle", english: "Piriformis", depth: 2, paired: true };
const gluteusMinimus: BundleStructure = { id: "gluteus-minimus", type: "muscle", english: "Gluteus minimus", depth: 3, paired: true };
const femur: BundleStructure = { id: "femur", type: "bone", english: "Femur", depth: 4, paired: true };
const iliofemoralLigament: BundleStructure = { id: "iliofemoral-ligament", type: "ligament", english: "Iliofemoral ligament", depth: 3, paired: true };
const fixture = [gluteusMaximus, gluteusMedius, piriformis, gluteusMinimus, femur, iliofemoralLigament];

test("tissue groups", () => {
  expect(tissueOf("bone")).toBe("bone");
  expect(tissueOf("muscle")).toBe("muscle");
  for (const type of ["tendon", "ligament", "capsule", "labrum", "bursa", "meniscus", "fascia"]) expect(tissueOf(type)).toBe("soft");
});

test("everything starts visible", () => {
  for (const s of fixture) expect(isVisible(initialLayers(), s, "l")).toBe(true);
});

test("peel hides the outermost visible muscle layer", () => {
  const s = peel(initialLayers(), fixture);
  expect(isVisible(s, gluteusMaximus, "l")).toBe(false);
  expect(isVisible(s, gluteusMedius, "l")).toBe(true);
});

test("the second peel hides every muscle of the next depth", () => {
  const s = peel(peel(initialLayers(), fixture), fixture);
  expect(isVisible(s, gluteusMedius, "l")).toBe(false);
  expect(isVisible(s, piriformis, "l")).toBe(false);
  expect(isVisible(s, gluteusMinimus, "l")).toBe(true);
});

test("peel twice then restore once", () => {
  const s = restore(peel(peel(initialLayers(), fixture), fixture));
  expect(s.peeledDepths).toEqual([1]);
});

test("restore with nothing peeled changes nothing", () => {
  expect(restore(initialLayers()).peeledDepths).toEqual([]);
});

test("peel never hides bones", () =>
  expect(isVisible(peel(peel(peel(initialLayers(), fixture), fixture), fixture), femur, "l")).toBe(true));

test("peel stops when no muscle layer is left", () => {
  let s = initialLayers();
  for (let i = 0; i < 6; i++) s = peel(s, fixture);
  expect(s.peeledDepths).toEqual([1, 2, 3]);
});

test("peel skips a layer whose muscles are all hidden by hand", () => {
  const s = peel(hideStructure(hideStructure(initialLayers(), "gluteus-maximus", "l"), "gluteus-maximus", "r"), fixture);
  expect(s.peeledDepths).toEqual([2]);
});

test("hide one structure", () => expect(isVisible(hideStructure(initialLayers(), "piriformis", "l"), piriformis, "l")).toBe(false));

test("show brings a hidden structure back", () =>
  expect(isVisible(showStructure(hideStructure(initialLayers(), "piriformis", "l"), hiddenKey("piriformis", "l")), piriformis, "l")).toBe(true));

test("tissue toggle hides soft tissue", () => expect(isVisible(toggleTissue(initialLayers(), "soft"), iliofemoralLigament, "l")).toBe(false));

test("tissue toggle twice shows it again", () =>
  expect(isVisible(toggleTissue(toggleTissue(initialLayers(), "soft"), "soft"), iliofemoralLigament, "l")).toBe(true));

test("functions do not change the state they are given", () => {
  const start = initialLayers();
  peel(start, fixture);
  hideStructure(start, "femur", "l");
  toggleTissue(start, "bone");
  expect(start).toEqual(initialLayers());
});

// revealFor
const obturatorInternus: BundleStructure = { id: "obturator-internus", type: "muscle", english: "Obturator internus", depth: 2, paired: true };
const obturatorExternus: BundleStructure = { id: "obturator-externus", type: "muscle", english: "Obturator externus", depth: 3, paired: true };
const revealFixture = [...fixture, obturatorInternus, obturatorExternus];

test("reveal a deep muscle peels the layers above", () => {
  const r = revealFor(initialLayers(), gluteusMinimus, "l", revealFixture);
  expect(r.peeledNow).toBe(2);
  expect(isVisible(r.state, gluteusMinimus, "l")).toBe(true);
  expect(revealFor(initialLayers(), obturatorExternus, "l", revealFixture).peeledNow).toBe(2);
});

test("reveal a muscle one layer down peels one layer", () => {
  const r = revealFor(initialLayers(), obturatorInternus, "l", revealFixture);
  expect(r.peeledNow).toBe(1);
  expect(isVisible(r.state, gluteusMaximus, "l")).toBe(false);
  expect(isVisible(r.state, obturatorInternus, "l")).toBe(true);
});

test("reveal a superficial muscle restores peeled layers", () => {
  const peeled = peel(peel(initialLayers(), revealFixture), revealFixture);
  const r = revealFor(peeled, gluteusMaximus, "l", revealFixture);
  expect(isVisible(r.state, gluteusMaximus, "l")).toBe(true);
  expect(r.peeledNow).toBe(0);
});

test("reveal restores layers at or below the target but keeps none that cover it", () => {
  const peeled = peel(peel(initialLayers(), revealFixture), revealFixture);
  const r = revealFor(peeled, gluteusMedius, "l", revealFixture);
  expect(isVisible(r.state, gluteusMedius, "l")).toBe(true);
  expect(r.state.peeledDepths).toEqual([1]);
  expect(r.peeledNow).toBe(0);
});

test("reveal shows a hidden tissue group", () => {
  const r = revealFor(toggleTissue(initialLayers(), "soft"), iliofemoralLigament, "l", revealFixture);
  expect(isVisible(r.state, iliofemoralLigament, "l")).toBe(true);
});

test("reveal a ligament at depth 3 peels the muscle layers 1 and 2 in front of it", () => {
  const r = revealFor(initialLayers(), iliofemoralLigament, "l", revealFixture);
  expect(r.peeledNow).toBe(2);
  expect(r.state.peeledDepths).toEqual([1, 2]);
  expect(isVisible(r.state, gluteusMinimus, "l")).toBe(true);
});

test("reveal a bone at depth 4 peels every muscle layer", () => {
  const r = revealFor(initialLayers(), femur, "l", revealFixture);
  expect(r.peeledNow).toBe(3);
  expect(r.state.peeledDepths).toEqual([1, 2, 3]);
  expect(isVisible(r.state, femur, "l")).toBe(true);
});

test("reveal a bone peels nothing when the muscles are switched off", () => {
  const r = revealFor(toggleTissue(initialLayers(), "muscle"), femur, "l", revealFixture);
  expect(r.peeledNow).toBe(0);
});

test("reveal unhides a structure hidden one by one", () => {
  const r = revealFor(hideStructure(initialLayers(), "femur", "l"), femur, "l", revealFixture);
  expect(isVisible(r.state, femur, "l")).toBe(true);
});

test("reveal leaves the old state alone", () => {
  const before = initialLayers();
  revealFor(before, gluteusMinimus, "l", revealFixture);
  expect(before.peeledDepths).toEqual([]);
});

test("hiding the left side leaves the right side showing", () => {
  const state = hideStructure(initialLayers(), "piriformis", "l");
  expect(isVisible(state, piriformis, "l")).toBe(false);
  expect(isVisible(state, piriformis, "r")).toBe(true);
});

test("showStructure takes the key that hiddenKey made", () => {
  const state = showStructure(hideStructure(initialLayers(), "piriformis", "l"), hiddenKey("piriformis", "l"));
  expect(isVisible(state, piriformis, "l")).toBe(true);
});

test("revealFor unhides only the side it was asked for", () => {
  let state = hideStructure(hideStructure(initialLayers(), "piriformis", "l"), "piriformis", "r");
  state = revealFor(state, piriformis, "l", [piriformis]).state;
  expect(isVisible(state, piriformis, "l")).toBe(true);
  expect(isVisible(state, piriformis, "r")).toBe(false);
});

test("a midline structure hides with an empty side", () => {
  const sacrum: BundleStructure = { id: "sacrum", type: "bone", english: "Sacrum", depth: 4, paired: false };
  const state = hideStructure(initialLayers(), "sacrum", "");
  expect(isVisible(state, sacrum, "")).toBe(false);
});

test("peel counts a layer as showing while one side of a muscle is still visible", () => {
  const state = hideStructure(initialLayers(), "gluteus-maximus", "l");
  expect(peel(state, fixture).peeledDepths).toEqual([1]);
});
