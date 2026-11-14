import { expect, test } from "vitest";
import de from "../i18n/de.json";
import en from "../i18n/en.json";

// The owner's word rule for notebook and summary text. The disclaimer and the load errors may name what they rule out.
const banned = /diagnos|injur|damag|treat|cure|caus|you have|assess|monitor|detect|track|symptom|patient|likel|risk|source of|relie|recover|rehab|heal/i;

// The same rule for the German texts, with German word stems. "Physiotherapeut" would match "therap",
// so these texts say "Physio". The stems after "therap" follow the English rule: symptom, patient,
// risk (Risiko), rehab and recover (erholen, genesen). "erhol" also matches "wiederholen",
// so a text with that word needs another one.
const bannedGerman = /diagnos|verletz|schädig|schaedig|behand|heil|ursach|therap|symptom|patient|risik|rehab|erhol|genes/i;

// The keys the word rule covers, in both languages.
const ruled = (key: string) =>
  (key.startsWith("notebook.") || key.startsWith("summary.")) &&
  key !== "notebook.disclaimer" &&
  !key.startsWith("notebook.loadError.");

test("notebook text stays clear of diagnostic words", () => {
  const bad = Object.entries(en).filter(([key, text]) => ruled(key) && banned.test(text));
  expect(bad).toEqual([]);
});

test("German notebook text stays clear of diagnostic words", () => {
  const bad = Object.entries(de).filter(([key, text]) => ruled(key) && bannedGerman.test(text));
  expect(bad).toEqual([]);
});

test("the word rule has notebook text to check", () => {
  expect(Object.keys(en).filter((key) => key.startsWith("notebook.")).length).toBeGreaterThan(10);
  expect(Object.keys(de).filter((key) => key.startsWith("notebook.")).length).toBeGreaterThan(10);
});
