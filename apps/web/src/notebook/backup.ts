import { NOTE_MAX, type NotebookEntry } from "./types";

// A backup is input from outside, so it is read very strictly.
export const BACKUP_MAX_BYTES = 1_000_000;

export type BackupFile = { format: "anatome-notebook"; version: 1; exportedAt: string; entries: NotebookEntry[] };
export type ParseResult =
  | { ok: true; entries: NotebookEntry[] }
  | { ok: false; reason: "too-large" | "not-json" | "wrong-format" | "newer-version" | "bad-entry" };

const two = (n: number) => String(n).padStart(2, "0");

export function backupFileName(now: Date): string {
  return `anatome-notebook-${now.getFullYear()}-${two(now.getMonth() + 1)}-${two(now.getDate())}.json`;
}

export function toBackup(entries: NotebookEntry[], now: Date): string {
  const file: BackupFile = { format: "anatome-notebook", version: 1, exportedAt: now.toISOString(), entries };
  return JSON.stringify(file, null, 2);
}

const isObject = (v: unknown): v is Record<string, unknown> => typeof v === "object" && v !== null && !Array.isArray(v);
const isText = (v: unknown): v is string => typeof v === "string" && v.length > 0;
const isNum = (v: unknown): v is number => typeof v === "number" && Number.isFinite(v);

// Rebuilds the pick with only its known fields, or gives null.
function readPick(v: unknown): NotebookEntry["pick"] | null {
  if (!isObject(v) || !isText(v.id)) return null;
  if (v.kind === "movement") return { kind: "movement", id: v.id };
  if (v.kind === "exercise" && isText(v.phase)) return { kind: "exercise", id: v.id, phase: v.phase };
  return null;
}

// Builds a fresh entry with exactly the known fields, or gives null.
function readEntry(v: unknown): NotebookEntry | null {
  if (!isObject(v)) return null;
  const { id, createdAt, date, pose, feeling, side, note } = v;
  const pick = readPick(v.pick);
  if (!isText(id) || !isNum(createdAt) || typeof date !== "string" || !/^\d{4}-\d{2}-\d{2}$/.test(date)) return null;
  if (!pick || !isObject(pose) || !Object.values(pose).every(isNum)) return null;
  if (feeling !== "painful" && feeling !== "fine") return null;
  if (side !== "l" && side !== "r" && side !== "both") return null;
  if (typeof note !== "string" || note.length > NOTE_MAX) return null;
  // fromEntries makes plain keys, so a key named __proto__ cannot change the prototype.
  return { id, createdAt, date, pick, pose: Object.fromEntries(Object.entries(pose) as [string, number][]), feeling, side, note };
}

export function parseBackup(text: string): ParseResult {
  if (text.length > BACKUP_MAX_BYTES) return { ok: false, reason: "too-large" };
  let data: unknown;
  try {
    data = JSON.parse(text);
  } catch {
    return { ok: false, reason: "not-json" };
  }
  if (!isObject(data) || data.format !== "anatome-notebook" || !Array.isArray(data.entries) || typeof data.exportedAt !== "string") {
    return { ok: false, reason: "wrong-format" };
  }
  if (isNum(data.version) && data.version > 1) return { ok: false, reason: "newer-version" };
  if (data.version !== 1) return { ok: false, reason: "wrong-format" };
  const entries: NotebookEntry[] = [];
  const seen = new Set<string>();
  for (const raw of data.entries) {
    const entry = readEntry(raw);
    if (!entry || seen.has(entry.id)) return { ok: false, reason: "bad-entry" };
    seen.add(entry.id);
    entries.push(entry);
  }
  return { ok: true, entries };
}

export function mergeEntries(existing: NotebookEntry[], incoming: NotebookEntry[]): { toAdd: NotebookEntry[]; skipped: number } {
  const have = new Set(existing.map((e) => e.id));
  const toAdd = incoming.filter((e) => !have.has(e.id));
  return { toAdd, skipped: incoming.length - toAdd.length };
}
