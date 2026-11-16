// Turns the YAML knowledge base into one JSON bundle per region for the app.
// The review gate lives here. In normal mode no row that is still unchecked gets through.

import { existsSync, readdirSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { parse } from "yaml";
import type {
  BundleAction,
  BundleAttachment,
  BundleCitation,
  BundleExercise,
  BundleMovement,
  BundleStructure,
  RegionBundle,
} from "../../../apps/web/src/data/bundle.ts";

// Rows as they are written in the YAML files. validateDataDir has already checked them.
type StructureRow = Omit<BundleStructure, "paired"> & { region: string; also_in?: string[]; midline?: boolean };
type ActionRow = Omit<BundleAction, "draft"> & { checked_by: string | null };
type ExerciseRow = Omit<BundleExercise, "draft"> & { regions: string[]; checked_by: string | null };
type JointRow = { id: string; region: string };
type AttachmentRow = Omit<BundleAttachment, "draft"> & { checked_by: string | null };

function readRows<T>(dir: string, file: string): T[] {
  const full = join(dir, file);
  return existsSync(full) ? (parse(readFileSync(full, "utf8")) as T[]) : [];
}

// All rows from every .yaml file in a subfolder. A missing folder gives no rows.
function readFolder<T>(dir: string, sub: string): T[] {
  const full = join(dir, sub);
  if (!existsSync(full)) return [];
  return readdirSync(full)
    .filter((f) => f.endsWith(".yaml"))
    .sort()
    .flatMap((f) => readRows<T>(dir, `${sub}/${f}`));
}

// The region names that have structures, for the build-data command.
export function listRegions(dataDir: string): string[] {
  return [...new Set(readFolder<StructureRow>(dataDir, "structures").map((s) => s.region))].sort();
}

export function compileRegion(dataDir: string, region: string, mode: "normal" | "review"): RegionBundle {
  const review = mode === "review";
  const structures = readFolder<StructureRow>(dataDir, "structures").filter((s) => s.region === region || s.also_in?.includes(region));
  const inRegion = new Set(structures.map((s) => s.id));

  const pendingByStructure: Record<string, number> = {};
  const pendingByMovement: Record<string, number> = {};
  const actions: BundleAction[] = [];
  for (const row of readFolder<ActionRow>(dataDir, "actions")) {
    if (!inRegion.has(row.structure)) continue;
    const draft = row.checked_by === null;
    if (draft) {
      pendingByStructure[row.structure] = (pendingByStructure[row.structure] ?? 0) + 1;
      pendingByMovement[row.movement] = (pendingByMovement[row.movement] ?? 0) + 1;
    }
    if (draft && !review) continue;
    // Pick the fields one by one, so checked_by, checked_on and (in normal mode) review_note never leak.
    const { id, structure, movement, load, role, when, applies_to, confidence, citations, review_note } = row;
    actions.push({
      id, structure, movement, load, role, when, applies_to, confidence, citations, draft,
      ...(review && review_note !== undefined ? { review_note } : {}),
    });
  }

  const attachments: BundleAttachment[] = [];
  for (const row of readFolder<AttachmentRow>(dataDir, "attachments")) {
    if (!inRegion.has(row.muscle)) continue;
    const draft = row.checked_by === null;
    if (draft && !review) continue;
    const { id, muscle, end, bone, landmark, citations } = row;
    attachments.push({ id, muscle, end, bone, landmark, citations, draft });
  }

  let pendingExercises = 0;
  const exercises: BundleExercise[] = [];
  for (const row of readRows<ExerciseRow>(dataDir, "exercises.yaml")) {
    if (!row.regions.includes(region)) continue;
    const draft = row.checked_by === null;
    if (draft) pendingExercises++;
    if (draft && !review) continue;
    // Pick the fields one by one, so checked_by, checked_on and (in normal mode) review_note never leak.
    const { id, english, german, phases, citations, review_note } = row;
    exercises.push({
      id, english, ...(german !== undefined ? { german } : {}), phases, citations, draft,
      ...(review && review_note !== undefined ? { review_note } : {}),
    });
  }

  // Only sources that a kept row points to.
  const used = new Set([...actions, ...attachments, ...exercises].flatMap((r) => r.citations.map((c) => c.ref)));
  const citations = readRows<BundleCitation & { access: string }>(dataDir, "citations.yaml")
    .filter((c) => used.has(c.id))
    .map(({ id, title, authors, year, url, license }) => ({ id, title, authors, year, url, license }));

  // german goes in only when the row has one, like gap below. The app falls back to english.
  // A region gets only the movements of its own joints, the joint is the part of dof before the dot.
  const ownJoints = new Set(readRows<JointRow>(dataDir, "joints.yaml").filter((j) => j.region === region).map((j) => j.id));
  const movements = readRows<BundleMovement>(dataDir, "movements.yaml").filter((m) => ownJoints.has(m.dof.split(".")[0])).map(({ id, english, german, dof, direction }) => ({
    id, english, ...(german !== undefined ? { german } : {}), dof, direction,
  }));

  return {
    region,
    mode,
    // gap and german go in only when the row has them, so the other structures carry no empty field.
    structures: structures.map(({ id, type, english, german, latin, depth, midline, gap }) => ({
      id, type, english, ...(german !== undefined ? { german } : {}), latin, depth, paired: !midline, ...(gap !== undefined ? { gap } : {}),
    })),
    movements,
    attachments,
    actions,
    citations,
    pendingByStructure,
    exercises,
    pendingByMovement,
    pendingExercises,
  };
}
