import type { Side } from "../viewer/pick";

// One thing a ray went through. kind is the mesh kind, "bone" for bones.
export type RayHit = { sid: string; side: Side; kind: string; distance: number };
// depth is model metres under the first hit, never negative.
export type UnderEntry = { sid: string; side: Side; distance: number; depth: number };

// How far under the surface the list reaches when no bone stops it.
export const CAP_M = 0.12;
// How far past a chosen structure the list reaches.
export const BEHIND_TARGET_M = 0.03;
// The other side counts as tapped too when the centre ray meets it this close to the tapped side.
export const SIDE_BAND_M = 0.01;

// Lists the structures under a tapped spot, nearest first.
// center is the ray through the spot, around are the nearby rays.
export function structuresUnder(center: RayHit[], around: RayHit[][], through?: { sid: string; side: Side }): UnderEntry[] {
  if (center.length === 0) return [];
  const all = [center, ...around].flat();
  const surface = Math.min(...center.map((h) => h.distance));

  // Without a target the list keeps to the side the centre ray meets first (owner's decision after review, 2026-11-15).
  // Midline structures always stay. A centre ray with no sided hit drops nothing.
  const tapped = through ? null : tappedSides(center);
  const kept = (h: RayHit) => !tapped || h.side === "" || tapped.has(h.side);

  // Only a bone that the list shows can stop it.
  const normalStop = (): number => {
    const bones = center.filter((h) => h.kind === "bone" && kept(h)).map((h) => h.distance);
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
    if (!kept(h)) continue;
    const key = `${h.sid}|${h.side}`;
    const seen = nearest.get(key);
    if (!seen || h.distance < seen.distance) {
      nearest.set(key, { sid: h.sid, side: h.side, distance: h.distance, depth: Math.max(0, h.distance - surface) });
    }
  }
  // Ties go by sid and then by side ("" before "l" before "r"), so the order never depends on the order of the hits.
  return [...nearest.values()].filter((e) => e.distance <= stop).sort((a, b) => a.distance - b.distance || order(a.sid, b.sid) || order(a.side, b.side));
}

// The side of the nearest sided centre hit, plus the other side when its nearest centre hit is within SIDE_BAND_M. null when no centre hit has a side.
function tappedSides(center: RayHit[]): Set<Side> | null {
  const near = (side: Side) => Math.min(...center.filter((h) => h.side === side).map((h) => h.distance));
  const l = near("l");
  const r = near("r");
  const first = Math.min(l, r);
  if (first === Infinity) return null;
  return new Set((["l", "r"] as const).filter((side) => (side === "l" ? l : r) - first <= SIDE_BAND_M));
}

function order(a: string, b: string): number {
  return a < b ? -1 : a > b ? 1 : 0;
}
