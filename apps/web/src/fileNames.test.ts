import { expect, test } from "vitest";

// Every source file under src, as a path from src. Nothing is loaded, the paths are all we need.
const files = Object.keys(import.meta.glob("./**/*.{ts,tsx,json,css}"));

// A path without its ending, the way an import names it.
const stem = (file: string) => file.replace(/\.(tsx?|json|css)$/, "");

// Windows and macOS treat Summary and summary as one name, and imports leave the ending out.
// Two such files build on Linux and fail on those systems, so no two may differ only by capital letters.
test("no two source files differ only by capital letters", () => {
  expect(files.length).toBeGreaterThan(50);
  const byName = new Map<string, string[]>();
  for (const file of files) {
    const key = stem(file).toLowerCase();
    byName.set(key, [...(byName.get(key) ?? []), file]);
  }
  const clashes = [...byName.values()].filter((group) => new Set(group.map(stem)).size > 1);
  expect(clashes).toEqual([]);
});
