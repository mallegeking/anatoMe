import type { BundleAction, BundleMovement, BundlePhase, RegionBundle } from "../data/bundle";

// An angle id such as "hip.flexion" to degrees.
export type Pose = Record<string, number>;
export type Highlight = "primary" | "secondary" | "pinched" | "stretched";
export const HIGHLIGHT_ORDER: Highlight[] = ["primary", "secondary", "pinched", "stretched"];
// Movement ids. Working ones are what the muscles do, position ones are where the joints are.
export type Query = { working: string[]; position: string[] };
export type InvolvedRow = { action: BundleAction; highlight: Highlight };
export type Involved = { rows: InvolvedRow[]; silent: string[]; bySid: Map<string, Highlight>; candidates: number };

// Every angle a movement names, at zero degrees.
export function neutralPose(bundle: RegionBundle): Pose {
  const pose: Pose = {};
  for (const m of bundle.movements) pose[m.dof] = 0;
  return pose;
}

// A row with no ranges always applies. A missing angle counts as 0. Range ends count.
export function appliesAt(action: BundleAction, pose: Pose): boolean {
  return (action.when ?? []).every((w) => {
    const v = pose[w.angle] ?? 0;
    return v >= w.min && v <= w.max;
  });
}

// A working row gives its role. Every other row gives its load.
export function highlightOf(action: BundleAction): Highlight {
  return action.load === "working" ? (action.role ?? "secondary") : action.load;
}

export function queryForMovement(id: string): Query {
  return { working: [id], position: [id] };
}

// The movements the joints are already in. A positive angle is the positive direction, a negative one the negative.
export function positionMovements(pose: Pose, movements: BundleMovement[]): string[] {
  return movements
    .filter((m) => {
      const v = pose[m.dof] ?? 0;
      return m.direction === "positive" ? v > 0 : v < 0;
    })
    .map((m) => m.id);
}

// Working rows come from the phase's effort list. Stretched and pinched rows come from where the joints are.
export function queryForPhase(phase: BundlePhase, pose: Pose, movements: BundleMovement[]): Query {
  return { working: [...phase.effort], position: positionMovements(pose, movements) };
}

export function poseAt(phase: BundlePhase, progress: number): Pose {
  const pose: Pose = {};
  for (const p of phase.path) pose[p.angle] = p.from + (p.to - p.from) * progress;
  return pose;
}

function candidatesOf(bundle: RegionBundle, query: Query): BundleAction[] {
  return bundle.actions.filter((a) => (a.load === "working" ? query.working : query.position).includes(a.movement));
}

// The angle ranges the candidate rows name, widened so they always include zero.
export function contextAngles(bundle: RegionBundle, query: Query): { angle: string; min: number; max: number }[] {
  const out = new Map<string, { angle: string; min: number; max: number }>();
  for (const a of candidatesOf(bundle, query)) {
    for (const w of a.when ?? []) {
      const cur = out.get(w.angle) ?? { angle: w.angle, min: 0, max: 0 };
      cur.min = Math.min(cur.min, w.min);
      cur.max = Math.max(cur.max, w.max);
      out.set(w.angle, cur);
    }
  }
  return [...out.values()];
}

export function involved(bundle: RegionBundle, query: Query, pose: Pose): Involved {
  const name = new Map(bundle.structures.map((s) => [s.id, s.english]));
  const nameOf = (id: string) => name.get(id) ?? id;
  const byName = (a: string, b: string) => nameOf(a).localeCompare(nameOf(b));
  const candidates = candidatesOf(bundle, query);
  const rows: InvolvedRow[] = candidates.filter((a) => appliesAt(a, pose)).map((action) => ({ action, highlight: highlightOf(action) }));
  rows.sort(
    (x, y) =>
      HIGHLIGHT_ORDER.indexOf(x.highlight) - HIGHLIGHT_ORDER.indexOf(y.highlight) ||
      byName(x.action.structure, y.action.structure) ||
      x.action.id.localeCompare(y.action.id),
  );
  const bySid = new Map<string, Highlight>();
  for (const r of rows) if (!bySid.has(r.action.structure)) bySid.set(r.action.structure, r.highlight);
  const silent = [...new Set(candidates.map((a) => a.structure))].filter((id) => !bySid.has(id)).sort(byName);
  return { rows, silent, bySid, candidates: candidates.length };
}
