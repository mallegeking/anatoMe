import { expect, test } from "vitest";
import { BACKUP_MAX_BYTES, backupFileName, mergeEntries, parseBackup, toBackup } from "./backup";
import type { NotebookEntry } from "./types";

const a: NotebookEntry = {
  id: "a",
  createdAt: 1,
  date: "2026-11-13",
  pick: { kind: "movement", id: "hip-flexion" },
  pose: { "hip.flexion": 30 },
  feeling: "painful",
  side: "l",
  note: "after stairs",
};
const b: NotebookEntry = {
  id: "b",
  createdAt: 2,
  date: "2026-11-12",
  pick: { kind: "exercise", id: "squat", phase: "down" },
  pose: { "knee.flexion": 90, "hip.flexion": 80 },
  feeling: "fine",
  side: "both",
  note: "",
};
const now = new Date(2026, 10, 13, 9, 30);
const file = (over: Record<string, unknown> = {}, entries: unknown[] = [a, b]) =>
  JSON.stringify({ format: "anatome-notebook", version: 1, exportedAt: now.toISOString(), entries, ...over });
const bad = { ok: false, reason: "bad-entry" };

test("a backup reads back to the same entries", () => expect(parseBackup(toBackup([a, b], now))).toEqual({ ok: true, entries: [a, b] }));
test("text that is not JSON is refused", () => expect(parseBackup("<html>")).toEqual({ ok: false, reason: "not-json" }));
test("another JSON file is refused", () => expect(parseBackup('{"hello":1}')).toEqual({ ok: false, reason: "wrong-format" }));
test("a newer version is refused", () => expect(parseBackup(file({ version: 2 }))).toEqual({ ok: false, reason: "newer-version" }));
test("one bad entry refuses the whole file", () => expect(parseBackup(file({}, [a, { ...b, feeling: "awful" }]))).toEqual(bad));
test("a pose with a text value is a bad entry", () => expect(parseBackup(file({}, [{ ...a, pose: { "hip.flexion": "30" } }]))).toEqual(bad));
test("a note longer than 500 characters is a bad entry", () => expect(parseBackup(file({}, [{ ...a, note: "x".repeat(501) }]))).toEqual(bad));
test("a file over the size limit is refused before parsing", () =>
  expect(parseBackup(" ".repeat(BACKUP_MAX_BYTES + 1))).toEqual({ ok: false, reason: "too-large" }));
test("extra fields are dropped", () => {
  const r = parseBackup(file({ more: 1 }, [{ ...a, evil: "x", pick: { ...a.pick, evil: 1 } }]));
  expect(r).toEqual({ ok: true, entries: [a] });
});
test("merging skips ids that exist", () => expect(mergeEntries([a], [a, b])).toEqual({ toAdd: [b], skipped: 1 }));
test("the file name carries the local date", () => expect(backupFileName(new Date(2026, 10, 13))).toBe("anatome-notebook-2026-11-13.json"));

// Ruling R4: anything that is not exactly the format is refused.
const wrong = { ok: false, reason: "wrong-format" };
test("a top level array is refused", () => expect(parseBackup("[]")).toEqual(wrong));
test("a top level null is refused", () => expect(parseBackup("null")).toEqual(wrong));
test("entries that is not an array is refused", () => expect(parseBackup(file({ entries: {} }))).toEqual(wrong));
test("a missing exportedAt is refused", () => expect(parseBackup(file({ exportedAt: undefined }))).toEqual(wrong));
test("a version that is not exactly 1 is refused", () => {
  for (const v of ["1", 0, null, undefined]) expect(parseBackup(file({ version: v }))).toEqual(wrong);
});
test("an entry that is not an object is bad", () => expect(parseBackup(file({}, [null]))).toEqual(bad));
test("a pose that is null or an array is bad", () => {
  expect(parseBackup(file({}, [{ ...a, pose: null }]))).toEqual(bad);
  expect(parseBackup(file({}, [{ ...a, pose: [1] }]))).toEqual(bad);
});
test("a pick with an empty id or phase is bad", () => {
  expect(parseBackup(file({}, [{ ...a, pick: { kind: "movement", id: "" } }]))).toEqual(bad);
  expect(parseBackup(file({}, [{ ...b, pick: { kind: "exercise", id: "squat", phase: "" } }]))).toEqual(bad);
  expect(parseBackup(file({}, [{ ...b, pick: { kind: "exercise", id: "squat" } }]))).toEqual(bad);
});
test("a repeated id is bad", () => expect(parseBackup(file({}, [a, { ...b, id: "a" }]))).toEqual(bad));
test("a pose key named __proto__ stays a plain key", () => {
  const text = file({}, [a]).replace('"hip.flexion":30', '"__proto__":30');
  const r = parseBackup(text);
  expect(r.ok && Object.getPrototypeOf(r.entries[0].pose)).toBe(Object.prototype);
});

// Review Focus 5: a backup made in one language must load in the other. The file holds ids and the
// format fields only, so nothing in it, and nothing in its name, depends on the language shown.
test("the backup format has no language in it", () => {
  const data = JSON.parse(toBackup([a, b], now));
  expect(Object.keys(data).sort()).toEqual(["entries", "exportedAt", "format", "version"]);
  expect(data.entries).toEqual([a, b]);
  expect(Object.keys(data.entries[0]).sort()).toEqual(["createdAt", "date", "feeling", "id", "note", "pick", "pose", "side"]);
  expect(backupFileName(now)).toBe("anatome-notebook-2026-11-13.json");
});
