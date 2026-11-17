import { expect, test, type Page } from "@playwright/test";
import de from "../src/i18n/de.json" with { type: "json" };
import en from "../src/i18n/en.json" with { type: "json" };

// Checks the layout in the built app at three sizes (see the projects in playwright.config.ts), in English and German:
// nothing runs off the side, nothing is cut off, every control is big enough for a thumb, the model keeps its room,
// and the three columns or the phone's stack are where they should be.
// The data comes from the test-only set in e2e/data (see scripts/e2e-prepare.mjs).

type Texts = Record<string, string>;
const LANGUAGES: { lang: "en" | "de"; texts: Texts }[] = [
  { lang: "en", texts: en },
  { lang: "de", texts: de },
];

// The model needs at least this much height on every screen.
const STAGE_MIN = 220;

async function open(page: Page, texts: Texts) {
  await page.goto("/");
  await expect(page.getByText(texts["loading.model"])).toHaveCount(0);
}

async function stageHeight(page: Page): Promise<number> {
  return (await page.locator(".stage").boundingBox())!.height;
}

// Everything that is too wide, cut off or too small to tap on the screen as it is now. An empty list means all is well.
async function layoutProblems(page: Page): Promise<string[]> {
  return page.evaluate(() => {
    const problems: string[] = [];
    // Enough to find the element: its tag, its classes and its text or label.
    const name = (el: Element) =>
      `${el.tagName.toLowerCase()}.${[...el.classList].join(".")} "${el.textContent?.trim().slice(0, 40) || el.getAttribute("aria-label")}"`;
    const root = document.documentElement;
    if (root.scrollWidth > root.clientWidth) problems.push(`the page is ${root.scrollWidth} px wide in ${root.clientWidth} px`);
    // The tab panel scrolls up and down on its own, so a line that is too long would only show as a sideways scroll there.
    const panel = document.getElementById("tabpanel");
    if (panel && panel.checkVisibility() && panel.scrollWidth > panel.clientWidth)
      problems.push(`the tab panel is ${panel.scrollWidth} px wide in ${panel.clientWidth} px`);
    // A tab or anything in it that is wider than its box has a cut-off label.
    for (const tab of document.querySelectorAll('[role="tab"]')) {
      for (const el of [tab, ...tab.querySelectorAll("*")]) {
        if (el.scrollWidth > el.clientWidth) problems.push(`${name(tab)} is cut off (${el.scrollWidth} px in ${el.clientWidth} px)`);
      }
    }
    for (const el of document.querySelectorAll('button, [role="tab"], select')) {
      if (!el.checkVisibility()) continue;
      const min = el.classList.contains("link-button") ? 32 : 44;
      const height = el.getBoundingClientRect().height;
      if (height < min) problems.push(`${name(el)} is ${height} px high, less than ${min} px`);
    }
    return problems;
  });
}

// The selection by search. On a short phone the field hides behind a button.
async function searchAndChoose(page: Page, texts: Texts, query: string) {
  const openSearch = page.getByRole("button", { name: texts["search.open"] });
  if (await openSearch.isVisible()) await openSearch.click();
  await page.getByRole("searchbox", { name: texts["search.label"] }).fill(query);
  await page.getByTestId("search-results").getByRole("button", { name: new RegExp(query, "i") }).first().click();
}

type Box = { x: number; y: number; width: number; height: number };
const overlaps = (a: Box, b: Box) =>
  a.x < b.x + b.width && b.x < a.x + a.width && a.y < b.y + b.height && b.y < a.y + a.height;

