import { mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { Document, NodeIO } from "@gltf-transform/core";
import { KHRDracoMeshCompression } from "@gltf-transform/extensions";
import draco3d from "draco3dgltf";
import { afterAll, expect, test } from "vitest";
import { budgetFor, checkModelMapping, modelStats, type ValidationResult } from "../src/checkModels.ts";

type Extras = Record<string, unknown>;
const BASE: Extras = { sid: "femur", label: "Femur", side: "l", kind: "bone", source: "bp3d" };

// Writes a glb with one single-triangle mesh node per entry. An entry overrides the base
// extras, and a key set to undefined is left out. The triangle spans x from x to x + 1.
async function writeGlb(file: string, meshes: Extras[], x = 0) {
  const doc = new Document();
  const buffer = doc.createBuffer();
  const scene = doc.createScene();
  for (const overrides of meshes) {
    const position = doc
      .createAccessor()
      .setType("VEC3")
      .setArray(new Float32Array([x, 0, 0, x + 1, 0, 0, x, 1, 0]))
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
function makeDir(files: { path: string; source: string; license: string }[], region = "test") {
  const d = mkdtempSync(join(tmpdir(), "anatome-models-"));
  made.push(d);
  writeFileSync(join(d, "manifest.json"), JSON.stringify({ regions: { [region]: { files } } }));
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
const femur = new Map([["femur", { type: "bone", english: "Femur", midline: false, regions: ["test"] }]]);

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

test("modelStats reports the size of the model", async () => {
  const d = await dir([{}, { sid: "tibia" }]);
  const { size } = await modelStats(join(d, "test.glb"));
  expect(size).toHaveLength(3);
  // The test file is flat, so a side may be zero.
  for (const n of size) {
    expect(Number.isFinite(n)).toBe(true);
    expect(n).toBeGreaterThanOrEqual(0);
  }
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
  const sacrum = new Map([["sacrum", { type: "bone", english: "Sacrum", midline: true, regions: ["test"] }]]);
  expectError(await checkModelMapping(await dir([{ sid: "sacrum", label: "Sacrum", side: "l" }]), sacrum), /sacrum is marked midline but mesh .* has side l/);
});

test("a paired structure with an unsided mesh is an error", async () =>
  expectError(await checkModelMapping(await dir([{ sid: "femur", side: "" }]), femur), /femur is not marked midline but mesh .* has no side/));

test("a midline structure with an unsided mesh passes", async () => {
  const sacrum = new Map([["sacrum", { type: "bone", english: "Sacrum", midline: true, regions: ["test"] }]]);
  expect((await checkModelMapping(await dir([{ sid: "sacrum", label: "Sacrum", side: "" }]), sacrum)).ok).toBe(true);
});

// Structures in the data must have a mesh somewhere, the check works in both directions.
test("a structure that no mesh carries is an error", async () => {
  const two = new Map([
    ["femur", { type: "bone", english: "Femur", midline: false, regions: ["test"] }],
    ["sacrum", { type: "bone", english: "Sacrum", midline: true, regions: ["test"] }],
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

test("a mesh must sit in a region its structure belongs to", async () => {
  const d = makeDir([{ path: "test.glb", source: "bp3d", license: "CC-BY-4.0" }], "lower-leg");
  await writeGlb(join(d, "test.glb"), [{ sid: "femur" }]);
  const structures = new Map([["femur", { type: "bone", english: "Femur", midline: false, regions: ["hip"] }]]);
  const result = await checkModelMapping(d, structures);
  expect(result.ok).toBe(false);
  expect(result.errors).toEqual([
    { file: "test.glb", path: "(unnamed node)", message: "femur belongs to hip, not to lower-leg" },
  ]);
});
test("a mesh in an also_in region passes", async () => {
  const d = makeDir([{ path: "test.glb", source: "bp3d", license: "CC-BY-4.0" }], "lower-leg");
  await writeGlb(join(d, "test.glb"), [{ sid: "femur" }]);
  const structures = new Map([["femur", { type: "bone", english: "Femur", midline: false, regions: ["hip", "lower-leg"] }]]);
  expect((await checkModelMapping(d, structures)).ok).toBe(true);
});

// In BodyParts3D, and so in the model, left is x > 0.
test("a mesh with side l whose centre lies at x < 0 fails", async () => {
  const d = makeDir([entry()]);
  await writeGlb(join(d, "test.glb"), [{ sid: "femur", side: "l" }], -2);
  const result = await checkModelMapping(d, femur);
  expect(result.ok).toBe(false);
  expect(result.errors).toEqual([
    { file: "test.glb", path: "(unnamed node)", message: "femur has side l but lies on the right" },
  ]);
});
test("a mesh with side l whose centre lies at x > 0 passes", async () => {
  const d = makeDir([entry()]);
  await writeGlb(join(d, "test.glb"), [{ sid: "femur", side: "l" }], 2);
  const result = await checkModelMapping(d, femur);
  expect(result.errors).toEqual([]);
  expect(result.ok).toBe(true);
});
test("a mesh with side r whose centre lies at x > 0 fails", async () => {
  const d = makeDir([entry()]);
  await writeGlb(join(d, "test.glb"), [{ sid: "femur", side: "r" }], 2);
  const result = await checkModelMapping(d, femur);
  expect(result.ok).toBe(false);
  expect(result.errors).toEqual([
    { file: "test.glb", path: "(unnamed node)", message: "femur has side r but lies on the left" },
  ]);
});
test("a mesh with side r whose centre lies at x < 0 passes", async () => {
  const d = makeDir([entry()]);
  await writeGlb(join(d, "test.glb"), [{ sid: "femur", side: "r" }], -2);
  const result = await checkModelMapping(d, femur);
  expect(result.errors).toEqual([]);
  expect(result.ok).toBe(true);
});

// A models folder whose manifest lists several regions. Each file is a glb with one mesh per
// entry. A file entry is [path, meshes, x], x is where the triangle starts (default 2, so
// every left mesh lies on the left).
type FileSpec = [string, Extras[], number?];
async function multiDir(regions: Record<string, FileSpec[]>) {
  const d = mkdtempSync(join(tmpdir(), "anatome-models-"));
  made.push(d);
  const manifest: Record<string, { files: { path: string; source: string; license: string }[] }> = {};
  for (const [region, files] of Object.entries(regions)) {
    manifest[region] = { files: files.map(([path]) => ({ path, source: "bp3d", license: "CC-BY-4.0" })) };
    for (const [path, meshes, x] of files) await writeGlb(join(d, path), meshes, x ?? 2);
  }
  writeFileSync(join(d, "manifest.json"), JSON.stringify({ regions: manifest }));
  return d;
}
const bones = new Map([
  ["femur", { type: "bone", english: "Femur", midline: false, regions: ["hip"] }],
  ["tibia", { type: "bone", english: "Tibia", midline: false, regions: ["hip"] }],
  ["sacrum", { type: "bone", english: "Sacrum", midline: true, regions: ["hip"] }],
]);
const tibia = { sid: "tibia", label: "Tibia" };
const sacrum = { sid: "sacrum", label: "Sacrum", side: "" };

test("the whole body may draw a structure of any region", async () => {
  const d = await multiDir({ hip: [["hip.glb", [{ sid: "femur" }]]], body: [["body.glb", [{ sid: "femur" }]]] });
  const result = await checkModelMapping(d, new Map([bones.entries().next().value!]));
  expect(result.errors).toEqual([]);
  expect(result.ok).toBe(true);
});
test("a structure drawn twice in the whole body fails", async () => {
  const d = await multiDir({
    hip: [["hip.glb", [{ sid: "femur" }]]],
    body: [["a.glb", [{ sid: "femur" }]], ["b.glb", [{ sid: "femur" }]]],
  });
  expectError(await checkModelMapping(d, bones), /femur side l is drawn twice in the whole body/);
});
test("a structure a region draws but the whole body does not fails", async () => {
  const d = await multiDir({ hip: [["hip.glb", [{ sid: "femur" }, tibia]]], body: [["body.glb", [{ sid: "femur" }]]] });
  expectError(await checkModelMapping(d, bones), /tibia side l is in hip but not in the whole body/);
});
test("a structure the whole body draws but no region draws fails", async () => {
  const d = await multiDir({ hip: [["hip.glb", [{ sid: "femur" }]]], body: [["body.glb", [{ sid: "femur" }, tibia]]] });
  expectError(await checkModelMapping(d, bones), /tibia side l is in the whole body but in no region/);
});
test("a whole body mesh more than 10 mm from its region copy fails", async () => {
  const d = await multiDir({ hip: [["hip.glb", [{ sid: "femur" }]]], body: [["body.glb", [{ sid: "femur" }], 2.02]] });
  expectError(await checkModelMapping(d, bones), /femur side l lies 20\.0 mm from its copy in hip\.glb, more than 10 mm/);
});
test("a whole body mesh 5 mm from its region copy passes", async () => {
  const d = await multiDir({ hip: [["hip.glb", [{ sid: "femur" }]]], body: [["body.glb", [{ sid: "femur" }], 2.005]] });
  const result = await checkModelMapping(d, new Map([bones.entries().next().value!]));
  expect(result.errors).toEqual([]);
});
test("a midline structure is named midline in these messages", async () => {
  const d = await multiDir({
    hip: [["hip.glb", [sacrum]]],
    body: [["a.glb", [sacrum]], ["b.glb", [sacrum]]],
  });
  expectError(await checkModelMapping(d, bones), /sacrum side midline is drawn twice in the whole body/);
});
test("the body is compared with the first other region that has the structure, wherever body sits", async () => {
  const d = await multiDir({
    body: [["body.glb", [{ sid: "femur" }], 2.005]],
    hip: [["hip.glb", [{ sid: "femur" }]]],
    "lower-leg": [["lower-leg.glb", [{ sid: "femur" }], 2.5]],
  });
  const structures = new Map([["femur", { type: "bone", english: "Femur", midline: false, regions: ["hip", "lower-leg"] }]]);
  const result = await checkModelMapping(d, structures);
  expect(result.errors).toEqual([]);
});
test("budgetFor", () => {
  expect(budgetFor("body")).toBe(240_000);
  for (const r of ["hip", "lower-leg", "shoulder", "arm", "neck", "trunk"]) expect(budgetFor(r)).toBe(150_000);
});
