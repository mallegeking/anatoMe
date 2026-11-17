// A coverage report for one region: which structures have action and attachment rows,
// and how many of those rows a physio or the owner has checked already.
// It only reads the YAML files. Run validate first, this does not check the data.

import { existsSync, readdirSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { parse } from "yaml";

export type StructureCoverage = {
  id: string; type: string; english: string;
  actions: { movement: string; load: string; checked: boolean }[];
  origins: number; insertions: number;       // attachment rows, muscles only
};
export type Coverage = {
  structures: StructureCoverage[];
  totals: { actions: number; actionsChecked: number; attachments: number; attachmentsChecked: number; exercises: number; exercisesChecked: number };
};

type Row = Record<string, any>;

// All rows of every .yaml file in a subfolder. A missing folder gives no rows.
function readFolder(dir: string, sub: string): Row[] {
  const full = join(dir, sub);
  if (!existsSync(full)) return [];
  return readdirSync(full)
    .filter((f) => f.endsWith(".yaml"))
    .sort()
    .flatMap((f) => (parse(readFileSync(join(full, f), "utf8")) as Row[] | null) ?? []);
}

// The optional exercises file. A missing file means no exercises.
function readExercises(dir: string): Row[] {
  const full = join(dir, "exercises.yaml");
  return existsSync(full) ? ((parse(readFileSync(full, "utf8")) as Row[] | null) ?? []) : [];
}

export function coverage(dataDir: string, region: string): Coverage {
  const rows = readFolder(dataDir, "structures").filter((s) => s.region === region);
  const structures: StructureCoverage[] = rows.map((s) => ({
    id: s.id, type: s.type, english: s.english, actions: [], origins: 0, insertions: 0,
  }));
  const byId = new Map(structures.map((s) => [s.id, s]));

  let actions = 0, actionsChecked = 0, attachments = 0, attachmentsChecked = 0;
  for (const a of readFolder(dataDir, "actions")) {
    const s = byId.get(a.structure);
    if (!s) continue;
    const checked = a.checked_by !== null && a.checked_by !== undefined;
    s.actions.push({ movement: a.movement, load: a.load, checked });
    actions++;
    if (checked) actionsChecked++;
  }
  for (const a of readFolder(dataDir, "attachments")) {
    const s = byId.get(a.muscle);
    if (!s) continue;
    if (a.end === "origin") s.origins++;
    else if (a.end === "insertion") s.insertions++;
    attachments++;
    if (a.checked_by !== null && a.checked_by !== undefined) attachmentsChecked++;
  }
  const exercises = readExercises(dataDir).filter((e) => Array.isArray(e.regions) && e.regions.includes(region));
  const exercisesChecked = exercises.filter((e) => e.checked_by !== null && e.checked_by !== undefined).length;

  return { structures, totals: { actions, actionsChecked, attachments, attachmentsChecked, exercises: exercises.length, exercisesChecked } };
}

const LIGAMENT_LIKE = new Set(["ligament", "capsule", "labrum", "bursa", "meniscus", "fascia"]);

function list(items: string[]): string {
  return items.length === 0 ? "None.\n" : items.map((i) => `- ${i}`).join("\n") + "\n";
}

// The report as Markdown, ready to read in a terminal or paste into a note.
export function formatReport(c: Coverage): string {
  const t = c.totals;
  const out: string[] = [];
  out.push(
    `Totals: ${t.actionsChecked} of ${t.actions} action rows checked, ` +
      `${t.attachmentsChecked} of ${t.attachments} attachment rows checked, ` +
      `${t.exercisesChecked} of ${t.exercises} exercises checked.\n`,
  );

  const muscles = c.structures.filter((s) => s.type === "muscle");
  out.push("## Muscles with no action row\n");
  out.push(list(muscles.filter((s) => s.actions.length === 0).map((s) => s.english)));

  out.push("## Muscles without an origin or without an insertion row\n");
  out.push(
    list(
      muscles
        .filter((s) => s.origins === 0 || s.insertions === 0)
        .map((s) => `${s.english} (${s.origins === 0 ? "no origin" : ""}${s.origins === 0 && s.insertions === 0 ? ", " : ""}${s.insertions === 0 ? "no insertion" : ""})`),
    ),
  );

  out.push("## Ligaments, capsule, labrum, bursae, menisci and fascia with no action row\n");
  out.push(list(c.structures.filter((s) => LIGAMENT_LIKE.has(s.type) && s.actions.length === 0).map((s) => s.english)));

  out.push("## Every structure\n");
  out.push("| Structure | Type | Action rows | Origins | Insertions |");
  out.push("| --- | --- | --- | --- | --- |");
  for (const s of c.structures) {
    const rows = s.actions.map((a) => `${a.movement} (${a.load}, ${a.checked ? "checked" : "waiting"})`).join(", ");
    const ends = s.type === "muscle" ? [String(s.origins), String(s.insertions)] : ["", ""];
    out.push(`| ${s.english} | ${s.type} | ${rows} | ${ends[0]} | ${ends[1]} |`);
  }
  return out.join("\n") + "\n";
}
