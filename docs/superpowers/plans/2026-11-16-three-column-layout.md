# Three-Column Layout and Stage Controls Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Give anatoMe a three-column layout on wide screens and a bottom-tab layout on phones, with stage controls, Layers in its own place, retry after failed loads, and one shared look for all four tab panels.

**Architecture:** One set of components for every width. A CSS grid places them, and one media query at 900 px switches between the phone arrangement and three columns. A small hook tells components which arrangement is active where CSS alone cannot (tab orientation, where Layers, credits and language live). The viewer gains a two-method handle and one camera callback. The stage controls are plain HTML over the stage edges.

**Tech Stack:** React 19, react-three-fiber, drei `CameraControls`, one global `index.css`, Vitest with jsdom, Playwright. No new dependency.

**Spec:** `docs/superpowers/specs/2026-11-16-three-column-layout-design.md`. Read it fully first. The mockup it names is a guide for looks. Where they disagree, the spec wins.

## Global Constraints

- Work only on the branch `claude/nifty-sagan-c57kd7`. Run `git branch --show-current` before every commit. Never commit to `main`.
- Before Task 1: `npm ci`, then the baseline `npm run validate && npm run check-models && npm test && npm run build && npm run e2e -w apps/web -- --trace off && node scripts/check-no-drafts.mjs`. Stop if it is red.
- Test first. See each new test fail before writing the code.
- Every task ends with `npm test`, `npm run build` and `npm run e2e -w apps/web -- --trace off` green, then one commit. A task that moves a control also updates the existing unit and e2e tests that looked for it in the old place. Never skip or loosen a test to get green.
- No new runtime dependency. No request to another host. The system font stack stays. The mockup's Inter font is not used.
- Every user-visible text and every `aria-label` comes from `apps/web/src/i18n/en.json` and `de.json`. Both files keep the same keys, in the same order. A key that is no longer used is removed from both.
- Docs and code comments: plain language, no em dashes, no semicolons in prose. Comments are short, for an owner who reads code but did not write it.
- The wide layout starts at a viewport width of 900 px. The rail is 208 px and the right column 380 px. From 900 px to 1099 px they are 176 px and 320 px.
- The phone stage is never shorter than 220 px. The phone sheet is at most 45 percent of the height.
- Every button, tab, select and link that acts as a button is at least 44 px high. Small text links inside cards are at least 32 px high.
- The panels keep their `data-testid` values and roles.
- `checked_by` is never touched. No data row is written or changed.
- Check the current official docs before using an API this repo does not use yet (camera-controls events and `dollyTo`, the `dialog` element, `useSyncExternalStore`).
- When the plan and the code disagree, take the smallest change that keeps the plan's intent and write it into the build report under "Deviations".

## Plan decisions (the planner's calls, the owner can overrule)

1. The spec names six grid areas. The grid has four: `top`, `nav`, `stage`, `side`. Layers, the tab panel and the foot are stacked inside `side` with flexbox. The result on screen is the same and the CSS is simpler.
2. Attachments keep their checked wording. The labels in the two-column grid are "Starts at" and "Ends at", cut from the existing texts, not the mockup's "From" and "To". German grammar makes a new sentence risky.
3. The empty-state heading says "Tap a structure to learn about it" on the phone layout and "Click a structure to learn about it" on the wide layout.
4. The lighter purple for "pinched" is `#b47be8`.
5. Dates use the locales `en-GB` and `de-DE`, which give "14 Nov 2026" and "14.11.2026".
6. The German texts in this plan are drafts. The owner corrects them when reading the build report.

## Review Focus

1. A window dragged across 900 px while Layers or the settings dialog is open must switch layout without losing the selection and without loading the model again. Test in Task 2 (`App.test.tsx`, the viewer mounts once) and Task 3.
2. German labels at 360 px must not be cut off in the tab bar or the top bar. Test in Task 13 (`layout.spec.ts`).
3. A camera direction that ties between two axes, or a zero vector, must give a view name and not crash. Test in Task 6 (`view.test.ts`).
4. A region with only two tabs must work in the vertical rail, and the arrow keys must wrap. Test in Task 2 (`ModeBar.test.tsx`).
5. "Try again" pressed while still offline must show the error again with the button, and pressing it many times must not stack requests. Test in Task 8.

---

## File Structure

```
apps/web/src/
├── index.css                    # tokens, .btn, .field, grid shell, panel pieces (Tasks 1, 2, 9)
├── App.tsx                      # shell markup, layers slot, dialog, stage controls, retry (Tasks 2 to 8)
├── ui/useMedia.ts               # new: useMedia, useWide, useShort (Task 2)
├── ui/icons.tsx                 # new: inline SVG icons (Task 2)
├── ui/ModeBar.tsx               # vertical prop, icons (Task 2)
├── ui/PanelArea.tsx             # loses the layers branch, becomes the tabpanel (Tasks 2, 3)
├── ui/TopBar.tsx                # h1, no layers toggle, settings button, compact search (Tasks 2, 3, 4, 7)
├── ui/AppDialog.tsx             # new: native dialog wrapper (Task 4)
├── ui/LanguagePicker.tsx        # new: split out of Credits (Task 4)
├── ui/Credits.tsx               # CreditsBody without the details wrapper (Task 4)
├── ui/pieces.tsx                # new: PanelTitle, Chip, SectionHeading, Card, KeyValue (Task 9)
├── ui/InfoPanel.tsx, ui/RegionInfo.tsx   # restyle (Task 9)
├── layers/LayersPanel.tsx       # onClose prop (Task 3)
├── viewer/handle.ts             # new: ViewerHandle type (Task 5)
├── viewer/Viewer.tsx, Scene.tsx, RegionModel.tsx   # handle, onView, retry (Tasks 5, 8)
├── viewer/ModelErrorBoundary.tsx    # onRetry (Task 8)
├── data/useRegionData.ts        # forgetFailedRegionData (Task 8)
├── stage/view.ts                # new: viewOf, markersOf (Task 6)
├── stage/StageControls.tsx      # new (Task 6)
├── movement/MovementPanel.tsx, movement/colors.ts   # restyle, pinched colour (Task 10)
├── area/AreaPanel.tsx           # restyle, uncertainty notes (Task 11)
├── notebook/dates.ts            # new: formatDate (Task 12)
├── notebook/compare.ts, NotebookPanel.tsx, Summary.tsx   # notes, restyle (Task 12)
apps/web/e2e/layout.spec.ts, stage.spec.ts   # new (Task 13)
apps/web/playwright.config.ts    # three projects (Task 13)
docs/superpowers/specs/2026-11-03-phase-1-hip-atlas-design.md   # amendment (Task 6)
```

Commands used below, from the repo root:

- One unit test file: `npm test -w apps/web -- src/path/File.test.tsx`
- All unit tests: `npm test`
- Build with type check: `npm run build`
- End to end: `npm run e2e -w apps/web -- --trace off`

---

### Task 1: Tokens and shared control styles

**Files:**
- Modify: `apps/web/src/index.css`

**Interfaces:**
- Produces: CSS variables on `:root` and the classes `.btn`, `.btn--primary`, `.field`. Later tasks use these names.

- [ ] **Step 1: Add the token block to `:root`**

Keep `--bg`, `--panel`, `--text`, `--muted`. Add, with today's values:

```css
--surface-2: #262b33;      /* raised surface: buttons, chips, the current card */
--border: #3a414c;
--divider: #2c323b;
--accent: #8ab4f8;
--accent-surface: #2f3a4a;
--warn-bg: #5c4400;
--warn-fg: #fff3cd;
--radius: 8px;
--tap: 44px;
--gap-1: 4px; --gap-2: 8px; --gap-3: 12px; --gap-4: 16px; --gap-5: 20px;
```

- [ ] **Step 2: Replace every hex colour below the token block with its variable**

`#14171c` becomes `var(--bg)`. Border radius `6px` on controls becomes `var(--radius)`. `min-height: 44px` becomes `var(--tap)`. The print block and the four `.swatch--*` rules keep their literals (Task 10 removes the swatch rules).

- [ ] **Step 3: Add `.btn`, `.btn--primary` and `.field`, and delete the five copies**

