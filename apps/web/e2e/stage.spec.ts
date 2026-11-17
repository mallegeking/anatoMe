import { expect, test, type Page } from "@playwright/test";
import texts from "../src/i18n/en.json" with { type: "json" };

// Walks the controls on the stage in the built app: the name chip, the view badge, the RIGHT and LEFT markers
// and the reset button. Runs at all three sizes (see the projects in playwright.config.ts).
// The data comes from the test-only set in e2e/data (see scripts/e2e-prepare.mjs).

// Opens the app and waits until the model is drawn and the camera has said where it looks from.
async function openModel(page: Page, path = "/") {
  await page.goto(path);
  // As long as the app's own load watchdog (LOAD_TIMEOUT_MS in src/viewer/useLoadWatchdog.ts). Load time is gated by perf-check, not here.
  await expect(page.getByText(texts["loading.model"])).toHaveCount(0, { timeout: 20_000 });
  await expect(page.locator(".stage-badge")).toHaveText(texts["view.front"]);
  // The panel's first text can change the height of the phone's sheet, and so the stage's, so wait for it too.
  await expect(page.getByTestId("info-label")).toBeVisible();
}

test("tap a structure, see the chip, clear it, reset the view", async ({ page }, info) => {
  const errors: string[] = [];
  page.on("pageerror", (error) => errors.push(error.message));
  page.on("console", (message) => {
    if (message.type() === "error") errors.push(message.text());
  });
  // The tap below is aimed at the hip's framing, so this check opens the hip (plan decision 4).
  await openModel(page, "/?region=hip");

  // The model stands in the middle of the stage and scales with its height, so the spot is placed from the middle
  // in stage heights, as in area.spec.ts. This is the thigh on the screen's right at every size.
  // (62 percent of the width, the first choice, lands on the thigh's outer edge on the small phone and misses.)
  const stage = (await page.locator(".stage").boundingBox())!;
  await page.mouse.click(stage.x + stage.width / 2 + 0.065 * stage.height, stage.y + 0.4 * stage.height);

  // Seen from the front, the screen's right is the body's left, as in a mirror.
  const chip = page.locator(".stage-chip");
  await expect(chip.locator(".stage-chip-name")).not.toBeEmpty();
  await expect(chip.locator(".stage-chip-side")).toHaveText(` ${texts["stage.side.l"]}`);
  await expect(page.locator(".stage-badge")).toHaveText(texts["view.front"]);
  await expect(page.locator(".stage-marker--left")).toHaveText(texts["stage.right"]);
  await expect(page.locator(".stage-marker--right")).toHaveText(texts["stage.left"]);

  await chip.getByRole("button", { name: texts["stage.clear"] }).click();
  await expect(chip).toBeEmpty();
  const hint = info.project.name === "desktop" ? texts["info.clickHint"] : texts["info.tapHint"];
  await expect(page.getByTestId("info-label")).toHaveText(hint);

  await page.getByRole("button", { name: texts["stage.reset"] }).click();
  await expect(page.locator(".stage-badge")).toHaveText(texts["view.front"]);
  expect(errors).toEqual([]);
});

test("turning the model to the back swaps the markers", async ({ page }) => {
  // The whole body has its own turning test in whole-body.spec.ts, because a 10-step drag of the whole body takes about 50 s in software WebGL.
  await openModel(page, "/?region=hip");
  const stage = (await page.locator(".stage").boundingBox())!;
  const badge = page.locator(".stage-badge");
  // A sideways drag of half the stage's height turns the model about half way round. Drag again if one is not enough.
  const y = stage.y + 0.5 * stage.height;
  const from = stage.x + stage.width / 2 - 0.25 * stage.height;
  await expect(async () => {
    await page.mouse.move(from, y);
    await page.mouse.down();
    await page.mouse.move(from + 0.5 * stage.height, y, { steps: 10 });
    await page.mouse.up();
    // The badge follows once the camera has come to rest.
    await expect(badge).toHaveText(texts["view.back"], { timeout: 3_000 });
  }).toPass({ timeout: 20_000 });
  await expect(page.locator(".stage-marker--left")).toHaveText(texts["stage.left"]);
  await expect(page.locator(".stage-marker--right")).toHaveText(texts["stage.right"]);

  // Reset brings back the first view, from the front, not only the first distance.
  await page.getByRole("button", { name: texts["stage.reset"] }).click();
  await expect(badge).toHaveText(texts["view.front"]);
  await expect(page.locator(".stage-marker--left")).toHaveText(texts["stage.right"]);
});
