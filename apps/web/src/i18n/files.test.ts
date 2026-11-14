import { expect, test } from "vitest";
import de from "./de.json";
import en from "./en.json";

// The set of placeholder names in a text, such as "label" in "{label} (left)", sorted.
const placeholders = (text: string) => [...new Set([...text.matchAll(/\{(\w+)\}/g)].map((m) => m[1]))].sort();

test("de.json has exactly the keys of en.json", () => expect(Object.keys(de).sort()).toEqual(Object.keys(en).sort()));

test("every German text keeps the placeholders of the English one", () => {
  const german: Record<string, string> = de;
  const differ = Object.entries(en).filter(([key, text]) => placeholders(german[key] ?? "").join() !== placeholders(text).join());
  expect(differ.map(([key]) => key)).toEqual([]);
});

test("no German text is empty", () => {
  expect(Object.entries(de).filter(([, text]) => text.trim() === "").map(([key]) => key)).toEqual([]);
});
