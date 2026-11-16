import { afterEach, expect, test, vi } from "vitest";
import { LANG_KEY, pickLanguage, readStoredLanguage, storeLanguage } from "./lang";

afterEach(() => vi.restoreAllMocks());

test("the stored choice wins", () => expect(pickLanguage("de", ["en-GB"])).toBe("de"));
test("without a stored choice the browser's first known language is taken", () => expect(pickLanguage(null, ["fr-FR", "de-AT", "en"])).toBe("de"));
test("an unknown stored value is ignored", () => expect(pickLanguage("xx", ["en-US"])).toBe("en"));
test("nothing known gives English", () => expect(pickLanguage(null, ["sn"])).toBe("en"));

test("reading survives a browser that blocks storage", () => {
  vi.spyOn(Storage.prototype, "getItem").mockImplementation(() => {
    throw new Error("blocked");
  });
  expect(readStoredLanguage()).toBeNull();
});

test("storing survives it too", () => {
  vi.spyOn(Storage.prototype, "setItem").mockImplementation(() => {
    throw new Error("blocked");
  });
  expect(() => storeLanguage("de")).not.toThrow();
});

test("a stored choice can be read back", () => {
  storeLanguage("de");
  expect(localStorage.getItem(LANG_KEY)).toBe("de");
  expect(readStoredLanguage()).toBe("de");
  localStorage.removeItem(LANG_KEY);
});
