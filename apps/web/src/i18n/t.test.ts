import { expect, test } from "vitest";
import { createT } from "./t";

test("fills variables", () => expect(createT({ a: "{x} y" })("a", { x: "1" })).toBe("1 y"));
test("missing key returns key", () => expect(createT({})("nope")).toBe("nope"));
test("a key missing in the language falls back to the fallback text", () => expect(createT({}, { a: "English {x}" })("a", { x: "1" })).toBe("English 1"));
