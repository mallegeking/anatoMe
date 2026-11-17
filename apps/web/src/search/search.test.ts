import { expect, test } from "vitest";
import type { BundleStructure } from "../data/bundle";
import { makeBundle } from "../ui/fixture";
import { searchStructures, selectBySearch } from "./search";

const hip: BundleStructure[] = [
  { id: "gluteus-maximus", type: "muscle", english: "Gluteus maximus", latin: "Musculus gluteus maximus", depth: 1, paired: true },
  { id: "gluteus-medius", type: "muscle", english: "Gluteus medius", latin: "Musculus gluteus medius", depth: 2, paired: true },
  { id: "gluteus-minimus", type: "muscle", english: "Gluteus minimus", latin: "Musculus gluteus minimus", depth: 3, paired: true },
  { id: "piriformis", type: "muscle", english: "Piriformis", latin: "Musculus piriformis", depth: 2, paired: true },
  { id: "adductor-magnus", type: "muscle", english: "Adductor magnus", latin: "Musculus adductor magnus", depth: 3, paired: true },
  { id: "adductor-minimus", type: "muscle", english: "Adductor minimus", depth: 3, paired: true },
  { id: "sacrum", type: "bone", english: "Sacrum", latin: "Os sacrum", depth: 4, paired: false },
  { id: "femur", type: "bone", english: "Femur", latin: "Os femoris", depth: 4, paired: true },
];
const names = (list: BundleStructure[]) => list.map((s) => s.english);

test("prefix of a word matches", () => expect(names(searchStructures("max", hip, "en"))).toContain("Gluteus maximus"));
test("does not match inside a word", () => expect(names(searchStructures("imus", hip, "en"))).toEqual([]));
test("two words both must match", () => expect(names(searchStructures("glut med", hip, "en"))).toEqual(["Gluteus medius"]));
test("Latin name matches", () => expect(names(searchStructures("musculus pirif", hip, "en"))).toEqual(["Piriformis"]));
test("accents and case ignored", () => expect(searchStructures("GLUTÉUS", hip, "en").length).toBe(3));
test("magnus does not return minimus", () => expect(names(searchStructures("adductor mag", hip, "en"))).toEqual(["Adductor magnus"]));
test("an empty or blank query finds nothing", () => {
  expect(searchStructures("", hip, "en")).toEqual([]);
  expect(searchStructures("   ", hip, "en")).toEqual([]);
});
test("English matches come before Latin only matches, then alphabetical", () => {
  // "os" matches the Latin "Os sacrum" and "Os femoris" only, "ob" matches nothing here.
  expect(names(searchStructures("os", hip, "en"))).toEqual(["Femur", "Sacrum"]);
  const mixed: BundleStructure[] = [
    { id: "a", type: "bone", english: "Zed", latin: "Musculus gamma", depth: 1, paired: true },
    { id: "b", type: "bone", english: "Musculus beta", depth: 1, paired: true },
    { id: "c", type: "bone", english: "Musculus alpha", depth: 1, paired: true },
  ];
  expect(names(searchStructures("musc", mixed, "en"))).toEqual(["Musculus alpha", "Musculus beta", "Zed"]);
});
test("at most 8 results", () => {
  const many = Array.from({ length: 20 }, (_, i): BundleStructure => ({ id: `m${i}`, type: "muscle", english: `Muscle ${i}`, depth: 1, paired: true }));
  expect(searchStructures("mus", many, "en").length).toBe(8);
});

test("search selection of a paired structure picks the left side", () => {
  expect(selectBySearch("piriformis", makeBundle())).toEqual({ sid: "piriformis", side: "l" });
});
test("search selection of the sacrum has no side", () => {
  expect(selectBySearch("sacrum", makeBundle())).toEqual({ sid: "sacrum", side: "" });
});

const german: BundleStructure[] = [
  { id: "hip-bone", type: "bone", english: "Hip bone", german: "Hüftbein", latin: "Os coxae", depth: 4, paired: true },
  { id: "gluteus-maximus", type: "muscle", english: "Gluteus maximus", german: "Großer Gesäßmuskel", latin: "Musculus gluteus maximus", depth: 1, paired: true },
  { id: "piriformis", type: "muscle", english: "Piriformis", latin: "Musculus piriformis", depth: 2, paired: true },
];
const ids = (list: BundleStructure[]) => list.map((s) => s.id);

test("in German the German name is found", () => expect(ids(searchStructures("hüft", german, "de"))).toEqual(["hip-bone"]));
test("an umlaut can be typed without dots", () => {
  expect(ids(searchStructures("huft", german, "de"))).toEqual(["hip-bone"]);
  expect(ids(searchStructures("hueft", german, "de"))).toEqual(["hip-bone"]);
  // ß can be typed as ss.
  expect(ids(searchStructures("grosser gesass", german, "de"))).toEqual(["gluteus-maximus"]);
});
test("in German the English and Latin names still work", () => {
  expect(ids(searchStructures("hip", german, "de"))).toEqual(["hip-bone"]);
  expect(ids(searchStructures("coxae", german, "de"))).toEqual(["hip-bone"]);
  // A structure with no German name is found by its English name too.
  expect(ids(searchStructures("pirif", german, "de"))).toEqual(["piriformis"]);
});
test("a structure that matches by two names appears once", () => {
  // "musculus" is in the Latin name of both muscles, "gluteus" in the English and the Latin name of one.
  expect(ids(searchStructures("gluteus", german, "de"))).toEqual(["gluteus-maximus"]);
  expect(ids(searchStructures("musculus", german, "de"))).toEqual(["gluteus-maximus", "piriformis"]);
});
test("in German the current language's matches come first and each group sorts by the German name", () => {
  const list: BundleStructure[] = [
    { id: "a", type: "bone", english: "Alpha", german: "Zett eins", depth: 1, paired: true },
    { id: "b", type: "bone", english: "Zett two", german: "Beta", depth: 1, paired: true },
    { id: "c", type: "bone", english: "Zett three", german: "Anton", depth: 1, paired: true },
  ];
  // "a" matches by its German name, "c" and "b" only by their English one. Each group sorts by the German name.
  expect(ids(searchStructures("zett", list, "de"))).toEqual(["a", "c", "b"]);
  // In English the German name is not searched, so "a" is not found. "c" and "b" match by their English name and sort by it.
  expect(ids(searchStructures("zett", list, "en"))).toEqual(["c", "b"]);
});
