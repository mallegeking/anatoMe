// Rough speed check you can run on a computer. It stands in for the phone, it is not the phone.
// It opens the built app 5 times in Chromium with a phone-sized screen and a 4x slower CPU,
// reads how long it took to become interactive, and prints the median.
// Run "npm run build" first. Then run: node apps/web/scripts/perf-check.mjs
// Exit code 0 means the median is under 5000 ms. Exit code 1 means it is not.
import { spawn } from "node:child_process";
import { connect } from "node:net";
import { createRequire } from "node:module";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

// Playwright comes with @playwright/test, a dev dependency of apps/web, so "npm install" brings it.
// The browser itself is a separate download. If this script cannot start Chromium on your own computer,
// run "npx playwright install chromium" once in apps/web.
const { chromium } = createRequire(import.meta.url)("playwright");

const LIMIT_MS = 5000;
const RUNS = 5;
const PORT = 4173;
const PAGE_URL = `http://localhost:${PORT}/?perf=1`;
const webDir = join(dirname(fileURLToPath(import.meta.url)), "..");

function median(numbers) {
  const sorted = [...numbers].sort((a, b) => a - b);
  const middle = Math.floor(sorted.length / 2);
  return sorted.length % 2 ? sorted[middle] : Math.round((sorted[middle - 1] + sorted[middle]) / 2);
}

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
  const samples = [];
  for (let run = 1; run <= RUNS; run++) {
    // A fresh browser context each time, so nothing is kept between runs.
    const context = await browser.newContext({ viewport: { width: 412, height: 915 } });
    const page = await context.newPage();
    const cdp = await context.newCDPSession(page);
    await cdp.send("Emulation.setCPUThrottlingRate", { rate: 4 });
    await cdp.send("Network.setCacheDisabled", { cacheDisabled: true });
    await page.goto(PAGE_URL);
    await page.waitForFunction(() => window.__anatomeInteractiveMs !== undefined, undefined, { timeout: 60000 });
    const ms = await page.evaluate(() => window.__anatomeInteractiveMs);
    samples.push(ms);
    console.log(`run ${run}: ${ms} ms`);
    await context.close();
  }
  const result = median(samples);
  console.log(`median interactive ms: ${result}`);
  if (result >= LIMIT_MS) {
    console.log(`Too slow. The limit is ${LIMIT_MS} ms.`);
    failed = true;
  }
} catch (error) {
  console.error(error);
  failed = true;
} finally {
  if (browser) await browser.close();
  stopServer();
}
process.exit(failed ? 1 : 0);
