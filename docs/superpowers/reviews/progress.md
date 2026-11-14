# Build progress

Sessions of 2026-11-14:

- Overnight run, prompt 1 of `docs/superpowers/plans/2026-11-13-opus-prompts.md`.
- Second run: finished plan 2b (Tasks 2 to 4) after the owner corrected the model size check.

| Plan | State | Report |
| --- | --- | --- |
| Phase 2a movement explorer, Tasks 1 to 8 | done | `phase-2a-build-report.md` |
| Phase 2d hip data, Tasks 1 and 2 (tools) | done | `phase-2d-tools-build-report.md` |
| Phase 2b area lookup, Tasks 1 to 4 | done (two plan rules for the owner, see below) | `phase-2b-build-report.md` |
| Phase 2c symptom notebook, Task 1 (wording check) | done, Tasks 2 to 7 not started (sign-off now recorded) | `docs/phase2/medical-device-wording.md` |
| Phase 2d hip data, Tasks 3 to 6 (sourced data) | done (12 rows, 2 exercises, gaps listed) | `phase-2d-data-build-report.md` |

## Waiting for the owner

- Phase 2a: run `docs/phase2/phone-measurements.md` (Movements tab, hiding one side) on the phone in the review build.
- Phase 2d tools: when the physio's answers arrive, record them with `npm run mark-checked` as `docs/review/how-to-record-a-review.md` describes.
- Phase 2b: the Area tab lists structures of the other leg in about 10 to 20 percent of taps when the model is turned (Review Focus 2 holds only from the front). Decide whether the list should also stop at the first structure of the other side and at a bone on any ray. Details in `phase-2b-build-report.md`, "For the owner" item 1.
- Phase 2b: "See what lies over and under it" misses its own structure for about 1 in 6 structures, because it aims at the middle of the bounding box. Decide whether to aim at the nearest point of the structure and add a line for a miss. Item 2 of the report.
- Phase 2b: decide whether `area.note` keeps the word "symptom" (item 3), and check on the phone whether the white dot (about 2 CSS pixels) can be seen (item 4).
- Phase 2b: run section 6 "Area tab" of `docs/phase2/phone-measurements.md` on the phone in the review build, with its physio question.
- Notebook: the owner's sign-off for the log, backup, summary and comparison is recorded in `docs/phase2/medical-device-wording.md` (2026-11-14). Tasks 2 to 7 of plan 2c can be built in the next session.
- Phase 2d data: 12 new action rows and 2 exercises wait for the physio in the review build. Gaps in `docs/phase2/data-gaps.md`.

## Notes for the next session

- Both runs built in a clone on the Linux file system, because the web tests time out on the Windows drive. The Windows checkout was fast-forwarded to the same commit at the end.
- `npm ci` and the Python `.venv` in the Windows checkout were run from WSL in the first run. Its `node_modules` and `.venv` hold Linux builds. Run `npm ci` again before using that checkout from Windows.
- If the owner changes the 2b stopping rule or the probe aim, the change sits in `apps/web/src/area/under.ts` and the probe effect in `apps/web/src/viewer/RegionModel.tsx`, each with a unit test.
