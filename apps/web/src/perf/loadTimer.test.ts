import { expect, test } from "vitest";
import { markInteractive } from "./loadTimer";

test("the first call stores a time and later calls return the same one", () => {
  const first = markInteractive();
  expect(first).toBeGreaterThan(0);
  expect(window.__anatomeInteractiveMs).toBe(first);
  expect(markInteractive()).toBe(first);
});
