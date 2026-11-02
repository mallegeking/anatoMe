// Rough speed check you can run on a computer. It stands in for the phone, it is not the phone.
// It opens the built app 5 times in Chromium with a phone-sized screen and a 4x slower CPU,
// reads how long it took to become interactive, and prints the median.
// Run "npm run build" first. Then run: node apps/web/scripts/perf-check.mjs
// Exit code 0 means the median is under 5000 ms. Exit code 1 means it is not.
import { spawn } from "node:child_process";
import { createRequire } from "node:module";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

// Playwright is not a dependency of this repo, so we load it the way it is installed on this machine.
// If this line fails on your own computer, run "npm i -D playwright" in apps/web and then "npx playwright install chromium".
const { chromium } = createRequire(import.meta.url)("playwright");

const LIMIT_MS = 5000;
const RUNS = 5;
const PORT = 4173;
const URL = `http://localhost:${PORT}/?perf=1`;
const webDir = join(dirname(fileURLToPath(import.meta.url)), "..");

function median(numbers) {
  const sorted = [...numbers].sort((a, b) => a - b);
  const middle = Math.floor(sorted.length / 2);
  return sorted.length % 2 ? sorted[middle] : Math.round((sorted[middle - 1] + sorted[middle]) / 2);
}

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
  const samples = [];
  for (let run = 1; run <= RUNS; run++) {
    // A fresh browser context each time, so nothing is kept between runs.
    const context = await browser.newContext({ viewport: { width: 412, height: 915 } });
    const page = await context.newPage();
    const cdp = await context.newCDPSession(page);
    await cdp.send("Emulation.setCPUThrottlingRate", { rate: 4 });
    await cdp.send("Network.setCacheDisabled", { cacheDisabled: true });
    await page.goto(URL);
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
  process.kill(-server.pid);
}
process.exit(failed ? 1 : 0);
