import { expect, test, type Page } from "@playwright/test";
import texts from "../src/i18n/en.json" with { type: "json" };

// Walks the whole body in the built app: it is what the app opens with, the picker leads to a region and back,
// and a search finds a structure that is not in the hip.
// The data comes from the test-only set in e2e/data (see scripts/e2e-prepare.mjs), which makes body.json too.

const REGION_ORDER = ["body", "hip", "lower-leg", "shoulder", "arm", "neck", "trunk"];

function picker(page: Page) {
  return page.getByRole("combobox", { name: texts["region.label"] });
}

// Opens the address and waits until the model is drawn. The whole body has many meshes, so this takes longer than a region.
async function openModel(page: Page, path: string) {
  await page.goto(path);
  await expect(page.getByText(texts["loading.model"])).toHaveCount(0, { timeout: 30_000 });
}

test("the app opens with the whole body", async ({ page }) => {
  const paths: string[] = [];
  page.on("request", (request) => paths.push(new URL(request.url()).pathname));
  await openModel(page, "/");

  await expect(picker(page)).toHaveValue("body");
  const all: Record<string, string> = texts;
  await expect(picker(page).locator("option")).toHaveText(REGION_ORDER.map((id) => all[`region.${id}`]));
  await expect(picker(page).locator("option").first()).toHaveText(texts["region.body"]);
  await expect(page.getByRole("tab", { name: texts["mode.movement"] })).toBeVisible();
  await expect(page.getByText(texts["regionGap.body"])).toBeVisible();
  expect(paths.some((p) => p.endsWith("data/body.json"))).toBe(true);
});

test("switch to a region and back", async ({ page }) => {
  await openModel(page, "/");
  await picker(page).selectOption({ label: texts["region.lower-leg"] });
  await expect(page).toHaveURL(/\?region=lower-leg$/);
  await expect(page.getByRole("tab")).toHaveText([texts["mode.atlas"], texts["mode.area"]]);

  await picker(page).selectOption({ label: texts["region.body"] });
  await expect(page).toHaveURL(/\?region=body$/);
  await expect(page.getByRole("tab", { name: texts["mode.movement"] })).toBeVisible();
});

test("a search in the whole body selects a structure outside the hip", async ({ page }) => {
  await openModel(page, "/");
  await page.getByRole("searchbox", { name: texts["search.label"] }).fill("scapula");
  // The whole body also has levator scapulae, which comes first in the list, so the scapula is picked by its name.
  await page.getByTestId("search-results").getByRole("button", { name: /^Scapula\b/ }).first().click();
  await expect(page.getByTestId("info-panel").getByRole("heading", { name: "Scapula", exact: true, level: 2 })).toBeVisible();
  await expect(page.locator(".stage-chip")).toContainText("Scapula");
});
