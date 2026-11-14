// Checks that the app shows a plain error message, not a blank screen, when the model cannot load.
// It opens the built app in Chromium three times and breaks the loading on purpose each time:
// 1. the Draco decoder files fail to download,
// 2. the Draco decoder files never answer, so only the load watchdog can notice,
// 3. a model file is missing (the server answers 404).
// Each time the error message from en.json must appear within 25 seconds.
// Run "npm run build" first. Then run: node apps/web/scripts/error-check.mjs
// Exit code 0 means all three cases passed. Exit code 1 means at least one did not.
import { spawn } from "node:child_process";
import { connect } from "node:net";
import { readFileSync } from "node:fs";
import { createRequire } from "node:module";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

// Playwright comes with @playwright/test, a dev dependency of apps/web. See perf-check.mjs for the browser download.
const { chromium } = createRequire(import.meta.url)("playwright");

const WAIT_MS = 25000;
const PORT = 4173;
const PAGE_URL = `http://localhost:${PORT}/`;
const webDir = join(dirname(fileURLToPath(import.meta.url)), "..");
const message = JSON.parse(readFileSync(join(webDir, "src", "i18n", "en.json"), "utf8"))["error.modelLoad"];

// Each case says which requests to break and how.
const cases = [
  { name: "decoder download fails", pattern: "**/draco/**", breakIt: (route) => route.abort() },
  // Never answering leaves the request hanging, like a stuck network.
  { name: "decoder never answers", pattern: "**/draco/**", breakIt: () => {} },
  { name: "model file missing", pattern: "**/models/*.glb", breakIt: (route) => route.fulfill({ status: 404, body: "" }) },
];

// True if something already answers on the port.
function portInUse() {
  return new Promise((resolve) => {
    const socket = connect({ port: PORT, host: "localhost" });
    socket.once("connect", () => {
      socket.destroy();
      resolve(true);
    });
    socket.once("error", () => resolve(false));
  });
}

// Stop the server and the npx and vite processes under it. Safe to call more than once.
let server;
function stopServer() {
  if (!server || !server.pid) return;
  try {
    process.kill(-server.pid);
  } catch {
    // Already gone.
  }
  server = undefined;
}

function fail(text) {
  console.log(text);
  stopServer();
  process.exit(1);
}

// Make sure the server is stopped if you press Ctrl+C.
for (const signal of ["SIGINT", "SIGTERM"]) {
  process.on(signal, () => {
    stopServer();
    process.exit(1);
  });
}

if (await portInUse()) fail(`Port ${PORT} is in use. Stop the other server and run this again.`);

// "detached" gives the server its own process group, so we can stop npx and vite together at the end.
server = spawn("npx", ["vite", "preview", "--port", String(PORT), "--strictPort"], {
  cwd: webDir,
  stdio: "ignore",
  detached: true,
});
let serverExited = false;
server.on("exit", () => {
  serverExited = true;
});
server.on("error", () => {
  serverExited = true;
});

// Wait up to 15 seconds until the preview server answers.
async function waitForServer() {
  const giveUp = Date.now() + 15000;
  while (Date.now() < giveUp && !serverExited) {
    try {
      const response = await fetch(PAGE_URL);
      if (response.ok) return;
    } catch {
      // Not up yet, try again.
    }
    await new Promise((resolve) => setTimeout(resolve, 250));
  }
  fail('The preview server did not start. Run "npm run build" first and check the output above.');
}

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
    await page.goto(PAGE_URL);
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
  stopServer();
}
process.exit(failed ? 1 : 0);
