import { Raycaster, Vector2, Vector3, type Camera, type Object3D } from "three";
import type { RayHit } from "../area/under";
import { structureOf } from "./pick";

// The outer rays sit this many pixels from the tap, about the width of a fingertip.
export const FINGER_PX = 14;

// Raycaster only skips an object when its layers do not match. It does not look at `visible`,
// so meshes the layers have switched off are hit too, which is what area lookup wants.
function castOne(raycaster: Raycaster, ndc: Vector2, camera: Camera, roots: Object3D[]): RayHit[] {
  raycaster.setFromCamera(ndc, camera);
  const nearest = new Map<string, RayHit>();
  for (const hit of raycaster.intersectObjects(roots, true)) {
    const structure = structureOf(hit.object);
    if (!structure) continue;
    const key = `${structure.sid}|${structure.side}`;
    const seen = nearest.get(key);
    if (!seen || hit.distance < seen.distance) {
      nearest.set(key, { sid: structure.sid, side: structure.side, kind: structure.kind, distance: hit.distance });
    }
  }
  return [...nearest.values()].sort((a, b) => a.distance - b.distance);
}

// Casts a ray through the tap and four more around it (right, left, up, down).
// pointer is in normalised device coordinates, size is the canvas in CSS pixels.
export function castFingerRays(
  pointer: { x: number; y: number },
  size: { width: number; height: number },
  camera: Camera,
  roots: Object3D[],
): { center: RayHit[]; around: RayHit[][] } {
  const raycaster = new Raycaster();
  const dx = (2 * FINGER_PX) / size.width;
  const dy = (2 * FINGER_PX) / size.height;
  const at = (x: number, y: number) => castOne(raycaster, new Vector2(x, y), camera, roots);
  return {
    center: at(pointer.x, pointer.y),
    around: [at(pointer.x + dx, pointer.y), at(pointer.x - dx, pointer.y), at(pointer.x, pointer.y + dy), at(pointer.x, pointer.y - dy)],
  };
}

// The world position that lies this far along the ray through the pointer.
export function pointAlong(pointer: { x: number; y: number }, camera: Camera, distance: number): [number, number, number] {
  const raycaster = new Raycaster();
  raycaster.setFromCamera(new Vector2(pointer.x, pointer.y), camera);
  const p = raycaster.ray.at(distance, new Vector3());
  return [p.x, p.y, p.z];
}
