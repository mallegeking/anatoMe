// Records a review: sets checked_by and checked_on on rows of the YAML knowledge base.
// It edits the text line by line and never parses and re-dumps the YAML, so comments,
// blank lines, quoting and line ends stay exactly as they were.

import { existsSync, readFileSync, readdirSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { validateDataDir } from "./validate.ts";

export type MarkResult = { text: string; marked: string[]; already: string[] };
export type MarkRun = { ok: boolean; marked: string[]; already: string[]; missing: string[]; errors: string[] };

const LABEL = /^(owner|physio-[0-9]+)$/;
// Same pattern as checked_on in the schema.
const DATE = /^[0-9]{4}-(0[1-9]|1[0-2])-(0[1-9]|[12][0-9]|3[01])$/;
const ROW_START = /^- id: (.*?)\s*$/;
const UNCHECKED = /^ {2}checked_by: null\s*$/;

// Marks the rows with these ids in one YAML file's text. Ids not in this file are ignored here.
export function markInText(text: string, ids: string[], by: string, on: string): MarkResult {
  const wanted = new Set(ids);
  const lines = text.split("\n");
  const crlf = text.includes("\r\n");
  const marked: string[] = [];
  const already: string[] = [];
  const out: string[] = [];
  // The id of the row we are inside, when it is one we were asked to mark.
  let current: string | null = null;
  let done = false;

  lines.forEach((line, i) => {
    const start = ROW_START.exec(line);
    if (start) {
      current = wanted.has(start[1]) ? start[1] : null;
      done = false;
    }
    if (current !== null && !done) {
      if (UNCHECKED.test(line)) {
        const own = line.endsWith("\r") ? "\r" : "";
        const last = i === lines.length - 1;
        out.push(`  checked_by: ${by}${own || (last && crlf ? "\r" : "")}`, `  checked_on: ${on}${own}`);
        marked.push(current);
        done = true;
        return;
      }
      if (/^ {2}checked_by:/.test(line)) {
        already.push(current);
        done = true;
      }
    }
    out.push(line);
  });
  return { text: out.join("\n"), marked, already };
}

// The data files that hold reviewable rows.
function reviewFiles(dataDir: string): string[] {
  const files: string[] = [];
  for (const folder of ["actions", "attachments"]) {
    const dir = join(dataDir, folder);
    if (!existsSync(dir)) continue;
    for (const f of readdirSync(dir).sort()) if (f.endsWith(".yaml")) files.push(join(dir, f));
  }
  const exercises = join(dataDir, "exercises.yaml");
  if (existsSync(exercises)) files.push(exercises);
  return files;
}

// Writes only when every id was found, none was already checked and the data still validates.
export function markChecked(dataDir: string, ids: string[], by: string, on: string): MarkRun {
  const run: MarkRun = { ok: false, marked: [], already: [], missing: [], errors: [] };
  if (!LABEL.test(by)) run.errors.push(`--by must be owner or a physio label like physio-1, not "${by}"`);
  if (!DATE.test(on)) run.errors.push(`--on must be a date like 2026-11-20, not "${on}"`);
  if (run.errors.length > 0) return run;

  const olds = new Map<string, string>();
  const news = new Map<string, string>();
  for (const file of reviewFiles(dataDir)) {
    const old = readFileSync(file, "utf8");
    const result = markInText(old, ids, by, on);
    olds.set(file, old);
    news.set(file, result.text);
    run.marked.push(...result.marked);
    run.already.push(...result.already);
  }
  const seen = new Set([...run.marked, ...run.already]);
  run.missing = ids.filter((id) => !seen.has(id));
  if (run.missing.length > 0 || run.already.length > 0) return run;

  const write = (texts: Map<string, string>) => {
    for (const [file, text] of texts) writeFileSync(file, text);
  };
  write(news);
  const result = validateDataDir(dataDir);
  if (!result.ok) {
    write(olds);
    run.errors = result.errors.map((e) => `${e.file} ${e.path}: ${e.message}`);
    run.marked = [];
    return run;
  }
  run.ok = true;
  return run;
}
