import { mkdtempSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { Document, NodeIO } from "@gltf-transform/core";
import { afterAll, expect, test } from "vitest";
import { checkModelMapping, modelStats, type ValidationResult } from "../src/checkModels.ts";

type Extras = Record<string, string | undefined>;
const BASE: Extras = { sid: "femur", label: "Femur", side: "l", kind: "bone", source: "bp3d" };

// Writes a glb with one single-triangle mesh node per entry. An entry overrides the base
// extras, and a key set to undefined is left out.
async function writeGlb(file: string, meshes: Extras[]) {
  const doc = new Document();
  const buffer = doc.createBuffer();
  const scene = doc.createScene();
  for (const overrides of meshes) {
    const position = doc
      .createAccessor()
      .setType("VEC3")
      .setArray(new Float32Array([0, 0, 0, 1, 0, 0, 0, 1, 0]))
      .setBuffer(buffer);
    const mesh = doc.createMesh().addPrimitive(doc.createPrimitive().setAttribute("POSITION", position));
    const extras = Object.fromEntries(
      Object.entries({ ...BASE, ...overrides }).filter(([, v]) => v !== undefined),
    );
    scene.addChild(doc.createNode().setMesh(mesh).setExtras(extras));
  }
  await new NodeIO().write(file, doc);
}

// Temporary folders made by the tests, removed at the end.
const made: string[] = [];
afterAll(() => made.forEach((d) => rmSync(d, { recursive: true, force: true })));

// A models folder holding test.glb and a manifest that lists it.
function makeDir(files: { path: string; source: string; license: string }[]) {
  const d = mkdtempSync(join(tmpdir(), "anatome-models-"));
  made.push(d);
  writeFileSync(join(d, "manifest.json"), JSON.stringify({ regions: { test: { files } } }));
  return d;
}
const entry = (license = "CC-BY-4.0") => ({ path: "test.glb", source: "bp3d", license });

async function dir(meshes: Extras[]) {
  const d = makeDir([entry()]);
  await writeGlb(join(d, "test.glb"), meshes);
  return d;
}
const dirWithMissingFile = () => makeDir([entry()]);
async function dirWithLicense(license: string) {
  const d = makeDir([entry(license)]);
  await writeGlb(join(d, "test.glb"), [{}]);
  return d;
}

function expectError(result: ValidationResult, pattern: RegExp) {
  expect(result.ok).toBe(false);
  const lines = result.errors.map((e) => `${e.file} ${e.path}: ${e.message}`);
  expect(lines.some((l) => pattern.test(l)), lines.join("\n")).toBe(true);
}

test("passes when every sid is known", async () => expect((await checkModelMapping(await dir([{ sid: "femur" }]), new Set(["femur"]))).ok).toBe(true));
test("fails on unknown sid", async () => expectError(await checkModelMapping(await dir([{ sid: "femurr" }]), new Set(["femur"])), /unknown structure id femurr/));
test("fails on missing extras key", async () => expectError(await checkModelMapping(await dir([{ sid: "femur", side: undefined }]), new Set(["femur"])), /missing side/));
test("fails on manifest file that does not exist", async () => expectError(await checkModelMapping(dirWithMissingFile(), new Set()), /not found/));
test("fails on unknown license", async () => expectError(await checkModelMapping(await dirWithLicense("CC-BY-NC-4.0"), new Set(["femur"])), /license/));

test("fails when a mesh source differs from its file's source", async () =>
  expectError(await checkModelMapping(await dir([{ source: "z-anatomy" }]), new Set(["femur"])), /source z-anatomy/));

test("fails on a glb that cannot be read", async () => {
  const d = makeDir([entry()]);
  writeFileSync(join(d, "test.glb"), "not a glb");
  expectError(await checkModelMapping(d, new Set(["femur"])), /cannot read glb/);
});

test("modelStats counts mesh nodes, triangles and bytes", async () => {
  const d = await dir([{}, { sid: "tibia" }]);
  const stats = await modelStats(join(d, "test.glb"));
  expect(stats.meshes).toBe(2);
  expect(stats.triangles).toBe(2);
  expect(stats.bytes).toBeGreaterThan(0);
});

test("a midline mesh has an empty side and passes", async () =>
  expect((await checkModelMapping(await dir([{ sid: "femur", side: "" }]), new Set(["femur"]))).ok).toBe(true));
test("fails on a side that is not l, r or empty", async () =>
  expectError(await checkModelMapping(await dir([{ side: "left" }]), new Set(["femur"])), /side must be/));
