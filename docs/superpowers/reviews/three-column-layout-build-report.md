# Three-column layout and stage controls: build report

Plan: `docs/superpowers/plans/2026-11-16-three-column-layout.md`, Tasks 1 to 14.
Spec: `docs/superpowers/specs/2026-11-16-three-column-layout-design.md`.
Built on 2026-11-16 on the working branch `claude/nifty-sagan-c57kd7`, in the cloud container, with subagent-driven development: one implementer per task and a task review after each. The owner was away for the whole run. Nothing was pushed by the builders. The controller pushes.

## Summary

anatoMe now has one set of components for every width. From 900 px wide the page has three columns: a navigation rail (208 px, or 176 px below 1100 px) with the four tabs, the credits button and the language switch, the model stage in the middle, and a right column (380 px, or 320 px below 1100 px) with Layers and the tab panel. Below 900 px the tabs sit at the bottom and the panel is a sheet of at most 45 percent of the height. The phone stage is never shorter than 220 px.

The stage has its own controls: a name chip for the selected structure, left and right side markers, a view badge (front, back, left, right, top, bottom), zoom in, zoom out, reset, and a Layers button on the phone. Layers has its own section and no longer replaces the tab panel. Credits and the language switch moved into a settings dialog on the phone and into the rail on wide screens. A failed load of the data, the 3D model, the manifest, the Draco decoder or a code chunk now shows a "Try again" button. The four tab panels (Structures, Movements, Under a spot, Notebook) share one look, with new German drafts and localised dates (`en-GB` and `de-DE`).

All checks are green except one known test that fails only because this container runs as root (see "Checks"). Nothing under `data/`, no `checked_by` and no data row was changed.

## Commits

First: `9dec91e` (the plan). Last before this report: `bec564a`. The two commits before the plan (`622d78e` to `f0d91d5`) are the spec.

| Task | Commits | State |
| --- | --- | --- |
| 1 Shared colours and control styles | `6052111` | done |
| 2 Grid shell and navigation rail | `e1275e6` | done with deviation |
| 3 Layers in its own section | `caf303b` | done with deviation |
| 4 Settings dialog, credits and language | `8531fa5`, `5966d78` (review fix) | done with deviation |
| 5 Reset, zoom and camera view in the viewer | `0eb17e1` | done with deviation |
| 6 Stage controls | `128ff17` | done with deviation |
| 7 Compact search on short phones | `f11d172`, `67c1906` (review fix) | done with deviation |
| 8 Retry after failed loads | `5e0280c` | done with deviation |
| 9 Shared panel pieces and the Structures panel | `ba89d64` | done with deviation |
| 10 Movements panel | `8e5c036` | done with deviation |
| 11 Under a spot panel | `e57964f` | done with deviation |
| 12 Notebook panel and dates | `17b074d`, `354c653` (review fix) | done with deviation |
| 13 Layout and stage checks in a browser | `bec564a` | done with deviation |
| 14 Full checks and this report | the commit that adds this file | done |

Task 12 was started by a first builder, and the container restarted before that builder reported. Its uncommitted edits survived in the working tree. A second builder verified every item of the brief against that tree and committed it (`17b074d`). The review fix `354c653` followed.

## Deviations

From the plan, grouped by task. Each was accepted by the task reviewer.

**Task 1.** Small leftover rules stayed after the copies were deleted: `.layers-toggle` (a margin), `.region-picker` and `.lang-picker`, and `.search-field`, so layouts and select backgrounds stay as they were. The radius went from 6 px to 8 px as the brief says. The review banner button got the `.btn` look. The review-list close button has no `.btn`, because the brief did not name it.

**Task 2.** The review banner and the top bar sit in a new `.top` wrapper that carries the grid area. `PanelArea.tsx` needed no change, and `role="tabpanel"` sits on the `.panel-scroll` element in `App.tsx`. The mount test counts from after the first act-wrapped click, because the viewer is keyed by region and mounts once more when the manifest names the region. `fireEvent` is used because `user-event` is not installed and no dependency may be added. `.panel` is a `div` now, not a `footer`. Extra tests: `useShort`, horizontal orientation and the heading order in the top bar.

