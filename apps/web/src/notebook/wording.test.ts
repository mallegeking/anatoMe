import { expect, test } from "vitest";
import en from "../i18n/en.json";

// The owner's word rule for notebook and summary text. The disclaimer and the load errors may name what they rule out.
const banned = /diagnos|injur|damag|treat|cure|caus|you have|assess|monitor|detect|track|symptom|patient|likel|risk|source of|relie|recover|rehab|heal/i;

test("notebook text stays clear of diagnostic words", () => {
  const bad = Object.entries(en).filter(
    ([key, text]) =>
      (key.startsWith("notebook.") || key.startsWith("summary.")) &&
      key !== "notebook.disclaimer" &&
      !key.startsWith("notebook.loadError.") &&
      banned.test(text),
  );
  expect(bad).toEqual([]);
});

test("the word rule has notebook text to check", () => {
  expect(Object.keys(en).filter((key) => key.startsWith("notebook.")).length).toBeGreaterThan(10);
});
