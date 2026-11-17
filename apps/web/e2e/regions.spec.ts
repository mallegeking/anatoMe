import { expect, test } from "@playwright/test";
import texts from "../src/i18n/en.json" with { type: "json" };

// Walks the body region switch in the built app: the picker, the address, the tabs of a region
// without movements, the gap line, and the way back to the hip.
// The data comes from the test-only set in e2e/data (see scripts/e2e-prepare.mjs).
test("the picker switches to the shoulder and back", async ({ page }) => {
  await page.goto("/");
  await page.getByRole("combobox", { name: texts["region.label"] }).selectOption({ label: texts["region.shoulder"] });
  await expect(page).toHaveURL(/\?region=shoulder$/);

  // The shoulder has no movements yet, so only the Structures and Area tabs are left.
  await expect(page.getByRole("tab")).toHaveText([texts["mode.atlas"], texts["mode.area"]]);
  await expect(page.getByText(texts["regionGap.shoulder"])).toBeVisible();

  await page.getByRole("searchbox", { name: texts["search.label"] }).fill("scapula");
  await page.getByTestId("search-results").getByRole("button", { name: /scapula/i }).first().click();
  await expect(page.getByTestId("info-panel").getByRole("heading", { name: "Scapula", level: 2 })).toBeVisible();

  await page.getByRole("combobox", { name: texts["region.label"] }).selectOption({ label: texts["region.hip"] });
  await expect(page.getByRole("tab", { name: texts["mode.movement"] })).toBeVisible();
  await expect(page.getByRole("searchbox", { name: texts["search.label"] })).toHaveValue("");
});

test("?region=shoulder opens the shoulder", async ({ page }) => {
  await page.goto("/?region=shoulder");
  await expect(page.getByRole("combobox", { name: texts["region.label"] })).toHaveValue("shoulder");
  await expect(page.getByRole("tab")).toHaveText([texts["mode.atlas"], texts["mode.area"]]);
  await expect(page.getByText(texts["regionGap.shoulder"])).toBeVisible();
});

test("?region=elbow opens the whole body", async ({ page }) => {
  await page.goto("/?region=elbow");
  await expect(page.getByRole("combobox", { name: texts["region.label"] })).toHaveValue("body");
  await expect(page.getByRole("tab", { name: texts["mode.movement"] })).toBeVisible();
});
