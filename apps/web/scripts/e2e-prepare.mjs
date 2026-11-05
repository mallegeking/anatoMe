// Makes the site the end-to-end test opens: a copy of the built app in dist-e2e/, with the data
// compiled from the small test-only data set in e2e/data/ instead of the real one.
// Why: the test checks things like "1 layer peeled" and "waiting for review". With the real data
// those change as the physio checks rows, and the test would break for a good reason.
// The test data never changes on its own, so the test only fails when the app breaks.
// dist/ itself is not touched, so check-no-drafts still looks at the real shipped build.
// Run "npm run build" first. Playwright runs this script before it starts the preview server.
import { execFileSync } from "node:child_process";
import { cpSync, existsSync, rmSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const webDir = join(dirname(fileURLToPath(import.meta.url)), "..");
const repoDir = join(webDir, "..", "..");
const dist = join(webDir, "dist");
const out = join(webDir, "dist-e2e");

if (!existsSync(join(dist, "index.html"))) {
  console.error('apps/web/dist has no built app. Run "npm run build" first.');
  process.exit(1);
}

rmSync(out, { recursive: true, force: true });
cpSync(dist, out, { recursive: true });
// build-data checks the test data first, then replaces the bundles in dist-e2e/data with normal-mode ones.
execFileSync("npx", ["tsx", "pipeline/data/src/cli.ts", "build-data", "apps/web/e2e/data", "apps/web/dist-e2e/data"], {
  cwd: repoDir,
  stdio: "inherit",
});
