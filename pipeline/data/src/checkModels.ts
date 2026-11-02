// Checks that the meshes in models/ match the knowledge base.
// Every mesh node carries glTF extras (sid, label, side, kind, source). The sid must be a
// structure id from data/structures, and each file must be listed with a license we allow.

import { existsSync, statSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { NodeIO, type Document } from "@gltf-transform/core";
import { KHRDracoMeshCompression } from "@gltf-transform/extensions";
import draco3d from "draco3dgltf";
import type { ValidationError, ValidationResult } from "./validate.ts";

export type { ValidationResult };

export const EXTRAS_KEYS = ["sid", "label", "side", "kind", "source"] as const;

// Mesh licenses that fit the project (see the design spec, section 6). No non-commercial ones.
export const ALLOWED_LICENSES = new Set(["CC-BY-4.0", "CC-BY-SA-4.0"]);

type ManifestFile = { path: string; source: string; license: string };
type Manifest = { regions: Record<string, { files: ManifestFile[] }> };

let ioPromise: Promise<NodeIO> | undefined;

// One reader for all files. Draco needs its decoder loaded once.
function io(): Promise<NodeIO> {
  ioPromise ??= draco3d.createDecoderModule().then((decoder) =>
    new NodeIO().registerExtensions([KHRDracoMeshCompression]).registerDependencies({ "draco3d.decoder": decoder }),
  );
  return ioPromise;
}

// The manifest's files, each with the region it belongs to.
export function manifestFiles(modelsDir: string): (ManifestFile & { region: string })[] {
  const manifest = JSON.parse(readFileSync(join(modelsDir, "manifest.json"), "utf8")) as Manifest;
  return Object.entries(manifest.regions).flatMap(([region, r]) => r.files.map((f) => ({ ...f, region })));
}

export async function checkModelMapping(modelsDir: string, structureIds: Set<string>): Promise<ValidationResult> {
  const errors: ValidationError[] = [];
  let files: ReturnType<typeof manifestFiles>;
  try {
    files = manifestFiles(modelsDir);
  } catch (e) {
    errors.push({ file: "manifest.json", path: "", message: `cannot read manifest: ${(e as Error).message}` });
    return { ok: false, errors };
  }

  for (const f of files) {
    const at = `regions.${f.region}`;
    if (!ALLOWED_LICENSES.has(f.license)) {
      errors.push({ file: "manifest.json", path: at, message: `license ${f.license} of ${f.path} is not allowed` });
    }
    const full = join(modelsDir, f.path);
    if (!existsSync(full)) {
      errors.push({ file: "manifest.json", path: at, message: `${f.path} not found` });
      continue;
    }
    let doc: Document;
    try {
      doc = await (await io()).read(full);
    } catch (e) {
      errors.push({ file: f.path, path: "", message: `cannot read glb: ${(e as Error).message}` });
      continue;
    }
    for (const node of meshNodes(doc)) {
      const name = node.getName() || "(unnamed node)";
      const extras = node.getExtras() as Record<string, unknown>;
      for (const key of EXTRAS_KEYS) {
        // side is "" for a midline structure such as the sacrum, every other key needs text.
        const empty = key === "side" ? false : extras[key] === "";
        if (extras[key] === undefined || extras[key] === null || empty) {
          errors.push({ file: f.path, path: name, message: `missing ${key} in extras` });
        }
      }
      if (typeof extras.side === "string" && !["l", "r", ""].includes(extras.side)) {
        errors.push({ file: f.path, path: name, message: `side must be l, r or empty, not ${extras.side}` });
      }
      const sid = extras.sid;
      if (typeof sid === "string" && sid !== "" && !structureIds.has(sid)) {
        errors.push({ file: f.path, path: name, message: `unknown structure id ${sid}` });
      }
      // A mesh from another source would carry the wrong license, so the sources must agree.
      if (extras.source !== undefined && extras.source !== f.source) {
        errors.push({ file: f.path, path: name, message: `source ${String(extras.source)} but the manifest says ${f.source}` });
      }
    }
  }
  return { ok: errors.length === 0, errors };
}

export async function modelStats(file: string): Promise<{ meshes: number; triangles: number; bytes: number }> {
  const doc = await (await io()).read(file);
  let meshes = 0;
  let triangles = 0;
  for (const node of meshNodes(doc)) {
    meshes++;
    for (const prim of node.getMesh()!.listPrimitives()) {
      // Only triangle lists are expected (mode 4). Anything else would need its own count.
      if (prim.getMode() !== 4) throw new Error(`${file}: primitive mode ${prim.getMode()} is not a triangle list`);
      const indices = prim.getIndices();
      const count = indices ? indices.getCount() : (prim.getAttribute("POSITION")?.getCount() ?? 0);
      triangles += count / 3;
    }
  }
  return { meshes, triangles, bytes: statSync(file).size };
}

function meshNodes(doc: Document) {
  return doc.getRoot().listNodes().filter((n) => n.getMesh() !== null);
}