**Task 3.** There is no jest-dom, so a `shown()` helper checks that nothing hidden is above an element. `App.test.tsx` got a `beforeEach` that resets the viewport to the phone. One extra test: a tap on empty space leaves Layers open.

**Task 4.** jsdom has no `showModal` or `close`, so `src/test-setup.ts` stubs them (`setupFiles` in `vite.config.ts`). The data-failure test and the `pickLanguage` helper were updated, because credits and the language picker moved. The last-resort error page also shows the language picker, which the brief did not name.

**Task 5.** The camera event is `rest`, not `sleep`. A zero-length direction is not reported. Extra tests: no report while the camera moves, and listener cleanup.

**Task 6.** The phone Layers button is an icon-only 44 px square named "Layers". On the wide layout the side markers sit on a line above the badge, as in the spec's wide sketch. The button stack on the phone is Layers above Reset. Badge, hint and markers do not take pointer events. The empty name chip stays in the page without padding, so it is still a live region. An unknown structure with no file label shows its id in the chip. The search notice got `data-testid="search-notice"`, because the chip is a second status region.

**Task 7.** The wide search field was left to a later task, because no brief owned it (see Task 13). `fireEvent` and `document.activeElement` are used instead of `user-event`. Prettier reformatted some unrelated lines in `TopBar.tsx`.

**Task 8.** Model files are cleared synchronously in the click, with the Scene module kept in a ref. The Draco decoder is renewed on retry, a fourth thing that remembers a failure, found in a real browser. A new helper `src/ui/lazyRetry.ts` makes a failed code chunk download again on the next mount. The log form's chunk failure shows `notebook.loadFailed` instead of `notebook.unavailable`. Save is ignored while a save runs. A `.retry-box` rule keeps the button next to the message.

**Task 9.** A new `RegionInfo.test.tsx` covers the hint. The empty-state hint is an `h2` and keeps `data-testid="info-label"`. New layout helper classes: `.panel-head`, `.panel-section`, `.card-title`, `.action-rows`, `.swatch`, `.kv-row`. The Layers title is an `h3`.

**Task 10.** Angle ids are dotted, so the slider's name is the text of `angle.hip.flexion` ("the hip bent"). The rule `.movement-structure[aria-current]` was removed, because the card carries that look. The contrast of the pinched colour `#b47be8` was taken from the brief. The controller computed about 5.9:1 on `#14171c` afterwards.

**Task 11.** The subtitle also shows under the "over and under" title. Rows are no longer de-duplicated per load, because the brief asks for one line per action row. Sources and review marks per row are not shown. Three older tests were updated as direct consequences: movement button names no longer carry the load word, and the unknown-entry card text is now "1mystery".

**Task 12.** Delete points to a visually hidden span "{name}, {date}" through `aria-describedby`. The panel root keeps the class `notebook-panel` next to `panel-body`.

**Task 13.** The stage tap spot follows the rule `area.spec.ts` already uses, because 62 percent of the width missed the model on the small phone. The left and right assertion did not change. The drag test retries inside `toPass()` until the badge reads Back view. The rail check is its own desktop-only test at 900 x 600. The wide top bar is a grid with `display: contents` on `.top-bar-row`. Between 900 and about 1130 px the search field is up to 72 px off centre, so the region picker keeps its full text (see "For the owner").

**Task 14.** The brief's `git diff a964bbd..HEAD` for the language files also covers earlier phases (`a964bbd` is the merge of the first pull request, and `de.json` did not exist then). The text table below uses the base `9dec91e~1`, so it lists only this plan's changes. The pipeline test run is one command per step, not one `&&` chain, because of the known root-only failure.

## Review Focus

The five lines of the plan and the test that covers each.

