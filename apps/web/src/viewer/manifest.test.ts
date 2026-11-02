import { expect, test } from "vitest";
import { regionFiles, type Manifest } from "./manifest";

const sample: Manifest = {
  regions: { hip: { files: [{ path: "hip.glb", source: "bp3d", license: "CC-BY-4.0" }] } },
};

test("regionFiles lists every file for the region", () =>
  expect(regionFiles(sample, "hip")).toEqual(["models/hip.glb"]));

test("an unknown region is an error", () =>
  expect(() => regionFiles(sample, "knee")).toThrow());