`.btn`: `min-height: var(--tap)`, `padding: 0 14px`, `border: 1px solid var(--border)`, `border-radius: var(--radius)`, `background: var(--surface-2)`, `color: var(--text)`, `font: inherit`. `.btn:disabled`: `opacity: 0.5`. `.btn--primary`: `border-color: var(--accent)`, `background: var(--accent-surface)`, `font-weight: 600`. `.btn[aria-pressed="true"]` takes the rule now at `.movement-choices button[aria-pressed="true"]`. `.field` takes the rule now at `.search-field` without its flex lines.

Give every `<button>` in `.panel-actions`, `.layers-panel`, `.movement-choices` and the review banner `className="btn"` (or add it to an existing class), and the selects and the search field `className="field"` plus their own class. Then delete the button rules at `.panel-actions button`, `.layers-toggle`, `.layers-panel button`, `.region-picker, .lang-picker`, `.movement-choices button` and the two `:disabled` copies.

- [ ] **Step 4: Verify**

Run: `grep -nE '#[0-9a-fA-F]{3,6}\b' apps/web/src/index.css`
Expected: matches only inside `:root`, the `.swatch--*` rules and `@media print`.

Run: `npm test && npm run build && npm run e2e -w apps/web -- --trace off`
Expected: all pass. Nothing visible changes.

- [ ] **Step 5: Commit**

```bash
git add apps/web/src
git commit -m "Move colours and control styles into shared variables and classes"
```

---

### Task 2: Grid shell, layout hook and the navigation rail

**Files:**
- Create: `apps/web/src/ui/useMedia.ts`, `apps/web/src/ui/useMedia.test.tsx`, `apps/web/src/ui/icons.tsx`
- Modify: `apps/web/src/App.tsx`, `apps/web/src/ui/ModeBar.tsx`, `apps/web/src/ui/PanelArea.tsx`, `apps/web/src/ui/TopBar.tsx`, `apps/web/src/index.css`, both language files
- Test: `apps/web/src/ui/ModeBar.test.tsx`, `apps/web/src/App.test.tsx`, `apps/web/src/ui/TopBar.test.tsx`

**Interfaces:**
- Produces:
  - `useMedia(query: string): boolean`, `WIDE_QUERY = "(min-width: 900px)"`, `SHORT_QUERY = "(max-width: 899px) and (max-height: 700px)"`, `useWide(): boolean`, `useShort(): boolean`. Where `window.matchMedia` does not exist they return `false`.
  - `icons.tsx` exports one component per icon, each `(props: { size?: number }) => JSX.Element`, drawn with strokes, `aria-hidden="true"`: `StructuresIcon`, `MovementsIcon`, `SpotIcon`, `NotebookIcon`, `SearchIcon`, `SettingsIcon`, `LayersIcon`, `ResetIcon`, `PlusIcon`, `MinusIcon`, `CloseIcon`, `BackIcon`, `LockIcon`, `AlertIcon`, `CheckIcon`.
  - `ModeBar` props gain `vertical: boolean`.
  - App markup classes: `.app` (grid), `.top-bar` (`top`), `.nav` (`nav`), `.stage` (`stage`), `.side` (`side`) holding `.layers-slot`, `.panel` and `.side-foot` in that order.
  - A test helper in `apps/web/src/ui/fixture.ts`: `setViewport(kind: "phone" | "wide" | "short"): void`. It installs a `window.matchMedia` stub that answers `WIDE_QUERY` and `SHORT_QUERY` for that kind and notifies listeners.

- [ ] **Step 1: Write the failing tests**

`useMedia.test.tsx`:

```tsx
test("useWide follows the 900 px query and updates on change", () => {
  setViewport("phone");
  const { result } = renderHook(() => useWide());
  expect(result.current).toBe(false);
  act(() => setViewport("wide"));
  expect(result.current).toBe(true);
});
test("without matchMedia the hooks say false", () => {
  // @ts-expect-error removing it on purpose
  delete window.matchMedia;
  expect(renderHook(() => useWide()).result.current).toBe(false);
});
```

`ModeBar.test.tsx`, added:

```tsx
test("vertical: Up and Down move, Left and Right do nothing, and the list says it is vertical", async () => {
  // render with vertical, modes atlas/movement/area/notebook, mode "atlas"
  expect(screen.getByRole("tablist")).toHaveAttribute("aria-orientation", "vertical");
  await user.keyboard("{ArrowDown}");   // onChange called with "movement"
  await user.keyboard("{ArrowRight}");  // onChange not called again
});
test("vertical with two tabs wraps: Up on the first goes to the last", ...); // modes ["atlas","area"], expects onChange("area")
test("each tab is tied to the panel", () => {
  // every tab has id `tab-${mode}` and aria-controls "tabpanel"
});
```

`App.test.tsx`, added:

```tsx
test("the app name is the page heading", ...);           // getByRole("heading", { level: 1, name: "anatoMe" })
test("the panel is the tab panel of the selected tab", ...); // getByRole("tabpanel") has aria-labelledby "tab-atlas"
test("the Area tab is called Under a spot", ...);         // getByRole("tab", { name: en["mode.area"] }), en["mode.area"] === "Under a spot"
test("switching between phone and wide keeps the viewer mounted and the selection", async () => {
  // count mounts of the mocked Viewer with a useEffect(() => { mounts++ }, [])
  // tap piriformis, act(() => setViewport("wide")), act(() => setViewport("phone"))
  // expect(mounts).toBe(1) and viewer.selection toEqual { sid: "piriformis", side: "l" }
});
```

- [ ] **Step 2: Run them and see them fail**

Run: `npm test -w apps/web -- src/ui/useMedia.test.tsx src/ui/ModeBar.test.tsx src/App.test.tsx`
Expected: FAIL (missing module, missing attribute, missing heading).

- [ ] **Step 3: Implement**

- `useMedia` with `useSyncExternalStore` over `matchMedia(query)` and its `change` event.
- `ModeBar`: `aria-orientation` set to `"vertical"` or `"horizontal"`. Keys: Down and Up when vertical, Right and Left when not, Home and End always. Each tab gets `id={"tab-" + m}`, `aria-controls="tabpanel"`, its icon and its name in a `<span>`. Icons by mode: atlas `StructuresIcon`, movement `MovementsIcon`, area `SpotIcon`, notebook `NotebookIcon`.
- `TopBar`: an `<h1 className="app-name">` with `t("app.name")` before the search field.
- `App.tsx`: wrap `ModeBar` in `<nav className="nav">`. Wrap the footer content in `<aside className="side">` with an empty `<div className="layers-slot">`, the `.panel` and an empty `<div className="side-foot">`. The element holding `PanelArea` gets `role="tabpanel"`, `id="tabpanel"`, `aria-labelledby={"tab-" + shownMode}` and `tabIndex={0}`. Pass `vertical={useWide()}` to `ModeBar`.
- Language files: `"app.name": "anatoMe"` in both. `"mode.area": "Under a spot"` in English. German `mode.area` stays "Stelle".
- CSS: `.app` becomes a grid.

```css
.app { display: grid; height: 100dvh; grid-template: "top" auto "stage" minmax(220px, 1fr) "side" auto "nav" auto / minmax(0, 1fr); }
.side { grid-area: side; display: flex; flex-direction: column; max-height: 45dvh; min-height: 0; }
@media (min-width: 900px) {
  .app { grid-template: "top top top" auto "nav stage side" minmax(0, 1fr) / 176px minmax(0, 1fr) 320px; }
  .side { max-height: none; border-left: 1px solid var(--divider); }
}
@media (min-width: 1100px) {
  .app { grid-template-columns: 208px minmax(0, 1fr) 380px; }
}
```

The `.panel` keeps its scroll behaviour inside `.side`. On the phone `.nav` is a row of four equal tabs with the icon above the name, 12 px text, and `padding-bottom: env(safe-area-inset-bottom)`. On the wide layout `.nav` is a column, each tab a row with the icon left of the name, the selected tab on `var(--accent-surface)`. The review banner and the review stage keep working: the banner sits inside `top`, the review list replaces the stage as today.

