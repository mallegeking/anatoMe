import { expect, test } from "@playwright/test";
import texts from "../src/i18n/en.json" with { type: "json" };

// Walks the Area tab in the built app: tap a spot on the model, read the list, clear the spot.
// The data comes from the test-only set in e2e/data (see scripts/e2e-prepare.mjs).
test("tap a spot and read what lies under it", async ({ page, baseURL }) => {
  // Remember every request, so we can check that nothing leaves the preview server.
  const hosts = new Set<string>();
  page.on("request", (request) => {
    const url = new URL(request.url());
    // data: and blob: addresses never leave the browser.
    if (url.protocol === "http:" || url.protocol === "https:") {
      hosts.add(url.host);
    }
  });

  await page.goto("/");
  await page.getByRole("tab", { name: texts["mode.area"] }).click();
  // As long as the app's own load watchdog (LOAD_TIMEOUT_MS in src/viewer/useLoadWatchdog.ts). Load time is gated by perf-check, not here.
  await expect(page.getByText(texts["loading.model"])).toHaveCount(0, { timeout: 20_000 });

  const canvas = page.locator("canvas");
  const box = (await canvas.boundingBox())!;
  // The app opens with the whole body, which stands in the middle of the canvas and scales with its height.
  // A little left of the middle (screen left is the body's right) at half the canvas height lands on the right
  // thigh, so the list starts with rectus femoris. The tap is placed from the middle in canvas heights.
  await canvas.click({ position: { x: box.width / 2 - 0.065 * box.height, y: box.height / 2 } });

  const panel = page.getByTestId("area-panel");
  await expect(panel.getByRole("heading", { name: texts["area.title"] })).toBeVisible();
  await expect(panel.getByRole("listitem").first()).toBeVisible();

  await panel.getByRole("button", { name: texts["area.clear"] }).click();
  await expect(page.getByText(texts["area.hint"])).toBeVisible();

  // Let the heavy files finish, so a late outside request cannot slip past.
  await page.waitForLoadState("networkidle");
  expect([...hosts]).toEqual([new URL(baseURL!).host]);
});
