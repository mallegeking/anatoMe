import { expect, test } from "vitest";
import type { BundleStructure } from "../data/bundle";
import { makeBundle } from "../ui/fixture";
import { searchStructures, selectBySearch } from "./search";

const hip: BundleStructure[] = [
  { id: "gluteus-maximus", type: "muscle", english: "Gluteus maximus", latin: "Musculus gluteus maximus", depth: 1 },
  { id: "gluteus-medius", type: "muscle", english: "Gluteus medius", latin: "Musculus gluteus medius", depth: 2 },
  { id: "gluteus-minimus", type: "muscle", english: "Gluteus minimus", latin: "Musculus gluteus minimus", depth: 3 },
  { id: "piriformis", type: "muscle", english: "Piriformis", latin: "Musculus piriformis", depth: 2 },
  { id: "adductor-magnus", type: "muscle", english: "Adductor magnus", latin: "Musculus adductor magnus", depth: 3 },
  { id: "adductor-minimus", type: "muscle", english: "Adductor minimus", depth: 3 },
  { id: "sacrum", type: "bone", english: "Sacrum", latin: "Os sacrum", depth: 4 },
  { id: "femur", type: "bone", english: "Femur", latin: "Os femoris", depth: 4 },
];
const names = (list: BundleStructure[]) => list.map((s) => s.english);

test("prefix of a word matches", () => expect(names(searchStructures("max", hip))).toContain("Gluteus maximus"));
test("does not match inside a word", () => expect(names(searchStructures("imus", hip))).toEqual([]));
test("two words both must match", () => expect(names(searchStructures("glut med", hip))).toEqual(["Gluteus medius"]));
test("Latin name matches", () => expect(names(searchStructures("musculus pirif", hip))).toEqual(["Piriformis"]));
test("accents and case ignored", () => expect(searchStructures("GLUTÉUS", hip).length).toBe(3));
test("magnus does not return minimus", () => expect(names(searchStructures("adductor mag", hip))).toEqual(["Adductor magnus"]));
test("an empty or blank query finds nothing", () => {
  expect(searchStructures("", hip)).toEqual([]);
  expect(searchStructures("   ", hip)).toEqual([]);
});
test("English matches come before Latin only matches, then alphabetical", () => {
  // "os" matches the Latin "Os sacrum" and "Os femoris" only, "ob" matches nothing here.
  expect(names(searchStructures("os", hip))).toEqual(["Femur", "Sacrum"]);
  const mixed: BundleStructure[] = [
    { id: "a", type: "bone", english: "Zed", latin: "Musculus gamma", depth: 1 },
    { id: "b", type: "bone", english: "Musculus beta", depth: 1 },
    { id: "c", type: "bone", english: "Musculus alpha", depth: 1 },
  ];
  expect(names(searchStructures("musc", mixed))).toEqual(["Musculus alpha", "Musculus beta", "Zed"]);
});
test("at most 8 results", () => {
  const many = Array.from({ length: 20 }, (_, i): BundleStructure => ({ id: `m${i}`, type: "muscle", english: `Muscle ${i}`, depth: 1 }));
  expect(searchStructures("mus", many).length).toBe(8);
});

test("search selection of a paired structure picks the left side", () => {
  expect(selectBySearch("piriformis", makeBundle())).toEqual({ sid: "piriformis", side: "l" });
});
test("search selection of the sacrum has no side", () => {
  expect(selectBySearch("sacrum", makeBundle())).toEqual({ sid: "sacrum", side: "" });
});
