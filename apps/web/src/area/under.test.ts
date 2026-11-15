import { expect, test } from "vitest";
import type { Side } from "../viewer/pick";
import { structuresUnder, type RayHit } from "./under";

const hit = (sid: string, distance: number, kind = "muscle", side: Side = "l"): RayHit => ({ sid, side, kind, distance });

test("orders by distance and stops at the first bone", () => {
  const center = [hit("sartorius", 1.0), hit("iliacus", 1.02), hit("femur", 1.05, "bone"), hit("gluteus-maximus", 1.1)];
  expect(structuresUnder(center, []).map((e) => e.sid)).toEqual(["sartorius", "iliacus", "femur"]);
});
test("depth is measured from the first hit", () => {
  const out = structuresUnder([hit("sartorius", 1.0), hit("femur", 1.05, "bone")], []);
  expect(out[0].depth).toBe(0);
  expect(out[1].depth).toBeCloseTo(0.05);
});
test("without a bone the list stops 0.12 under the surface", () => {
  const center = [hit("gracilis", 1.0), hit("adductor-magnus", 1.1), hit("gracilis", 1.3, "muscle", "r")];
  expect(structuresUnder(center, []).map((e) => `${e.sid}|${e.side}`)).toEqual(["gracilis|l", "adductor-magnus|l"]);
});
test("a far bone does not lift the depth limit", () => {
  const center = [hit("gracilis", 1.0), hit("femur", 1.4, "bone", "r")];
  expect(structuresUnder(center, []).map((e) => e.sid)).toEqual(["gracilis"]);
});
test("a structure only an outer ray hits is included", () => {
  const out = structuresUnder([hit("sartorius", 1.0), hit("femur", 1.05, "bone")], [[hit("rectus-femoris", 1.01)]]);
  expect(out.map((e) => e.sid)).toEqual(["sartorius", "rectus-femoris", "femur"]);
});
test("the nearest hit of a structure wins across rays", () => {
  const out = structuresUnder([hit("sartorius", 1.0)], [[hit("sartorius", 0.99)]]);
  expect(out).toEqual([{ sid: "sartorius", side: "l", distance: 0.99, depth: 0 }]);
});
test("an empty centre ray gives nothing, even when outer rays hit", () => expect(structuresUnder([], [[hit("sartorius", 1.0)]])).toEqual([]));
test("through a target the list passes bone and ends just behind the target", () => {
  const center = [hit("gluteus-maximus", 1.0), hit("hip-bone", 1.04, "bone"), hit("iliacus", 1.06), hit("psoas-major", 1.08), hit("sartorius", 1.2)];
  expect(structuresUnder(center, [], { sid: "iliacus", side: "l" }).map((e) => e.sid)).toEqual(["gluteus-maximus", "hip-bone", "iliacus", "psoas-major"]);
});
test("a target that no ray hits falls back to the normal rule", () => {
  const center = [hit("sartorius", 1.0), hit("femur", 1.05, "bone"), hit("biceps-femoris-long-head", 1.1)];
  expect(structuresUnder(center, [], { sid: "piriformis", side: "l" }).map((e) => e.sid)).toEqual(["sartorius", "femur"]);
});
test("the left and right copy at the same distance come out in the same order, whatever the order of the hits", () => {
  const left = hit("gracilis", 1.0, "muscle", "l");
  const right = hit("gracilis", 1.0, "muscle", "r");
  const keys = (center: RayHit[]) => structuresUnder(center, []).map((e) => `${e.sid}|${e.side}`);
  expect(keys([left, right])).toEqual(["gracilis|l", "gracilis|r"]);
  expect(keys([right, left])).toEqual(["gracilis|l", "gracilis|r"]);
});

// Without a target the list keeps to the tapped side. The other side counts as tapped only when the centre ray meets it within SIDE_BAND_M.
const keys = (out: { sid: string; side: Side }[]) => out.map((e) => `${e.sid}|${e.side}`);
test("a deeper hit of the other side is left out", () => {
  const center = [hit("biceps-femoris-long-head", 1.0), hit("semitendinosus", 1.02), hit("semitendinosus", 1.08, "muscle", "r")];
  expect(keys(structuresUnder(center, []))).toEqual(["biceps-femoris-long-head|l", "semitendinosus|l"]);
});
test("the other side is left out when only an outer ray hits it", () => {
  expect(keys(structuresUnder([hit("sartorius", 1.0)], [[hit("gracilis", 1.05, "muscle", "r")]]))).toEqual(["sartorius|l"]);
});
test("a midline structure stays", () => {
  const center = [hit("gluteus-maximus", 1.0, "muscle", "r"), hit("sacrum", 1.03, "bone", "")];
  expect(keys(structuresUnder(center, []))).toEqual(["gluteus-maximus|r", "sacrum|"]);
});
test("both sides stay when the centre ray meets them within 1 cm", () => {
  const center = [hit("pectineus", 1.0), hit("pectineus", 1.005, "muscle", "r"), hit("adductor-brevis", 1.03, "muscle", "r")];
  expect(keys(structuresUnder(center, []))).toEqual(["pectineus|l", "pectineus|r", "adductor-brevis|r"]);
});
test("through a target nothing is dropped by side", () => {
  const center = [hit("gluteus-maximus", 1.0, "muscle", "r"), hit("piriformis", 1.05)];
  expect(keys(structuresUnder(center, [], { sid: "piriformis", side: "l" }))).toEqual(["gluteus-maximus|r", "piriformis|l"]);
});
test("a bone of the other side does not stop the list", () => {
  const center = [hit("sartorius", 1.0), hit("hip-bone", 1.04, "bone", "r"), hit("iliacus", 1.08)];
  expect(keys(structuresUnder(center, []))).toEqual(["sartorius|l", "iliacus|l"]);
});
test("a bone of the tapped side still stops the list", () => {
  const center = [hit("sartorius", 1.0), hit("femur", 1.04, "bone", "l"), hit("iliacus", 1.08)];
  expect(keys(structuresUnder(center, []))).toEqual(["sartorius|l", "femur|l"]);
});
