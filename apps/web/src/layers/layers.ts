import type { BundleStructure } from "../data/bundle";
import type { Side } from "../viewer/pick";

// Bone and muscle get their own switch. Everything else is "soft".
export type TissueGroup = "bone" | "muscle" | "soft";

export function tissueOf(type: string): TissueGroup {
  if (type === "bone" || type === "muscle") return type;
  return "soft";
}

// The key for one side of one structure in hiddenIds. A midline structure uses an empty side.
export function hiddenKey(sid: string, side: Side): string {
  return `${sid}|${side}`;
}

// What the person has hidden so far.
// peeledDepths is in the order of peeling, so the last one is undone first.
export type LayerState = {
  hiddenTissues: Set<TissueGroup>;
  peeledDepths: number[];
  hiddenIds: Set<string>;
};

export function initialLayers(): LayerState {
  return { hiddenTissues: new Set(), peeledDepths: [], hiddenIds: new Set() };
}

// Every function below returns a new state and leaves the old one alone.
function copy(state: LayerState): LayerState {
  return { hiddenTissues: new Set(state.hiddenTissues), peeledDepths: [...state.peeledDepths], hiddenIds: new Set(state.hiddenIds) };
}

export function isVisible(state: LayerState, structure: BundleStructure, side: Side): boolean {
  const group = tissueOf(structure.type);
  if (state.hiddenTissues.has(group)) return false;
  if (state.hiddenIds.has(hiddenKey(structure.id, side))) return false;
  // Peeling only ever takes away muscles. Bones and soft tissue stay.
  if (group === "muscle" && state.peeledDepths.includes(structure.depth)) return false;
  return true;
}

// True when at least one side of the structure is showing.
export function isVisibleOnAnySide(state: LayerState, structure: BundleStructure): boolean {
  const sides: Side[] = structure.paired ? ["l", "r"] : [""];
  return sides.some((side) => isVisible(state, structure, side));
}

// Hides the outermost muscle layer that is still showing.
// A layer counts as showing when at least one of its muscles is visible.
export function peel(state: LayerState, structures: BundleStructure[]): LayerState {
  const depths = structures
    .filter((s) => tissueOf(s.type) === "muscle" && isVisibleOnAnySide(state, s))
    .map((s) => s.depth);
  if (depths.length === 0) return state;
  const next = copy(state);
  next.peeledDepths.push(Math.min(...depths));
  return next;
}

// Puts back the layer that was peeled last.
export function restore(state: LayerState): LayerState {
  if (state.peeledDepths.length === 0) return state;
  const next = copy(state);
  next.peeledDepths.pop();
  return next;
}

export function hideStructure(state: LayerState, sid: string, side: Side): LayerState {
  const next = copy(state);
  next.hiddenIds.add(hiddenKey(sid, side));
  return next;
}

// key is what hiddenKey made.
export function showStructure(state: LayerState, key: string): LayerState {
  const next = copy(state);
  next.hiddenIds.delete(key);
  return next;
}

export function toggleTissue(state: LayerState, group: TissueGroup): LayerState {
  const next = copy(state);
  if (next.hiddenTissues.has(group)) next.hiddenTissues.delete(group);
  else next.hiddenTissues.add(group);
  return next;
}

// Makes a structure visible again, however it was hidden.
// It shows the tissue group, unhides the asked side of the structure, puts back peeled layers at or below it
// and peels the muscle layers that cover it. peeledNow counts only the layers peeled just now.
// This works the same for every kind of target. A ligament at depth 3 sits under the muscles of depth 1 and 2,
// and a bone at depth 4 sits under all of them.
export function revealFor(state: LayerState, target: BundleStructure, side: Side, structures: BundleStructure[]): { state: LayerState; peeledNow: number } {
  let next = copy(state);
  next.hiddenTissues.delete(tissueOf(target.type));
  next.hiddenIds.delete(hiddenKey(target.id, side));

  next.peeledDepths = next.peeledDepths.filter((depth) => depth < target.depth);
  let peeledNow = 0;
  // Peel while some visible muscle sits above the target.
  while (structures.some((s) => tissueOf(s.type) === "muscle" && isVisibleOnAnySide(next, s) && s.depth < target.depth)) {
    next = peel(next, structures);
    peeledNow++;
  }
  return { state: next, peeledNow };
}