1. A window dragged across 900 px with Layers or the settings dialog open keeps the selection and does not load the model again.
   - `apps/web/src/App.test.tsx`: "switching between phone and wide keeps the viewer mounted and the selection" (the viewer's mount count does not change).
   - `apps/web/src/App.test.tsx`: "going from phone to wide with Layers open keeps Layers, the selection and the tab".
   - `apps/web/src/App.test.tsx`: "a dialog that is open closes when the layout changes". By design the settings dialog closes when the layout changes, because on the wide layout its content lives in the rail. The selection is not touched.
2. German labels at 360 px are not cut off in the tab bar or the top bar.
   - `apps/web/e2e/layout.spec.ts`: "in German › nothing overflows and nothing is cut off", run in the `small-phone` project (360 x 640) as well as the phone and the desktop. It checks every tab and every element inside it.
3. A camera direction that ties between two axes, or a zero vector, gives a view name and does not crash.
   - `apps/web/src/stage/view.test.ts`: "a tie goes to front or back first, then left or right" and "a zero or broken direction is the front view". The plan names `view.test.ts` under `viewer/`. The file is in `stage/`.
4. A region with only two tabs works in the vertical rail, and the arrow keys wrap.
   - `apps/web/src/ui/ModeBar.test.tsx`: "vertical with two tabs wraps: Up on the first goes to the last", "the arrows wrap at the ends" and "vertical: Up and Down move, Left and Right do nothing, and the list says it is vertical".
5. "Try again" pressed while still offline shows the error and the button again, and many presses do not stack requests.
   - `apps/web/src/App.test.tsx`: "data: Try again while still offline shows the error and the button again, one request per press" (counts the requests per press).
   - `apps/web/src/viewer/ModelErrorBoundary.test.tsx`: "a child that fails again shows the message and the button again".
   - `apps/web/src/viewer/Viewer.test.tsx`: "Try again after a model failure loads the scene again".
   - `apps/web/src/ui/lazyRetry.test.tsx`: "a part whose download failed downloads again the next time it mounts".
   - `apps/web/src/App.test.tsx`: "notebook: a part that failed to load says so and can be tried again".
   - `apps/web/scripts/error-check.mjs` runs in a real browser (see "Checks").
   - Only the data case has a test that counts requests over several presses. For the model, manifest and code chunks the tests show that a second failure shows the button again. They do not press many times.

## Checks

Run from `/home/user/anatoMe` on 2026-11-16, one command at a time. The last lines of each output:

| Check | Result |
| --- | --- |
| `npm run validate` | pass: "data in data is valid" |
| `npm run check-models` | pass: "every mesh maps to one of 312 structures". Triangles: lower-leg 44294, shoulder 109449, arm 45227, neck 90682, trunk 140296 (budget 150000 each) |
| `npm test -w apps/web` | pass: 47 test files, 539 tests (baseline was 39 files, 406 tests) |
| `npm test -w pipeline/data` | 138 passed, 1 failed (the known one, see below) |
| `npm test -w apps/web -- src/i18n` | pass: 4 files, 17 tests (both language files have the same keys and placeholders) |
| `npm run build:review -w apps/web` | pass: six review bundles, hip.json 137917 bytes, 64 actions, 63 attachments, 2 exercises |
| `npm run build` | pass: "built in 648ms", `Scene` chunk 1,028.05 kB (272.40 kB gzip), `index` chunk 295.28 kB |
| `npm run e2e -w apps/web -- --trace off` | pass: 41 passed, 8 skipped (the single-size checks, skipped by design in the other projects) |
| `node scripts/check-no-drafts.mjs` | pass: "apps/web/dist/data: 6 bundle(s), no drafts" |
| `node apps/web/scripts/perf-check.mjs` | pass: runs 1705, 1709, 1712, 1782, 1724 ms, median 1712 ms (limit 5000 ms) |
| `node apps/web/scripts/error-check.mjs` | pass: decoder download fails (message after 947 ms), decoder never answers (20546 ms), model file missing (943 ms) |
| `npm run test:py` | not run: there is no `.venv` in this container and none was created. No Python file changed in this plan |
| Leftover grep for `layers-toggle`, `swatch--`, `notebookError`, `storeError` in `apps/web/src` | no matches |

**The known pipeline failure.** `pipeline/data/test/markChecked.test.ts`, "a write that fails part way restores every file", fails here and failed before Task 1. The test makes a file read-only with `chmod 0444` and expects the write to fail. This container runs as root, and root can write to a read-only file, so the write succeeds and the test sees no failure. It is not a GUI problem and nobody edited the test. The pipeline count is the same as the baseline, 138 passed and 1 failed, so no other pipeline test changed. On a normal user account the test should pass. It has not been run in that setting.

The e2e run covers three browser sizes (412 x 915 phone, 360 x 640 small phone, 1280 x 800 desktop) in English and German, all in Chromium.

## Not verified

- A real phone. All phone checks ran in Chromium with a phone-sized window and touch emulation. Touch drag, pinch, the on-screen keyboard and the browser's address bar changing the height are untested.
- A print preview on paper. The Notebook summary was checked by unit tests only, not on a printer.
- A screen reader. Roles, names, live regions and the dialog were set up and tested by their attributes. Nobody listened to them.
- How the German texts read. They are drafts, listed below for the owner.
- Retry of a failed code-chunk download in browsers other than Chromium. Some browsers keep a failed module fetch, so on Safari or Firefox a failed code chunk (the 3D scene, the notebook, the log form) may still need a page reload. Only jsdom tests cover this retry. In Chromium, the model, manifest, data and decoder retries were also checked in a real browser.
- The phone sheet with Layers open was not looked at in a browser during Task 3. Task 13 checks its size in a browser. The controller looked at the Task 13 screenshots of the desktop and phone with a structure selected.
- Contrast was computed for the selected phone tab (about 7.7:1) and the pinched colour (about 5.9:1). Nothing else was measured.

## Noticed and not done

Minor findings from the task reviews, left alone on purpose. One line each.

**Task 1**
- `index.css` has runs of blank lines where rules were deleted (about lines 196 to 200, 256 to 260, 345).
- A stranded region-picker comment near `.top-bar` (about line 300).
- `.btn--primary` and `.btn[aria-pressed]` repeat identical declarations and could share one rule.
- `.layers-toggle` is a one-line margin helper (the grep above found no use left in `src`, so the rule can go).

**Task 2**
- The "horizontal" test in `ModeBar.test.tsx` starts with an assertion that tests nothing.
- No test for Home and End in vertical mode.
- `useMedia` builds a new `MediaQueryList` on each snapshot.
- The last-resort error page still renders the footer outside `.side`.

**Task 3**
- The temporary stage Layers button always read `layers.open`. Task 6 replaced it.
- The phone-to-wide test title says the tab is kept, but it does not check a tab other than the default.

**Task 4**
- `AppDialog` unmounts on close and never calls `dialog.close()`, so focus may not return to the opener for keyboard users.
- The test "not inside a details element" in `Credits.test.tsx` is now empty of meaning.
- The `close()` stub in `test-setup.ts` is unused.
- An orphaned "Big enough for a thumb" comment in `index.css`.
- The `setDialog(null)` effect on `[wide]` also runs on mount.

**Task 5**
- `zoomBy` compounds from the current distance in mid-glide, so two fast taps zoom less than expected.
- `onViewRef.current` is assigned during render.
- No test that `resetView` reuses the first framing's box and padding.

**Task 6**
- The clear button sits inside the `role="status"` region, so it may be announced with the name.
- The `. . . buttons 1fr` grid row in `index.css` has no comment.
- The chip pill takes pointer events, so a drag that starts on it does not reach the canvas.
- The debug-only perf overlay (top left) can sit on top of the chip. Task 13 moved it below the chip.

**Task 7**
- Prettier reformatted unrelated lines in `TopBar.tsx`.
- On a short phone, choosing a search result leaves the field open (see "For the owner").
- `fieldOpen` is not reset when `compact` turns false, and there is no test for choosing a result on a compact screen and then collapsing the field.

**Task 8**
- No busy or disabled state on Save during a save, and Cancel during a failing save loses the note.
- `lazyRetry` may start one extra download if the parent re-renders between the rejection and the boundary catching it.
- No unit test for the Draco decoder renewal.
- `NotebookPanel` still shows `notebook.unavailable` for a failed list, delete or backup load (see "For the owner").
- `ComponentType<any>` in `lazyRetry.ts`.

**Task 9**
- The Card test in `pieces.test.tsx` ends with `expect(container).toBeTruthy()`, which checks nothing.
- The "wide" test in `InfoPanel.test.tsx` resets the viewport in the body, not in `afterEach`.
- The Layers heading is an `h3` with no `h2` before it.
- The switch-side button reads "Right side" next to a chip "Left side" (see "For the owner").

**Task 10**
- Stray blank lines in `index.css` (about lines 984 to 1040) and a shuffled `.movement-slider input` rule.
- The slider's `label` wraps the input, which also has an `aria-label`.
- The swatch test compares the `style.background` string.

**Task 11**
- No test for review mode with the new row layout.
- The old `.area-panel { overflow-wrap: anywhere }` was removed. Task 13 was to put it on `.panel-body`. The leftover grep did not cover this, so check that long German names do not overflow at narrow widths. The "nothing overflows" check in `layout.spec.ts` passed in all projects.

**Task 12**
- The date could be a `<time dateTime>` element.
- `candidateNotes` has no guard for a confidence value outside high, medium and low (the types forbid it).
- The fix report has no red run for the two tightened assertions.

**Task 13**
- The centring tolerance of 80 px is loose at 1280 px, where the offset is 0, and there is no assertion at 900 px.
- "Nothing is cut off" cannot see clipped text inside a native select.
- `.link-button` has `min-height: 32px` everywhere, untested inside running text.
- The `.nav` flex children could shrink on screens shorter than 600 px. Add `flex-shrink: 0`.
- The size check does not assert that it walked a non-trivial number of controls.

**Task 14**
- `README.md` screenshots under `docs/phase1/` show the old layout. They were not retaken.
- The German tab name for "Under a spot" is still "Stelle" (key `mode.area`). It was not part of the plan's changes.

## For the owner

### a. German texts to correct

Every new or changed text in this plan, from `git diff 9dec91e~1..HEAD -- apps/web/src/i18n/de.json apps/web/src/i18n/en.json`. The last four rows are not new sentences. Their English parts were cut from the old text, and the German parts were derived the same way (plan decision 2). Texts that this plan removed (`info.type`, `info.origin`, `info.insertion`, `area.movement`, `movement.slider`, `notebook.entry`) are not listed.

| Key | English | German draft |
| --- | --- | --- |
| `app.name` | anatoMe | anatoMe |
| `info.tapHint` | Tap a structure to learn about it (was: Tap a structure to see its name) | Tippe auf eine Struktur, um mehr zu erfahren |
| `info.clickHint` | Click a structure to learn about it | Klicke auf eine Struktur, um mehr zu erfahren |
| `info.tapHelp` | Drag to turn the model, pinch to zoom, or search by name above. | Ziehen dreht das Modell, zwei Finger zoomen. Oder suche oben nach einem Namen. |
| `error.modelLoad` | The 3D model could not be loaded. Check your connection and try again. | Das 3D-Modell konnte nicht geladen werden. Prüfe deine Verbindung und versuche es erneut. |
| `error.dataLoad` | The information about the structures could not be loaded. Check your connection and try again. | Die Informationen zu den Strukturen konnten nicht geladen werden. Prüfe deine Verbindung und versuche es erneut. |
| `error.retry` | Try again | Erneut versuchen |
| `settings.title` | Settings | Einstellungen |
| `dialog.close` | Close | Schließen |
| `info.originLabel` (derived) | Starts at | Beginnt an |
| `info.originValue` (derived) | {landmark} of the {bone} | {landmark} ({bone}) |
| `info.insertionLabel` (derived) | Ends at | Endet an |
| `info.insertionValue` (derived) | {landmark} of the {bone} | {landmark} ({bone}) |
| `info.sideChip.l` | Left side | Linke Seite |
| `info.sideChip.r` | Right side | Rechte Seite |
| `info.otherSide.l` | Left side | Linke Seite |
| `info.otherSide.r` | Right side | Rechte Seite |
| `info.hideShort` | Hide | Ausblenden |
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
| `search.open` | Search | Suche |
| `area.title` | Under this spot (was: Under this spot, from the surface inwards) | Unter dieser Stelle |
| `area.subtitle` | From the surface inwards | Von der Oberfläche nach innen |
| `info.overUnderShort` | Over and under | Darüber und darunter |
| `mode.area` | Under a spot (was: Area) | unchanged, still "Stelle" |
| `movement.pickHint` | The model shows which structures take part. | Das Modell zeigt, welche Strukturen beteiligt sind. |
| `movement.back` | All movements (was: Pick another movement) | Alle Bewegungen |
| `movement.degrees` | {value} degrees | {value} Grad |
| `movement.kind` | Movement | Bewegung |
| `movement.kindExercise` | Exercise | Übung |
| `notebook.saveFailed` | The note could not be saved. Try again. | Die Notiz konnte nicht gespeichert werden. Versuche es erneut. |
| `notebook.loadFailed` | This part of the app could not be loaded. Check your connection and try again. | Dieser Teil der App konnte nicht geladen werden. Prüfe deine Verbindung und versuche es erneut. |
| `notebook.entryAria` | {name}, {date} | {name}, {date} |
| `notebook.keep` | Keep and share | Aufbewahren und teilen |

Dates in the Notebook and the printed summary use `en-GB` ("14 Nov 2026") and `de-DE` ("14.11.2026").

### b. Plan decisions to confirm

1. The grid has four areas (`top`, `nav`, `stage`, `side`), not the spec's six. Layers, the tab panel and the foot are stacked inside `side`. The screen looks the same.
2. Attachments keep their checked wording. The labels are "Starts at" and "Ends at" (German "Beginnt an" and "Endet an"), not the mockup's "From" and "To".
3. The empty-state heading says "Tap a structure to learn about it" on the phone layout and "Click a structure to learn about it" on the wide layout.
4. The lighter purple for "pinched" is `#b47be8`.
5. Dates use the locales `en-GB` and `de-DE`.
6. All German texts above are drafts for the owner to correct.

### c. Open choices found during the build

1. **Region picker cut on a 360 px phone.** The picker's text is cut ("Hip and thig"). The check does not catch clipped text inside a native select. Options: shorten the region names, show only an icon on the smallest phones, or give the picker its own row.
2. **Search field off centre between 900 and about 1130 px.** It is up to 72 px off centre and narrower than 620 px, so the name and the picker keep their full width. At 1280 px it is centred. Choose: keep this, or let the name and picker shrink.
3. **Right column cramped at 900 x 600.** The tab panel gets about 200 px of height and scrolls. Choose: accept it, or lower the rail's educational line and credits into the settings dialog on short screens.
4. **Phone button "Right side" next to a chip "Left side".** On the phone the button is named after the side it switches to, so it reads "Right side" while the chip reads "Left side". On wide screens it reads "Show the other side". Choose a clearer phone label.
5. **Short-phone search field stays open over the top bar** after a result is chosen. It closes only when its text is cleared, as the brief said. Choose: close it on choosing a result.
6. **`notebook.unavailable` for failed list, delete and backup loads.** The text says the browser blocks storage, which is not true for these failures. Choose: a different text for these.
7. **The "Under a spot" subtitle** ("From the surface inwards") also shows under the "over and under" title, where it is less fitting. Choose: hide it there.
8. **Retry of a failed code chunk in Safari and Firefox** may not work without a page reload (see "Not verified").

Changed behaviours a user will notice:

- The heading of the info panel is the structure's name alone. The old "Type: ..." line (`info.type`) is gone.
- The movement buttons in "Under a spot" no longer carry the load word, and each action row is listed on its own line, even when two rows have the same load.
- The tab "Area" is now "Under a spot" in English.
- Layers no longer hides the tab panel. On the phone it opens in the sheet and closes on a tab change or a tap on a structure.
- Credits and the language switch moved: the phone has them in a settings dialog, the wide layout in the rail.
- A failed load now shows "Try again" instead of asking for a page reload.
