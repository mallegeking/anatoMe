import { expect, test } from "vitest";
import { parse } from "yaml";
import { findReviewEdits, findReviewedRowChanges } from "../../../scripts/check-review-guard.mjs";

const diff = (lines: string[]) =>
  ["diff --git a/data/actions/hip.yaml b/data/actions/hip.yaml", "+++ b/data/actions/hip.yaml", "@@ -1,2 +1,3 @@", ...lines].join("\n");

test("a new row left unchecked passes", () => expect(findReviewEdits(diff(["+- id: new-row", "+  checked_by: null"]))).toEqual([]));
test("setting checked_by is caught", () => expect(findReviewEdits(diff(["-  checked_by: null", "+  checked_by: physio-1"]))).toHaveLength(1));
test("adding checked_on is caught", () => expect(findReviewEdits(diff(["+  checked_on: 2026-12-01"]))).toHaveLength(1));
test("removing a review is not an edit this guard cares about", () => expect(findReviewEdits(diff(["-  checked_by: physio-1", "+  checked_by: null"]))).toEqual([]));
test("the words inside a says text do not trigger it", () => expect(findReviewEdits(diff(['+      says: "the row has checked_by: owner in the text"']))).toEqual([]));

test("in a diff of two files the result names the file that sets checked_by", () => {
  const two = [
    "diff --git a/data/actions/hip.yaml b/data/actions/hip.yaml",
    "+++ b/data/actions/hip.yaml",
    "@@ -1,2 +1,3 @@",
    "+- id: new-row",
    "+  checked_by: null",
    "diff --git a/data/attachments/hip.yaml b/data/attachments/hip.yaml",
    "+++ b/data/attachments/hip.yaml",
    "@@ -1,2 +1,3 @@",
    "+  checked_by: owner",
  ].join("\n");
  const found = findReviewEdits(two);
  expect(found).toHaveLength(1);
  expect(found[0]).toContain("data/attachments/hip.yaml");
});

test("checked_by as the first key of a list item is caught", () => expect(findReviewEdits(diff(["+- checked_by: physio-1"]))).toHaveLength(1));
test("checked_on as the first key of an indented list item is caught", () => expect(findReviewEdits(diff(["+  - checked_on: 2026-12-01"]))).toHaveLength(1));
test("a quoted checked_by key is caught", () => expect(findReviewEdits(diff(['+  "checked_by": physio-1']))).toHaveLength(1));
test("a single-quoted checked_on key is caught", () => expect(findReviewEdits(diff(["+  'checked_on': 2026-12-01"]))).toHaveLength(1));
test("flow style with both keys counts as one offending line", () =>
  expect(findReviewEdits(diff(["+- {id: x, checked_by: physio-1, checked_on: 2026-12-01}"]))).toHaveLength(1));
test("flow style with only checked_by set is caught", () => expect(findReviewEdits(diff(["+- {id: x, checked_by: physio-1}"]))).toHaveLength(1));
test("null stays fine in quoted-key and flow forms", () => {
  expect(findReviewEdits(diff(['+  "checked_by": null']))).toEqual([]);
  expect(findReviewEdits(diff(["+- {id: x, checked_by: null}"]))).toEqual([]);
  expect(findReviewEdits(diff(["+- {id: x, 'checked_by': null, note: y}"]))).toEqual([]);
  expect(findReviewEdits(diff(["+- checked_by: null"]))).toEqual([]);
});

// The row check: a diff, the file at the base and the file at the head, run through both checks the way the CLI does.
const bothChecks = (diffLines: string[], base: string, head: string) => [
  ...findReviewEdits(diff(diffLines)),
  ...findReviewedRowChanges(parse(base), parse(head)),
];

test("a changed field on a row whose checked_by line is unchanged context is caught", () => {
  const base = "- id: row-a\n  says: old text\n  checked_by: physio-1\n";
  const head = "- id: row-a\n  says: new text\n  checked_by: physio-1\n";
  const found = bothChecks(["- id: row-a", "-  says: old text", "+  says: new text", "   checked_by: physio-1"], base, head);
  expect(found).toHaveLength(1);
  expect(found[0]).toContain("row-a");
});

test("a new row head inserted above an existing review is caught", () => {
  const base = "- id: row-a\n  says: x\n  checked_by: physio-1\n  checked_on: 2026-12-01\n";
  const head = "- id: row-a\n  says: x\n  checked_by: null\n- id: row-b\n  says: y\n  checked_by: physio-1\n  checked_on: 2026-12-01\n";
  const lines = [" - id: row-a", "   says: x", "+  checked_by: null", "+- id: row-b", "+  says: y", "   checked_by: physio-1", "   checked_on: 2026-12-01"];
  const found = bothChecks(lines, base, head);
  expect(found).toHaveLength(1);
  expect(found[0]).toContain("row-b");
});

test("checked_by with its value on the next added line is caught", () => {
  const base = "- id: row-a\n  says: x\n  checked_by: null\n";
  const head = "- id: row-a\n  says: x\n  checked_by:\n    physio-1\n";
  const found = bothChecks([" - id: row-a", "   says: x", "-  checked_by: null", "+  checked_by:", "+    physio-1"], base, head);
  expect(found).toHaveLength(1);
  expect(found[0]).toContain("row-a");
});

test("an unchanged checked row passes", () => {
  const base = "- id: row-a\n  says: x\n  checked_by: physio-1\n- id: row-b\n  says: old\n  checked_by: null\n";
  const head = "- id: row-a\n  says: x\n  checked_by: physio-1\n- id: row-b\n  says: new\n  checked_by: null\n";
  expect(bothChecks([" - id: row-b", "-  says: old", "+  says: new", "   checked_by: null"], base, head)).toEqual([]);
});

test("a checked row set back to null passes", () => {
  const base = "- id: row-a\n  says: x\n  checked_by: physio-1\n  checked_on: 2026-12-01\n";
  const head = "- id: row-a\n  says: x\n  checked_by: null\n";
  expect(bothChecks(["   says: x", "-  checked_by: physio-1", "-  checked_on: 2026-12-01", "+  checked_by: null"], base, head)).toEqual([]);
});

test("a new unchecked row passes", () => {
  const base = "- id: row-a\n  says: x\n  checked_by: physio-1\n";
  const head = "- id: row-a\n  says: x\n  checked_by: physio-1\n- id: row-b\n  says: y\n  checked_by: null\n";
  expect(bothChecks(["+- id: row-b", "+  says: y", "+  checked_by: null"], base, head)).toEqual([]);
});
