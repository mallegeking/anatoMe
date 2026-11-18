import { expect, test, type Page } from "@playwright/test";
import texts from "../src/i18n/en.json" with { type: "json" };

// Walks the controls on the stage with the whole body, which the app opens with: a tap and the name chip,
// zooming and reset, turning and the RIGHT and LEFT markers. Runs at all three sizes (see the projects in playwright.config.ts).
// The data comes from the test-only set in e2e/data (see scripts/e2e-prepare.mjs).

// Each step on the whole body waits for full software frames, which takes seconds in the test browser.
test.beforeEach(() => test.setTimeout(120_000));

// Opens the whole body and waits until it is drawn and the camera has said where it looks from.
async function openModel(page: Page) {
  await page.goto("/");
  // As long as the app's own load watchdog (LOAD_TIMEOUT_MS in src/viewer/useLoadWatchdog.ts). Load time is gated by perf-check, not here.
  await expect(page.getByText(texts["loading.model"])).toHaveCount(0, { timeout: 20_000 });
  // The load error also removes the loading text, so check that the model really came: the camera has said where it
  // looks from, and the model's load error is not on the page.
  await expect(page.locator(".stage-badge")).toHaveText(texts["view.front"]);
  await expect(page.getByRole("alert").filter({ hasText: texts["error.modelLoad"] })).toHaveCount(0);
  // The panel's first text can change the height of the phone's sheet, and so the stage's, so wait for it too.
  await expect(page.getByTestId("info-label")).toBeVisible();
}

// A picture of the stage once the camera has come to rest: two pictures in a row that are the same.
async function restingPicture(page: Page): Promise<Buffer> {
  const canvas = page.locator(".stage canvas");
  let last = await canvas.screenshot();
  await expect(async () => {
    const next = await canvas.screenshot();
    const same = next.equals(last);
    last = next;
    expect(same, "the picture has stopped changing").toBe(true);
  }).toPass({ timeout: 30_000, intervals: [1_000] });
  return last;
}

// Two fingers on the middle of the stage, moved from `from` to `to` pixels apart, as a pinch on a phone.
async function pinch(page: Page, from: number, to: number) {
  const stage = (await page.locator(".stage").boundingBox())!;
  const x = stage.x + stage.width / 2;
  const y = stage.y + stage.height / 2;
  const fingers = (apart: number) => [{ x: x - apart / 2, y }, { x: x + apart / 2, y }];
  const cdp = await page.context().newCDPSession(page);
  await cdp.send("Input.dispatchTouchEvent", { type: "touchStart", touchPoints: fingers(from) });
  // Each move waits for a full software frame of the whole body, so two steps are enough.
  for (const share of [0.5, 1]) {
    await cdp.send("Input.dispatchTouchEvent", { type: "touchMove", touchPoints: fingers(from + (to - from) * share) });
  }
  await cdp.send("Input.dispatchTouchEvent", { type: "touchEnd", touchPoints: [] });
}

test("tap a structure of the whole body, see its name in the chip, clear it", async ({ page }, info) => {
  const errors: string[] = [];
  page.on("pageerror", (error) => errors.push(error.message));
  page.on("console", (message) => {
    if (message.type() === "error") errors.push(message.text());
  });
  await openModel(page);

  // The model stands in the middle of the stage and scales with its height, so the spot is placed from the middle
  // in stage heights. Found by tapping the built app at all three sizes: this is the left rectus femoris, on the
  // screen's right because the front view is a mirror. Sartorius lies just above and inside, tensor fasciae latae above and outside.
  const stage = (await page.locator(".stage").boundingBox())!;
  await page.mouse.click(stage.x + stage.width / 2 + 0.068 * stage.height, stage.y + 0.53 * stage.height);

  const chip = page.locator(".stage-chip");
  await expect(chip.locator(".stage-chip-name")).toHaveText(`Rectus femoris ${texts["stage.side.l"]}`, { timeout: 30_000 });
  await expect(chip.locator(".stage-chip-side")).toHaveText(` ${texts["stage.side.l"]}`);

  await chip.getByRole("button", { name: texts["stage.clear"] }).click();
  await expect(chip).toBeEmpty();
  const hint = info.project.name === "desktop" ? texts["info.clickHint"] : texts["info.tapHint"];
  await expect(page.getByTestId("info-label")).toHaveText(hint);
  expect(errors).toEqual([]);
});

test("zooming in and out changes the whole body's view and reset brings the first view back", async ({ page }, info) => {
  await openModel(page);
  const first = await restingPicture(page);

  // The wide layout has zoom buttons. A phone has none and zooms with a pinch.
  const wide = info.project.name === "desktop";
  const stage = (await page.locator(".stage").boundingBox())!;
  if (wide) await page.getByRole("button", { name: texts["stage.zoomIn"] }).click();
  else await pinch(page, 0.2 * stage.height, 0.5 * stage.height);
  const zoomedIn = await restingPicture(page);
  expect(zoomedIn.equals(first), "zooming in changes the view").toBe(false);

  if (wide) await page.getByRole("button", { name: texts["stage.zoomOut"] }).click();
  else await pinch(page, 0.5 * stage.height, 0.2 * stage.height);
  const zoomedOut = await restingPicture(page);
  expect(zoomedOut.equals(zoomedIn), "zooming out changes the view").toBe(false);

  await page.getByRole("button", { name: texts["stage.reset"] }).click();
  let afterReset = zoomedOut;
  await expect(async () => {
    afterReset = await restingPicture(page);
    expect(afterReset.equals(first), "reset shows the first view").toBe(true);
  })
    .toPass({ timeout: 30_000 })
    .catch(async (error: unknown) => {
      // This failed once in fifteen runs and could not be made to fail again, so a failure keeps its pictures.
      await info.attach("first view", { body: first, contentType: "image/png" });
      await info.attach("view after reset", { body: afterReset, contentType: "image/png" });
      await info.attach("page after reset", { body: await page.screenshot(), contentType: "image/png" });
      await info.attach("chip after reset", { body: (await page.locator(".stage-chip").textContent()) ?? "", contentType: "text/plain" });
      throw error;
    });
  await expect(page.locator(".stage-badge")).toHaveText(texts["view.front"]);
});

test("turning the whole body to the back swaps the markers and reset brings the front back", async ({ page }) => {
  await openModel(page);
  const badge = page.locator(".stage-badge");

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
