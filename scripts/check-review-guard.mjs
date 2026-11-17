// Fails when a pull request records a review in data/. Only the project owner does that.
// Usage: node scripts/check-review-guard.mjs <base branch>, for example main.
// It runs two checks over every yaml file under data/:
// 1. The line check looks at the added lines of git diff origin/<base>...HEAD. A line is flagged when it
//    sets checked_by to anything but null, or when it adds a checked_on line, in block, list-item,
//    quoted-key or flow style. Text inside a quoted value does not match, because the key must start
//    the line or follow a brace or comma.
// 2. The row check reads each file at origin/<base> and at HEAD and compares the rows by id. A row at
//    HEAD whose checked_by is not null must be exactly the same as the row with the same id at the base.
//    This catches what the line check cannot see: a changed field under an unchanged checked_by line,
//    a new row that takes over an existing review, and a value written on the line after checked_by.

import { execFileSync } from "node:child_process";
import { isDeepStrictEqual } from "node:util";
import { pathToFileURL } from "node:url";
import { parse } from "yaml";

// The key may start the line, follow list dashes ("- key:"), be quoted, or follow "{" or ","
// in flow style. A comma or brace is needed before it, so words inside a quoted text do not match.
const KEY_START = String.raw`(?:^\+(?:\s*-)*\s*|[{,]\s*)`;
const SETS_CHECKED_BY = new RegExp(KEY_START + String.raw`["']?checked_by["']?\s*:\s*(?=\S)(?!null\s*(?:$|[,}#]))`);
const ADDS_CHECKED_ON = new RegExp(KEY_START + String.raw`["']?checked_on["']?\s*:`);

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

// Takes the parsed rows of one file at the base and at the head. Returns one problem for every head
// row with checked_by not null that is not deep-equal to the base row with the same id, so a new,
// changed or re-keyed row that carries a review. A head file that is not a list cannot be checked
// row by row, so that is a problem too. A missing base file counts as no rows.
export function findReviewedRowChanges(baseRows, headRows) {
  if (headRows == null) return [];
  if (!Array.isArray(headRows)) return ["(whole file): not a list of rows, so the review check cannot read it"];
  const base = new Map();
  for (const row of Array.isArray(baseRows) ? baseRows : []) {
    if (typeof row?.id === "string") base.set(row.id, row);
  }
  const found = [];
  headRows.forEach((row, index) => {
    if (row == null || typeof row !== "object" || row.checked_by == null) return;
    const id = typeof row.id === "string" ? row.id : `(row ${index + 1} without an id)`;
    const before = typeof row.id === "string" ? base.get(row.id) : undefined;
    if (!isDeepStrictEqual(before, row)) {
      found.push(`${id}: checked_by is set on a row that is new or changed since the base`);
    }
  });
  return found;
}

const git = (args) => execFileSync("git", args, { encoding: "utf8", maxBuffer: 256 * 1024 * 1024 });

// The file's text at a commit, or null when the file does not exist there.
function showFile(ref, path) {
  try {
    return execFileSync("git", ["show", `${ref}:${path}`], { encoding: "utf8", stdio: ["ignore", "pipe", "ignore"], maxBuffer: 256 * 1024 * 1024 });
  } catch {
    return null;
  }
}

// Runs only when started from the command line, so a test can import the functions.
if (import.meta.url === pathToFileURL(process.argv[1] ?? "").href) {
  const baseName = process.argv[2];
  if (!baseName) {
    console.error("Usage: node scripts/check-review-guard.mjs <base branch>");
    process.exit(2);
  }
  const baseRef = `origin/${baseName}`;
  const problems = findReviewEdits(git(["diff", `${baseRef}...HEAD`, "--", "data"]));

  const files = git(["ls-tree", "-r", "--name-only", "HEAD", "--", "data"])
    .split("\n")
    .filter((f) => /\.ya?ml$/.test(f));
  for (const file of files) {
    const baseText = showFile(baseRef, file);
    const headText = showFile("HEAD", file);
    const rows = findReviewedRowChanges(baseText == null ? [] : parse(baseText), headText == null ? [] : parse(headText));
    for (const p of rows) problems.push(`${file}: ${p}`);
  }

  if (problems.length > 0) {
    console.error("These changes record a review:");
    for (const p of problems) console.error(`  ${p}`);
    process.exit(1);
  }
  console.log(`No review recorded: ${files.length} data files checked against ${baseRef}.`);
}