- [ ] **Step 4: Run the tests, the build and the e2e, and fix the specs that named the old tab text**

Run: `npm test && npm run build && npm run e2e -w apps/web -- --trace off`
Expected: PASS. `e2e/area.spec.ts` and any unit test that used the literal "Area" now read the name from `en.json`.

- [ ] **Step 5: Commit**

```bash
git add apps/web
git commit -m "Lay the app out as a grid with a navigation rail on wide screens"
```

---

### Task 3: Layers gets its own place

**Files:**
- Modify: `apps/web/src/App.tsx`, `apps/web/src/ui/PanelArea.tsx`, `apps/web/src/ui/TopBar.tsx`, `apps/web/src/layers/LayersPanel.tsx`, `apps/web/src/index.css`, both language files
- Test: `apps/web/src/App.test.tsx`, `apps/web/src/layers/LayersPanel.test.tsx`, `apps/web/src/ui/TopBar.test.tsx`

**Interfaces:**
- Consumes: `useWide`, `setViewport`, `LayersIcon`, `.layers-slot`.
- Produces:
  - `LayersPanel` gains `onClose?: () => void`. With it, a button named `t("layers.close")` shows next to the title.
  - `PanelArea` loses the props `layersOpen`, `layers` and `setLayers`.
  - `TopBar` loses `layersOpen` and `onToggleLayers`.
  - App keeps `layersOpen` state. A stage button named `t("layers.open")` with `aria-expanded` opens it on the phone. Task 6 moves this button into `StageControls`. Until then it is a plain button in the bottom right corner of `.stage` with the class `stage-btn`.

- [ ] **Step 1: Write the failing tests** in `App.test.tsx`

```tsx
test("wide: the layers section is always there, next to the tab panel", async () => {
  setViewport("wide"); // render, wait for data
  expect(screen.getByTestId("layers-panel")).toBeVisible();
  expect(screen.getByTestId("info-label")).toBeVisible();       // the Structures hint is still shown
  expect(screen.queryByRole("button", { name: en["layers.close"] })).toBeNull();
});
test("phone: the layers button opens Layers in the sheet, and a tab change closes it", async () => {
  setViewport("phone");
  await user.click(screen.getByRole("button", { name: en["layers.open"] }));
  expect(screen.getByTestId("layers-panel")).toBeVisible();
  await user.click(screen.getByRole("tab", { name: en["mode.movement"] }));
  expect(screen.queryByTestId("layers-panel")).toBeNull();
  expect(screen.getByTestId("movement-panel")).toBeVisible();
});
test("phone: a tap on a structure closes Layers and shows the structure", ...);  // open layers, click "tap piriformis", info-panel visible
test("phone: the close button closes Layers", ...);
test("the top bar has no layers button", ...);  // within(banner) queryByRole("button", { name: en["layers.open"] }) is null
test("going from phone to wide with Layers open keeps Layers, the selection and the tab", async () => {
  // phone, tap piriformis, open layers, act(() => setViewport("wide"))
  // layers-panel and info-panel are both visible, no close button, viewer.selection is still piriformis left
  // act(() => setViewport("phone")): the info panel shows and Layers is closed
});
```

- [ ] **Step 2: Run them and see them fail**

Run: `npm test -w apps/web -- src/App.test.tsx`
Expected: FAIL.

- [ ] **Step 3: Implement**

- Move the four layer handlers (`peel`, `restore`, `toggleTissue`, `showStructure`) from `PanelArea` into `App`, using `structures`.
- `App` renders `LayersPanel` in `.layers-slot` when `wide || layersOpen`. On the phone it passes `onClose`, and the tab panel element gets the `hidden` attribute while Layers is open, so the tab's state is kept.
- `setLayersOpen(false)` in the `ModeBar` change handler, in `tapModel` when `sel !== null`, in `overUnder` and in `openMovement`. `chooseResult` and `changeRegion` already close it.
- Remove the toggle from `TopBar`.
- Going from phone to wide sets `layersOpen` to false, so coming back to the phone starts with Layers closed.
- On the wide layout `.layers-slot` has a bottom border and does not scroll away. The hidden-structures list appears only when something is hidden, as today.
- Update the existing tests that opened Layers through the top bar.

- [ ] **Step 4: Run everything**

Run: `npm test && npm run build && npm run e2e -w apps/web -- --trace off`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add apps/web
git commit -m "Give Layers its own section so it no longer replaces the tab panel"
```

---

### Task 4: Language, credits and the educational line move

**Files:**
- Create: `apps/web/src/ui/AppDialog.tsx`, `apps/web/src/ui/AppDialog.test.tsx`, `apps/web/src/ui/LanguagePicker.tsx`
- Modify: `apps/web/src/ui/Credits.tsx`, `apps/web/src/ui/TopBar.tsx`, `apps/web/src/App.tsx`, `apps/web/src/index.css`, both language files, `apps/web/e2e/atlas.spec.ts`
- Test: `apps/web/src/ui/Credits.test.tsx`, `apps/web/src/App.test.tsx`

**Interfaces:**
- Consumes: `useWide`, `SettingsIcon`, `CloseIcon`, `.nav`, `.side-foot`.
- Produces:
  - `AppDialog(props: { open: boolean; title: string; closeLabel: string; onClose: () => void; children: ReactNode })`. A native `<dialog>` opened with `showModal()`, with the title as `h2`, a close button, and `onClose` called for the button, the Escape key and a click on the backdrop.
  - `LanguagePicker(props: { t: Translate; lang: Lang; onLang: (lang: Lang) => void; showLabel: boolean })`. A `<label>` with the visible text `t("lang.label")` when `showLabel`, else `aria-label`.
  - `CreditsBody(props: { t: Translate })` in `Credits.tsx`: the credit list and the lines under it, with no `details` wrapper and no language picker. The old `Credits` export is removed.
  - `TopBar` gains `onSettings?: () => void`. With it, a button named `t("settings.title")` shows.
- New texts: `"settings.title"`: "Settings" / "Einstellungen". `"dialog.close"`: "Close" / "Schließen".

Where things go:

| Item | Wide | Phone |
|---|---|---|
| Educational line | bottom of `.nav` | top of `.panel`, pinned, as today |
| Credits | a `.btn` named `t("credits.title")` at the bottom of `.nav`, opens the dialog with `CreditsBody` | inside the settings dialog |
| Language picker | `.side-foot`, `showLabel` true | inside the settings dialog, above the credits |
| Settings button | not shown | in the top bar |

The last-resort error page (`extra` of the outer boundary) shows `EducationalLine` and `CreditsBody` directly, with no dialog.

- [ ] **Step 1: Write the failing tests**

`AppDialog.test.tsx`:

```tsx
test("opens as a modal with its title and closes on the button and on Escape", async () => {
  // render open, title "Settings": getByRole("dialog", { name: "Settings" }) is there
  // click getByRole("button", { name: "Close" }) -> onClose called once
  // fireEvent(dialog, new Event("cancel")) -> onClose called twice
});
test("closed means nothing is shown", ...); // queryByRole("dialog") is null
```

If jsdom has no `showModal`, add a small stub for it in the test setup file and say so in the build report.

`App.test.tsx`:

```tsx
test("wide: the educational line and the credits button sit in the rail, the language picker in the side foot", async () => {
  setViewport("wide");
  const rail = screen.getByRole("navigation");
  expect(within(rail).getByText(en["about.educational"])).toBeVisible();
  await user.click(within(rail).getByRole("button", { name: en["credits.title"] }));
  expect(within(screen.getByRole("dialog")).getByText(en["credits.modified"])).toBeVisible();
  expect(screen.getByLabelText(en["lang.label"])).toBeVisible();
});
test("phone: settings opens the language picker and the credits", async () => {
  setViewport("phone");
  expect(screen.getAllByText(en["about.educational"])).toHaveLength(1);
  await user.click(screen.getByRole("button", { name: en["settings.title"] }));
  const dialog = screen.getByRole("dialog", { name: en["settings.title"] });
  await user.selectOptions(within(dialog).getByLabelText(en["lang.label"]), "de");
  expect(document.documentElement.lang).toBe("de");
});
test("the last-resort error page still shows the educational line and the credits", ...);
```

- [ ] **Step 2: Run them and see them fail**

Run: `npm test -w apps/web -- src/ui/AppDialog.test.tsx src/App.test.tsx src/ui/Credits.test.tsx`
Expected: FAIL.

- [ ] **Step 3: Implement as the table says**

App state: `dialog: "settings" | "credits" | null`. Changing layout while a dialog is open closes it.

- [ ] **Step 4: Update `e2e/atlas.spec.ts`**

The step that clicked the credits title becomes: click the settings button, then expect the educational line and a credit line. Run everything:

Run: `npm test && npm run build && npm run e2e -w apps/web -- --trace off`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add apps/web
git commit -m "Move language and credits into a dialog and the rail"
```

