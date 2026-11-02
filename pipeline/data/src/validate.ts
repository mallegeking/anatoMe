// Checks the knowledge base in data/.
// Ajv checks the shape of each file against data/schema. Plain code below checks
// what a schema cannot: ids that point to other files, and the anatomy rules.

import { existsSync, readdirSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { fileURLToPath } from "node:url";
import { Ajv, type ErrorObject, type ValidateFunction } from "ajv";
import { parse } from "yaml";

export type ValidationError = { file: string; path: string; message: string };
export type ValidationResult = { ok: boolean; errors: ValidationError[] };

// The schemas live next to the real data, also when we check a test fixture.
const SCHEMA_DIR = fileURLToPath(new URL("../../../data/schema/", import.meta.url));

type Kind = "joints" | "movements" | "structures" | "actions" | "citations";

type Joint = { id: string; dofs: { id: string }[] };
type Movement = { id: string; dof: string };
type Structure = { id: string; type: string };
type Citation = { id: string };
type Action = {
  id: string;
  structure: string;
  movement: string;
  load: "working" | "stretched" | "pinched";
  role?: string;
  when?: { angle: string; min: number; max: number }[];
  citations: { ref: string }[];
};

// Which load types each structure type may have. Bones and joints never appear in actions.
const ALLOWED_LOADS: Record<string, string[]> = {
  muscle: ["working", "stretched", "pinched"],
  tendon: ["working", "stretched", "pinched"],
  ligament: ["stretched", "pinched"],
  capsule: ["stretched", "pinched"],
  labrum: ["stretched", "pinched"],
  bursa: ["stretched", "pinched"],
  nerve: ["stretched", "pinched"],
};

// One rows file after loading. rows is empty when the file could not be read or failed the schema.
type Loaded<T> = { file: string; rows: T[] };

export function validateDataDir(dir: string): ValidationResult {
  const errors: ValidationError[] = [];
  const validators = compileSchemas();

  const load = <T>(kind: Kind, file: string): Loaded<T> => {
    const rows = readYaml(dir, file, errors);
    if (rows === undefined) return { file, rows: [] };
    const validate = validators[kind];
    if (!validate(rows)) {
      for (const e of validate.errors ?? []) errors.push({ file, path: e.instancePath, message: friendly(e) });
      return { file, rows: [] };
    }
    return { file, rows: rows as T[] };
  };

  const joints = load<Joint>("joints", "joints.yaml");
  const movements = load<Movement>("movements", "movements.yaml");
  const citations = load<Citation>("citations", "citations.yaml");
  const structures = listYaml(dir, "structures").map((f) => load<Structure>("structures", f));
  const actions = listYaml(dir, "actions").map((f) => load<Action>("actions", f));

  // Ids must be unique within each kind, across all files of that kind.
  checkUnique([joints], errors);
  checkUnique([movements], errors);
  checkUnique([citations], errors);
  checkUnique(structures, errors);
  checkUnique(actions, errors);

  const angles = new Set(joints.rows.flatMap((j) => j.dofs.map((d) => `${j.id}.${d.id}`)));
  for (const [i, m] of movements.rows.entries()) {
    if (!angles.has(m.dof)) errors.push({ file: movements.file, path: `/${i}/dof`, message: `unknown dof ${m.dof}` });
  }

  const structureById = new Map(structures.flatMap((s) => s.rows).map((s) => [s.id, s]));
  const movementIds = new Set(movements.rows.map((m) => m.id));
  const citationIds = new Set(citations.rows.map((c) => c.id));

  for (const { file, rows } of actions) {
    for (const [i, a] of rows.entries()) {
      const at = (rest = "") => `/${i}${rest}`;
      const structure = structureById.get(a.structure);
      if (!structure) {
        errors.push({ file, path: at("/structure"), message: `unknown structure ${a.structure}` });
      } else {
        const allowed = ALLOWED_LOADS[structure.type];
        if (!allowed) {
          errors.push({ file, path: at("/structure"), message: `type ${structure.type} cannot appear in actions` });
        } else if (!allowed.includes(a.load)) {
          errors.push({ file, path: at("/load"), message: `load must be ${allowed.join(" or ")} for type ${structure.type}` });
        }
      }
      if (!movementIds.has(a.movement)) {
        errors.push({ file, path: at("/movement"), message: `unknown movement ${a.movement}` });
      }
      if (a.load === "working" && a.role === undefined) {
        errors.push({ file, path: at(), message: "role is required when load is working" });
      }
      if (a.load !== "working" && a.role !== undefined) {
        errors.push({ file, path: at("/role"), message: "role is only used when load is working" });
      }
      for (const [j, w] of (a.when ?? []).entries()) {
        if (!angles.has(w.angle)) errors.push({ file, path: at(`/when/${j}/angle`), message: `unknown angle ${w.angle}` });
        if (!(w.min < w.max)) errors.push({ file, path: at(`/when/${j}`), message: "min must be less than max" });
      }
      for (const [j, c] of a.citations.entries()) {
        if (!citationIds.has(c.ref)) errors.push({ file, path: at(`/citations/${j}/ref`), message: `unknown citation ${c.ref}` });
      }
    }
  }

  return { ok: errors.length === 0, errors };
}

// The ids of every structure in dir/structures, for the model check.
// Returns an empty set when a file cannot be read, validateDataDir reports why.
// What the mesh check needs to know about each structure.
export type StructureInfo = { type: string; english: string };

// Reads data/structures into a map from structure id to its type and english name.
export function loadStructures(dir: string): Map<string, StructureInfo> {
  const structures = new Map<string, StructureInfo>();
  for (const file of listYaml(dir, "structures")) {
    const rows = readYaml(dir, file, []);
    if (!Array.isArray(rows)) continue;
    for (const r of rows) {
      if (r && typeof r.id === "string") structures.set(r.id, { type: String(r.type), english: String(r.english) });
    }
  }
  return structures;
}

function compileSchemas(): Record<Kind, ValidateFunction> {
  // allErrors so one run shows every problem, allowUnionTypes for checked_by (string or null).
  const ajv = new Ajv({ allErrors: true, allowUnionTypes: true });
  const kinds: Kind[] = ["joints", "movements", "structures", "actions", "citations"];
  return Object.fromEntries(
    kinds.map((k) => [k, ajv.compile(JSON.parse(readFileSync(join(SCHEMA_DIR, `${k}.schema.json`), "utf8")))]),
  ) as Record<Kind, ValidateFunction>;
}

// Parses one YAML file. Returns undefined and records an error when it is missing or broken.
function readYaml(dir: string, file: string, errors: ValidationError[]): unknown {
  const full = join(dir, file);
  if (!existsSync(full)) {
    errors.push({ file, path: "", message: "file not found" });
    return undefined;
  }
  try {
    return parse(readFileSync(full, "utf8"));
  } catch (e) {
    errors.push({ file, path: "", message: `YAML error: ${(e as Error).message}` });
    return undefined;
  }
}

// The .yaml files in a subfolder, as paths relative to the data folder, sorted.
function listYaml(dir: string, sub: string): string[] {
  const full = join(dir, sub);
  if (!existsSync(full)) return [];
  return readdirSync(full)
    .filter((f) => f.endsWith(".yaml"))
    .sort()
    .map((f) => `${sub}/${f}`);
}

function checkUnique(files: Loaded<{ id: string }>[], errors: ValidationError[]) {
  const seen = new Set<string>();
  for (const { file, rows } of files) {
    for (const [i, r] of rows.entries()) {
      if (seen.has(r.id)) errors.push({ file, path: `/${i}/id`, message: `duplicate id ${r.id}` });
      seen.add(r.id);
    }
  }
}

// Turns an Ajv error into a sentence a data author can act on.
function friendly(e: ErrorObject): string {
  const last = e.instancePath.split("/").pop();
  if (last === "checked_by") return "checked_by must be null or the name of the person who checked the row";
  switch (e.keyword) {
    case "required":
      return `${(e.params as { missingProperty: string }).missingProperty} is required`;
    case "additionalProperties":
      return `unknown field ${(e.params as { additionalProperty: string }).additionalProperty}`;
    case "enum":
      return `must be one of ${(e.params as { allowedValues: unknown[] }).allowedValues.join(", ")}`;
    case "minItems":
      if (last === "citations") return "needs at least one citation";
      return `needs at least ${(e.params as { limit: number }).limit} item(s)`;
    default:
      return e.message ?? "invalid";
  }
}
