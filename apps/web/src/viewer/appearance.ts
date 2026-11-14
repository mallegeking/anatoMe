import type { Highlight } from "../movement/roles";
import type { Selection, Side } from "./pick";

// How one mesh should look right now.
export type Paint = { visible: boolean; highlight: Highlight | null; selected: boolean };

export function paintOf(
  mesh: { sid: string; side: Side },
  ctx: { selection: Selection | null; highlights: ReadonlyMap<string, Highlight> | null; isShown: (sid: string, side: Side) => boolean },
): Paint {
  return {
    visible: ctx.isShown(mesh.sid, mesh.side),
    highlight: ctx.highlights?.get(mesh.sid) ?? null,
    selected: ctx.selection?.sid === mesh.sid && ctx.selection.side === mesh.side,
  };
}