for (const { lang, texts } of LANGUAGES) {
  test.describe(`in ${lang === "en" ? "English" : "German"}`, () => {
    test.beforeEach(async ({ page }) => {
      if (lang === "de") await page.addInitScript(() => localStorage.setItem("anatome.lang", "de"));
    });

    test("nothing overflows and nothing is cut off", async ({ page }) => {
      await open(page, texts);
      await expect(page.locator("html")).toHaveAttribute("lang", lang);
      expect(await layoutProblems(page)).toEqual([]);
      expect(await stageHeight(page)).toBeGreaterThanOrEqual(STAGE_MIN);
    });

    test("the stage keeps its room with each tab open and with a structure selected", async ({ page }) => {
      await open(page, texts);
      // What each tab shows first, so the check waits until the tab's content is in.
      const firstContent = {
        atlas: page.getByTestId("info-label"),
        movement: page.getByTestId("movement-panel"),
        area: page.getByText(texts["area.hint"]),
        notebook: page.getByTestId("notebook-panel"),
      };
      for (const [mode, content] of Object.entries(firstContent)) {
        await page.getByRole("tab", { name: texts[`mode.${mode}`] }).click();
        await expect(page.getByRole("tab", { name: texts[`mode.${mode}`] })).toHaveAttribute("aria-selected", "true");
        await expect(content).toBeVisible();
        expect(await stageHeight(page), mode).toBeGreaterThanOrEqual(STAGE_MIN);
        expect(await layoutProblems(page), mode).toEqual([]);
      }
      await searchAndChoose(page, texts, "piriformis");
      await expect(page.getByTestId("info-panel").getByRole("heading", { name: "Piriformis", level: 2 })).toBeVisible();
      await expect(page.locator(".stage-chip")).toContainText("Piriformis");
      expect(await stageHeight(page)).toBeGreaterThanOrEqual(STAGE_MIN);
      expect(await layoutProblems(page)).toEqual([]);
    });

    test("the arrangement matches the width", async ({ page }, info) => {
      await open(page, texts);
      const nav = (await page.locator(".nav").boundingBox())!;
      const stage = (await page.locator(".stage").boundingBox())!;
      const tabpanel = (await page.getByRole("tabpanel").boundingBox())!;
      if (info.project.name === "desktop") {
        expect(nav.x + nav.width).toBeLessThanOrEqual(stage.x);
        expect(tabpanel.x).toBeGreaterThanOrEqual(stage.x + stage.width);
        await expect(page.getByTestId("layers-panel")).toBeVisible();
        await expect(page.getByRole("button", { name: texts["layers.open"] })).toHaveCount(0);

        // The search field sits in the middle of the top bar, in one row with the app name, and is at most about 620 px wide.
        const bar = (await page.locator(".top-bar").boundingBox())!;
        const field = (await page.getByRole("searchbox", { name: texts["search.label"] }).boundingBox())!;
        const appName = (await page.getByRole("heading", { name: texts["app.name"], level: 1 }).boundingBox())!;
        expect(field.y).toBeLessThan(appName.y + appName.height);
        expect(appName.y).toBeLessThan(field.y + field.height);
        expect(field.width).toBeLessThanOrEqual(620);
        expect(Math.abs(field.x + field.width / 2 - (bar.x + bar.width / 2))).toBeLessThanOrEqual(80);
        // The result list drops down under the field and is no wider than it.
        await page.getByRole("searchbox", { name: texts["search.label"] }).fill("piriformis");
        const drop = (await page.getByTestId("search-results").boundingBox())!;
        expect(Math.abs(drop.x - field.x)).toBeLessThanOrEqual(1);
        expect(Math.abs(drop.width - field.width)).toBeLessThanOrEqual(1);
      } else {
        expect(nav.y).toBeGreaterThanOrEqual(tabpanel.y + tabpanel.height);
        await expect(page.getByTestId("layers-panel")).toHaveCount(0);

        // Three structures hidden one by one fill the Layers list, so it needs more room than the sheet has.
        for (const name of ["Piriformis", "Gluteus maximus", "Femur"]) {
          await searchAndChoose(page, texts, name);
          const info = page.getByTestId("info-panel");
          await expect(info.getByRole("heading", { name, level: 2 })).toBeVisible();
          await info.getByRole("button", { name: texts["info.hideShort"], exact: true }).click();
        }

        // Layers opens in the sheet with its controls and the educational line, and the model keeps its room.
        await page.getByRole("button", { name: texts["layers.open"] }).click();
        const layers = page.getByTestId("layers-panel");
        await expect(layers).toBeVisible();
        await expect(layers.getByRole("button", { name: texts["layers.peel"] })).toBeVisible();
        await expect(layers.getByRole("button", { name: texts["layers.restore"] })).toBeVisible();
        await expect(layers.getByRole("listitem")).toHaveCount(3);
        const educational = page.locator(".panel").getByText(texts["about.educational"]);
        await expect(educational).toBeVisible();
        const slot = (await page.locator(".layers-slot").boundingBox())!;
        const line = (await educational.boundingBox())!;
        expect(overlaps(slot, line)).toBe(false);
        // The whole line shows: its box lies inside the panel, which cuts off what sticks out, and inside the screen.
        const panel = (await page.locator(".panel").boundingBox())!;
        const viewport = page.viewportSize()!;
        expect(line.y, "line top in the panel").toBeGreaterThanOrEqual(panel.y - 0.5);
        expect(line.y + line.height, "line bottom in the panel").toBeLessThanOrEqual(panel.y + panel.height + 0.5);
        expect(line.y, "line top on the screen").toBeGreaterThanOrEqual(0);
        expect(line.y + line.height, "line bottom on the screen").toBeLessThanOrEqual(viewport.height);
        expect(await stageHeight(page)).toBeGreaterThanOrEqual(STAGE_MIN);
        expect(await layoutProblems(page)).toEqual([]);
      }
    });

    test("the rail fits its tabs, the educational line and the credits button", async ({ page }, info) => {
      test.skip(info.project.name !== "desktop", "The rail is only on the wide layout.");
      // The widest rail and the narrowest one, on a short screen.
      for (const size of [
        { width: 1280, height: 800 },
        { width: 900, height: 600 },
      ]) {
        await page.setViewportSize(size);
        await open(page, texts);
        const label = `${size.width} x ${size.height}`;
        const nav = page.locator(".nav");
        const navBox = (await nav.boundingBox())!;
        const parts = [
          page.getByRole("tablist"),
          nav.getByText(texts["about.educational"]),
          nav.getByRole("button", { name: texts["credits.title"] }),
        ];
        const boxes: Box[] = [];
        for (const part of parts) {
          // A rail that is too short scrolls on its own, so each part can be brought fully into view.
          await part.scrollIntoViewIfNeeded();
          await expect(part).toBeInViewport({ ratio: 1 });
          // Measured from the top of the rail's content, so the parts compare even if the rail scrolled in between.
          const box = (await part.boundingBox())!;
          boxes.push({ ...box, y: box.y + (await nav.evaluate((el) => el.scrollTop)) });
        }
        for (const box of boxes) {
          expect(box.x, label).toBeGreaterThanOrEqual(navBox.x);
          expect(box.x + box.width, label).toBeLessThanOrEqual(navBox.x + navBox.width);
        }
        const [tabs, line, credits] = boxes;
        expect(tabs.y + tabs.height, label).toBeLessThanOrEqual(line.y);
        expect(line.y + line.height, label).toBeLessThanOrEqual(credits.y);
        // Nothing in the rail runs off its side.
        expect(await nav.evaluate((el) => el.scrollWidth <= el.clientWidth), label).toBe(true);
        expect(await layoutProblems(page), label).toEqual([]);
      }
    });

    test("small phone: the search field is behind a button", async ({ page }, info) => {
      test.skip(info.project.name !== "small-phone", "Only the short phone folds the search field.");
      await open(page, texts);
      await expect(page.getByRole("searchbox", { name: texts["search.label"] })).toHaveCount(0);
      await page.getByRole("button", { name: texts["search.open"] }).click();
      const field = page.getByRole("searchbox", { name: texts["search.label"] });
      await expect(field).toBeFocused();
      await field.fill("piriformis");
      await page.getByTestId("search-results").getByRole("button", { name: /piriformis/i }).first().click();
      await expect(page.getByTestId("info-panel").getByRole("heading", { name: "Piriformis", level: 2 })).toBeVisible();
      expect(await stageHeight(page)).toBeGreaterThanOrEqual(STAGE_MIN);
      // The chosen name shows on the stage, so the field folds away and the bar is whole again.
      await expect(page.getByRole("searchbox", { name: texts["search.label"] })).toHaveCount(0);
      await expect(page.getByRole("button", { name: texts["search.open"] })).toHaveAttribute("aria-expanded", "false");
      await expect(page.getByRole("button", { name: texts["settings.title"] })).toBeVisible();
    });

    test("no request leaves the preview host", async ({ page, baseURL }) => {
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
      await open(page, texts);
      // Wait until the heavy files have really been asked for, so a late outside request cannot slip past.
      await page.waitForLoadState("networkidle");
      await expect.poll(() => paths.some((p) => p.endsWith(".glb"))).toBe(true);
      expect(paths.some((p) => p.endsWith("data/body.json"))).toBe(true);
      expect(paths.some((p) => p.includes("/draco/"))).toBe(true);
      expect([...hosts]).toEqual([new URL(baseURL!).host]);
    });
  });
}
