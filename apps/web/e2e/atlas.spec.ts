import { expect, test } from "@playwright/test";
import texts from "../src/i18n/en.json" with { type: "json" };

// Walks the main path of the atlas in the built app on a phone-sized screen:
// search for piriformis, choose it, read the info panel, open the credits.
// The data comes from the test-only set in e2e/data (see scripts/e2e-prepare.mjs), not from data/,
// so this test does not change when the physio checks real rows.
test("search piriformis and read about it", async ({ page, baseURL }) => {
  // Remember every request, so we can check that nothing leaves the preview server.
  const hosts = new Set<string>();
  const paths: string[] = [];
  page.on("request", (request) => {
    const url = new URL(request.url());
    // data: and blob: addresses never leave the browser.
    if (url.protocol === "http:" || url.protocol === "https:") {
      hosts.add(url.host);
      paths.push(url.pathname);
    }
  });

  await page.goto("/");

  await page.getByRole("searchbox", { name: texts["search.label"] }).fill("piriformis");
  await page.getByTestId("search-results").getByRole("button", { name: /piriformis/i }).first().click();

  const panel = page.getByTestId("info-panel");
  await expect(panel.getByRole("heading", { name: "Piriformis", level: 2 })).toBeVisible();
  // In the test data piriformis lies one layer under gluteus maximus, so exactly one layer is peeled.
  await expect(page.getByRole("status").filter({ hasText: texts["search.peeledOne"].replace("{name}", "Piriformis") })).toBeVisible();
  // The test data has one checked hip row and one row that stays unchecked on purpose.
  await expect(panel.getByRole("heading", { name: texts["info.does.hip"] })).toBeVisible();
  await expect(panel.getByText(texts["info.pending"])).toBeVisible();

  await page.getByText(texts["credits.title"], { exact: true }).click();
  await expect(page.getByText(texts["about.educational"])).toBeVisible();

  // Wait until the heavy files have really been asked for, so a late outside request cannot slip past.
  await page.waitForLoadState("networkidle");
  await expect.poll(() => paths.some((p) => p.endsWith(".glb"))).toBe(true);
  // These prove the listener saw the data, the meshes and the decoder.
  expect(paths.some((p) => p.endsWith("data/hip.json"))).toBe(true);
  expect(paths.some((p) => p.endsWith(".glb"))).toBe(true);
  expect(paths.some((p) => p.includes("/draco/"))).toBe(true);

  expect([...hosts]).toEqual([new URL(baseURL!).host]);
});
