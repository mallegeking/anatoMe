import type { Side } from "../viewer/pick";

// One thing a ray went through. kind is the mesh kind, "bone" for bones.
export type RayHit = { sid: string; side: Side; kind: string; distance: number };
// depth is model metres under the first hit, never negative.
export type UnderEntry = { sid: string; side: Side; distance: number; depth: number };

// How far under the surface the list reaches when no bone stops it.
export const CAP_M = 0.12;
// How far past a chosen structure the list reaches.
export const BEHIND_TARGET_M = 0.03;

// Lists the structures under a tapped spot, nearest first.
// center is the ray through the spot, around are the nearby rays.
export function structuresUnder(center: RayHit[], around: RayHit[][], through?: { sid: string; side: Side }): UnderEntry[] {
  if (center.length === 0) return [];
  const all = [center, ...around].flat();
  const surface = Math.min(...center.map((h) => h.distance));

  const normalStop = (): number => {
    const bones = center.filter((h) => h.kind === "bone").map((h) => h.distance);
    const capped = surface + CAP_M;
    return bones.length > 0 ? Math.min(Math.min(...bones), capped) : capped;
  };

  let stop: number | undefined;
  if (through) {
    const target = all.filter((h) => h.sid === through.sid && h.side === through.side).map((h) => h.distance);
    if (target.length > 0) stop = Math.min(...target) + BEHIND_TARGET_M;
  }
  if (stop === undefined) stop = normalStop();

  // Each structure and side keeps its nearest distance.
  const nearest = new Map<string, UnderEntry>();
  for (const h of all) {
    const key = `${h.sid}|${h.side}`;
    const seen = nearest.get(key);
    if (!seen || h.distance < seen.distance) {
      nearest.set(key, { sid: h.sid, side: h.side, distance: h.distance, depth: Math.max(0, h.distance - surface) });
    }
  }
  return [...nearest.values()]
    .filter((e) => e.distance <= stop)
    .sort((a, b) => a.distance - b.distance || (a.sid < b.sid ? -1 : a.sid > b.sid ? 1 : 0));
}
