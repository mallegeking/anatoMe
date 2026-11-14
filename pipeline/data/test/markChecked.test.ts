import { cpSync, mkdtempSync, readFileSync, readdirSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { fileURLToPath } from "node:url";
import { afterEach, expect, test } from "vitest";
import { markChecked, markInText } from "../src/markChecked.ts";
import { validateDataDir } from "../src/validate.ts";

const text = [
  "# header comment",
  "",
  "- id: row-a",
  "  structure: piriformis",
  '  says: "a long quoted line, with a comma"',
  "  checked_by: null",
  "",
  "- id: row-b",
  "  checked_by: null",
  "  review_note: Check the angle",
  "",
].join("\n");

test("marks one row and adds the date under it", () => {
  const out = markInText(text, ["row-a"], "physio-1", "2026-11-20");
  expect(out.marked).toEqual(["row-a"]);
  expect(out.text).toContain("  checked_by: physio-1\n  checked_on: 2026-11-20\n\n- id: row-b\n  checked_by: null");
});
test("leaves every other line untouched", () => {
  const out = markInText(text, ["row-b"], "physio-1", "2026-11-20").text.split("\n");
  const before = text.split("\n");
  expect(out.filter((l: string) => !l.includes("checked_"))).toEqual(before.filter((l: string) => !l.includes("checked_")));
});
test("keeps Windows line ends", () =>
  expect(markInText(text.replaceAll("\n", "\r\n"), ["row-a"], "owner", "2026-11-20").text).toContain("  checked_by: owner\r\n  checked_on: 2026-11-20\r\n"));
test("a row that is checked already is reported and left alone", () => {
  const once = markInText(text, ["row-a"], "physio-1", "2026-11-20").text;
  const twice = markInText(once, ["row-a"], "physio-2", "2026-12-01");
  expect(twice.already).toEqual(["row-a"]);
  expect(twice.text).toBe(once);
});
test("an id that is the start of another id does not match it", () => {
  const t = "- id: row-a\n  checked_by: null\n- id: row-ab\n  checked_by: null\n";
  const out = markInText(t, ["row-a"], "physio-1", "2026-11-20");
  expect(out.text).toBe("- id: row-a\n  checked_by: physio-1\n  checked_on: 2026-11-20\n- id: row-ab\n  checked_by: null\n");
});

// markChecked works on a copy of the valid fixture, never on the real data folder.
const fixture = fileURLToPath(new URL("./fixtures/valid", import.meta.url));
const temps: string[] = [];
afterEach(() => {
  for (const d of temps.splice(0)) rmSync(d, { recursive: true, force: true });
});
function copyFixture(): string {
  const dir = mkdtempSync(join(tmpdir(), "mark-checked-"));
  temps.push(dir);
  cpSync(fixture, dir, { recursive: true });
  return dir;
}
function snapshot(dir: string): Record<string, string> {
  const out: Record<string, string> = {};
  for (const f of readdirSync(dir, { recursive: true, withFileTypes: true })) {
    if (f.isFile()) {
      const p = join(f.parentPath, f.name);
      out[p] = readFileSync(p, "utf8");
    }
  }
  return out;
}

test("a missing id changes no file", () => {
  const dir = copyFixture();
  const before = snapshot(dir);
  const run = markChecked(dir, ["piriformis-insertion-femur", "no-such-row"], "owner", "2026-11-20");
  expect(run.ok).toBe(false);
  expect(run.missing).toEqual(["no-such-row"]);
  expect(snapshot(dir)).toEqual(before);
});
test("an id that is checked already changes no file", () => {
  const dir = copyFixture();
  const before = snapshot(dir);
  const run = markChecked(dir, ["piriformis-insertion-femur", "gluteus-maximus-insertion-femur"], "owner", "2026-11-20");
  expect(run.ok).toBe(false);
  expect(run.already).toEqual(["gluteus-maximus-insertion-femur"]);
  expect(snapshot(dir)).toEqual(before);
});
test("an action row marked by the owner is refused and the files are restored", () => {
  const dir = copyFixture();
  const before = snapshot(dir);
  const run = markChecked(dir, ["piriformis-hip-internal-rotation"], "owner", "2026-11-20");
  expect(run.ok).toBe(false);
  expect(run.errors.join("\n")).toContain("action rows can only be checked by a physio");
  expect(snapshot(dir)).toEqual(before);
});
test("an attachment row can be marked by the owner", () => {
  const dir = copyFixture();
  const run = markChecked(dir, ["piriformis-insertion-femur"], "owner", "2026-11-20");
  expect(run.ok).toBe(true);
  expect(run.marked).toEqual(["piriformis-insertion-femur"]);
  expect(validateDataDir(dir).ok).toBe(true);
  expect(readFileSync(join(dir, "attachments/hip.yaml"), "utf8")).toContain("  checked_by: owner\n  checked_on: 2026-11-20");
});
test("an action row and an exercise row can be marked by a physio", () => {
  const dir = copyFixture();
  const run = markChecked(dir, ["piriformis-hip-internal-rotation", "goblet-squat"], "physio-1", "2026-11-20");
  expect(run.ok).toBe(true);
  expect(validateDataDir(dir).ok).toBe(true);
});
test("a bad label or date is refused", () => {
  const dir = copyFixture();
  const before = snapshot(dir);
  const bad = markChecked(dir, ["piriformis-insertion-femur"], "Dr Smith", "2026-11-20");
  expect(bad.ok).toBe(false);
  expect(bad.errors.length).toBeGreaterThan(0);
  const badDate = markChecked(dir, ["piriformis-insertion-femur"], "owner", "20-11-2026");
  expect(badDate.ok).toBe(false);
  expect(snapshot(dir)).toEqual(before);
});