---

### Task 5: A handle on the viewer and the camera direction

**Files:**
- Create: `apps/web/src/viewer/handle.ts`
- Modify: `apps/web/src/viewer/Viewer.tsx`, `apps/web/src/viewer/Scene.tsx`, `apps/web/src/viewer/RegionModel.tsx`
- Test: `apps/web/src/viewer/Viewer.test.tsx`

**Interfaces:**
- Produces:

```ts
// viewer/handle.ts
export type ViewDirection = readonly [number, number, number];
export type ViewerHandle = {
  // Frames the whole model again, as on first load, with a glide.
  resetView(): void;
  // Multiplies the camera distance. 0.8 comes closer, 1.25 moves away. The controls' limits still hold.
  zoomBy(factor: number): void;
};
```

  - `Viewer` and `Scene` props gain `handle?: Ref<ViewerHandle>` and `onView?: (direction: ViewDirection) => void`.
  - `direction` is the unit vector from the camera's target to the camera, in model space. It is reported once after the first framing and again each time the camera comes to rest.

- [ ] **Step 1: Write the failing tests** in `Viewer.test.tsx`

The file already stubs the controls. Make `fitToBox` and `dollyTo` `vi.fn`s, give the stub a `distance` of 2, `getTarget` and `getPosition` that fill a vector, and `addEventListener`.

```tsx
test("resetView frames the whole model again with a glide", async () => {
  // render with a handle ref, wait for load
  fitToBox.mockClear();
  act(() => handle.current!.resetView());
  expect(fitToBox).toHaveBeenCalledTimes(1);
  expect(fitToBox.mock.calls[0][1]).toBe(true);
});
test("zoomBy multiplies the distance", () => {
  act(() => handle.current!.zoomBy(0.8));
  expect(dollyTo).toHaveBeenCalledWith(1.6, true);
});
test("onView reports the direction after the first framing and when the camera rests", () => {
  // stub position (0, 0, 2), target (0, 0, 0)
  expect(onView).toHaveBeenLastCalledWith([0, 0, 1]);
  // move stub position to (2, 0, 0), fire the controls' rest event
  expect(onView).toHaveBeenLastCalledWith([1, 0, 0]);
});
test("the handle does nothing before the model has loaded", ...); // no throw, fitToBox not called
```

- [ ] **Step 2: Run them and see them fail**

Run: `npm test -w apps/web -- src/viewer/Viewer.test.tsx`
Expected: FAIL.

- [ ] **Step 3: Implement in `RegionModel`**

`useImperativeHandle` on the passed ref. `resetView` reuses the box and padding of the first framing. `zoomBy` calls `controls.dollyTo(controls.distance * factor, true)`. The direction callback listens to the controls' `rest` event (check the camera-controls docs for the exact event name). Nothing here runs per frame, so the render loop stays on demand.

- [ ] **Step 4: Run the tests and the build**

Run: `npm test && npm run build`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add apps/web/src/viewer
git commit -m "Let the app reset and zoom the view and hear where the camera looks"
```

---

### Task 6: Stage controls

**Files:**
- Create: `apps/web/src/stage/view.ts`, `apps/web/src/stage/view.test.ts`, `apps/web/src/stage/StageControls.tsx`, `apps/web/src/stage/StageControls.test.tsx`
- Modify: `apps/web/src/App.tsx`, `apps/web/src/ui/RegionInfo.tsx`, `apps/web/src/index.css`, both language files, `docs/superpowers/specs/2026-11-03-phase-1-hip-atlas-design.md`
- Test: `apps/web/src/App.test.tsx`

**Interfaces:**
- Consumes: `ViewerHandle`, `ViewDirection`, `useWide`, the icons.
- Produces:

```ts
// stage/view.ts
export type ViewName = "front" | "back" | "left" | "right" | "top" | "bottom";
// The body faces +z, its head is at +y and its left side is at +x.
export function viewOf(direction: ViewDirection): ViewName;
// Which body side is at the left and at the right edge of the screen. null when the view is not from the front or back.
export function markersOf(view: ViewName): { screenLeft: "l" | "r"; screenRight: "l" | "r" } | null;
```

```ts
// stage/StageControls.tsx
type Props = {
  t: Translate;
  wide: boolean;
  // The selected structure's name without its side, and its side. null when nothing is selected.
  selected: { name: string; side: "l" | "r" | "" } | null;
  view: ViewName | null;            // null until the camera has reported
  onClearSelection: () => void;
  onReset: () => void;
  onZoom: (factor: number) => void;
  layersOpen: boolean;
  onToggleLayers: () => void;       // phone only
};
```

- New texts (English / German):

| Key | English | German |
|---|---|---|
| `stage.clear` | Clear the selection | Auswahl aufheben |
| `stage.side.l` | left | links |
| `stage.side.r` | right | rechts |
| `stage.left` | LEFT | LINKS |
| `stage.right` | RIGHT | RECHTS |
| `view.front` | Front view | Ansicht von vorn |
| `view.back` | Back view | Ansicht von hinten |
| `view.left` | Left side | Linke Seite |
| `view.right` | Right side | Rechte Seite |
| `view.top` | From above | Von oben |
| `view.bottom` | From below | Von unten |
| `stage.hint` | Drag to turn, scroll to zoom, click a structure | Ziehen dreht, Scrollen zoomt, Klick wählt eine Struktur |
| `stage.zoomIn` | Zoom in | Vergrößern |
| `stage.zoomOut` | Zoom out | Verkleinern |
| `stage.reset` | Reset the view | Ansicht zurücksetzen |

- [ ] **Step 1: Write the failing tests**

`view.test.ts`:

```ts
test.each([
  [[0, 0, 1], "front"], [[0, 0, -1], "back"], [[1, 0, 0], "left"], [[-1, 0, 0], "right"],
  [[0, 1, 0], "top"], [[0, -1, 0], "bottom"], [[0.3, 0.2, 0.93], "front"],
] as const)("viewOf(%j) is %s", (dir, name) => expect(viewOf(dir)).toBe(name));
test("a tie goes to front or back first, then left or right", () => {
  expect(viewOf([0.7071, 0, 0.7071])).toBe("front");
  expect(viewOf([0.7071, 0.7071, 0])).toBe("left");
});
test("a zero or broken direction is the front view", () => {
  expect(viewOf([0, 0, 0])).toBe("front");
  expect(viewOf([NaN, 0, 0])).toBe("front");
});
test("markers: from the front the body's right is on the screen's left", () => {
  expect(markersOf("front")).toEqual({ screenLeft: "r", screenRight: "l" });
  expect(markersOf("back")).toEqual({ screenLeft: "l", screenRight: "r" });
  expect(markersOf("left")).toBeNull();
  expect(markersOf("top")).toBeNull();
});
```

`StageControls.test.tsx`:

```tsx
test("the chip names the selection in a status region that is always there", () => {
  // selected null: getByRole("status") is in the document and empty, no clear button
  // rerender selected { name: "Piriformis", side: "l" }: status has text "Piriformis" and "left"
  // click getByRole("button", { name: en["stage.clear"] }) -> onClearSelection called
});
test("a midline structure shows no side word", ...);          // side "" -> no "left" or "right" text in the status
test("front view: badge and both markers", ...);              // view "front": texts en["view.front"], en["stage.right"], en["stage.left"]
test("side view: badge, no markers", ...);                    // view "left": en["view.left"] shown, en["stage.left"] not in the document
test("no view yet: no badge and no markers", ...);
test("wide: zoom buttons and the hint, no layers button", async () => {
  // click zoomIn -> onZoom(0.8), zoomOut -> onZoom(1.25), reset -> onReset
  // getByText(en["stage.hint"]), queryByRole("button", { name: en["layers.open"] }) is null
});
test("phone: layers and reset buttons, no zoom buttons and no hint", ...); // layers button has aria-expanded matching layersOpen
```

`App.test.tsx`:

```tsx
test("selecting a structure on the Movements tab still names it in the chip", ...);
test("a structure the data does not know shows its file label in the chip", ...);
test("the chip's clear button clears the selection", ...);   // viewer.selection toBeNull()
```

- [ ] **Step 2: Run them and see them fail**

Run: `npm test -w apps/web -- src/stage src/App.test.tsx`
Expected: FAIL.

- [ ] **Step 3: Implement**

- `viewOf`: the axis with the largest absolute value decides. On a tie z wins over x, and x over y. Anything not finite, or all zero, is "front".
- `StageControls` renders into `.stage` as a sibling of the viewer: `.stage-chip` top left, `.stage-marker--left` and `.stage-marker--right` in the bottom corners, `.stage-view` (badge, and the hint when wide) bottom left, `.stage-buttons` bottom right. The wrapper has `pointer-events: none` and each control `pointer-events: auto`, so drags next to them reach the canvas. On the phone the markers sit on the same line as the badge. Buttons are 44 px squares with an `aria-label`.
- `App`: a `useRef<ViewerHandle>` passed to `Viewer`, `view` state set from `onView` through `viewOf`, and `StageControls` wired up. The name for the chip is the structure's name in the current language, or the file label for an unknown structure. Remove the temporary layers button from Task 3.
- `RegionInfo`: remove `aria-live` from the hint. The chip is now the one status region for the selection.
- The left and right truth is pinned by an end-to-end test in Task 13.

- [ ] **Step 4: Amend the Phase 1 spec**

In `docs/superpowers/specs/2026-11-03-phase-1-hip-atlas-design.md`, section 5.1, after the sentence that ends "no horizontal scroll at 360 px wide", add:

> Amended on 2026-11-16: nothing covers the centre of the stage. Small controls may sit at its edges and corners. See `2026-11-16-three-column-layout-design.md`, section 8.

- [ ] **Step 5: Run everything**

Run: `npm test && npm run build && npm run e2e -w apps/web -- --trace off`
Expected: PASS.

- [ ] **Step 6: Commit**

```bash
git add apps/web docs
git commit -m "Add the stage controls: name chip, side markers, view badge, zoom and reset"
```

---

### Task 7: Room for the model on a short phone

**Files:**
- Modify: `apps/web/src/ui/TopBar.tsx`, `apps/web/src/App.tsx`, `apps/web/src/index.css`, both language files
- Test: `apps/web/src/ui/TopBar.test.tsx`

**Interfaces:**
- Consumes: `useShort`, `SearchIcon`, `setViewport("short")`.
- Produces: `TopBar` gains `compact: boolean`. New text `"search.open"`: "Search" / "Suche".

- [ ] **Step 1: Write the failing tests** in `TopBar.test.tsx`

```tsx
test("compact: a search button stands in for the field", async () => {
  // compact true: queryByRole("searchbox") is null, getByRole("button", { name: en["search.open"] }) has aria-expanded "false"
  await user.click(button);
  expect(screen.getByRole("searchbox")).toHaveFocus();
});
test("compact: the field closes again when it is empty and loses focus", ...);
test("compact: the field stays open while it holds text", ...);
test("not compact: the field is always there and there is no search button", ...);
```

- [ ] **Step 2: Run them and see them fail**

Run: `npm test -w apps/web -- src/ui/TopBar.test.tsx`
Expected: FAIL.

- [ ] **Step 3: Implement**

`App` passes `compact={useShort()}`. In compact mode the top bar is one row: name, region picker, search button, settings button. The open field spans the whole row over the other controls. In CSS the phone top bar is two rows (name and buttons, then the field) except under `SHORT_QUERY`, and the grid row for `stage` keeps `minmax(220px, 1fr)` so the sheet gives way first.

- [ ] **Step 4: Run everything**

Run: `npm test && npm run build && npm run e2e -w apps/web -- --trace off`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add apps/web
git commit -m "Collapse the search field on short phones so the model keeps its room"
```

