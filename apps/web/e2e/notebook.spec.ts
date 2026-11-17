import { expect, test } from "@playwright/test";
import texts from "../src/i18n/en.json" with { type: "json" };

// Walks the Notebook in the built app: log a movement, read the note in the Notebook tab, reload
// and read it again. The data comes from the test-only set in e2e/data (see scripts/e2e-prepare.mjs).
test("log a movement and find the note again after a reload", async ({ page, baseURL }) => {
  // Remember every request and its method, so we can check that nothing leaves the preview server
  // and that nothing is ever sent (only GET).
  const hosts = new Set<string>();
  const methods = new Set<string>();
  page.on("request", (request) => {
    const url = new URL(request.url());
    // data: and blob: addresses never leave the browser.
    if (url.protocol === "http:" || url.protocol === "https:") {
      hosts.add(url.host);
      methods.add(request.method());
    }
  });

  await page.goto("/");
  await page.getByRole("tab", { name: texts["mode.movement"] }).click();
  await page.getByRole("button", { name: "Hip external rotation" }).click();
  await page.getByRole("button", { name: texts["notebook.log"] }).click();
  await page.getByRole("button", { name: texts["notebook.painful"] }).click();
  await page.getByRole("button", { name: texts["notebook.side.l"], exact: true }).click();
  await page.getByRole("button", { name: texts["notebook.save"], exact: true }).click();

  const openNotebook = async () => {
    await page.getByRole("tab", { name: texts["mode.notebook"] }).click();
    await expect(page.getByRole("heading", { name: texts["notebook.entries"] })).toBeVisible();
    await expect(page.getByRole("listitem").filter({ hasText: "Hip external rotation" })).toHaveCount(1);
    await expect(page.getByRole("heading", { name: texts["notebook.lookInto"] })).toBeVisible();
  };
  await openNotebook();

  // The note lives in IndexedDB, so it is still there after a reload.
  await page.reload();
  await openNotebook();

  // Let the heavy files finish, so a late outside request cannot slip past.
  await page.waitForLoadState("networkidle");
  expect([...hosts]).toEqual([new URL(baseURL!).host]);
  expect([...methods]).toEqual(["GET"]);
});
