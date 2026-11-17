import { expect, test } from "vitest";
import { formatDate } from "./dates";

test("English and German", () => {
  expect(formatDate("2026-11-14", "en")).toBe("14 Nov 2026");
  expect(formatDate("2026-11-14", "de")).toBe("14.11.2026");
});

test("the day does not shift with the time zone", () => {
  expect(formatDate("2026-01-01", "en")).toBe("1 Jan 2026");
  expect(formatDate("2026-12-31", "de")).toBe("31.12.2026");
});

test("not a real day comes back as it is", () => {
  expect(formatDate("9999-99-99", "en")).toBe("9999-99-99");
  expect(formatDate("2026-02-30", "en")).toBe("2026-02-30");
  expect(formatDate("yesterday", "de")).toBe("yesterday");
  expect(formatDate("", "de")).toBe("");
});
