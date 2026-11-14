import { mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { Document, NodeIO } from "@gltf-transform/core";
import { KHRDracoMeshCompression } from "@gltf-transform/extensions";
import draco3d from "draco3dgltf";
import { afterAll, expect, test } from "vitest";
import { checkModelMapping, modelStats, type ValidationResult } from "../src/checkModels.ts";

type Extras = Record<string, unknown>;
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

// The structures the checks know about, with the type and english name the meshes must match.
const femur = new Map([["femur", { type: "bone", english: "Femur", midline: false }]]);

function expectError(result: ValidationResult, pattern: RegExp) {
  expect(result.ok).toBe(false);
  const lines = result.errors.map((e) => `${e.file} ${e.path}: ${e.message}`);
  expect(lines.some((l) => pattern.test(l)), lines.join("\n")).toBe(true);
}

test("passes when every sid is known", async () => expect((await checkModelMapping(await dir([{ sid: "femur" }]), femur)).ok).toBe(true));
test("fails on unknown sid", async () => expectError(await checkModelMapping(await dir([{ sid: "femurr" }]), femur), /unknown structure id femurr/));
test("fails on missing extras key", async () => expectError(await checkModelMapping(await dir([{ sid: "femur", side: undefined }]), femur), /missing side/));
test("fails on manifest file that does not exist", async () => expectError(await checkModelMapping(dirWithMissingFile(), new Map()), /not found/));
test("fails on unknown license", async () => expectError(await checkModelMapping(await dirWithLicense("CC-BY-NC-4.0"), femur), /license/));

test("fails when a mesh source differs from its file's source", async () =>
  expectError(await checkModelMapping(await dir([{ source: "z-anatomy" }]), femur), /source z-anatomy/));

test("fails on a glb that cannot be read", async () => {
  const d = makeDir([entry()]);
  writeFileSync(join(d, "test.glb"), "not a glb");
  expectError(await checkModelMapping(d, femur), /cannot read glb/);
});

test("modelStats counts mesh nodes, triangles and bytes", async () => {
  const d = await dir([{}, { sid: "tibia" }]);
  const stats = await modelStats(join(d, "test.glb"));
  expect(stats.meshes).toBe(2);
  expect(stats.triangles).toBe(2);
  expect(stats.bytes).toBeGreaterThan(0);
});

test("fails on a side that is not l, r or empty", async () =>
  expectError(await checkModelMapping(await dir([{ side: "left" }]), femur), /side must be/));

test("fails on a sid that is not text", async () =>
  expectError(await checkModelMapping(await dir([{ sid: 7 }]), femur), /sid must be text/));

test("fails when a z-anatomy file is not CC-BY-SA-4.0", async () => {
  const d = makeDir([{ path: "test.glb", source: "z-anatomy", license: "CC-BY-4.0" }]);
  await writeGlb(join(d, "test.glb"), [{ source: "z-anatomy" }]);
  expectError(await checkModelMapping(d, femur), /z-anatomy files must be CC-BY-SA-4.0/);
});
test("fails when a bp3d file is not CC-BY-4.0", async () =>
  expectError(await checkModelMapping(await dirWithLicense("CC-BY-SA-4.0"), femur), /bp3d files must be CC-BY-4.0/));

test("fails when a mesh kind differs from the structure type", async () =>
  expectError(await checkModelMapping(await dir([{ kind: "muscle" }]), femur), /kind muscle but femur is a bone/));
test("fails when a mesh label differs from the structure name", async () =>
  expectError(await checkModelMapping(await dir([{ label: "Thigh bone" }]), femur), /label Thigh bone but femur is called Femur/));

test("a midline structure with a sided mesh is an error", async () => {
  const sacrum = new Map([["sacrum", { type: "bone", english: "Sacrum", midline: true }]]);
  expectError(await checkModelMapping(await dir([{ sid: "sacrum", label: "Sacrum", side: "l" }]), sacrum), /sacrum is marked midline but mesh .* has side l/);
});

test("a paired structure with an unsided mesh is an error", async () =>
  expectError(await checkModelMapping(await dir([{ sid: "femur", side: "" }]), femur), /femur is not marked midline but mesh .* has no side/));

test("a midline structure with an unsided mesh passes", async () => {
  const sacrum = new Map([["sacrum", { type: "bone", english: "Sacrum", midline: true }]]);
  expect((await checkModelMapping(await dir([{ sid: "sacrum", label: "Sacrum", side: "" }]), sacrum)).ok).toBe(true);
});

// Structures in the data must have a mesh somewhere, the check works in both directions.
test("a structure that no mesh carries is an error", async () => {
  const two = new Map([
    ["femur", { type: "bone", english: "Femur", midline: false }],
    ["sacrum", { type: "bone", english: "Sacrum", midline: true }],
  ]);
  expectError(await checkModelMapping(await dir([{ sid: "femur" }]), two), /structure sacrum has no mesh in any file/);
});

// Writes a Draco-compressed glb with one triangle mesh, the way the real model files are stored.
async function writeDracoGlb(file: string, extras: Extras) {
  const doc = new Document();
  const buffer = doc.createBuffer();
  const position = doc.createAccessor().setType("VEC3").setArray(new Float32Array([0, 0, 0, 1, 0, 0, 0, 1, 0])).setBuffer(buffer);
  const indices = doc.createAccessor().setType("SCALAR").setArray(new Uint16Array([0, 1, 2])).setBuffer(buffer);
  const mesh = doc.createMesh().addPrimitive(doc.createPrimitive().setAttribute("POSITION", position).setIndices(indices));
  doc.createScene().addChild(doc.createNode().setMesh(mesh).setExtras({ ...BASE, ...extras }));
  doc.createExtension(KHRDracoMeshCompression).setRequired(true).setEncoderOptions({ method: KHRDracoMeshCompression.EncoderMethod.EDGEBREAKER });
  const io = new NodeIO()
    .registerExtensions([KHRDracoMeshCompression])
    .registerDependencies({ "draco3d.encoder": await draco3d.createEncoderModule() });
  await io.write(file, doc);
}

test("the model check reads a Draco-compressed file", async () => {
  const d = makeDir([entry()]);
  await writeDracoGlb(join(d, "test.glb"), { sid: "femur" });
  // The file really is compressed, so a reader without the decoder cannot open it.
  expect(readFileSync(join(d, "test.glb")).includes("KHR_draco_mesh_compression")).toBe(true);
  const result = await checkModelMapping(d, femur);
  expect(result.errors).toEqual([]);
  expect(result.ok).toBe(true);
});
