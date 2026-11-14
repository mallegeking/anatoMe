import { readdirSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { fileURLToPath } from "node:url";
import { expect, test } from "vitest";
import { parse } from "yaml";

// Every gap and every joint named in the data needs a text in each language file the app ships.
const repoDir = fileURLToPath(new URL("../../../", import.meta.url));
const structuresDir = join(repoDir, "data/structures");
const i18nDir = join(repoDir, "apps/web/src/i18n");

const gaps = readdirSync(structuresDir)
  .filter((f) => f.endsWith(".yaml"))
  .flatMap((f) => parse(readFileSync(join(structuresDir, f), "utf8")) as { gap?: string }[])
  .flatMap((s) => (s.gap ? [s.gap] : []));
const joints = (parse(readFileSync(join(repoDir, "data/joints.yaml"), "utf8")) as { id: string }[]).map((j) => j.id);
const languageFiles = readdirSync(i18nDir).filter((f) => f.endsWith(".json"));

test("every gap and joint in the data has a text in every language file", () => {
  // Guards against a test that passes because it found nothing to check.
  expect(languageFiles.length).toBeGreaterThan(0);
  expect(gaps.length).toBeGreaterThan(0);
  expect(joints.length).toBeGreaterThan(0);
  const keys = [...new Set([...gaps.map((g) => `gap.${g}`), ...joints.map((j) => `joint.${j}`)])];
  const missing = languageFiles.flatMap((file) => {
    const texts = JSON.parse(readFileSync(join(i18nDir, file), "utf8")) as Record<string, string>;
    return keys.filter((key) => !(key in texts)).map((key) => `${file}: ${key}`);
  });
  expect(missing).toEqual([]);
});
