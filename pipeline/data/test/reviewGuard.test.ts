import { expect, test } from "vitest";
import { findReviewEdits } from "../../../scripts/check-review-guard.mjs";

const diff = (lines: string[]) =>
  ["diff --git a/data/actions/hip.yaml b/data/actions/hip.yaml", "+++ b/data/actions/hip.yaml", "@@ -1,2 +1,3 @@", ...lines].join("\n");

test("a new row left unchecked passes", () => expect(findReviewEdits(diff(["+- id: new-row", "+  checked_by: null"]))).toEqual([]));
test("setting checked_by is caught", () => expect(findReviewEdits(diff(["-  checked_by: null", "+  checked_by: physio-1"]))).toHaveLength(1));
test("adding checked_on is caught", () => expect(findReviewEdits(diff(["+  checked_on: 2026-12-01"]))).toHaveLength(1));
test("removing a review is not an edit this guard cares about", () => expect(findReviewEdits(diff(["-  checked_by: physio-1", "+  checked_by: null"]))).toEqual([]));
test("the words inside a says text do not trigger it", () => expect(findReviewEdits(diff(['+      says: "the row has checked_by: owner in the text"']))).toEqual([]));
