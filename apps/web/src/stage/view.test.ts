import { expect, test } from "vitest";
import { markersOf, viewOf } from "./view";

test.each([
  [[0, 0, 1], "front"],
  [[0, 0, -1], "back"],
  [[1, 0, 0], "left"],
  [[-1, 0, 0], "right"],
  [[0, 1, 0], "top"],
  [[0, -1, 0], "bottom"],
  [[0.3, 0.2, 0.93], "front"],
] as const)("viewOf(%j) is %s", (dir, name) => expect(viewOf(dir)).toBe(name));

test("a tie goes to front or back first, then left or right", () => {
  expect(viewOf([0.7071, 0, 0.7071])).toBe("front");
  expect(viewOf([0.7071, 0.7071, 0])).toBe("left");
});

test("a zero or broken direction is the front view", () => {
  expect(viewOf([0, 0, 0])).toBe("front");
  expect(viewOf([NaN, 0, 0])).toBe("front");
  expect(viewOf([Infinity, 0, 0])).toBe("front");
});

test("markers: from the front the body's right is on the screen's left", () => {
  expect(markersOf("front")).toEqual({ screenLeft: "r", screenRight: "l" });
  expect(markersOf("back")).toEqual({ screenLeft: "l", screenRight: "r" });
  expect(markersOf("left")).toBeNull();
  expect(markersOf("right")).toBeNull();
  expect(markersOf("top")).toBeNull();
  expect(markersOf("bottom")).toBeNull();
});
