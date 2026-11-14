import type { BundleStructure } from "../data/bundle";
import type { Highlight } from "../movement/roles";
import type { Side } from "../viewer/pick";
import { isVisible, tissueOf, type LayerState } from "./layers";

// Builds the "is this shown" check for the viewer, in one place.
// Without highlights the layers decide, and structures the data does not know are shown.
// With highlights, involved structures show on both sides whatever the layers say,
// bones follow the layers, and everything else is hidden.
export function makeIsShown(
  structures: BundleStructure[],
  layers: LayerState,
  highlights: ReadonlyMap<string, Highlight> | null,
): (sid: string, side: Side) => boolean {
  const byId = new Map(structures.map((s) => [s.id, s]));
  return (sid, side) => {
    const structure = byId.get(sid);
    if (!highlights) return structure ? isVisible(layers, structure, side) : true;
    if (highlights.has(sid)) return true;
    return structure !== undefined && tissueOf(structure.type) === "bone" && isVisible(layers, structure, side);
  };
}
