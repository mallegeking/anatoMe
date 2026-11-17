import { expect, test } from "vitest";
import type { Manifest } from "../viewer/manifest";
import { chooseRegion, regionIds, WHOLE_BODY } from "./regions";

const file = { path: "x.glb", source: "bp3d", license: "CC-BY-4.0" };

test("regionIds lists the regions in the manifest's order", () => {
  const manifest: Manifest = { regions: { shoulder: { files: [file] }, hip: { files: [file] } } };
  expect(regionIds(manifest)).toEqual(["shoulder", "hip"]);
});

test("takes the region the address names", () => expect(chooseRegion(["hip", "shoulder"], "?region=shoulder")).toBe("shoulder"));
test("an unknown region falls back to the first", () => expect(chooseRegion(["hip", "shoulder"], "?region=elbow")).toBe("hip"));
test("no parameter gives the first", () => expect(chooseRegion(["hip"], "")).toBe("hip"));
test("no regions at all is an error", () => expect(() => chooseRegion([], "")).toThrow());

const ids = ["body", "hip", "lower-leg", "shoulder", "arm", "neck", "trunk"];
test("the whole body opens when the address names no region", () => expect(chooseRegion(ids, "")).toBe("body"));
test("an unknown region opens the whole body", () => expect(chooseRegion(ids, "?region=elbow")).toBe("body"));
test("every region still opens by its id", () => {
  for (const id of ids) expect(chooseRegion(ids, `?region=${id}`)).toBe(id);
});

test("the whole body's id is body", () => expect(WHOLE_BODY).toBe("body"));
