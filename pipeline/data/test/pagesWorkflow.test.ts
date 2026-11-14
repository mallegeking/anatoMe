import { readFileSync } from "node:fs";
import { expect, test } from "vitest";

const text = readFileSync(new URL("../../../.github/workflows/pages.yml", import.meta.url), "utf8");

test("the Pages workflow never builds the review copy", () => expect(text).not.toMatch(/build:review|dist-review/));
test("it uploads only the normal build", () => expect(text).toMatch(/path:\s*apps\/web\/dist\s*$/m));
test("the draft check runs after the build and before the upload", () => {
  const build = text.indexOf("npm run build");
  const check = text.indexOf("check-no-drafts.mjs");
  const upload = text.indexOf("upload-pages-artifact");
  expect(build).toBeGreaterThan(-1);
  expect(check).toBeGreaterThan(build);
  expect(upload).toBeGreaterThan(check);
});
test("the deploy is skipped while the repo is private", () => expect(text).toContain("github.event.repository.private == false"));
test("no step is allowed to fail silently", () => expect(text).not.toMatch(/continue-on-error/));
