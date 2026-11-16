import { expect, test } from "vitest";
import { makeMovementBundle } from "./fixture";
import { clearPick, initialMovementState, pickExercise, pickMovement, pickPhase, queryOf, setAngle, setProgress } from "./state";

const b = makeMovementBundle();

test("the movement mode starts with nothing picked", () => expect(initialMovementState()).toEqual({ pick: null, pose: {}, progress: 0 }));

test("picking a movement starts from the neutral pose", () =>
  expect(pickMovement(b, "hip-external-rotation")).toEqual({
    pick: { kind: "movement", id: "hip-external-rotation" },
    pose: { "hip.flexion": 0, "hip.rotation": 0, "knee.flexion": 0 },
    progress: 0,
  }));

test("picking an exercise starts its first phase", () => expect(pickExercise(b, "squat").pick).toEqual({ kind: "exercise", id: "squat", phase: "lowering" }));

test("progress moves the pose along the phase", () =>
  expect(setProgress(pickExercise(b, "squat"), b, 0.5).pose).toEqual({ "hip.flexion": 50, "hip.rotation": 0, "knee.flexion": 55 }));

test("changing the phase starts it from the beginning", () => {
  const s = pickPhase(setProgress(pickExercise(b, "squat"), b, 0.5), b, "rising");
  expect(s.progress).toBe(0);
  expect(s.pose["hip.flexion"]).toBe(100);
});

test("a pick the bundle does not know gives no query", () => expect(queryOf({ pick: { kind: "movement", id: "gone" }, pose: {}, progress: 0 }, b)).toBeNull());

test("nothing picked gives no query", () => expect(queryOf(initialMovementState(), b)).toBeNull());

test("a movement gives its own query and an exercise phase gives its effort", () => {
  expect(queryOf(pickMovement(b, "hip-external-rotation"), b)).toEqual({ working: ["hip-external-rotation"], position: ["hip-external-rotation"] });
  expect(queryOf(setProgress(pickExercise(b, "squat"), b, 0.5), b)).toEqual({ working: ["hip-extension", "knee-extension"], position: ["hip-flexion", "knee-flexion"] });
});

test("setting an angle changes only that angle", () =>
  expect(setAngle(pickMovement(b, "hip-external-rotation"), "hip.flexion", 65).pose).toEqual({ "hip.flexion": 65, "hip.rotation": 0, "knee.flexion": 0 }));

test("clearing the pick starts again", () => expect(clearPick()).toEqual(initialMovementState()));
