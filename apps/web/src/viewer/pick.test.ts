import { Group, Mesh, type Object3D } from "three";
import { expect, test } from "vitest";
import { pickHit, pickVisibleHit, shouldClear, shouldSelect } from "./pick";

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
test("empty-space clear uses the same 6 px rule as selecting", () => expect(shouldClear(5)).toBe(true));
test("a drag over empty space does not clear", () => expect(shouldClear(6)).toBe(false));

test("nearest hit with a sid wins", () => {
  const near = mesh({});
  const mid = mesh({ sid: "gluteus-medius", label: "Gluteus medius", side: "l", kind: "muscle" });
  const far = mesh({ sid: "femur", label: "Femur", side: "l", kind: "bone" });
  expect(
    pickHit([
      { object: far, distance: 3 },
      { object: near, distance: 1 },
      { object: mid, distance: 2 },
    ])?.structure.sid,
  ).toBe("gluteus-medius");
});

test("sid on a parent is found", () =>
  expect(
    pickHit([{ object: childOf({ sid: "femur", label: "Femur", side: "r", kind: "bone" }), distance: 1 }])?.structure.sid,
  ).toBe("femur"));

test("no sid anywhere gives null", () =>
  expect(pickHit([{ object: mesh({}), distance: 1 }])).toBeNull());

test("an empty hit list gives null", () => expect(pickHit([])).toBeNull());

const maxMesh = mesh({ sid: "gluteus-maximus", label: "Gluteus maximus", side: "", kind: "muscle" });
const medMesh = mesh({ sid: "gluteus-medius", label: "Gluteus medius", side: "", kind: "muscle" });

test("tap skips hidden meshes", () =>
  expect(
    pickVisibleHit([{ object: maxMesh, distance: 1 }, { object: medMesh, distance: 2 }], (sid) => sid !== "gluteus-maximus")?.structure.sid,
  ).toBe("gluteus-medius"));

test("tap on only hidden meshes picks nothing", () =>
  expect(pickVisibleHit([{ object: maxMesh, distance: 1 }], () => false)).toBeNull());
