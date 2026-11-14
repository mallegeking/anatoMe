import { describe, expect, test } from "vitest";
import { makeMovementBundle } from "./fixture";
import { contextAngles, involved, neutralPose, poseAt, positionMovements, queryForMovement, queryForPhase } from "./roles";
import type { Involved, Pose } from "./roles";

const b = makeMovementBundle();
const ids = (i: Involved) => i.rows.map((r) => r.action.id);
const er = queryForMovement("hip-external-rotation");
const ir = queryForMovement("hip-internal-rotation");
const at = (flexion: number): Pose => ({ ...neutralPose(b), "hip.flexion": flexion });

describe("movement roles", () => {
  test("neutral pose has every angle at zero", () => expect(neutralPose(b)).toEqual({ "hip.flexion": 0, "hip.rotation": 0, "knee.flexion": 0 }));
  test("external rotation with the hip straight", () => {
    const i = involved(b, er, at(0), "en");
    expect(ids(i)).toEqual(["m7", "m1", "m3"]);
    expect(i.silent).toEqual([]);
    expect(i.candidates).toBe(4);
  });
  test("a pose on the end of a range still applies", () => expect(ids(involved(b, er, at(45), "en"))).toEqual(["m7", "m1", "m3"]));
  test("past its range a structure goes silent", () => {
    const i = involved(b, er, at(50), "en");
    expect(ids(i)).toEqual(["m7", "m3"]);
    expect(i.silent).toEqual(["piriformis"]);
  });
  test("a gap between two measured ranges is silent", () => {
    const i = involved(b, er, at(65), "en");
    expect(ids(i)).toEqual(["m3"]);
    expect(i.silent).toEqual(["obturator-externus", "piriformis"]);
  });
  test("the role changes with the angle", () => expect(involved(b, er, at(80), "en").bySid.get("obturator-externus")).toBe("secondary"));
  test("internal rotation shows the stretched ligament", () => {
    expect(ids(involved(b, ir, at(0), "en"))).toEqual(["m5"]);
    const bent = involved(b, ir, at(90), "en");
    expect(ids(bent)).toEqual(["m2", "m5"]);
    expect(bent.bySid.get("ischiofemoral-ligament")).toBe("stretched");
  });
  test("positionMovements follows the sign of each angle", () =>
    expect(positionMovements({ "hip.flexion": 50, "hip.rotation": -10, "knee.flexion": 0 }, b.movements)).toEqual(["hip-flexion", "hip-external-rotation"]));
  test("poseAt moves along the path", () => expect(poseAt(b.exercises[0].phases[0], 0.5)).toEqual({ "hip.flexion": 50, "knee.flexion": 55 }));
  test("lowering into a squat lights the extensors, not the flexors", () => {
    const phase = b.exercises[0].phases[0];
    const pose = { ...neutralPose(b), ...poseAt(phase, 0.5) };
    const q = queryForPhase(phase, pose, b.movements);
    expect(q).toEqual({ working: ["hip-extension", "knee-extension"], position: ["hip-flexion", "knee-flexion"] });
    expect(ids(involved(b, q, pose, "en"))).toEqual(["m4"]);
  });
  test("at the bottom of the squat the labrum row applies too", () => {
    const phase = b.exercises[0].phases[0];
    const pose = { ...neutralPose(b), ...poseAt(phase, 1) };
    const i = involved(b, queryForPhase(phase, pose, b.movements), pose, "en");
    expect(ids(i)).toEqual(["m4", "m6"]);
    expect(i.bySid.get("acetabular-labrum")).toBe("pinched");
  });
  test("context angles span what the rows name, widened to zero", () => {
    expect(contextAngles(b, er)).toEqual([{ angle: "hip.flexion", min: 0, max: 90 }]);
    expect(contextAngles(b, queryForMovement("hip-extension"))).toEqual([]);
  });
  test("a movement with no rows has no candidates", () => expect(involved(b, queryForMovement("knee-flexion"), at(0), "en").candidates).toBe(0));
});
