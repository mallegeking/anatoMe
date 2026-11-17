# Phase 2d data build report: sourced hip data

Plan: `docs/superpowers/plans/2026-11-13-phase-2d-hip-data.md`, Tasks 3, 4, 5 and 6. Tasks 1 and 2 are in `phase-2d-tools-build-report.md`.
Built on: `claude/install-superpowers-plugin-v0gy65`, 2026-11-14.

## Summary

Twelve new stretched rows and two exercises were drafted from open-access sources opened in full on 2026-11-14. All of them have `checked_by: null`, so the normal build still holds no action row and no exercise. Everything the opened sources did not support is written into `docs/phase2/data-gaps.md`: pinched rows for the bursae and the labrum, most deep rotators and adductors, iliacus, and four of the six exercises. The ten thigh muscles already had knee rows, so Task 5 added none. Iliacus and psoas major moved from depth 1 to depth 2 on the strength of an ultrasound guide.

## How the sources were found and read

- Five research agents searched Europe PMC (open-access full texts only) and wrote candidate passages with their licence lines into working files outside the repo. They did not write data.
- I downloaded every cited source as full text from the Europe PMC API, checked each passage word for word against it with a script, read the paragraph around it, and wrote every row myself.
- **Second read (Tasks 3 and 4):** every cited source was downloaded again, fresh, into a separate folder. A script checked each quote and each "paragraph beginning" locator against the fresh copy and printed the source's licence next to ours, and I read the paragraph around every quote for the direction of the movement and for the angles. All quotes and locators were found, all licences matched, and no row changed. The summaries (two exercise citations, two psoas citations) were compared with the source text by hand.
- EUR-Lex, NCBI Bookshelf (StatPearls) and some publisher pages refused automated reading. Nothing from them is cited.
- Rows were also read as sentences in the review build's Movements tab with Playwright (each hip movement, and each exercise phase at 0, 50 and 100 percent).

## Commits

First: `8d943fb`. Last: `baab363`.

| Task | Commits | State |
| --- | --- | --- |
| 3 Stretched and pinched rows | `8d943fb` (capsular ligaments, capsule, ligament of the head of the femur), `920890f` (iliotibial tract, bursa gaps), `548a74a` (hamstrings, rectus femoris, psoas major), `420597a` (adductor longus, rotator gaps) | done with deviation |
| 4 Exercises | `778e429` | done with deviation |
| 5 Knee rows | `3453b2f` (gap file only) | done, nothing missing |
| 6 Depth of iliacus and psoas major, not modelled | `baab363` | done |

## Deviations

- **Task 3, no "second read" commit.** The plan's Step 6 commits what the second read changed. It changed nothing, so there is no such commit.
- **Task 3, "knee straight" could not be written as an angle.** The hamstring sources speak of hip flexion with the knee extended. A `when` with `knee.flexion` from 0 to 0 fails the validator ("min must be less than max"), so the three hamstring rows have no angle range and the knee condition is in their `review_note`. In the app they also show as stretched with the knee bent, for example at the bottom of the squat.
- **Task 3, no pinched rows.** The plan looks for pinching positions for the labrum and the three bursae. The opened sources either name no movement (sitting, friction) or name positions without a number ("in extension", "full abduction"), and a row without an angle range would claim the pinch at every angle. All are in the gap file.
- **Task 4, only two of six exercises.** Squat and side-lying hip abduction have sourced angles. Forward lunge, Romanian deadlift, glute bridge and clamshell do not (gap file, section Task 4).
- **Task 4, a start at 0.** No source states the standing (or lying) start angle as a number. Each exercise starts its path at 0, the model's own zero for standing upright, and the file header and each `review_note` say so. Every other `from` and `to` is a number the source states (90.3 and 94.0 for the squat, 30 for the abduction).
- **Task 4, effort for the squat comes from a loaded back squat** (80 percent of the one repetition maximum), used for a bodyweight squat. The `review_note` asks the physio.
- **Task 5, nothing to add.** Each of the ten muscles already had a knee row on 2026-11-14. The gap file records this. The plan's commit message "Add the missing knee rows" would not be true, so the commit says "Record that every thigh muscle already has a knee row".
- **Task 6, depth 2.** The depth note cites an ultrasound guide under CC BY-NC 4.0, written as our own summary. It shows sartorius as the outermost muscle over the iliopsoas at the front of the hip joint. It does not mention rectus femoris, so the note says only "one layer under sartorius".

