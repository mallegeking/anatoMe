# Phase 2d tools build report: recording a review and the coverage report

Plan: `docs/superpowers/plans/2026-11-13-phase-2d-hip-data.md`, Tasks 1 and 2 only. Tasks 3 to 6 are reported in `phase-2d-data-build-report.md`.
Built on: `claude/install-superpowers-plugin-v0gy65`, 2026-11-14.

## Summary

`npm run mark-checked -- --by physio-1 --on <date> --from <file>` records a review. It edits the YAML text line by line, changes only the `checked_by` line and adds the `checked_on` line under it, and writes nothing at all when an id is missing, already checked, refused by the validator, or when a write fails part way. `docs/review/how-to-record-a-review.md` explains the steps for the reviewer and the owner. `npm run data-report` prints which structures have rows and which do not. The model check now also fails for a structure that no mesh carries, and the labrum, joint and Draco cases have their own tests.

mark-checked was never run on the real `data/` folder. Every test and every manual try used a copy of a fixture in a temporary folder. `git diff --stat 9daa445..HEAD -- data/` is empty.

## Commits

First: `8ad2afa`. Last: `399d23f`.

| Task | Commit | State |
| --- | --- | --- |
| 1 Recording a review with one command | `8ad2afa`, fix `91e0d48` | done with deviation |
| 2 Coverage report and two loose ends | `8ac82c7` | done |
| Final review fixes | `399d23f` | done |

## Deviations

- **Task 1.** The review found that a write error part way (a locked or read-only file, a full disk) would leave some files changed and nothing restored. `markChecked` now writes only the files whose text changed, puts the writes and the validation in one `try`, and on any failure writes every touched file back to its old text. A test makes one file read-only so the second write fails, and checks that every file is byte-equal to before. Duplicate ids are marked once, and a missing `--from` file gives a one-line message instead of a stack trace (exit 2, as the other usage errors of the CLI).
- **Task 1.** The brief's test snippet needed a type on one lambda (`(l: string)`) for `tsc`.
- **Task 2.** Three of the four "loose end" tests passed before any code change (labrum cannot work, joint cannot appear in actions, Draco file). As the plan says, the tests were kept and no code was changed for them. Only "structure has no mesh in any file" was new code.
- **Final review fixes.** `data-report` with an unknown region (a typo) now prints an error and exits 1 instead of a report that looks clean. The guide names the `not written` output and says exercise rows are refused for `owner` like action rows. One more test marks a row inside the whole valid fixture file and compares the entire result with the original text plus exactly the two changed lines. The stale sentence "Labrum and joint still have no fixture of their own" in the follow-ups doc was removed.

## Review Focus

1. **Missing id, already checked, owner on an action row change no file.** `pipeline/data/test/markChecked.test.ts` "a missing id changes no file", "an action row marked by the owner is refused and the files are restored", the already-checked case in the same block, and the part-way write failure test. Each compares a byte snapshot of every file in the temp copy before and after.
2. **Every other byte stays.** `markChecked.test.ts` "leaves every other line untouched", "keeps Windows line ends", "an id that is the start of another id does not match it", and "marks one row inside a whole fixture file and changes nothing else" (exact comparison of the full file).

## Checks

Run on `399d23f`, all exit 0.

```
npm run validate                  data in data is valid
npm run check-models              every mesh maps to one of 52 structures
npm test                          web: Tests 183 passed (183)
                                  pipeline: Tests 98 passed (98)
npm run build:review -w apps/web  hip.json (review): 114640 bytes, 52 actions, 63 attachments, 0 exercises
npm run build                     hip.json (normal): 8451 bytes, 0 actions, 0 attachments, 0 exercises
npm run e2e -w apps/web           2 passed
node scripts/check-no-drafts.mjs  apps/web/dist/data: 1 bundle(s), no drafts
perf-check                        median interactive ms: 2102 (limit 5000)
error-check                       all three cases show their message
npm run test:py                   14 passed
```

`npm run data-report` on the real data (start of the data tasks): 0 of 52 action rows checked, 0 of 63 attachment rows checked, 0 exercises. Psoas major has no origin row. Seventeen ligaments, capsule, bursae and menisci have no action row, among them the iliotibial tract, the pubofemoral ligament, the hip joint capsule and the three hip bursae.

## Not verified

- The command on the owner's Windows checkout with real `\r\n` files. The behaviour is tested on `\r\n` text in memory, and the restore path is tested on Linux only.
- The read-only file test assumes the tests do not run as root (CI runs as a normal user on `ubuntu-latest`).

## Noticed, not done

- A row whose line reads `checked_by: null # note` or `checked_by: ~`, or a row with no `checked_by` line, is reported as "already checked" or "not found". Nothing is written in either case, the schema requires the key and the real data has neither form.
- When a run is refused, `MarkRun.marked` still lists the ids that would have been marked. The CLI prints `not written` for them, so nothing wrong reaches the owner.
- No test runs the CLI itself (the `--from` parsing and the exit codes were checked by hand).
- When one model file cannot be read, every structure in it also gets a "has no mesh in any file" error, which buries the real error.
- `formatReport` builds the "no origin, no insertion" text with nested conditions that are hard to read.

## For the owner

- When the physio's answers arrive, follow `docs/review/how-to-record-a-review.md`. Try the command once on a copy of the data folder first if you want to see it work before it touches `data/`.
