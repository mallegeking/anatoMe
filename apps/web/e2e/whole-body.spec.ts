import { readdirSync, readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { expect, test, type Page } from "@playwright/test";
import texts from "../src/i18n/en.json" with { type: "json" };

// Walks the whole body in the built app: it is what the app opens with, the picker leads to a region and back,
// a search finds a structure that is not in the hip, Under a spot lists what lies under a tap, and peeling works.
// The data comes from the test-only set in e2e/data (see scripts/e2e-prepare.mjs), which makes body.json too.

const REGION_ORDER = ["body", "hip", "lower-leg", "shoulder", "arm", "neck", "trunk"];

function picker(page: Page) {
  return page.getByRole("combobox", { name: texts["region.label"] });
}

// Opens the address and waits until the model is drawn.
async function openModel(page: Page, path: string) {
  await page.goto(path);
  // As long as the app's own load watchdog (LOAD_TIMEOUT_MS in src/viewer/useLoadWatchdog.ts). Load time is gated by perf-check, not here.
  await expect(page.getByText(texts["loading.model"])).toHaveCount(0, { timeout: 20_000 });
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

test("turning the whole body to the back swaps the markers and reset brings the front back", async ({ page }) => {
  // Each step below waits for a full software frame of the whole body, which takes seconds when several browsers share the machine.
  test.setTimeout(120_000);
  await openModel(page, "/");
  const badge = page.locator(".stage-badge");
  await expect(badge).toHaveText(texts["view.front"]);
  // The panel's first text can change the height of the phone's sheet, and so the stage's, so wait for it too.
  await expect(page.getByTestId("info-label")).toBeVisible();

  // A sideways drag of half the stage's height turns the model half way round, as in stage.spec.ts.
  // The turn depends only on the drag distance, and each pointer move costs a full software frame of the whole body, so two steps are enough.
  const stage = (await page.locator(".stage").boundingBox())!;
  const y = stage.y + 0.5 * stage.height;
  const from = stage.x + stage.width / 2 - 0.25 * stage.height;
  await page.mouse.move(from, y);
  await page.mouse.down();
  await page.mouse.move(from + 0.5 * stage.height, y, { steps: 2 });
  await page.mouse.up();
  // The badge follows once the camera has come to rest.
  await expect(badge).toHaveText(texts["view.back"], { timeout: 30_000 });
  await expect(page.locator(".stage-marker--left")).toHaveText(texts["stage.left"]);
  await expect(page.locator(".stage-marker--right")).toHaveText(texts["stage.right"]);

  await page.getByRole("button", { name: texts["stage.reset"] }).click();
  await expect(badge).toHaveText(texts["view.front"], { timeout: 30_000 });
  await expect(page.locator(".stage-marker--left")).toHaveText(texts["stage.right"]);
});

// The home region of each structure in the test data, by its English name, read from e2e/data/structures/<region>.yaml.
function homeRegions(): Map<string, string> {
  const dir = fileURLToPath(new URL("./data/structures/", import.meta.url));
  const homes = new Map<string, string>();
  for (const file of readdirSync(dir).filter((f) => f.endsWith(".yaml"))) {
    for (const line of readFileSync(`${dir}${file}`, "utf8").split("\n")) {
      const found = /english: ([^,]+),.* region: ([a-z-]+)/.exec(line);
      if (found) homes.set(found[1], found[2]);
    }
  }
  return homes;
}

// Opens the whole body on the Under a spot tab and gives back the stage's box, measured once the sheet has its first text.
async function openArea(page: Page) {
  await openModel(page, "/");
  await expect(page.locator(".stage-badge")).toHaveText(texts["view.front"]);
  await page.getByRole("tab", { name: texts["mode.area"] }).click();
  // The hint can change the height of the phone's sheet, and so the stage's, so wait for it before measuring.
  await expect(page.getByText(texts["area.hint"])).toBeVisible();
  return (await page.locator(".stage").boundingBox())!;
}

// The names as the list wrote them, side words included, from the last call of listedRegions.
let lastLabels: string[] = [];

// The home region of each entry in the Under a spot list, in the list's order. A name without a home fails the test.
async function listedRegions(page: Page): Promise<string[]> {
  const items = page.getByTestId("area-panel").getByRole("listitem");
  await expect(items.first()).toBeVisible({ timeout: 30_000 });
  const homes = homeRegions();
  // A paired structure shows as "<name> (left)" or "<name> (right)", so the side's words come off.
  const sideWords = [texts["side.left"], texts["side.right"]].map((text) => text.replace("{label}", ""));
  const nameOf = (label: string) => sideWords.reduce((name, words) => (name.endsWith(words) ? name.slice(0, -words.length) : name), label);
  const labels = await items.locator(".area-card-head button").allTextContents();
  lastLabels = labels;
  const names = labels.map(nameOf);
  return names.map((name) => {
    expect(homes.has(name), `${name} is in the test data`).toBe(true);
    return homes.get(name)!;
  });
}

test("Under a spot: a tap on the trunk lists what lies under it", async ({ page }) => {
  test.setTimeout(120_000);
  const stage = await openArea(page);
  // The model stands in the middle of the stage and scales with its height, so the spot is placed from the middle
  // in stage heights, as in stage.spec.ts. This is the chest a little left of the breastbone (screen right), on pectoralis major.
  await page.mouse.click(stage.x + stage.width / 2 + 0.045 * stage.height, stage.y + stage.height / 2 - 0.25 * stage.height);

  const regions = await listedRegions(page);
  expect(regions.length).toBeGreaterThanOrEqual(1);
  expect(["trunk", "shoulder"]).toContain(regions[0]);
  expect(regions).not.toContain("arm");
  // Front view: screen right is the body's left, so no entry may be a right-side structure.
  const rightWords = texts["side.right"].replace("{label}", "");
  expect(lastLabels.filter((label) => label.endsWith(rightWords))).toEqual([]);
});

test("Under a spot: a tap on an arm beside the trunk", async ({ page }) => {
  // The turn below waits for full software frames of the whole body, as in the turning test above.
  test.setTimeout(120_000);
  const stage = await openArea(page);
  // A sideways drag of a quarter of the stage's height turns the model a quarter of the way round, to its right side.
  const y = stage.y + 0.5 * stage.height;
  const from = stage.x + stage.width / 2 - 0.125 * stage.height;
  await page.mouse.move(from, y);
  await page.mouse.down();
  await page.mouse.move(from + 0.25 * stage.height, y, { steps: 2 });
  await page.mouse.up();
  await expect(page.locator(".stage-badge")).toHaveText(texts["view.right"], { timeout: 30_000 });

  // The middle of the right upper arm, where it hangs over the side of the chest.
  await page.mouse.click(stage.x + stage.width / 2 - 0.025 * stage.height, stage.y + stage.height / 2 - 0.2 * stage.height);

  const regions = await listedRegions(page);
  expect(["arm", "shoulder"]).toContain(regions[0]);
  // The right upper arm was tapped, so no entry may be a left-side structure.
  const leftWords = texts["side.left"].replace("{label}", "");
  expect(lastLabels.filter((label) => label.endsWith(leftWords))).toEqual([]);
});

test("peeling a layer in the whole body", async ({ page }) => {
  test.setTimeout(120_000);
  await openModel(page, "/");
  // On the phone the layers button on the stage opens the Layers section in the sheet.
  await page.getByRole("button", { name: texts["layers.open"] }).click();
  const layers = page.getByTestId("layers-panel");
  await layers.getByRole("button", { name: texts["layers.peel"] }).click();
  await expect(layers.getByText(texts["layers.peeledOne"])).toBeVisible({ timeout: 30_000 });
});
