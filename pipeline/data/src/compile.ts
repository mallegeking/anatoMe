// Turns the YAML knowledge base into one JSON bundle per region for the app.
// The review gate lives here. In normal mode no row that is still unchecked gets through.

import { existsSync, readdirSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { parse } from "yaml";
import type {
  BundleAction,
  BundleAttachment,
  BundleCitation,
  BundleMovement,
  BundleStructure,
  RegionBundle,
} from "../../../apps/web/src/data/bundle.ts";

// Rows as they are written in the YAML files. validateDataDir has already checked them.
type StructureRow = BundleStructure & { region: string };
type ActionRow = Omit<BundleAction, "draft"> & { checked_by: string | null };
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
  const structures = readFolder<StructureRow>(dataDir, "structures").filter((s) => s.region === region);
  const inRegion = new Set(structures.map((s) => s.id));

  const pendingByStructure: Record<string, number> = {};
  const actions: BundleAction[] = [];
  for (const row of readFolder<ActionRow>(dataDir, "actions")) {
    if (!inRegion.has(row.structure)) continue;
    const draft = row.checked_by === null;
    if (draft) pendingByStructure[row.structure] = (pendingByStructure[row.structure] ?? 0) + 1;
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

  // Only sources that a kept row points to.
  const used = new Set([...actions, ...attachments].flatMap((r) => r.citations.map((c) => c.ref)));
  const citations = readRows<BundleCitation & { access: string }>(dataDir, "citations.yaml")
    .filter((c) => used.has(c.id))
    .map(({ id, title, authors, year, url, license }) => ({ id, title, authors, year, url, license }));

  const movements = readRows<BundleMovement>(dataDir, "movements.yaml").map(({ id, english, dof, direction }) => ({
    id, english, dof, direction,
  }));

  return {
    region,
    mode,
    structures: structures.map(({ id, type, english, latin, depth }) => ({ id, type, english, latin, depth })),
    movements,
    attachments,
    actions,
    citations,
    pendingByStructure,
  };
}