---

### Task 8: Try again after a failed load

**Files:**
- Modify: `apps/web/src/data/useRegionData.ts`, `apps/web/src/viewer/ModelErrorBoundary.tsx`, `apps/web/src/viewer/Viewer.tsx`, `apps/web/src/viewer/Scene.tsx`, `apps/web/src/App.tsx`, `apps/web/src/ui/PanelArea.tsx`, `apps/web/src/movement/MovementPanel.tsx`, `apps/web/src/notebook/NotebookPanel.tsx`, both language files
- Test: `apps/web/src/data/useRegionData.test.tsx`, `apps/web/src/viewer/ModelErrorBoundary.test.tsx`, `apps/web/src/viewer/Viewer.test.tsx`, `apps/web/src/App.test.tsx`, `apps/web/src/movement/MovementPanel.test.tsx`

**Interfaces:**
- Produces:
  - `forgetFailedRegionData(): void` in `useRegionData.ts`. Removes every failed entry from the cache. Pending and done entries stay.
  - `ModelErrorBoundary` gains `onRetry?: () => void`. With it, and when the failure is not the WebGL one, a `.btn` named `t("error.retry")` shows under the message. A click calls `onRetry` and clears the boundary's failed state.
  - `Viewer` gains `onRetry: () => void`.
  - `forgetModelFiles(urls: string[]): void` exported from `Scene.tsx`. Clears the loader's cache for those files.
  - App: `notebookFailure: "blocked" | "load" | null` replaces `notebookError`. `PanelArea` and `NotebookPanel` take `storeFailure` with that type in place of `storeError`.
  - `logMovement` and the `onLog` prop become `(input) => Promise<boolean>`. `true` means saved.
- Texts:

| Key | English | German |
|---|---|---|
| `error.retry` | Try again | Erneut versuchen |
| `error.modelLoad` (changed) | The 3D model could not be loaded. Check your connection and try again. | Das 3D-Modell konnte nicht geladen werden. Prüfe deine Verbindung und versuche es erneut. |
| `error.dataLoad` (changed) | The information about the structures could not be loaded. Check your connection and try again. | Die Informationen zu den Strukturen konnten nicht geladen werden. Prüfe deine Verbindung und versuche es erneut. |
| `notebook.saveFailed` | The note could not be saved. Try again. | Die Notiz konnte nicht gespeichert werden. Versuche es erneut. |
| `notebook.loadFailed` | This part of the app could not be loaded. Check your connection and try again. | Dieser Teil der App konnte nicht geladen werden. Prüfe deine Verbindung und versuche es erneut. |

`notebook.unavailable` keeps its text and now means only that storage is blocked.

- [ ] **Step 1: Write the failing tests**

`useRegionData.test.tsx`:

```tsx
test("after forgetFailedRegionData a failed region is fetched again", async () => {
  // fetch answers 404 once, then the bundle. First render shows the boundary's error.
  // forgetFailedRegionData(), rerender with a new key: the bundle arrives. expect(fetch).toHaveBeenCalledTimes(2)
});
test("forgetFailedRegionData leaves loaded regions alone", ...); // fetch count stays 1
```

`ModelErrorBoundary.test.tsx`:

```tsx
test("with onRetry a failed load shows Try again, and a click renders the children again", ...);
test("the WebGL message has no Try again button", ...);
test("a child that fails again shows the message and the button again", ...);
```

`App.test.tsx`:

