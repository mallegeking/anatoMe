// Fails when the shipped build holds anything that no person has checked.
// Run after npm run build. It looks at every bundle in apps/web/dist/data, the folder that ships.
// A review bundle left behind cannot slip through, because the build recompiles in normal mode first.

import { existsSync, readdirSync, readFileSync } from "node:fs";
import { join } from "node:path";

const dir = "apps/web/dist/data";
const problems = [];
const files = existsSync(dir) ? readdirSync(dir).filter((f) => f.endsWith(".json")) : [];
if (files.length === 0) problems.push(`${dir} is missing or has no .json bundles`);

for (const f of files) {
  const text = readFileSync(join(dir, f), "utf8");
  let bundle;
  try {
    bundle = JSON.parse(text);
  } catch {
    problems.push(`${f}: not valid JSON`);
    continue;
  }
  if (bundle.mode !== "normal") problems.push(`${f}: mode is ${bundle.mode}, expected normal`);
  if (text.includes("review_note")) problems.push(`${f}: contains review_note`);
  for (const kind of ["actions", "attachments"]) {
    const drafts = (bundle[kind] ?? []).filter((row) => row.draft === true);
    if (drafts.length > 0) problems.push(`${f}: ${drafts.length} draft row(s) in ${kind}: ${drafts.map((r) => r.id).join(", ")}`);
  }
}

if (problems.length > 0) {
  for (const p of problems) console.error(p);
  process.exit(1);
}
console.log(`${dir}: ${files.length} bundle(s), no drafts`);
