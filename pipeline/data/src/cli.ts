// Command line entry for the data checks.
//   validate <dataDir>                  checks the YAML knowledge base
//   build-data <dataDir> <outDir> [--review]  validates, then writes <outDir>/<region>.json per region
//   check-models <modelsDir> <dataDir>  checks mesh extras, licenses and the triangle budget
// Prints one "file path: message" line per problem and exits 1 when there is any.

import { mkdirSync, readdirSync, rmSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { compileRegion, listRegions } from "./compile.ts";
import { checkModelMapping, manifestFiles, modelStats } from "./checkModels.ts";
import { loadStructures, validateDataDir, type ValidationResult } from "./validate.ts";

// The most triangles one region may have, so it stays smooth on a phone.
const TRIANGLE_BUDGET = 150_000;

function report(result: ValidationResult): number {
  for (const e of result.errors) console.error(`${e.file} ${e.path}: ${e.message}`);
  return result.ok ? 0 : 1;
}

async function main(args: string[]): Promise<number> {
  const [command, ...rest] = args;
  if (command === "validate" && rest.length === 1) {
    const code = report(validateDataDir(rest[0]));
    if (code === 0) console.log(`data in ${rest[0]} is valid`);
    return code;
  }
  if (command === "check-models" && rest.length === 2) {
    const [modelsDir, dataDir] = rest;
    const structures = loadStructures(dataDir);
    const result = await checkModelMapping(modelsDir, structures);
    if (!result.ok) return report(result);

    // Print size numbers per file and check the budget per region.
    const totals = new Map<string, number>();
    for (const f of manifestFiles(modelsDir)) {
      const s = await modelStats(join(modelsDir, f.path));
      console.log(`${f.path}: ${s.meshes} meshes, ${s.triangles} triangles, ${s.bytes} bytes`);
      totals.set(f.region, (totals.get(f.region) ?? 0) + s.triangles);
    }
    let code = 0;
    for (const [region, triangles] of totals) {
      const over = triangles > TRIANGLE_BUDGET;
      console.log(`region ${region}: ${triangles} triangles (budget ${TRIANGLE_BUDGET})${over ? " OVER BUDGET" : ""}`);
      if (over) code = 1;
    }
    if (code === 0) console.log(`every mesh maps to one of ${structures.size} structures`);
    return code;
  }
  if (command === "build-data") {
    const review = rest.includes("--review");
    const paths = rest.filter((a) => a !== "--review");
    if (paths.length === 2) {
      const [dataDir, outDir] = paths;
      const code = report(validateDataDir(dataDir));
      if (code !== 0) return code;
      mkdirSync(outDir, { recursive: true });
      // Clear old bundles first, so a stale file for another region (or an earlier review build) cannot ship.
      for (const f of readdirSync(outDir)) if (f.endsWith(".json")) rmSync(join(outDir, f));
      for (const region of listRegions(dataDir)) {
        const bundle = compileRegion(dataDir, region, review ? "review" : "normal");
        const text = JSON.stringify(bundle);
        writeFileSync(join(outDir, `${region}.json`), text);
        console.log(`${region}.json (${bundle.mode}): ${text.length} bytes, ${bundle.actions.length} actions, ${bundle.attachments.length} attachments`);
      }
      return 0;
    }
  }
  console.error("usage: cli.ts validate <dataDir> | build-data <dataDir> <outDir> [--review] | check-models <modelsDir> <dataDir>");
  return 2;
}

process.exitCode = await main(process.argv.slice(2));
