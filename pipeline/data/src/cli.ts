// Command line entry for the data checks.
//   validate <dataDir>                  checks the YAML knowledge base
//   check-models <modelsDir> <dataDir>  checks mesh extras, licenses and the triangle budget
// Prints one "file path: message" line per problem and exits 1 when there is any.

import { join } from "node:path";
import { checkModelMapping, manifestFiles, modelStats } from "./checkModels.ts";
import { loadStructureIds, validateDataDir, type ValidationResult } from "./validate.ts";

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
    const ids = loadStructureIds(dataDir);
    const result = await checkModelMapping(modelsDir, ids);
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
    if (code === 0) console.log(`every mesh maps to one of ${ids.size} structures`);
    return code;
  }
  console.error("usage: cli.ts validate <dataDir> | check-models <modelsDir> <dataDir>");
  return 2;
}

process.exitCode = await main(process.argv.slice(2));
