import { Group, Mesh, type Object3D } from "three";
import { expect, test } from "vitest";
import { createT } from "../i18n/t";
import en from "../i18n/en.json";
import { formatLabel, pickStructure, shouldSelect } from "./pick";

const t = createT(en);

function mesh(userData: Record<string, unknown>): Object3D {
  const m = new Mesh();
  m.userData = userData;
  return m;
}

function childOf(userData: Record<string, unknown>): Object3D {
  const parent = new Group();
  parent.userData = userData;
  const child = new Mesh();
  parent.add(child);
  return child;
}

test("a tap selects", () => expect(shouldSelect(3)).toBe(true));
test("a drag does not select", () => expect(shouldSelect(6)).toBe(false));

test("nearest hit with a sid wins", () => {
  const near = mesh({});
  const mid = mesh({ sid: "gluteus-medius", label: "Gluteus medius", side: "l", kind: "muscle" });
  const far = mesh({ sid: "femur", label: "Femur", side: "l", kind: "bone" });
  expect(
    pickStructure([
      { object: far, distance: 3 },
      { object: near, distance: 1 },
      { object: mid, distance: 2 },
    ])?.sid,
  ).toBe("gluteus-medius");
});

test("sid on a parent is found", () =>
  expect(
    pickStructure([{ object: childOf({ sid: "femur", label: "Femur", side: "r", kind: "bone" }), distance: 1 }])?.sid,
  ).toBe("femur"));

test("no sid anywhere gives null", () =>
  expect(pickStructure([{ object: mesh({}), distance: 1 }])).toBeNull());

test("an empty hit list gives null", () => expect(pickStructure([])).toBeNull());

test("left label", () =>
  expect(formatLabel({ sid: "x", label: "Gluteus maximus", side: "l", kind: "muscle" }, t)).toBe(
    "Gluteus maximus (left)",
  ));

test("right label", () =>
  expect(formatLabel({ sid: "x", label: "Gluteus maximus", side: "r", kind: "muscle" }, t)).toBe(
    "Gluteus maximus (right)",
  ));

test("unpaired label has no side", () =>
  expect(formatLabel({ sid: "sacrum", label: "Sacrum", side: "", kind: "bone" }, t)).toBe("Sacrum"));
