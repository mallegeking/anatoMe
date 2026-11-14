import { expect, test } from "vitest";
import type { Highlight } from "../movement/roles";
import { paintOf } from "./appearance";

const hi = new Map<string, Highlight>([["piriformis", "primary"]]);
const shownAll = () => true;

test("a highlighted, selected mesh carries both", () =>
  expect(paintOf({ sid: "piriformis", side: "l" }, { selection: { sid: "piriformis", side: "l" }, highlights: hi, isShown: shownAll })).toEqual({
    visible: true,
    highlight: "primary",
    selected: true,
  }));
test("the other side is highlighted but not selected", () =>
  expect(paintOf({ sid: "piriformis", side: "r" }, { selection: { sid: "piriformis", side: "l" }, highlights: hi, isShown: shownAll }).selected).toBe(false));
test("no highlights gives null", () =>
  expect(paintOf({ sid: "femur", side: "l" }, { selection: null, highlights: null, isShown: shownAll }).highlight).toBeNull());