```tsx
test("data: Try again fetches the data once more and shows the panel", ...);
test("data: Try again while still offline shows the error and the button again, one request per press", async () => {
  // data requests answer 404 three times. Press Try again twice.
  // the alert and the button are there after each press, and the data url was fetched exactly 3 times
});
test("data: going to another region and back fetches again", ...);
test("model: Try again reads the manifest again after it failed", ...);  // manifest fails once, then loads. Viewer gets files with urls.
test("notebook: a store that is blocked says so", ...);                  // openNotebook rejects -> en["notebook.unavailable"]
test("notebook: a save that fails says so and keeps the typed note", async () => {
  // store.put rejects. Type "sharp pain", press Save.
  // getByText(en["notebook.saveFailed"]) and the textarea still has "sharp pain"
});
test("notebook: a part that failed to load says so and can be tried again", ...); // lazyParts.panelFails once -> en["notebook.loadFailed"]. Leave the tab and come back: the panel shows.
test("notebook: after a failed open the next log tries again", ...);     // openNotebook rejects once, then works. Second save shows en["notebook.saved"].
```

`Viewer.test.tsx`:

```tsx
test("Try again after a model failure loads the scene again", ...); // the mocked loader throws once. Click the button. The loading text, then onLoaded.
```

- [ ] **Step 2: Run them and see them fail**

Run: `npm test -w apps/web -- src/data src/viewer src/App.test.tsx src/movement`
Expected: FAIL.

- [ ] **Step 3: Implement**

- Data: the inner boundary in `App` gets `onRetry={forgetFailedRegionData}`. `changeRegion` calls `forgetFailedRegionData()` too.
- Model: three things remember a failure, and "Try again" clears all three. The manifest: move the manifest read into a function `readManifest()` in `App` that the first effect and `Viewer`'s `onRetry` both call when `models` holds an error. The model files: `Viewer` calls `import("./Scene").then((m) => m.forgetModelFiles(urls))` before it remounts. The lazy 3D code: `Viewer` keeps an attempt counter and makes a fresh `lazy(() => import("./Scene"))` for each attempt with `useMemo`. The watchdog starts again with each attempt.
- Notebook: in `openStore`, a rejection sets `notebookOpening.current = null`. `logMovement` tells the three cases apart: the `import` failing is "load", `openNotebook` failing is "blocked", `put` failing is a failed save. The notice key follows. The notebook tab's `QuietBoundary` fallback shows `notebook.loadFailed`, and leaving and reopening the tab mounts a fresh lazy panel.
- `LogMovement` awaits `onLog` and closes the form only on `true`.

- [ ] **Step 4: Run everything, and `node apps/web/scripts/error-check.mjs`**

Run: `npm test && npm run build && npm run e2e -w apps/web -- --trace off && node apps/web/scripts/error-check.mjs`
Expected: PASS. If `error-check.mjs` looks for the old message text, update the text it expects.

- [ ] **Step 5: Commit**

```bash
git add apps/web
git commit -m "Let failed loads be tried again and say what went wrong in the notebook"
```

---

### Task 9: Panel pieces and the Structures panel

**Files:**
- Create: `apps/web/src/ui/pieces.tsx`, `apps/web/src/ui/pieces.test.tsx`
- Modify: `apps/web/src/ui/InfoPanel.tsx`, `apps/web/src/ui/RegionInfo.tsx`, `apps/web/src/layers/LayersPanel.tsx`, `apps/web/src/index.css`, both language files
- Test: `apps/web/src/ui/InfoPanel.test.tsx`

**Interfaces:**
- Consumes: `useWide`.
- Produces, in `pieces.tsx`:

```tsx
export function PanelTitle(props: { children: ReactNode; sub?: ReactNode }): JSX.Element;   // <h2 class="panel-title"> and <p class="panel-sub">
export function Chip(props: { children: ReactNode; tone?: "plain" | "warn"; icon?: ReactNode }): JSX.Element;  // <span class="chip">
export function Chips(props: { children: ReactNode }): JSX.Element;                          // the row that holds chips
export function SectionHeading(props: { children: ReactNode; swatch?: string }): JSX.Element; // <h3 class="section-heading">, swatch is a colour
export function Card(props: { children: ReactNode; current?: boolean; as?: "div" | "li" }): JSX.Element;       // class "card", "card--current"
export function KeyValue(props: { rows: { key: string; value: ReactNode }[] }): JSX.Element;  // <dl class="kv">
```

CSS for them: `.panel-title` 1.5rem semibold. `.chip` 13 px text, `padding: 3px 10px`, pill radius, `var(--surface-2)`. `.chip--warn` on `#4a3a14` with `#ffe2a6` text, both added as tokens `--warn-chip-bg` and `--warn-chip-fg`. `.section-heading` 13 px, semibold, `var(--muted)`, `text-transform: uppercase`, `letter-spacing: 0.04em`. `.card` `padding: 12px 14px`, `border: 1px solid var(--divider)`, `border-radius: var(--radius)`, column flex with 4 px gap. `.card--current` `background: var(--surface-2)`, `border-color: var(--border)`. `.kv` a two-column grid, key column 72 px, keys in `var(--muted)`. All panels share one `.panel-body` rule: column flex, 20 px gap, 15 px text. The per-panel typography rules (`.info-panel h2` and the like) are deleted as each panel moves over.

- Text changes (English / German). For the four attachment keys, cut the existing German texts at the first ": " the same way.

| Key | English | German |
|---|---|---|
| `info.tapHint` (changed) | Tap a structure to learn about it | Tippe auf eine Struktur, um mehr zu erfahren |
| `info.clickHint` | Click a structure to learn about it | Klicke auf eine Struktur, um mehr zu erfahren |
| `info.tapHelp` | Drag to turn the model, pinch to zoom, or search by name above. | Ziehen dreht das Modell, zwei Finger zoomen. Oder suche oben nach einem Namen. |
| `info.originLabel` | Starts at | the part of German `info.origin` before ": " |
| `info.originValue` | {landmark} of the {bone} | the part of German `info.origin` after ": " |
| `info.insertionLabel` | Ends at | the part of German `info.insertion` before ": " |
| `info.insertionValue` | {landmark} of the {bone} | the part of German `info.insertion` after ": " |
| `info.sideChip.l` | Left side | Linke Seite |
| `info.sideChip.r` | Right side | Rechte Seite |
| `info.otherSide.l` | Left side | Linke Seite |
| `info.otherSide.r` | Right side | Rechte Seite |
| `info.hideShort` | Hide | Ausblenden |
| `info.overUnderShort` | Over and under | Darüber und darunter |

Removed keys: `info.type`, `info.origin`, `info.insertion`. The review list uses `info.origin` and `info.insertion` today. Give it the label and value keys joined with ": " so its text does not change.

- [ ] **Step 1: Write the failing tests**

`pieces.test.tsx`: one test per piece that it renders the element and class named above, that `Card current` adds `card--current`, and that `SectionHeading swatch="#d1495b"` renders an `aria-hidden` swatch with that background.

`InfoPanel.test.tsx`, changed and added:

```tsx
test("the title is the name alone, and chips give the type and the side", () => {
  // piriformis, side "l"
  expect(screen.getByRole("heading", { level: 2, name: "Piriformis" })).toBeVisible();
  expect(screen.getByText(en["type.muscle"])).toHaveClass("chip");
  expect(screen.getByText(en["info.sideChip.l"])).toHaveClass("chip");
});
test("a midline structure has no side chip", ...);
test("attachments are a list of label and value pairs", () => {
  expect(screen.getByText(en["info.originLabel"]).tagName).toBe("DT");
  // the value next to it holds the landmark and the bone, as before
});
test("the waiting line is a card", ...);                    // getByText(en["info.pending"]).closest(".card") is not null
test("phone: the buttons use the short labels", ...);       // setViewport("phone"), side "l": en["info.otherSide.r"], en["info.hideShort"], en["info.overUnderShort"]
test("wide: the buttons use the long labels", ...);         // en["info.switchSide"], en["info.hide"], en["info.overUnder"]
test("the action buttons come before the attachments", ...); // compareDocumentPosition
```

`RegionInfo` hint:

```tsx
test("phone: the empty state has the tap heading and the help line", ...);   // en["info.tapHint"] and en["info.tapHelp"]
test("wide: the empty state says click and has no help line", ...);          // en["info.clickHint"], en["info.tapHelp"] not in the document
```

- [ ] **Step 2: Run them and see them fail**

Run: `npm test -w apps/web -- src/ui`
Expected: FAIL.

