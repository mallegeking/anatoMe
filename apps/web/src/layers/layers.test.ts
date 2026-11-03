import { expect, test } from "vitest";
import type { BundleStructure } from "../data/bundle";
import { hideStructure, initialLayers, isVisible, peel, restore, revealFor, showStructure, tissueOf, toggleTissue } from "./layers";

const gluteusMaximus: BundleStructure = { id: "gluteus-maximus", type: "muscle", english: "Gluteus maximus", depth: 1 };
const gluteusMedius: BundleStructure = { id: "gluteus-medius", type: "muscle", english: "Gluteus medius", depth: 2 };
const piriformis: BundleStructure = { id: "piriformis", type: "muscle", english: "Piriformis", depth: 2 };
const gluteusMinimus: BundleStructure = { id: "gluteus-minimus", type: "muscle", english: "Gluteus minimus", depth: 3 };
const femur: BundleStructure = { id: "femur", type: "bone", english: "Femur", depth: 4 };
const iliofemoralLigament: BundleStructure = { id: "iliofemoral-ligament", type: "ligament", english: "Iliofemoral ligament", depth: 3 };
const fixture = [gluteusMaximus, gluteusMedius, piriformis, gluteusMinimus, femur, iliofemoralLigament];

test("tissue groups", () => {
  expect(tissueOf("bone")).toBe("bone");
  expect(tissueOf("muscle")).toBe("muscle");
  for (const type of ["tendon", "ligament", "capsule", "labrum", "bursa", "meniscus", "fascia"]) expect(tissueOf(type)).toBe("soft");
});

test("everything starts visible", () => {
  for (const s of fixture) expect(isVisible(initialLayers(), s)).toBe(true);
});

test("peel hides the outermost visible muscle layer", () => {
  const s = peel(initialLayers(), fixture);
  expect(isVisible(s, gluteusMaximus)).toBe(false);
  expect(isVisible(s, gluteusMedius)).toBe(true);
});

test("the second peel hides every muscle of the next depth", () => {
  const s = peel(peel(initialLayers(), fixture), fixture);
  expect(isVisible(s, gluteusMedius)).toBe(false);
  expect(isVisible(s, piriformis)).toBe(false);
  expect(isVisible(s, gluteusMinimus)).toBe(true);
});

test("peel twice then restore once", () => {
  const s = restore(peel(peel(initialLayers(), fixture), fixture));
  expect(s.peeledDepths).toEqual([1]);
});

test("restore with nothing peeled changes nothing", () => {
  expect(restore(initialLayers()).peeledDepths).toEqual([]);
});

test("peel never hides bones", () =>
  expect(isVisible(peel(peel(peel(initialLayers(), fixture), fixture), fixture), femur)).toBe(true));

test("peel stops when no muscle layer is left", () => {
  let s = initialLayers();
  for (let i = 0; i < 6; i++) s = peel(s, fixture);
  expect(s.peeledDepths).toEqual([1, 2, 3]);
});

test("peel skips a layer whose muscles are all hidden by hand", () => {
  const s = peel(hideStructure(initialLayers(), "gluteus-maximus"), fixture);
  expect(s.peeledDepths).toEqual([2]);
});

test("hide one structure", () => expect(isVisible(hideStructure(initialLayers(), "piriformis"), piriformis)).toBe(false));

test("show brings a hidden structure back", () =>
  expect(isVisible(showStructure(hideStructure(initialLayers(), "piriformis"), "piriformis"), piriformis)).toBe(true));

test("tissue toggle hides soft tissue", () => expect(isVisible(toggleTissue(initialLayers(), "soft"), iliofemoralLigament)).toBe(false));

test("tissue toggle twice shows it again", () =>
  expect(isVisible(toggleTissue(toggleTissue(initialLayers(), "soft"), "soft"), iliofemoralLigament)).toBe(true));

test("functions do not change the state they are given", () => {
  const start = initialLayers();
  peel(start, fixture);
  hideStructure(start, "femur");
  toggleTissue(start, "bone");
  expect(start).toEqual(initialLayers());
});

// revealFor
const obturatorInternus: BundleStructure = { id: "obturator-internus", type: "muscle", english: "Obturator internus", depth: 2 };
const obturatorExternus: BundleStructure = { id: "obturator-externus", type: "muscle", english: "Obturator externus", depth: 3 };
const revealFixture = [...fixture, obturatorInternus, obturatorExternus];

test("reveal a deep muscle peels the layers above", () => {
  const r = revealFor(initialLayers(), gluteusMinimus, revealFixture);
  expect(r.peeledNow).toBe(2);
  expect(isVisible(r.state, gluteusMinimus)).toBe(true);
  expect(revealFor(initialLayers(), obturatorExternus, revealFixture).peeledNow).toBe(2);
});

test("reveal a muscle one layer down peels one layer", () => {
  const r = revealFor(initialLayers(), obturatorInternus, revealFixture);
  expect(r.peeledNow).toBe(1);
  expect(isVisible(r.state, gluteusMaximus)).toBe(false);
  expect(isVisible(r.state, obturatorInternus)).toBe(true);
});

test("reveal a superficial muscle restores peeled layers", () => {
  const peeled = peel(peel(initialLayers(), revealFixture), revealFixture);
  const r = revealFor(peeled, gluteusMaximus, revealFixture);
  expect(isVisible(r.state, gluteusMaximus)).toBe(true);
  expect(r.peeledNow).toBe(0);
});

test("reveal restores layers at or below the target but keeps none that cover it", () => {
  const peeled = peel(peel(initialLayers(), revealFixture), revealFixture);
  const r = revealFor(peeled, gluteusMedius, revealFixture);
  expect(isVisible(r.state, gluteusMedius)).toBe(true);
  expect(r.state.peeledDepths).toEqual([1]);
  expect(r.peeledNow).toBe(0);
});

test("reveal shows a hidden tissue group", () => {
  const r = revealFor(toggleTissue(initialLayers(), "soft"), iliofemoralLigament, revealFixture);
  expect(isVisible(r.state, iliofemoralLigament)).toBe(true);
});

test("reveal a ligament at depth 3 peels the muscle layers 1 and 2 in front of it", () => {
  const r = revealFor(initialLayers(), iliofemoralLigament, revealFixture);
  expect(r.peeledNow).toBe(2);
  expect(r.state.peeledDepths).toEqual([1, 2]);
  expect(isVisible(r.state, gluteusMinimus)).toBe(true);
});

test("reveal a bone at depth 4 peels every muscle layer", () => {
  const r = revealFor(initialLayers(), femur, revealFixture);
  expect(r.peeledNow).toBe(3);
  expect(r.state.peeledDepths).toEqual([1, 2, 3]);
  expect(isVisible(r.state, femur)).toBe(true);
});

test("reveal a bone peels nothing when the muscles are switched off", () => {
  const r = revealFor(toggleTissue(initialLayers(), "muscle"), femur, revealFixture);
  expect(r.peeledNow).toBe(0);
});

test("reveal unhides a structure hidden one by one", () => {
  const r = revealFor(hideStructure(initialLayers(), "femur"), femur, revealFixture);
  expect(isVisible(r.state, femur)).toBe(true);
});

test("reveal leaves the old state alone", () => {
  const before = initialLayers();
  revealFor(before, gluteusMinimus, revealFixture);
  expect(before.peeledDepths).toEqual([]);
});
