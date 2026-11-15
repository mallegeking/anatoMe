# Build progress

Sessions of 2026-11-14:

- Overnight run, prompt 1 of `docs/superpowers/plans/2026-11-13-opus-prompts.md`.
- Second run: finished plan 2b (Tasks 2 to 4) after the owner corrected the model size check.
- Third run: built plan 2c, the Notebook (Tasks 2 to 7), with the comparison on.
- Fourth run: built plan 3, publish v1 (Tasks 1 to 8). The repo stays private. Nothing was made public, Pages is off, no tag was pushed.
- Fifth run: built plan 4a, regions and German (Tasks 1 to 3). Task 4 is blocked on the surface gate, Task 5 was not started.

| Plan | State | Report |
| --- | --- | --- |
| Phase 2a movement explorer, Tasks 1 to 8 | done | `phase-2a-build-report.md` |
| Phase 2d hip data, Tasks 1 and 2 (tools) | done | `phase-2d-tools-build-report.md` |
| Phase 2b area lookup, Tasks 1 to 4 | done (two plan rules for the owner, see below) | `phase-2b-build-report.md` |
| Phase 2c notebook, Task 1 (wording check) | done | `docs/phase2/medical-device-wording.md` |
| Phase 2c notebook, Tasks 2 to 7 | done (with the owner's stricter wording rules, points for the owner below) | `phase-2c-build-report.md` |
| Phase 2d hip data, Tasks 3 to 6 (sourced data) | done (12 rows, 2 exercises, gaps listed) | `phase-2d-data-build-report.md` |
| Phase 3 publish v1, Tasks 1 to 8 | done (Task 3 stopped for the owner, open audit items below) | `phase-3-build-report.md` |
| Phase 4a regions and German, Tasks 1 to 5 | partly done (Tasks 1 to 3 done, Task 4 blocked, Task 5 not started) | `phase-4a-build-report.md` |

## Waiting for the owner

- Phase 2a: run `docs/phase2/phone-measurements.md` (Movements tab, hiding one side) on the phone in the review build.
- Phase 2d tools: when the physio's answers arrive, record them with `npm run mark-checked` as `docs/review/how-to-record-a-review.md` describes.
- Phase 2b: "See what lies over and under it" misses its own structure for about 1 in 6 structures, because it aims at the middle of the bounding box. Decide whether to aim at the nearest point of the structure and add a line for a miss. Item 2 of the report.
- Phase 2b: decide whether `area.note` keeps the word "symptom" (item 3), and check on the phone whether the white dot (about 2 CSS pixels) can be seen (item 4).
- Phase 2b: run section 6 "Area tab" of `docs/phase2/phone-measurements.md` on the phone in the review build, with its physio question.
- Phase 2c: the entry chunk grew 5.96 kB raw (1.89 kB gzip), over the 3 kB budget of Task 5 Step 4. The 56 new texts are about 3.2 kB of it. Decide the budget. Item 1 of `phase-2c-build-report.md`, "For the owner".
- Phase 2c: confirm that "Structures to look into" is ordered by name, not by count (wording rule 5), and decide what to do when the summary runs past one page (items 2 and 3).
- Phase 2c: three texts that are slightly off, all plan wording (item 4), and the phone sheet question that contains "diagnosis" (item 5).
- Phase 2c: run section 7 "Notebook" of `docs/phase2/phone-measurements.md` on the phone in the review build, including a real print preview.
- Phase 2d data: 12 new action rows and 2 exercises wait for the physio in the review build. Gaps in `docs/phase2/data-gaps.md`.
- Phase 3: the history audit (`docs/phase3/history-audit.md`) has seven open items D1 to D7 (handle, symptoms and personal circumstances in the spec, the home server description, a personal e-mail address and a computer-like author name in commit metadata, and a local home-folder path in the history of commit `ed43141`). Decide between leaving them, rewriting history, or starting the public repo from a fresh commit, before checklist item 9. A squash-merge keeps D7 out of `main`. Item 1 of `phase-3-build-report.md`, "For the owner".
- Phase 3: confirm the four extra licence mappings and the 21 licence rows read from Europe PMC (item 2 of the report), `REPO_URL` in `apps/web/src/config.ts` (item 3) and the README "What comes next" wording (item 4).
- Phase 3: the remaining steps to publish v1 are in `docs/phase3/publish-checklist.md`. They start after the physio review.

- Phase 4a: Task 4 is blocked. The new surface gate (95th percentile of the bone surface distances, limit 5 mm) measures 7.8 and 8.0 mm before decimation and 7.0 and 7.3 mm after, mostly on the iliac wing. Decide how the gate should work (four options in item 1 of `phase-4a-build-report.md`, "For the owner"). The uncommitted Steps 1 and 2 are saved as `~/build/research/phase4a-task4-wip.patch` in the Linux home, with the task report beside it. After the decision, Task 4 and then Task 5 (the region playbook) can be built.
- Phase 4a: proofread the German texts and names (section "For the owner to proofread" of the report), especially the disclaimer and the educational line. Decide on "Physio-Fachkraft" in the summary and on the style of the German names (items 2 to 4).
- Phase 4a: install `unzip` on the Linux machine. The builder used a copy unpacked from the Ubuntu package outside the repo (item 5).

## Notes for the next session

- All five runs built in a clone on the Linux file system, because the web tests time out on the Windows drive. The Windows checkout was fast-forwarded to the same commit at the end.
- `npm ci` and the Python `.venv` in the Windows checkout were run from WSL in the first run. Its `node_modules` and `.venv` hold Linux builds. Run `npm ci` again before using that checkout from Windows.
- If the owner changes the 2b stopping rule or the probe aim, the change sits in `apps/web/src/area/under.ts` and the probe effect in `apps/web/src/viewer/RegionModel.tsx`, each with a unit test.