- [ ] **Step 3: Implement**

`InfoPanel` order: `PanelTitle` (name, the Latin line as `sub`), `Chips`, the action buttons, the attachments section (`SectionHeading`, `KeyValue`, sources per row as today), one section per joint with a `Card` per movement that holds its action rows, then the waiting line and the gap line as cards. Every draft mark, review note and source keeps working. The hint keeps `data-testid="info-label"`. `LayersPanel` uses `SectionHeading` for its title and `.btn` buttons.

- [ ] **Step 4: Run everything**

Run: `npm test && npm run build && npm run e2e -w apps/web -- --trace off`
Expected: PASS, after `e2e/atlas.spec.ts` reads the changed texts from `en.json`.

- [ ] **Step 5: Commit**

```bash
git add apps/web
git commit -m "Build the shared panel pieces and restyle the Structures panel with them"
```

---

### Task 10: Movements panel

**Files:**
- Modify: `apps/web/src/movement/MovementPanel.tsx`, `apps/web/src/movement/colors.ts`, `apps/web/src/notebook/LogForm.tsx`, `apps/web/src/index.css`, both language files
- Test: `apps/web/src/movement/MovementPanel.test.tsx`

**Interfaces:**
- Consumes: the pieces from Task 9, `BackIcon`.
- Produces: `HIGHLIGHT_COLORS.pinched` is `"#b47be8"`.
- Text changes:

| Key | English | German |
|---|---|---|
| `movement.back` (changed) | All movements | Alle Bewegungen |
| `movement.pickHint` | The model shows which structures take part. | Das Modell zeigt, welche Strukturen beteiligt sind. |
| `movement.degrees` | {value} degrees | {value} Grad |
| `movement.kind` | Movement | Bewegung |
| `movement.kindExercise` | Exercise | Übung |

Removed key: `movement.slider`.

- [ ] **Step 1: Write the failing tests**

```tsx
test("the picker shows each joint's movements as buttons under a section heading", ...); // heading level 3 en["movement.joint.hip"] with class section-heading, the hint line en["movement.pickHint"]
test("a picked movement has a back link above its title", async () => {
  // getByRole("button", { name: en["movement.back"] }) comes before the h2, a click calls onChange with no pick
});
test("chips name the kind and the joint", ...);              // en["movement.kind"] and en["movement.joint.hip"] as chips
test("the slider is labelled by the angle's name and shows its value next to it", () => {
  // getByRole("slider", { name: en["angle.knee_flexion"] }) and getByText("90 degrees") for a pose of 90
});
test("Log this movement is the primary button", ...);        // has class btn--primary
test("each involved structure is a card, and the selected one is the current card", ...); // closest(".card"), "card--current" for selection.sid
test("every card shows its uncertainty notes", ...);         // the confidence text and, for a row with applies_to, the Only in line
test("the group heading's swatch has the colour the model uses", () => {
  // the swatch inside the Main movers heading has background HIGHLIGHT_COLORS.primary
});
test("pinched is the lighter purple", () => expect(HIGHLIGHT_COLORS.pinched).toBe("#b47be8"));
```

Use the angle id the fixture really has in place of `knee_flexion`.

- [ ] **Step 2: Run them and see them fail**

Run: `npm test -w apps/web -- src/movement`
Expected: FAIL.

- [ ] **Step 3: Implement**

The back control is a `link-button` with `BackIcon`. The slider sits in a `Card`: one line with the angle's name and `movement.degrees`, then the `<input type="range">`, which gets `aria-label` from the angle's name and `aria-valuetext` from `movement.degrees`. Result groups use `SectionHeading` with `swatch={HIGHLIGHT_COLORS[highlight]}`. Delete the `.swatch--*` rules. The exercise view uses the same pieces: phase buttons as `.btn` with `aria-pressed`, the progress slider in a card. `LogForm` uses `.btn`, with Save as `.btn--primary`.

- [ ] **Step 4: Run everything**

Run: `npm test && npm run build && npm run e2e -w apps/web -- --trace off`
Expected: PASS, after `e2e/movement.spec.ts` reads the changed texts from `en.json`.

- [ ] **Step 5: Commit**

```bash
git add apps/web
git commit -m "Restyle the Movements panel and lighten the pinched colour"
```

---

### Task 11: Under a spot panel

**Files:**
- Modify: `apps/web/src/area/AreaPanel.tsx`, `apps/web/src/index.css`, both language files
- Test: `apps/web/src/area/AreaPanel.test.tsx`

**Interfaces:**
- Consumes: the pieces, `ActionNotes` and `describeAction`.
- Text changes:

| Key | English | German |
|---|---|---|
| `area.title` (changed) | Under this spot | Unter dieser Stelle |
| `area.subtitle` | From the surface inwards | Von der Oberfläche nach innen |

Removed key: `area.movement`.

- [ ] **Step 1: Write the failing tests**

```tsx
test("the title and the line under it", ...);                 // h2 en["area.title"], then en["area.subtitle"]
test("each layer is a numbered card, in order from the surface", () => {
  // the ordered list has one card per entry, the badges read 1, 2, ...
});
test("the entry that is selected is the current card", ...);
test("each movement that loads a structure shows what it does and its uncertainty notes", () => {
  // a fixture row with applies_to and confidence "medium":
  // the link named after the movement, the describeAction text, en["info.appliesTo"] with its text, en["confidence.medium"]
});
test("one line per action row, so two rows of the same movement both show", ...);
test("the two notes come after the list and the clear button", ...);  // compareDocumentPosition for en["area.note"] and en["area.noSkin"]
test("with no checked rows there is no Movements that load it heading, and the waiting line shows", ...); // keeps today's behaviour
```

- [ ] **Step 2: Run them and see them fail**

Run: `npm test -w apps/web -- src/area`
Expected: FAIL.

- [ ] **Step 3: Implement**

Inside each card, after the type and depth line: the muted label `area.loadedBy`, then for every action row of the structure, in the order of the bundle's movement list: a `link-button` with the movement's name that calls `onOpenMovement`, the `describeAction` text, and `ActionNotes`. The "over and under" title and the "not on this line" state keep their texts and use `PanelTitle` and a `Card`. The hint for no spot keeps its key and its test id.

- [ ] **Step 4: Run everything**

Run: `npm test && npm run build && npm run e2e -w apps/web -- --trace off`
Expected: PASS, after `e2e/area.spec.ts` reads the changed texts from `en.json`.

- [ ] **Step 5: Commit**

```bash
git add apps/web
git commit -m "Restyle Under a spot and show the uncertainty next to every load claim"
```

---

### Task 12: Notebook panel and the printed summary

**Files:**
- Create: `apps/web/src/notebook/dates.ts`, `apps/web/src/notebook/dates.test.ts`
- Modify: `apps/web/src/notebook/compare.ts`, `apps/web/src/notebook/NotebookPanel.tsx`, `apps/web/src/notebook/Summary.tsx`, `apps/web/src/index.css`, both language files
- Test: `apps/web/src/notebook/compare.test.ts`, `apps/web/src/notebook/NotebookPanel.test.tsx`, `apps/web/src/notebook/Summary.test.tsx`, `apps/web/src/notebook/wording.test.ts`

**Interfaces:**
- Consumes: the pieces, `LockIcon`, `AlertIcon`, `CheckIcon`.
- Produces:

```ts
// notebook/dates.ts
// "2026-11-14" becomes "14 Nov 2026" in English and "14.11.2026" in German. Anything that is not a real day comes back unchanged.
export function formatDate(isoDay: string, lang: Lang): string;

// notebook/compare.ts
// The weakest confidence among the rows that made the structure count, and every distinct "only in" limit among them, in row order.
export function candidateNotes(bundle: RegionBundle, cand: Candidate): { confidence: "high" | "medium" | "low"; appliesTo: string[] };
```

- Text changes:

| Key | English | German |
|---|---|---|
| `notebook.keep` | Keep and share | Aufbewahren und teilen |
| `notebook.entryAria` | {name}, {date} | {name}, {date} |

Removed key: `notebook.entry`.

- [ ] **Step 1: Write the failing tests**

`dates.test.ts`:

