# Phase 2c build report: the Notebook

Plan: `docs/superpowers/plans/2026-11-13-phase-2c-symptom-notebook.md`, Tasks 2 to 7. Task 1 (the wording check) was done earlier.
Built on: `claude/install-superpowers-plugin-v0gy65`, 2026-11-14.
Owner sign-off (`docs/phase2/medical-device-wording.md`, section 8): both lines say "yes", so Tasks 2 to 7 were built with the comparison on (`SHOW_COMPARISON = true`).
State: **done.** Every check passes. Some of the owner's stricter wording rules changed details of the plan (see Deviations), and a few points wait for the owner (see "For the owner").

## Summary

The app has a fourth tab, "Notebook". In the Movements tab a picked movement or exercise phase has a "Log this movement" button. It opens a small form for the feeling ("It hurts" or "It feels fine"), the side and a note. Entries are stored in IndexedDB in the browser and nowhere else. The Notebook tab lists the notes, shows "Structures to look into" per side (structures that painful notes load and no fine note of the same side loads), saves and loads a backup file, and prints a one-page summary through the browser's own print. All notebook code loads only when the tab or the form is first opened.

## Commits

First and last: `25baf00` and `c834697` (the report commit follows). The commit before this plan is `8ecaedb`.

| Task | Commits | State |
| --- | --- | --- |
| 2 The on-device store | `25baf00`, fix `8df1851` | done |
| 3 The backup file | `2dc45dc` | done with deviation |
| 4 Structures to look into | `1f1a989` | done with deviation |
| 5 The Notebook tab and the log form | `466bca6`, fixes `ad34ca5`, `73a4ae7` | done with deviation |
| 6 The one-page summary | `94328c4`, fix `40ba5e4` | done with deviation |
| 7 End-to-end test, phone sheet and docs | `bd3968e` | done |
| Fixes from the final review | `c834697` | done |

How it was built: subagent-driven, one implementer per task, a review of each task, fix rounds where a review found something, and a final review of the whole range `8ecaedb..bd3968e` with one fix wave and a check of that wave. I did the browser checks and the print check myself.

## Deviations

The owner's prompt asked for every rule in section 5 of `docs/phase2/medical-device-wording.md`, also the stricter ones. These changed the plan in places:

