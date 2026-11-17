import { expect, test } from "@playwright/test";
import texts from "../src/i18n/en.json" with { type: "json" };

// Walks the Movements tab in the built app: pick a movement, then pick an exercise.
// The data comes from the test-only set in e2e/data (see scripts/e2e-prepare.mjs).
test("pick a movement and an exercise", async ({ page, baseURL }) => {
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
  await page.getByRole("tab", { name: texts["mode.movement"] }).click();
  await page.getByRole("button", { name: "Hip external rotation" }).click();
  await expect(page.getByRole("heading", { name: texts["movement.group.primary"] })).toBeVisible();
  await expect(page.getByRole("button", { name: "Piriformis", exact: true })).toBeVisible();

  await page.getByRole("button", { name: texts["movement.back"] }).click();
  await page.getByRole("button", { name: "Test squat" }).click();
  await expect(page.getByText(texts["movement.effortNote"])).toBeVisible();
  await expect(page.getByRole("button", { name: "Gluteus maximus", exact: true })).toBeVisible();

  // Let the heavy files finish, so a late outside request cannot slip past.
  await page.waitForLoadState("networkidle");
  expect([...hosts]).toEqual([new URL(baseURL!).host]);
});
