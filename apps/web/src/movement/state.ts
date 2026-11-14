import type { BundlePhase, RegionBundle } from "../data/bundle";
import { neutralPose, poseAt, queryForMovement, queryForPhase, type Pose, type Query } from "./roles";

// What is picked in the Movements tab: a plain movement, or one phase of an exercise.
export type MovementPick = { kind: "movement"; id: string } | { kind: "exercise"; id: string; phase: string };
// progress runs from 0 (start of the phase) to 1 (its end). Only exercises use it.
export type MovementState = { pick: MovementPick | null; pose: Pose; progress: number };

export function initialMovementState(): MovementState {
  return { pick: null, pose: {}, progress: 0 };
}

export function clearPick(): MovementState {
  return initialMovementState();
}

// A movement starts with every joint at zero.
export function pickMovement(bundle: RegionBundle, id: string): MovementState {
  return { pick: { kind: "movement", id }, pose: neutralPose(bundle), progress: 0 };
}

function phaseOf(bundle: RegionBundle, pick: MovementPick | null): BundlePhase | undefined {
  if (pick?.kind !== "exercise") return undefined;
  return bundle.exercises.find((e) => e.id === pick.id)?.phases.find((p) => p.id === pick.phase);
}

// The pose at a point of a phase. Joints the phase does not move stay at zero.
function poseOf(bundle: RegionBundle, phase: BundlePhase | undefined, progress: number): Pose {
  return { ...neutralPose(bundle), ...(phase ? poseAt(phase, progress) : {}) };
}

// An exercise starts at the beginning of its first phase.
export function pickExercise(bundle: RegionBundle, id: string): MovementState {
  const first = bundle.exercises.find((e) => e.id === id)?.phases[0];
  return { pick: { kind: "exercise", id, phase: first?.id ?? "" }, pose: poseOf(bundle, first, 0), progress: 0 };
}

// Another phase of the same exercise, from its beginning.
export function pickPhase(state: MovementState, bundle: RegionBundle, phase: string): MovementState {
  if (state.pick?.kind !== "exercise") return state;
  const pick = { ...state.pick, phase };
  return { pick, pose: poseOf(bundle, phaseOf(bundle, pick), 0), progress: 0 };
}

export function setAngle(state: MovementState, angle: string, value: number): MovementState {
  return { ...state, pose: { ...state.pose, [angle]: value } };
}

export function setProgress(state: MovementState, bundle: RegionBundle, progress: number): MovementState {
  return { ...state, pose: poseOf(bundle, phaseOf(bundle, state.pick), progress), progress };
}

// What to look up for the current pick. Null when nothing is picked or the bundle does not know the pick.
export function queryOf(state: MovementState, bundle: RegionBundle): Query | null {
  const { pick } = state;
  if (!pick) return null;
  if (pick.kind === "movement") return bundle.movements.some((m) => m.id === pick.id) ? queryForMovement(pick.id) : null;
  const phase = phaseOf(bundle, pick);
  return phase ? queryForPhase(phase, state.pose, bundle.movements) : null;
}
