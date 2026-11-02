import type { Object3D } from "three";
import type { Translate } from "../i18n/t";

export type PickedStructure = {
  sid: string;
  label: string;
  side: "l" | "r" | "";
  kind: string;
};

export type Hit = { object: Object3D; distance: number };
export type PickedHit = { object: Object3D; structure: PickedStructure };

// A finger moves a little even during a tap. Past this many pixels it is a drag.
const TAP_SLOP_PX = 6;

export function shouldSelect(dragPx: number): boolean {
  return dragPx < TAP_SLOP_PX;
}

// Looks at the object and then its parents until one carries a structure id.
function structureOf(object: Object3D): PickedStructure | null {
  for (let node: Object3D | null = object; node; node = node.parent) {
    const data = node.userData as Partial<PickedStructure>;
    if (typeof data.sid === "string" && data.sid) {
      return {
        sid: data.sid,
        label: data.label ?? data.sid,
        side: data.side === "l" || data.side === "r" ? data.side : "",
        kind: data.kind ?? "",
      };
    }
  }
  return null;
}

// Nearest hit that belongs to a named structure. Also returns the hit object so it can be highlighted.
export function pickHit(hits: Hit[]): PickedHit | null {
  const nearestFirst = [...hits].sort((a, b) => a.distance - b.distance);
  for (const hit of nearestFirst) {
    const structure = structureOf(hit.object);
    if (structure) return { object: hit.object, structure };
  }
  return null;
}

export function pickStructure(hits: Hit[]): PickedStructure | null {
  return pickHit(hits)?.structure ?? null;
}

export function formatLabel(p: PickedStructure, t: Translate): string {
  if (p.side === "l") return t("side.left", { label: p.label });
  if (p.side === "r") return t("side.right", { label: p.label });
  return p.label;
}
