# anatoMe: roadmap for the rest of the build

Date: 2026-11-13
Status: draft, waiting for review by the project owner
Based on: `docs/superpowers/specs/2026-11-02-anatome-design.md` (main spec) and the state of the repo on 2026-11-13.

This page is the index for the plans written on 2026-11-13. It says which plan covers which part of the roadmap, the order to build them in, what can run while the physio review is still open, and what is not planned yet and why. Points marked **(builder's call)** were decided by Claude while writing the plans. The owner can overrule any of them before the build starts.

## Where the project stands

- Phase 0 and Phase 1 are built. The phone gate for Phase 1 and the physio review are open.
- All 52 action rows and all 63 attachment rows have `checked_by: null`. So the normal build shows names, layers and search, and no claim yet. Everything about movements shows only in the review build until rows are checked.
- This matters for every plan below: each new screen must look right with zero checked rows, because that is the real state today.

## The plans

| Plan | Covers | Needs | Kind of work |
| --- | --- | --- | --- |
| [Phase 2a: movement explorer](2026-11-13-phase-2a-movement-explorer.md) | Pick a movement or an exercise, structures light up by role, joint-angle control, mode tabs, Phase 1 leftovers in the app | Nothing | Code |
| [Phase 2b: area lookup](2026-11-13-phase-2b-area-lookup.md) | "Tap where it hurts": the structures under a spot, layer by layer, with the movements that load each | 2a merged | Code |
| [Phase 2c: symptom notebook](2026-11-13-phase-2c-symptom-notebook.md) | EU medical device wording check, on-device log, structures to look into, one-page export, backup file | 2a merged. Owner signs off the wording check (Task 1) before the rest is built | Research, then code |
| [Phase 2d: hip data](2026-11-13-phase-2d-hip-data.md) | Tools for taking in review results, stretched and pinched rows, knee rows, exercises, open depth questions | Task 4 (exercises) needs the exercise schema from 2a Task 3 | Tools, then sourced data |
| [Phase 3: publish v1](2026-11-13-phase-3-publish-v1.md) | Licence re-check, history audit, public README, CONTRIBUTING, data correction process, GitHub Pages | Phase 2 gate: the physio has reviewed the hip data | Research, docs, CI |
| [Phase 4a: regions and German](2026-11-13-phase-4a-regions-and-german.md) | App and pipeline ready for more than one region, German UI, the region playbook | Phase 3 done | Code, translation |

## Order

```
2a  ──►  2b  ──►  2c (Task 1 first, then owner sign-off, then the rest)
 │
 └─►  2d Task 4 (exercises)

2d Tasks 1, 2, 3, 5 and 6: any time, also next to 2a

Phase 2 gate (physio has reviewed the hip data)  ──►  3  ──►  4a
```

- 2a goes first because it adds the mode tabs and the movement logic that 2b and 2c build on.
- 2b and 2c both add a tab to `App.tsx`. Build them one after the other, not side by side, so they do not collide.
- 2d touches only `data/`, `pipeline/data/` and `docs/`, so it can run next to the app plans. One exception: its exercise task needs the schema from 2a.
- All build work happens on the working branch `claude/install-superpowers-plugin-v0gy65`, one commit per task. Nobody but the owner touches `main`. The owner merges the working branch into `main` after the review. Where a plan says "merged", read "built on the working branch". See `2026-11-13-build-rules.md` and `2026-11-13-opus-prompts.md`.

## What does not wait for the physio

All of 2a, 2b, 2c and 2d can be built now. They are tested with fixtures and the test-only data in `apps/web/e2e/data`, and the owner looks at real data in the review build. Phase 3 is the first plan that truly waits: the spec does not let v1 go public before the physio has reviewed the hip data.

When the physio's answers arrive, 2d Task 1 gives the owner a command to mark rows as checked without editing 115 YAML rows by hand.

## Decisions the owner should look at before the build

These are the builder's calls with the most weight. Each plan lists its own in a "Design decisions" section.

1. **Exercises are gated like action rows, and only a physio can check them** (2a, 2d). An exercise says which muscles work in each phase, which is a claim about the body.
2. **An exercise phase names its effort, not only its joint motion** (2a). Lowering into a squat bends the hip, but the muscles that work are the ones that straighten it. The data says so directly in an `effort` field, so the app never lights the wrong group.
3. **In movement mode the uninvolved muscles and soft tissue are hidden, bones stay** (2a). Fading them with see-through materials would cost frames on the Galaxy A23.
4. **The joint-angle control only spans angles that some row names** (2a). No range of motion number is shown that has no source.
5. **Area lookup works from the 3D meshes at the moment of the tap, not from a hand-written region map** (2b). The spec's region map entity is not created.
6. **The notebook is built only after the owner has read and signed off the wording check** (2c). It is the feature closest to the line the spec calls "drifting into diagnosis".
7. **Quotes are checked by the validator against the source licence** (3). A `says_kind: quote` from a source that is not compatible with CC BY 4.0 fails the build.
8. **The quadriceps tendon and patellar ligament stay known gaps** (2d). Neither mesh source has them and drawing them by hand was ruled out in Phase 0.

## Not planned yet, and why

- **Phase 4 region content** (spine and neck, shoulder girdle, upper limb, knee and ankle). Each region needs its own mesh inventory and source decision before anyone can list its files and structures, exactly as the hip did in Phase 0. Plan 4a makes the app and pipeline ready and writes the playbook. The next step after that is a short design for the first new region. The owner's shoulder is the natural pick.
- **Phase 5, simulation playback.** The OpenSim model licence is still an open item in the spec, and nothing in the app can play an animation yet. It needs its own design.
- **Phase 6, video input.** A stretch goal in the spec. It needs its own design after Phase 5.
- **Shona UI.** Waits for German and for a check of which anatomy terms exist in Shona.
- **Installable offline app and peripheral nerves.** On the ideas list, not in v1.

## About this machine

The repo was built so far on Linux. This Windows checkout has Node 22 and the npm packages, but no `.venv`, no `sources/` and no `tools/blender`. So:

- `npm run validate`, `npm run check-models`, `npm test`, `npm run build` and the Playwright test run here.
- `npm run test:py` (it calls `.venv/bin/pytest`) and every Blender step do not run here. CI runs the Python tests. Mesh work belongs on Linux or WSL. Only plan 4a has such steps and it says so in the task.

## How the work is checked

Opus builds each plan task by task. After each plan, Claude (Fable) reviews the branch against the plan, the spec and the plan's Review Focus list before the owner merges.