```ts
test("English and German", () => {
  expect(formatDate("2026-11-14", "en")).toBe("14 Nov 2026");
  expect(formatDate("2026-11-14", "de")).toBe("14.11.2026");
});
test("the day does not shift with the time zone", ...);       // "2026-01-01" stays 1 Jan 2026
test("not a real day comes back as it is", () => {
  expect(formatDate("9999-99-99", "en")).toBe("9999-99-99");
  expect(formatDate("", "de")).toBe("");
});
```

`compare.test.ts`:

```ts
test("candidateNotes takes the weakest confidence and collects the limits", () => {
  // evidence rows: one "high" with no limit, one "medium" with applies_to "hips with pincer-type impingement"
  expect(candidateNotes(bundle, cand)).toEqual({ confidence: "medium", appliesTo: ["hips with pincer-type impingement"] });
});
test("an evidence id the bundle no longer has is passed over, and no rows at all means low", ...);
```

`NotebookPanel.test.tsx`:

```tsx
test("the privacy line is in a card right under the title, with the disclaimer after it", ...);
test("a note is a card with its name, its date in the reader's language, and chips for feeling and side", () => {
  // entry date "2026-11-14", lang "de": getByText("14.11.2026"), chips en or de texts for notebook.painful and notebook.side.l
});
test("the hurts chip has the warn tone and an icon, the fine chip an icon", ...); // class chip--warn, an svg inside each
test("Delete is described by the note's name and date", ...);  // aria-describedby points at the line with name and date
test("each structure to look into shows its uncertainty notes", ...); // en["confidence.medium"] and en["info.appliesTo"] with the limit
test("print and the two backup buttons sit under Keep and share", ...);
```

`Summary.test.tsx`:

```tsx
test("the printed list shows the uncertainty notes for each structure", ...);
test("the printed dates are in the reader's language", ...);   // the date column and the Printed on line
```

`wording.test.ts` keeps passing unchanged.

- [ ] **Step 2: Run them and see them fail**

Run: `npm test -w apps/web -- src/notebook`
Expected: FAIL.

- [ ] **Step 3: Implement**

`formatDate` uses `Intl.DateTimeFormat` with the locale `en-GB` or `de-DE`, `dateStyle: "medium"` and `timeZone: "UTC"`, on a date built from the three numbers in UTC. A note card: one line with the name and the date (this line carries the id that Delete points at), `Chips` with the feeling (`tone="warn"` and `AlertIcon` for painful, `CheckIcon` for fine) and the side, the angles line, the note text, the Delete link. The candidate's button keeps its text from `candidateText`. Under it come the `info.appliesTo` lines and the confidence text from `candidateNotes`. `Summary` prints the same lines under each candidate and formats its dates with `formatDate`. The sections are "Your notes", "Structures to look into" and "Keep and share", each with a `SectionHeading`. The empty notebook keeps its text and its load button.

- [ ] **Step 4: Run everything**

Run: `npm test && npm run build && npm run e2e -w apps/web -- --trace off`
Expected: PASS, after `e2e/notebook.spec.ts` reads the changed texts from `en.json`.

- [ ] **Step 5: Commit**

```bash
git add apps/web
git commit -m "Restyle the Notebook, show uncertainty in its list and print, and localise dates"
```

---

### Task 13: Layout and stage checks in a real browser

**Files:**
- Create: `apps/web/e2e/layout.spec.ts`, `apps/web/e2e/stage.spec.ts`
- Modify: `apps/web/playwright.config.ts`

**Interfaces:**
- Produces: three Playwright projects.

```ts
projects: [
  { name: "phone", use: { viewport: { width: 412, height: 915 }, hasTouch: true, isMobile: true } },
  { name: "small-phone", use: { viewport: { width: 360, height: 640 }, hasTouch: true, isMobile: true }, testMatch: /(layout|stage)\.spec\.ts/ },
  { name: "desktop", use: { viewport: { width: 1280, height: 800 } }, testMatch: /(layout|stage)\.spec\.ts/ },
],
```

The five existing specs run in `phone` only.

- [ ] **Step 1: Write `layout.spec.ts`**

It runs once in English and once in German. German is set with `page.addInitScript(() => localStorage.setItem("anatome.lang", "de"))`. Texts come from `en.json` and `de.json`. For each language:

```ts
test("nothing overflows and nothing is cut off", async ({ page }) => {
  // goto "/", wait until the loading text is gone
  // document.documentElement.scrollWidth <= clientWidth
  // every [role=tab]: scrollWidth <= clientWidth
  // every visible button, [role=tab] and select that is not a .link-button: bounding box height >= 44
  // every visible .link-button: bounding box height >= 32
  // the stage's bounding box height >= 220
});
test("the stage keeps its room with each tab open and with a structure selected", ...); // walk the tabs, select piriformis by search, stage height >= 220 each time
test("the arrangement matches the width", async ({ page }, info) => {
  // desktop: the navigation's box is left of the stage's, the tab panel's box is right of it, the layers panel is visible
  // phone and small-phone: the navigation's top is below the tab panel's bottom, no layers panel until the layers button is pressed
});
test("small phone: the search field is behind a button", ...); // only in the small-phone project, with test.skip for the others
test("no request leaves the preview host", ...);               // same check as atlas.spec.ts
```

- [ ] **Step 2: Write `stage.spec.ts`**

```ts
test("tap a structure, see the chip, clear it, reset the view", async ({ page }) => {
  // wait for the model. Tap the stage at 62% of its width and 40% of its height: the thigh on the screen's right.
  // the status region names a structure and the word en["stage.side.l"]: the screen's right is the body's left from the front
  // the badge reads en["view.front"], the markers en["stage.right"] on the left and en["stage.left"] on the right
  // press the clear button: the status region is empty and the hint is back
  // press the reset button: no error, the badge still reads en["view.front"]
});
test("turning the model to the back swaps the markers", async ({ page }) => {
  // drag across the stage until the badge reads en["view.back"], then the left marker reads en["stage.left"]
});
```

If the tap at that spot misses the model in one project, move it and say so in the build report. Do not weaken the left and right assertion. If it fails with the spot on the model, the axis constants in `stage/view.ts` are wrong: fix them and `view.test.ts`, and report it.

- [ ] **Step 3: Run them**

Run: `npm run build && npm run e2e -w apps/web -- --trace off`
Expected: PASS in all three projects. A failure here that is a real layout problem is fixed in the CSS, not in the test.

- [ ] **Step 4: Commit**

```bash
git add apps/web
git commit -m "Check the layout at three sizes in two languages and the stage controls in a real browser"
```

---

### Task 14: Full checks and the build report

**Files:**
- Create: `docs/superpowers/reviews/three-column-layout-build-report.md`
- Modify: `docs/superpowers/reviews/progress.md`, `README.md` if it describes the layout or the tabs

- [ ] **Step 1: Run every check and keep the output**

Run: `npm run validate && npm run check-models && npm test && npm run build:review -w apps/web && npm run build && npm run e2e -w apps/web -- --trace off && node scripts/check-no-drafts.mjs && node apps/web/scripts/perf-check.mjs && node apps/web/scripts/error-check.mjs`
Expected: all pass. The perf median stays under 5000 ms. If `.venv` exists, also `npm run test:py`.

- [ ] **Step 2: Check the leftovers**

Run: `grep -rn "layers-toggle\|swatch--\|notebookError\|storeError" apps/web/src`
Expected: no matches.

Run: `npm test -w apps/web -- src/i18n`
Expected: PASS, so both language files have the same keys and placeholders.

- [ ] **Step 3: Write the build report**

Sections, as in the earlier reports: Summary, Commits (one line per task with its hash), Deviations, Review Focus (for each of the five lines, the test that covers it by file and name), Checks (the last lines of each check and the perf median), Not verified (the real phone, a print preview, a screen reader, how the German texts read), Noticed and not done, For the owner (the German drafts to correct, the plan decisions to confirm). Add one line for this plan to `progress.md`.

- [ ] **Step 4: Commit and push**

```bash
git add docs README.md
git commit -m "Write the build report for the three-column layout"
git push -u origin claude/nifty-sagan-c57kd7
```
