// Checks that the app shows a plain error message, not a blank screen, when the model cannot load.
// It opens the built app in Chromium three times and breaks the loading on purpose each time:
// 1. the Draco decoder files fail to download,
// 2. the Draco decoder files never answer, so only the load watchdog can notice,
// 3. a model file is missing (the server answers 404).
// Each time the error message from en.json must appear within 25 seconds.
// Run "npm run build" first. Then run: node apps/web/scripts/error-check.mjs
// Exit code 0 means all three cases passed. Exit code 1 means at least one did not.
import { spawn } from "node:child_process";
import { readFileSync } from "node:fs";
import { createRequire } from "node:module";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

// Playwright comes with @playwright/test, a dev dependency of apps/web. See perf-check.mjs for the browser download.
const { chromium } = createRequire(import.meta.url)("playwright");

const WAIT_MS = 25000;
const PORT = 4174;
const URL = `http://localhost:${PORT}/`;
const webDir = join(dirname(fileURLToPath(import.meta.url)), "..");
const message = JSON.parse(readFileSync(join(webDir, "src", "i18n", "en.json"), "utf8"))["error.modelLoad"];

// Each case says which requests to break and how.
const cases = [
  { name: "decoder download fails", pattern: "**/draco/**", breakIt: (route) => route.abort() },
  // Never answering leaves the request hanging, like a stuck network.
  { name: "decoder never answers", pattern: "**/draco/**", breakIt: () => {} },
  { name: "model file missing", pattern: "**/models/*.glb", breakIt: (route) => route.fulfill({ status: 404, body: "" }) },
];

// Wait until the preview server answers.
async function waitForServer() {
  for (let i = 0; i < 60; i++) {
    try {
      const response = await fetch(URL);
      if (response.ok) return;
    } catch {
      // Not up yet, try again.
    }
    await new Promise((resolve) => setTimeout(resolve, 250));
  }
  throw new Error(`The preview server did not start on port ${PORT}. Did you run "npm run build"?`);
}

// "detached" gives the server its own process group, so we can stop npx and vite together at the end.
const server = spawn("npx", ["vite", "preview", "--port", String(PORT), "--strictPort"], {
  cwd: webDir,
  stdio: "ignore",
  detached: true,
});

let browser;
let failed = false;
try {
  await waitForServer();
  browser = await chromium.launch();
  for (const check of cases) {
    // A fresh browser context each time, so nothing is kept between cases.
    const context = await browser.newContext({ viewport: { width: 412, height: 915 } });
    const page = await context.newPage();
    await page.route(check.pattern, check.breakIt);
    const started = Date.now();
    await page.goto(URL);
    try {
      await page.getByRole("alert").filter({ hasText: message }).waitFor({ timeout: WAIT_MS });
      console.log(`ok   ${check.name}: message shown after ${Date.now() - started} ms`);
    } catch {
      console.log(`FAIL ${check.name}: no error message after ${WAIT_MS} ms`);
      failed = true;
    }
    await context.close();
  }
} catch (error) {
  console.error(error);
  failed = true;
} finally {
  if (browser) await browser.close();
  process.kill(-server.pid);
}
process.exit(failed ? 1 : 0);
