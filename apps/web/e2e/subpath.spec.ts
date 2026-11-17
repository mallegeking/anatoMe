import { expect, test } from "@playwright/test";
import { cpSync, existsSync, mkdtempSync, readFileSync, rmSync, statSync } from "node:fs";
import { createServer, type Server } from "node:http";
import { tmpdir } from "node:os";
import { extname, join, normalize, sep } from "node:path";
import { fileURLToPath } from "node:url";
import texts from "../src/i18n/en.json" with { type: "json" };

// GitHub Pages serves the app from a folder named after the repo, not from the root.
// This test copies the shipped build (dist/) into a folder named anatoMe under a temporary root,
// serves that root with its own small server, and opens /anatoMe/. Every request must stay inside
// /anatoMe/ and none may fail. The preview server of the other tests is not used here.
const FOLDER = "anatoMe";
const dist = fileURLToPath(new URL("../dist", import.meta.url));

const TYPES: Record<string, string> = {
  ".html": "text/html; charset=utf-8",
  ".js": "text/javascript",
  ".css": "text/css",
  ".json": "application/json",
  ".glb": "model/gltf-binary",
  ".wasm": "application/wasm",
  ".svg": "image/svg+xml",
  ".png": "image/png",
  ".txt": "text/plain; charset=utf-8",
};

let root: string;
let server: Server;
let origin: string;

test.beforeAll(async () => {
  if (!existsSync(join(dist, "index.html"))) throw new Error('apps/web/dist has no built app. Run "npm run build" first.');
  root = mkdtempSync(join(tmpdir(), "anatome-subpath-"));
  cpSync(dist, join(root, FOLDER), { recursive: true });

  server = createServer((req, res) => {
    const path = decodeURIComponent(new URL(req.url ?? "/", "http://x").pathname);
    let file = normalize(join(root, path));
    // Nothing outside the temporary root is served.
    if (file !== root && !file.startsWith(root + sep)) {
      res.writeHead(403).end();
      return;
    }
    if (existsSync(file) && statSync(file).isDirectory()) file = join(file, "index.html");
    if (!existsSync(file)) {
      res.writeHead(404).end();
      return;
    }
    res.writeHead(200, { "Content-Type": TYPES[extname(file)] ?? "application/octet-stream" });
    res.end(readFileSync(file));
  });
  await new Promise<void>((resolve) => server.listen(0, "127.0.0.1", resolve));
  const address = server.address();
  if (address === null || typeof address === "string") throw new Error("the test server has no port");
  origin = `http://127.0.0.1:${address.port}`;
});

test.afterAll(async () => {
  await new Promise((resolve) => server?.close(resolve));
  if (root) rmSync(root, { recursive: true, force: true });
});

test("the built app works from the anatoMe folder", async ({ page }) => {
  const outside: string[] = [];
  const failed: string[] = [];
  page.on("request", (request) => {
    const url = new URL(request.url());
    // data: and blob: addresses never leave the browser.
    if (url.protocol !== "http:" && url.protocol !== "https:") return;
    if (url.origin !== origin || !url.pathname.startsWith(`/${FOLDER}/`)) outside.push(request.url());
  });
  page.on("response", (response) => {
    if (response.status() >= 400) failed.push(`${response.status()} ${response.url()}`);
  });

  await page.goto(`${origin}/${FOLDER}/`);
  // The app sets this once the model is drawn and the controls work. When it never comes, the
  // error names the requests that failed or left the folder, which is the usual reason.
  await page
    .waitForFunction(() => (window as { __anatomeInteractiveMs?: number }).__anatomeInteractiveMs !== undefined, undefined, { timeout: 45_000 })
    .catch((error: Error) => {
      throw new Error(`the model did not become interactive. Failed: ${JSON.stringify(failed)}. Outside /${FOLDER}/: ${JSON.stringify(outside)}. ${error.message}`);
    });

  await page.getByRole("searchbox", { name: texts["search.label"] }).fill("piriformis");
  await page.getByTestId("search-results").getByRole("button", { name: /piriformis/i }).first().click();
  await expect(page.getByTestId("info-panel").getByRole("heading", { name: "Piriformis", level: 2 })).toBeVisible();

  // Let the heavy files finish, so a late request cannot slip past.
  await page.waitForLoadState("networkidle");
  expect(outside).toEqual([]);
  expect(failed).toEqual([]);
});
