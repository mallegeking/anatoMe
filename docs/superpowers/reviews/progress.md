# Build progress

Session of 2026-11-14 (overnight run, prompt 1 of `docs/superpowers/plans/2026-11-13-opus-prompts.md`).

| Plan | State | Report |
| --- | --- | --- |
| Phase 2a movement explorer, Tasks 1 to 8 | done | `phase-2a-build-report.md` |
| Phase 2d hip data, Tasks 1 and 2 (tools) | done | `phase-2d-tools-build-report.md` |
| Phase 2b area lookup, Tasks 1 to 4 | partly done: Task 1 done, Task 2 blocked, Tasks 3 and 4 skipped | `phase-2b-build-report.md` |
| Phase 2c symptom notebook, Task 1 (wording check) | done, Tasks 2 to 7 waiting for sign-off | `docs/phase2/medical-device-wording.md` |
| Phase 2d hip data, Tasks 3 to 6 (sourced data) | done (12 rows, 2 exercises, gaps listed) | `phase-2d-data-build-report.md` |

## Waiting for the owner

- Phase 2a: run `docs/phase2/phone-measurements.md` (Movements tab, hiding one side) on the phone in the review build.
- Phase 2d tools: when the physio's answers arrive, record them with `npm run mark-checked` as `docs/review/how-to-record-a-review.md` describes.
- Phase 2b Task 2 is **blocked** at Step 4: `hip.glb` measures 0.325 x 1.124 x 0.173, the plan expects the largest number between 0.5 and 1.0. The model runs from the ankle (tibia, fibula at -0.025) to the top of psoas major (1.099), so it looks like metres with a longer span than the plan assumed. Tried: built Steps 1 to 3 (castRays and its tests pass, size output in check-models), ran check-models, read the bounds per mesh. Not tuned, work discarded. Decide the range, then Task 2 is rebuilt and Tasks 3 and 4 follow. Details in `phase-2b-build-report.md`.
- Notebook Tasks 2 to 7 wait for the owner's sign-off in docs/phase2/medical-device-wording.md
- Phase 2d data: 12 new action rows and 2 exercises wait for the physio in the review build. Gaps in `docs/phase2/data-gaps.md`.

## Notes for the next session

- This run built in a clone on the Linux file system, because the web tests timed out on the Windows drive. The Windows checkout was fast-forwarded to the same commit at the end.
- `npm ci` and the Python `.venv` were run in the Windows checkout at the start (as the prompt asked), from WSL. Its `node_modules` and `.venv` now hold Linux builds. Run `npm ci` again before using that checkout from Windows.
- Phase 2b Task 2 can be rebuilt from its Step 1 once the scale range is decided.