## Review Focus

3. **A `when` wider than the source.** Only two new rows have a `when`. `ligament-of-head-of-femur-hip-external-rotation-stretched`: 60 to 90, where the source says "high flexion (≥ 60°)" and tested 60, 90 and full flexion (no number for full flexion). `adductor-longus-hip-abduction-stretched`: abduction 0 to 40 and flexion -20 to 80, exactly the tested angles in the Methods. Both were checked in the second read.
4. **Quotes from incompatible licences.** A script checked every new citation: all 24 quotes come from CC BY sources. The four summaries are the two psoas citations from CC BY-NC-ND sources (Zerbinati 2026, Aali 2025) and two squat citations that report table values in our own words. The depth note for iliacus and psoas major (Manske 2024, CC BY-NC 4.0) is also our own summary.
5. **Rows keyed to the wrong direction.** Read as sentences in the Movements tab of the review build. Each new row sits under the movement that tightens or lengthens the structure: iliofemoral ligament under external rotation, pubofemoral under abduction, ischiofemoral under adduction, the capsule under extension, the ligament of the head of the femur under external rotation in flexion, the iliotibial tract under adduction, the hamstrings under hip flexion, rectus femoris and psoas major under hip extension, adductor longus under abduction.

## Rows added

"My confidence" says how sure I am that the row says what the source says, not how sure the anatomy is.

| Row | Source | Licence | Quote or summary | My confidence |
| --- | --- | --- | --- | --- |
| `iliofemoral-ligament-hip-external-rotation-stretched` | van-arkel-2015-restraint (PMC4491667), ng-2019 (PMC7406151) | Creative Commons CC-BY (version not stated), CC BY 4.0 | quote, quote | high. "Restraint" read as "stretched" is asked in the review note |
| `pubofemoral-ligament-hip-abduction-stretched` | ng-2019, van-arkel-2015-restraint | CC BY 4.0, CC-BY | quote, quote | medium. Both sources tie it to extension or full abduction, the row has no angle |
| `ischiofemoral-ligament-hip-adduction-stretched` | baba-2022 (PMC8725321), van-arkel-2015-restraint | CC BY 4.0, CC-BY | quote, quote | medium. Baba states it from earlier studies |
| `hip-joint-capsule-hip-extension-stretched` | ng-2019, van-arkel-2015 (PMC4655836) | CC BY 4.0, CC BY 4.0 | quote, quote | medium. A whole-capsule row from a photo of one part and from the rotation slack data |
| `ligament-of-head-of-femur-hip-external-rotation-stretched` (hip flexion 60 to 90) | van-arkel-2015-restraint, migliorini-2024 (PMC11662112) | CC-BY, CC BY 4.0 | quote, quote | high |
| `iliotibial-tract-hip-adduction-stretched` | borghi-2025 (PMC12635949), zhao-2026 (PMC13693282) | CC BY 4.0, CC BY 4.0 | quote, quote | medium. Clinical test logic, not a length measurement |
| `biceps-femoris-long-head-hip-flexion-stretched` | kellis-2022 (PMC9446565), danielsson-2020 (PMC7526261) | CC BY 4.0, CC BY 4.0 | quote, quote | high |
| `semimembranosus-hip-flexion-stretched` | kellis-2022, danielsson-2020 | CC BY 4.0, CC BY 4.0 | quote, quote | high |
| `semitendinosus-hip-flexion-stretched` | kellis-2022, danielsson-2020 | CC BY 4.0, CC BY 4.0 | quote, quote | medium. The source says semitendinosus copes with more range |
| `rectus-femoris-hip-extension-stretched` | chanel-2025 (PMC12782349) | CC BY 4.0 | quote | medium. Only 0 and 80 degrees of hip flexion were tested |
| `psoas-major-hip-extension-stretched` | zerbinati-2026 (PMC13387791), aali-2025 (PMC11923245) | CC BY-NC-ND 4.0, CC BY-NC-ND 4.0 | summary, summary | medium. Both take the stretch as given (surgery set-up, flexibility test) |
| `adductor-longus-hip-abduction-stretched` (abduction 0 to 40, hip flexion -20 to 80) | kato-2023 (PMC10261119) | CC BY 4.0 | quote, quote | high |
| exercise `bodyweight-squat` | pottorf-2026 (PMC13179743), park-2026 (PMC13413768) | Creative Commons Attribution License (version not stated), Creative Commons Attribution (CC BY) license (version not stated) | summary (table values), summary (table values) and quote | high for the angles, medium for the effort (loaded squat) |
| exercise `side-lying-hip-abduction` | uebayashi-2026 (PMC13353230) | Creative Commons Attribution License (version not stated) | quote, quote | high |

