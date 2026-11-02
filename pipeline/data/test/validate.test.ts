import { fileURLToPath } from "node:url";
import { expect, test } from "vitest";
import { validateDataDir, type ValidationResult } from "../src/validate.ts";

// Each case is a small data folder under test/fixtures.
const fx = (name: string) => fileURLToPath(new URL(`./fixtures/${name}`, import.meta.url));

// Passes when the folder fails validation with at least one message matching the pattern.
function expectError(dir: string, pattern: RegExp) {
  const result: ValidationResult = validateDataDir(dir);
  expect(result.ok).toBe(false);
  const lines = result.errors.map((e) => `${e.file} ${e.path}: ${e.message}`);
  expect(lines.some((l) => pattern.test(l)), lines.join("\n")).toBe(true);
}

test("valid fixture passes", () => expect(validateDataDir(fx("valid")).ok).toBe(true));
test("ligament cannot be working", () => expectError(fx("ligament-working"), /load must be stretched or pinched for type ligament/));
test("working row needs a role", () => expectError(fx("working-no-role"), /role is required when load is working/));
test("unknown angle in when", () => expectError(fx("bad-angle"), /unknown angle hip\.twist/));
test("min greater than max", () => expectError(fx("min-gt-max"), /min must be less than max/));
test("row without citations", () => expectError(fx("no-citations"), /at least one citation/));
test("citation must have says", () => expectError(fx("no-says"), /says is required/));
test("missing citation id", () => expectError(fx("missing-citation"), /unknown citation/));
test("missing structure id", () => expectError(fx("missing-structure"), /unknown structure/));
test("duplicate ids", () => expectError(fx("duplicate-id"), /duplicate id gluteus-maximus/));
test("checked_by must be null or a non-empty string", () => expectError(fx("checked-empty"), /checked_by/));

test("missing folder reports a missing file instead of throwing", () =>
  expectError(fx("does-not-exist"), /not found/));