1. **Candidates are listed by name, not by count (rule 5, "plain counts, not a ranking").** The plan's design decision 3 orders the list by how many painful notes load each structure. `compare.ts` orders it by English name. Each line still says plainly how many painful notes load the structure. The plan's test "more painful entries rank a structure higher" became "more painful entries raise a structure's count". It checks the count (piriformis, 2, evidence m1 and m2) and the name order. All other plan tests kept their exact values, because their expected order was already alphabetical.
2. **The word test is stricter (rule 2).** `wording.test.ts` checks every `notebook.` and `summary.` key (apart from the disclaimer and `notebook.loadError.`) against the plan's seven stems plus the thirteen of rule 2 (assess, monitor, detect, track, symptom, patient, likel, risk, source of, relie, recover, rehab, heal). The plan's texts pass.
3. **The disclaimer sits next to the result (rule 6).** The panel shows the disclaimer again directly under "Structures to look into". The printed page shows it in the header and again right before the comparison.
4. **The backup reader is stricter (owner's prompt: "refuse anything that is not exactly the format").** On top of the plan's checks: the top level must be a plain object with `exportedAt` a string. `version` must be exactly the number 1, a larger number gives "newer version", anything else "not a notebook backup". An entry must be a plain object, `pose` a plain object of finite numbers, `pick` is rebuilt from its known fields with non-empty ids, and an id may appear only once in a file. Extra fields on an entry are still dropped, as the plan's test says.
5. **The entry chunk grew by more than 3 kB.** Task 5 Step 4 asks for at most 3 kB, measured against `8ecaedb` as the owner asked. See "Chunk sizes". The plan's own new texts in `en.json` are 2.66 kB raw on their own, and all app text has to live in `en.json`. I did not move texts out of `en.json` to meet the number.
6. **Five extra text keys for the printed tables.** The plan lists the table columns (date, movement, side, angles, note) but gives no text for the column headings. Added `summary.column.date` "Date", `summary.column.movement` "Movement", `summary.column.side` "Side", `summary.column.angles` "Angles", `summary.column.note` "Note". The word test covers them.
7. **The printed page carries the same lines as the panel.** The plan lists only the candidate lines and `summary.basis` for each side. The page now also prints the panel's "Also loaded by movements that feel fine" line, "Log movements that feel fine too" when a side has no fine note, "this list may be incomplete" when rows wait, and "no checked movement information" only under the same condition as the panel. Without this the page would drop caveats the screen shows, and in one case it printed a false sentence.
8. **In the review build the page prints the review banner instead of `summary.basis`.** The basis line says the list uses only checked information, which is not true in the review build, where draft rows count.
9. **Angles are shown in whole degrees.** An exercise pose comes from the progress slider and can be 31.604999999999997. The panel and the page show "32 degrees". The stored value is unchanged. Angles the data does not know (possible in a loaded backup) are left out of the line.
10. **The tab bar sizes tabs by their labels**, because four equal tabs cut the labels off at 360 px.
11. **`store.ts` also exports `makeEntry`.** App gets it through the same lazy import that opens the store. A separate lazy import of `types.ts` had made the build put a small runtime chunk into the first screen.
12. **Small additions from the final review:** a failure to load the notebook panel, the log form or the print summary stays inside that part (`ui/QuietBoundary.tsx`), the hidden print summary is cleared after printing and when leaving the tab (so the browser's own print cannot print deleted notes later), note line breaks are kept on paper, spell check is off on the note field (some browsers can send typed text to an online spell check), focus moves into the form when it opens and back to the button when it closes, and each Delete button is described by its note line.
13. **README sentence.** The plan asks for one sentence that notes never leave the device. Because a person can save a backup or print, it reads "Notes you write in the app stay in your browser. The app never sends them anywhere."
14. **Phone sheet numbering.** The new section is "7. Notebook". The old sections 7 and 8 are now 8 and 9. Nothing refers to the numbers.
15. **`App.tsx` keeps the notes and a press counter, not the summary model.** Task 6 says `App.tsx` keeps the `SummaryModel` in state, and `onPrint` sets it and calls `window.print()` after the next paint. To build the model, `App.tsx` would have to import `summary.ts` and with it `compare.ts`, and that notebook code would then sit in the first download, against the plan's rule that notebook code loads only when it is first needed. So `App.tsx` keeps only the notes to print and a counter that goes up with each press. The new lazy file `notebook/PrintSummary.tsx` builds the model, renders `Summary`, and calls `window.print()` one frame after it is on the page. A lazy part is only on the page some time after the press, so `App.tsx` could not know when to print. Each new counter value prints again.
16. **`notebook/angles.ts` is a new file the plan does not list.** It holds `formatAngles`, which turns a logged pose into words in whole degrees (deviation 9). The panel and the printed page both use it, so they always say the same.
17. **The print check gave two pages, not one.** Task 6 Step 4 expected one A4 page in the review build with five notes. The result was two A4 pages, because the draft rows of the review build give 25 candidate lines. The normal build gives one page with the same five notes. See the print check under "Checks".

## Review Focus

1. **No usable IndexedDB gives one clear line and the rest works.** `store.test.ts` "opening without IndexedDB rejects" and "a throw while reading indexedDB becomes a rejection". `NotebookPanel.test.tsx` "without storage it shows the unavailable line and no buttons" and "a store that cannot list shows the unavailable line". `App.test.tsx` "without storage a log says the notebook is unavailable and the tab says so too", and "a print summary that fails to load leaves the rest of the app on screen".
2. **A bad backup changes nothing and says why. HTML in a note shows as text.** `backup.test.ts` "text that is not JSON is refused", "another JSON file is refused", "a newer version is refused", "one bad entry refuses the whole file", "a pose with a text value is a bad entry", "a file over the size limit is refused before parsing" and the stricter ones ("a version that is not exactly 1 is refused", "a repeated id is bad" and others). `NotebookPanel.test.tsx` "loading a damaged backup changes nothing and says why", "loading a file that is not JSON says so", "a note with HTML shows it as text". On the printed page an HTML note printed as literal text (print check below).
3. **An unknown movement is listed as unknown and left out of the comparison.** `compare.test.ts` "an unknown movement is counted apart and ignored", "an unknown exercise or phase is unknown with an empty map". `NotebookPanel.test.tsx` "a note for a movement the bundle lacks is listed as unknown".
4. **Missing information gives a sentence, never an empty box.** `NotebookPanel.test.tsx` "with only fine notes it asks for a painful one", "with no rows for the logged movement it says so", "shows structures to look into for the left side" (with the ask for fine notes), "a movement with rows waiting for review says the list may be incomplete". On paper: `Summary.test.tsx` "a side with no fine notes carries the same ask as the panel, after the candidate lines", "a list that may be incomplete says so on the page", "when a fine movement rules everything out the side says so, not that there is no information".
5. **Painful on the left and fine on the right leaves the left list alone.** `compare.test.ts` "fine on the right does not rule out the left".

Privacy: `notebook.spec.ts` "log a movement and find the note again after a reload" checks that every request goes to the preview host and every method is GET, before and after the reload. No notebook file uses `console`, `innerHTML` or `dangerouslySetInnerHTML`. Lazy loading: `App.test.tsx` "the notebook is not opened at start, only when its tab opens".

## Chunk sizes

Task 5 Step 4, compared with `8ecaedb` as the owner asked. Numbers are from `npm run build`.

| Build | Entry chunk raw | Entry chunk gzip |
| --- | --- | --- |
| `8ecaedb` (before this plan) | 257.79 kB | 80.23 kB |
| `466bca6` (Task 5, first commit) | 261.60 kB | 81.45 kB |
| `ad34ca5` (Task 5, runtime chunk removed) | 262.15 kB | 81.67 kB |
| `c834697` (end of the plan) | 263.75 kB | 82.12 kB |

Growth over the whole plan: 5.96 kB raw, 1.89 kB gzip. About 3.2 kB of it (56 new keys) is the new `notebook.` and `summary.` texts in `en.json`, the rest is the fourth tab, the lazy imports, the log button and the print wiring. `index.html` loads only the entry script, as before the plan. No notebook-only text such as "anatome-notebook" or "print-summary" is in the entry chunk.

Notebook chunks at `c834697`, all loaded on demand: NotebookPanel 8.63 kB (gzip 3.07), PrintSummary 2.81 kB (gzip 1.09), LogForm 1.46 kB (gzip 0.61), store 1.42 kB (gzip 0.64), types 0.24 kB (gzip 0.20).

## Checks

Run on `c834697`, all exit 0.

```
npm run validate                  data in data is valid
npm run check-models              every mesh maps to one of 52 structures
npm test                          web: Tests 328 passed (328)
                                  pipeline: Tests 99 passed (99)
npm run build:review -w apps/web  hip.json (review): 136010 bytes, 64 actions, 63 attachments, 2 exercises
npm run build                     hip.json (normal): 8550 bytes, 0 actions, 0 attachments, 0 exercises
npm run e2e -w apps/web           4 passed (17.9s)
node scripts/check-no-drafts.mjs  apps/web/dist/data: 1 bundle(s), no drafts
perf-check                        median interactive ms: 3126 in the full run, 2251 and 2566 in two reruns (limit 5000)
error-check                       ok decoder download fails: message shown after 1005 ms
                                  ok decoder never answers: message shown after 20166 ms
                                  ok model file missing: message shown after 929 ms
npm run test:py                   14 passed in 3.67s
```

The 3126 ms in the full run was measured while a preview server of mine was still running on the same machine. With it stopped the two reruns gave 2251 and 2566 ms.

**Print check (Task 6 Step 4), in headless Chromium with Playwright.** I logged five movements in the review build at 360 x 740 (three that hurt, two that feel fine, one note with HTML tags and a long sentence), pressed "Print a one-page summary" with `window.print` recorded, then switched to print media and made a screenshot and an A4 PDF.

- `window.print` was called once, after the summary was on the page.
- In print the app is hidden and the summary shows, black on white.
- The note with `<b>` printed as literal text and wrapped inside its cell. Nothing ran off the right edge.
- The disclaimer is at the top and again before the comparison.
- In the review build the last line is the review banner.
- **The review build gives 2 A4 pages.** The draft rows give 25 candidate lines. **The normal build gives 1 page** with the same five notes.
- The console held only three.js and WebGL warnings, no note text.

## Not verified

- **A real print preview and a printer.** Margins, the page break, whether the phone offers "Save as PDF", and the header and footer the browser adds. Only the headless Chromium check above was done. No PDF renderer was available to look at the pages themselves.
- **Anything on the phone.** Whether notes survive closing the browser and some days without use, where the phone saves the backup file, how loading a backup works with the phone's file picker, logging in flight mode, and whether `window.print()` works on the phone after the summary loads. The phone sheet has section 7 for this.
- **A real browser with storage blocked** (for example a private window in Firefox or Safari). Tested with a missing and a throwing `indexedDB` in jsdom only.
- **Two tabs of the app open at once.** Not tried.
- **Screen readers.** Not tried.

## Noticed, not done

- If the log form's code fails to load, its fallback line has no Cancel button until another movement is picked.
- A failure to load the print summary gives no feedback. The print button simply does nothing.
- The "Saved to your notebook." line stays until the next selection, also after switching tabs. This is how the existing notice line works.
- Status lines (`role="status"`) are added with their text already in them, which some screen readers do not announce.
- When a list of notes loads after a change fails, the line says the notebook is unavailable even though the change was written.
- Small store points: `onblocked` rejects but a later successful open is not closed, there is no `onversionchange` handler, `persist()` is also asked after a delete, notes with the same `createdAt` have no fixed order, and cutting a note at 500 characters can split an emoji in two.
- Small backup points: the 1 MB limit on the text counts characters, not bytes (the panel also checks the file size). A version 2 file whose `entries` is not a list says "not a notebook backup" instead of "newer version". Impossible dates like 2026-99-99 pass the date check, as the plan specifies.
- Tests that would be good to add: `incomplete` false in a review bundle and the exercise branch, a note of exactly 500 characters, candidates and ruled-out lines together on the page, loading the same file twice.
- The plan text of design decision 3 still says the list is ordered by count. It should say by name, to match the code and rule 5.

## For the owner

1. **Decided on 2026-11-15:** the entry chunk budget in Task 5 Step 4 is 6 kB, so the growth of 5.96 kB is within it.

   Was: **The entry chunk is 5.96 kB larger (1.89 kB gzip) than before this plan, over the 3 kB in Task 5 Step 4.** The 56 new texts in `en.json` are about 3.2 kB on their own. Decide whether the budget should change, or whether the notebook texts should move out of the first download (that needs a change to how texts are loaded).
2. **Decided on 2026-11-15:** the list of structures stays ordered by name with plain counts, and the plan now says so.

   Was: **"Structures to look into" is ordered by name, not by count** (rule 5). Please confirm. The plan's design decision 3 says by count.
3. **Decided on 2026-11-15:** a summary of two pages is accepted, and the button text "Print a one-page summary" stays.

   Was: **"One-page summary" is not always one page.** With the review build's draft rows, five notes already gave two pages. With up to 12 + 12 notes of 500 characters, the normal build will also run longer. Decide whether to cap the candidate lines, shorten what is printed, or rename the button.
4. **Texts that are slightly off, all plan wording:**
   - When the only painful notes are for movements this version does not know, the panel says "Log at least one movement that hurts", although the person did.
   - "{painful} of {total} movements" counts notes, not movements. One movement logged twice gives "2 of 2 movements".
   - `notebook.unavailable` ("This browser does not let the app store notes, for example in a private window") is also shown when a write fails or when the notebook code cannot be loaded.

   Each needs a new or changed text.
5. **The phone sheet line "Does any sentence in the Notebook tab read like a diagnosis or like advice?"** is the plan's text. It contains "diagnosis", but as a question to the tester. Keep it or reword it.
6. **`area.note` from plan 2b** ("It does not say what causes a symptom.") would fail the stricter word list if rule 1 ("every public text counts") is applied to all of `en.json`. The word test checks only `notebook.` and `summary.` keys. This is still open from the 2b report.
7. **Run section 7 "Notebook" of `docs/phase2/phone-measurements.md`** on the phone in the review build, including the question about diagnosis or advice.

## Fixes after the review

Run of 2026-11-15, at the tip of the working branch (plans 3 and 4a are built on top of 2c). No app code changed, only tests, the plan, the phone sheet, this report and the progress file.

| Item | Commit |
| --- | --- |
| 1 Two missing tests in `compare.test.ts`: "an exercise note with exercises waiting marks the list incomplete" and "a review bundle is never marked incomplete" | `6136e1e` |
| 2 Deviations 15 to 17 (the lazy `PrintSummary.tsx`, the new `angles.ts`, two printed pages) | `c940cd9` |
| 3 The owner decisions of 2026-11-15 in the plan and the phone sheet | `1645cfe` |
| 4 Items 1 to 3 of "For the owner" marked as decided, their lines removed from the progress file | `a9dac35` |

Each new test was checked against `compare.ts` with its line removed, and `compare.ts` was put back unchanged. Without the line `if (entry.pick.kind === "exercise" && bundle.pendingExercises > 0) incomplete = true;` only "an exercise note with exercises waiting marks the list incomplete" fails. With `if (bundle.mode === "normal")` taken away only "a review bundle is never marked incomplete" fails. The exercise test logs the squat at 50 degrees of hip flexion and no knee flexion, so knee flexion, which has rows waiting, is not in its query and only the exercise line can mark the list incomplete.

Not changed, because it is outside the list: the plan still says "one-page" in its goal line, in the title of Task 6 and in Task 7 Step 3 ("is it one page"). Also, since plan 4a, `compare.ts` orders the list by the name in the language shown, which is the English name in English.

Checks, all exit 0:

```
npm run validate                  data in data is valid
npm run check-models              every mesh maps to one of 52 structures
npm test                          web: Tests 396 passed (396)
                                  pipeline: Tests 127 passed (127)
npm run build:review -w apps/web  hip.json (review): 137917 bytes, 64 actions, 63 attachments, 2 exercises
npm run build                     hip.json (normal): 10381 bytes, 0 actions, 0 attachments, 0 exercises
npm run e2e -w apps/web           4 passed (19.4s)
node scripts/check-no-drafts.mjs  apps/web/dist/data: 1 bundle(s), no drafts
perf-check                        median interactive ms: 3256 (limit 5000)
error-check                       ok decoder download fails: message shown after 1049 ms
                                  ok decoder never answers: message shown after 20962 ms
                                  ok model file missing: message shown after 1183 ms
npm run test:py                   14 passed in 4.51s
```
