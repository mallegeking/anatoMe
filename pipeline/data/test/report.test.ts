import { appendFileSync, cpSync, mkdtempSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { fileURLToPath } from "node:url";
import { afterAll, expect, test } from "vitest";
import { coverage, formatReport } from "../src/report.ts";

const valid = fileURLToPath(new URL("./fixtures/valid", import.meta.url));

// A copy of the valid fixture that a test may add rows to, removed at the end.
const made: string[] = [];
afterAll(() => made.forEach((d) => rmSync(d, { recursive: true, force: true })));
function copyOfValid() {
  const d = mkdtempSync(join(tmpdir(), "anatome-report-"));
  made.push(d);
  cpSync(valid, d, { recursive: true });
  return d;
}

test("counts checked and waiting rows", () => {
  const c = coverage(valid, "hip");
  expect(c.totals).toEqual({ actions: 2, actionsChecked: 1, attachments: 2, attachmentsChecked: 1, exercises: 2, exercisesChecked: 1 });
  const gm = c.structures.find((s) => s.id === "gluteus-maximus")!;
  expect(gm.actions).toEqual([{ movement: "hip-extension", load: "working", checked: true }]);
  expect(gm.insertions).toBe(1);
  expect(gm.origins).toBe(0);
  const text = formatReport(c);
  expect(text).toContain("hip-extension (working, checked)");
  expect(text).toContain("hip-internal-rotation (stretched, waiting)");
});

test("a muscle with no action row is listed", () => {
  const d = copyOfValid();
  appendFileSync(join(d, "structures/hip.yaml"), "- {id: sartorius, type: muscle, english: Sartorius, region: hip, depth: 1}\n");
  const text = formatReport(coverage(d, "hip"));
  const section = text.split("Muscles with no action row")[1].split("\n## ")[0];
  expect(section).toContain("Sartorius");
  expect(section).not.toContain("Gluteus maximus");
});

test("a muscle with only an origin row is listed as incomplete", () => {
  const d = copyOfValid();
  appendFileSync(join(d, "structures/hip.yaml"), "- {id: iliacus, type: muscle, english: Iliacus, region: hip, depth: 1}\n");
  appendFileSync(
    join(d, "attachments/hip.yaml"),
    "- id: iliacus-origin-femur\n  muscle: iliacus\n  end: origin\n  bone: femur\n  landmark: test\n  citations:\n    - {ref: used-source, locator: page 3, says: A third short quote., says_kind: quote}\n  checked_by: null\n",
  );
  const c = coverage(d, "hip");
  expect(c.structures.find((s) => s.id === "iliacus")).toMatchObject({ origins: 1, insertions: 0 });
  const section = formatReport(c).split("Muscles without an origin or without an insertion row")[1].split("\n## ")[0];
  expect(section).toContain("Iliacus");
});

test("an unknown region has no structures", () => {
  expect(coverage(valid, "hips").structures).toEqual([]);
});
