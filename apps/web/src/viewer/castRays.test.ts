import { BoxGeometry, Mesh, PerspectiveCamera } from "three";
import { expect, test } from "vitest";
import { castFingerRays } from "./castRays";

function box(sid: string, z: number, kind = "muscle", visible = true) {
  const mesh = new Mesh(new BoxGeometry(1, 1, 0.1));
  mesh.position.z = z;
  mesh.userData = { sid, side: "l", kind, label: sid };
  mesh.visible = visible;
  mesh.updateMatrixWorld();
  return mesh;
}
const camera = new PerspectiveCamera(40, 1, 0.01, 20);
camera.position.z = 5;
camera.updateMatrixWorld();
const size = { width: 400, height: 400 };

test("the centre ray lists every structure along it, nearest first", () => {
  const { center } = castFingerRays({ x: 0, y: 0 }, size, camera, [box("far", -1), box("near", 0)]);
  expect(center.map((h) => h.sid)).toEqual(["near", "far"]);
  expect(center[0].distance).toBeCloseTo(4.95);
});

test("a mesh that is switched off is still hit", () =>
  expect(castFingerRays({ x: 0, y: 0 }, size, camera, [box("hidden", 0, "muscle", false)]).center.map((h) => h.sid)).toEqual(["hidden"]));

test("there are four outer rays", () => expect(castFingerRays({ x: 0, y: 0 }, size, camera, [box("near", 0)]).around).toHaveLength(4));

test("a tap beside everything gives empty rays", () =>
  expect(castFingerRays({ x: 0.95, y: 0.95 }, size, camera, [box("near", 0)]).center).toEqual([]));

test("each structure appears once per ray", () => {
  const { center } = castFingerRays({ x: 0, y: 0 }, size, camera, [box("m", 0), box("m", -1)]);
  expect(center).toHaveLength(1);
  expect(center[0].distance).toBeCloseTo(4.95);
});
