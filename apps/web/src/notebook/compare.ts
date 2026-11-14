import type { RegionBundle } from "../data/bundle";
import type { Lang } from "../i18n/lang";
import { nameOf } from "../i18n/names";
import { involved, neutralPose, queryForMovement, queryForPhase, type Query } from "../movement/roles";
import type { NotebookEntry } from "./types";

// A structure that painful entries load and no fine entry of the same side loads.
// painful is how many painful entries load it. evidence is the sorted action ids that made it count.
export type Candidate = { sid: string; painful: number; evidence: string[] };
export type Comparison = {
  side: "l" | "r";
  painfulCount: number; // known painful entries for this side
  fineCount: number; // known fine entries for this side
  unknownCount: number; // entries for this side whose pick the bundle does not know
  candidates: Candidate[]; // plain counts, ordered by the name in the language shown (then by id), not by count
  ruledOut: string[]; // loaded by a painful and by a fine entry, by the name in the language shown
  incomplete: boolean;
};

// The query as the Movements tab builds it, or null when the bundle does not know the pick.
function queryOf(entry: NotebookEntry, bundle: RegionBundle): Query | null {
  const pick = entry.pick;
  if (pick.kind === "movement") {
    return bundle.movements.some((m) => m.id === pick.id) ? queryForMovement(pick.id) : null;
  }
  const phase = bundle.exercises.find((x) => x.id === pick.id)?.phases.find((p) => p.id === pick.phase);
  return phase ? queryForPhase(phase, entry.pose, bundle.movements) : null;
}

export function isKnown(entry: NotebookEntry, bundle: RegionBundle): boolean {
  return queryOf(entry, bundle) !== null;
}

// Structure id to the ids of the action rows that load it. Empty for an unknown entry.
// The order of the rows does not matter here, so it asks involved() for the English order.
export function loadedBy(entry: NotebookEntry, bundle: RegionBundle): Map<string, string[]> {
  const out = new Map<string, string[]>();
  const query = queryOf(entry, bundle);
  if (!query) return out;
  const pose = { ...neutralPose(bundle), ...entry.pose };
  for (const row of involved(bundle, query, pose, "en").rows) {
    const ids = out.get(row.action.structure) ?? [];
    ids.push(row.action.id);
    out.set(row.action.structure, ids);
  }
  return out;
}

// lang changes only the order of the candidates and of the ruled out structures.
export function compare(entries: NotebookEntry[], bundle: RegionBundle, side: "l" | "r", lang: Lang): Comparison {
  const mine = entries.filter((x) => x.side === side || x.side === "both");
  const name = new Map(bundle.structures.map((s) => [s.id, nameOf(s, lang)]));
  const byName = (a: string, b: string) => (name.get(a) ?? a).localeCompare(name.get(b) ?? b, lang) || a.localeCompare(b);

  let painfulCount = 0;
  let fineCount = 0;
  let unknownCount = 0;
  let incomplete = false;
  const painful = new Map<string, { entries: number; evidence: Set<string> }>();
  const fine = new Set<string>();

  for (const entry of mine) {
    const query = queryOf(entry, bundle);
    if (!query) {
      unknownCount++;
      continue;
    }
    if (bundle.mode === "normal") {
      const moves = new Set([...query.working, ...query.position]);
      if (Object.keys(bundle.pendingByMovement).some((id) => moves.has(id) && bundle.pendingByMovement[id] > 0)) incomplete = true;
      if (entry.pick.kind === "exercise" && bundle.pendingExercises > 0) incomplete = true;
    }
    const loaded = loadedBy(entry, bundle);
    if (entry.feeling === "painful") {
      painfulCount++;
      for (const [sid, ids] of loaded) {
        const cur = painful.get(sid) ?? { entries: 0, evidence: new Set<string>() };
        cur.entries++;
        for (const id of ids) cur.evidence.add(id);
        painful.set(sid, cur);
      }
    } else {
      fineCount++;
      for (const sid of loaded.keys()) fine.add(sid);
    }
  }

  const candidates: Candidate[] = [...painful]
    .filter(([sid]) => !fine.has(sid))
    .sort(([a], [b]) => byName(a, b))
    .map(([sid, v]) => ({ sid, painful: v.entries, evidence: [...v.evidence].sort() }));
  const ruledOut = [...painful.keys()].filter((sid) => fine.has(sid)).sort(byName);
  return { side, painfulCount, fineCount, unknownCount, candidates, ruledOut, incomplete };
}
