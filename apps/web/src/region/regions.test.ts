import { expect, test } from "vitest";
import type { Manifest } from "../viewer/manifest";
import { chooseRegion, regionIds } from "./regions";

const file = { path: "x.glb", source: "bp3d", license: "CC-BY-4.0" };

test("regionIds lists the regions in the manifest's order", () => {
  const manifest: Manifest = { regions: { shoulder: { files: [file] }, hip: { files: [file] } } };
  expect(regionIds(manifest)).toEqual(["shoulder", "hip"]);
});

test("takes the region the address names", () => expect(chooseRegion(["hip", "shoulder"], "?region=shoulder")).toBe("shoulder"));
test("an unknown region falls back to the first", () => expect(chooseRegion(["hip", "shoulder"], "?region=elbow")).toBe("hip"));
test("no parameter gives the first", () => expect(chooseRegion(["hip"], "")).toBe("hip"));
test("no regions at all is an error", () => expect(() => chooseRegion([], "")).toThrow());
