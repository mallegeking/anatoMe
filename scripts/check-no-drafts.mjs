// Fails when the normal bundle holds anything that no person has checked.
// Run after the build. The build always recompiles in normal mode first, so this also
// catches a review bundle left behind in apps/web/public/data.

import { readFileSync } from "node:fs";

const file = "apps/web/public/data/hip.json";
const text = readFileSync(file, "utf8");
const bundle = JSON.parse(text);
const problems = [];

if (bundle.mode !== "normal") problems.push(`mode is ${bundle.mode}, expected normal`);
if (text.includes("review_note")) problems.push("the file contains review_note");
for (const kind of ["actions", "attachments"]) {
  const drafts = (bundle[kind] ?? []).filter((row) => row.draft === true);
  if (drafts.length > 0) problems.push(`${drafts.length} draft row(s) in ${kind}: ${drafts.map((r) => r.id).join(", ")}`);
}

if (problems.length > 0) {
  for (const p of problems) console.error(`${file}: ${p}`);
  process.exit(1);
}
console.log(`${file} has no drafts`);