Also changed: `iliacus` and `psoas-major` in `data/structures/hip.yaml` (depth 1 to 2, new `depth_note` citing Manske 2024, PMC11611481, CC BY-NC 4.0, as our own summary).

New citations: van-arkel-2015-restraint, migliorini-2024, borghi-2025, zhao-2026, kellis-2022, danielsson-2020, chanel-2025, zerbinati-2026, aali-2025, kato-2023, pottorf-2026, park-2026, uebayashi-2026.

## Checks

Run on `baab363`, all exit 0.

```
npm run validate                  data in data is valid
npm run check-models              every mesh maps to one of 52 structures
npm test                          web: Tests 192 passed (192)
                                  pipeline: Tests 98 passed (98)
npm run build:review -w apps/web  hip.json (review): 136010 bytes, 64 actions, 63 attachments, 2 exercises
npm run build                     hip.json (normal): 8550 bytes, 0 actions, 0 attachments, 0 exercises
npm run e2e -w apps/web           2 passed
node scripts/check-no-drafts.mjs  apps/web/dist/data: 1 bundle(s), no drafts
perf-check                        median interactive ms: 2009 (limit 5000)
error-check                       all three cases show their message
npm run test:py                   14 passed
npm run data-report               0 of 64 action rows checked, 0 of 63 attachment rows checked, 0 of 2 exercises checked
```

## Not verified

- The anatomy itself. Every row is a draft for the physio, and the rows' questions are in their `review_note`.
- The exercises on the phone. The Exercises section of `docs/phase2/phone-measurements.md` now lists four checks.
- Whether the new depth of iliacus and psoas major looks right when peeling layers on the phone.

## Noticed, not done

- The app writes a negative hip angle as "with the hip bent between -20 and 80 degrees" (adductor longus row). The review note explains the range, but the sentence reads oddly. A wording change in `describe.ts` for negative angles would help.
- A range cannot hold a single angle (`min` must be less than `max`). Rows that a source ties to one tested angle (piriformis at 0 degrees, the knee held straight) cannot be written. The owner may want a way to say "only at this angle" or "with the knee straight".
- The existing row `obturator-internus-hip-internal-rotation` spans 0 to 60 degrees, while its source names 0 and 60 and says the ischiofemoral ligament did most of the holding at 30. That fills a gap between two measured angles. Its review note already asks the physio.
- Hamstrings now show as main movers and as stretched at the same time at the bottom of the squat (working from the effort list, stretched from the hip flexion). The panel shows the strongest role, which is right, but the physio may want to see it.
- NCBI Bookshelf (StatPearls) could not be read automatically (captcha), so no StatPearls page is cited.

## For the owner

- 12 new action rows and 2 exercises wait for the physio in the review build (review list and Movements tab). Each has a question in `review_note`.
- Four exercises (forward lunge, Romanian deadlift, glute bridge, clamshell) have no sourced angles. The physio could give typical teaching ranges, but the rules say a row needs an opened source, so those would need a citable source first.
- `docs/phase2/data-gaps.md` lists everything that is still missing, with the sources tried.
