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

test("valid fixture with attachments passes", () => expect(validateDataDir(fx("valid")).ok).toBe(true));
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
test("checked_by set needs checked_on", () => expectError(fx("checked-no-date"), /checked_on is required when checked_by is set/));
test("checked_on must be a date", () => expectError(fx("bad-date"), /checked_on/));
test("citation needs says_kind", () => expectError(fx("no-says-kind"), /says_kind/));
test("capsule cannot be working", () => expectError(fx("capsule-working"), /load must be stretched or pinched for type capsule/));
test("bursa cannot be working", () => expectError(fx("bursa-working"), /load must be stretched or pinched for type bursa/));
test("bones cannot appear in actions", () => expectError(fx("bone-in-actions"), /type bone cannot appear in actions/));
test("meniscus cannot be working", () => expectError(fx("meniscus-working"), /load must be stretched or pinched for type meniscus/));
test("fascia can only be stretched", () => expectError(fx("fascia-pinched"), /load must be stretched for type fascia/));
test("structure needs depth", () => expectError(fx("no-depth"), /depth/));
test("attachment muscle must be a muscle", () => expectError(fx("attachment-on-bone"), /muscle must be a structure of type muscle/));
test("attachment bone must be a bone", () => expectError(fx("attachment-to-muscle"), /bone must be a structure of type bone/));
test("attachment needs a citation", () => expectError(fx("attachment-no-citation"), /at least one citation/));
test("duplicate id across actions and attachments", () => expectError(fx("duplicate-across"), /duplicate id/));

test("missing folder reports a missing file instead of throwing", () =>
  expectError(fx("does-not-exist"), /not found/));
test("checked_by must be a role label, not a name", () => expectError(fx("checked-by-name"), /checked_by/));
test("checked_on cannot be set while checked_by is null", () => expectError(fx("unchecked-with-date"), /checked_on must not be set while checked_by is null/));
