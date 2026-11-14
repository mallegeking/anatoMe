// Fails when a diff of data/ records a review. Only the project owner does that.
// Usage: git diff origin/main...HEAD -- data | node scripts/check-review-guard.mjs
// It looks at added lines only. A line is flagged when it sets checked_by to anything but null,
// or when it adds a checked_on line. Text inside a quoted value never matches, because the
// match needs the key at the start of the line.

import { readFileSync } from "node:fs";
import { pathToFileURL } from "node:url";

const SETS_CHECKED_BY = /^\+\s*checked_by:\s*(?=\S)(?!null\s*$)/;
const ADDS_CHECKED_ON = /^\+\s*checked_on:/;

// Returns the offending added lines, each with the file it belongs to.
export function findReviewEdits(diff) {
  const found = [];
  let file = "(unknown file)";
  for (const line of diff.split("\n")) {
    if (line.startsWith("+++ ")) {
      file = line.slice(4).replace(/^b\//, "");
    } else if (SETS_CHECKED_BY.test(line) || ADDS_CHECKED_ON.test(line)) {
      found.push(`${file}: ${line}`);
    }
  }
  return found;
}

// Runs only when started from the command line, so a test can import the function.
if (import.meta.url === pathToFileURL(process.argv[1] ?? "").href) {
  const problems = findReviewEdits(readFileSync(0, "utf8"));
  if (problems.length > 0) {
    console.error("These added lines record a review:");
    for (const p of problems) console.error(`  ${p}`);
    process.exit(1);
  }
}
