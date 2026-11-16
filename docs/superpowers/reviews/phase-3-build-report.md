# Phase 3 publish v1: build report

Plan: `docs/superpowers/plans/2026-11-13-phase-3-publish-v1.md`, Tasks 1 to 8.
Built on 2026-11-14 on the working branch `claude/install-superpowers-plugin-v0gy65`, in the Linux clone, with subagent-driven development: one implementer per task, a task review after each, and a final review of the whole branch on the strongest model.

## Summary

Every citation now carries a machine-readable `license_id`, and the validator refuses a quote from any source whose licence does not fit CC BY 4.0. Every licence page was opened again on 2026-11-14 (60 sources, 3 citations corrected) and the history was audited for private things (no secret, no address, no key, seven doubtful items for the owner). The repo has a public README, CONTRIBUTING, a data correction process with issue and pull request templates, a CI guard against outside pull requests that record reviews, a Pages workflow that deploys only the checked build from `main` and only while the repo is public, and the version and two links in the credits. The owner's remaining steps are in `docs/phase3/publish-checklist.md`.

## Commits

First: `fd7fc22`. Last: `2394625`.

| Task | Commits | State |
| --- | --- | --- |
| 1 Licence ids and the quote rule | `fd7fc22` | done with deviation |
| 2 Licence re-check | `ed43141`, `bceabaa` (fix after review) | done with deviation |
| 3 History and privacy audit | `7d94a5c` | done, stopped for the owner (findings open) |
| 4 Tooling and doc follow-ups | `13d7c3d` | done with deviation |
| 5 Public docs, correction process, review guard | `ab7df85`, `bff1c66` (fix after review) | done with deviation |
| 6 GitHub Pages deploy | `bde825c` | done |
| 7 Version and links in the app | `a3f5d89` | done with deviation |
| 8 The owner's publish checklist | `c5a43d0` | done with deviation |
| Final review fixes | `2394625` | done |

## Deviations

- **Task 1, licence mapping.** The plan's mapping list is a snapshot of 2026-11-13. Phase 2d added sources after it, so the data had four licence texts the list does not name. Each names exactly one licence of the fixed list in other words, so it got that id and not `other`: "CC BY-NC-ND 4.0" to `CC-BY-NC-ND-4.0` (zerbinati-2026, aali-2025), and three "CC BY, version not stated" wordings to `CC-BY-unversioned` (park-2026, kumazaki-2022, van-arkel-2015-restraint). Forcing `other` would have turned 23 real quotes into errors because of wording alone. Task 2 then checked every one of them against the live page. No real citation needed `other`, no `says` text was rewritten, and no real quote came from an incompatible source.
- **Task 1, `data/LICENSE`.** Its second line is an attribution note for quoted text, not a carve-out for incompatible quotes, so it stays.
- **Task 1, web bundle.** The citations the app bundle carries have no `license_id`. The plan does not ask for it in the app.
- **Task 2, second-hand pages.** For 21 articles the PubMed Central page showed only a bot check. The record uses the Europe PMC full text record of the same article (its licence element) and says so in each row. The three corrected citations now say what their page says plus the version from its licence link, for example "Creative Commons Attribution License, linked to CC BY 4.0", with `license_id: CC-BY-4.0`.
- **Task 2, commit trailer.** The trailer of `ed43141` names another Claude model. It was not amended, because history is not rewritten.
- **Task 3, author names.** The author list gives counts per name as the plan asks, but the third author name, which reads like a computer name, is described and not spelled out, because the owner's rules forbid copying hostnames.
- **Task 4.** `error-check.mjs` moved from port 4174 to 4173, because the plan has both scripts probe 4173. The two scripts can no longer run at the same time. The phone sheet has no section called "tap pass criteria", so the spike report points to sections 3 to 5 of `docs/phase0/phone-measurements.md`.
- **Task 5.** A one-line `scripts/check-review-guard.d.mts` was added, because TypeScript refused the untyped `.mjs` import in the test. The row code is optional in the correction docs and the issue form, because the normal build never shows row codes. In the copied "How to write a row" steps "the physio" became "the physiotherapist", the plan task numbers were dropped and the `license_id` and quote rule were added. The review guard job also checks `github.event_name == 'pull_request'`, because `ci.yml` runs on push too, and runs its step with `shell: bash` so a failing `git diff` fails the job.
- **Task 6.** No deviation. The action versions are the ones the GitHub documentation shows on 2026-11-14 (checkout v6, setup-node v7, upload-pages-artifact v4, deploy-pages v4). The release pages list newer majors. They were not used, as the owner asked for the documentation. `configure-pages` is not used, because the plan's step list does not have it and it fails while Pages is off.
- **Task 7.** The root `package.json` had no version, so `"version": "1.0.0"` was added. `apps/web/src/app-version.d.ts` declares `__APP_VERSION__`. The `define` sits only at the top of `vite.config.ts`, because Vitest already sees it there (the Credits test checks the version line).
- **Task 8.** Item 7 says "with the physio's consent" instead of "her consent", because the audit flags gendered references to the reviewer as identifying. The EU wording item in spec section 12 got a pointer and no strike, because the item itself names a second read before v1, which is checklist item 6 and still open. The final review fixes added sub-points to items 1, 5 and 9 (see below). The 13 numbered items are unchanged.
- **Final review fixes (`2394625`).** The review guard also catches `checked_by` and `checked_on` as the first key of a list item, with a quoted key, and in flow style. The checklist asks the owner to use the GitHub no-reply address for review commits, to run the audit searches again just before going public, to update `REPO_URL` if the public repo starts from a fresh commit, and to look closely at outside pull requests that touch `.github/` or the guard script. The audit has a seventh item (see "For the owner"). CONTRIBUTING and the schema say when to use `license_id: other`. The README no longer shows the review build screenshot. The licence record has no semicolons in prose. A test makes sure no Pages step may fail silently.

## Review Focus

1. **A draft row or a review bundle reaching the public site.** `pipeline/data/test/pagesWorkflow.test.ts`: "the Pages workflow never builds the review copy", "it uploads only the normal build", "the draft check runs after the build and before the upload", "the deploy is skipped while the repo is private", "no step is allowed to fail silently". The draft check itself is `scripts/check-no-drafts.mjs`, run in the same job after `npm run build`.
2. **A quote from a non-commercial or share-alike source.** `pipeline/data/test/validate.test.ts`: "a quote from a non-commercial source is refused", "a quote in an attachment from a non-commercial source is refused", "a summary of a non-commercial source is fine", "the real data has no quote from an incompatible source", "the quotable licences are the six that fit CC BY 4.0" (share-alike ids are not in the set).
3. **The site served from a sub-path.** Checked by hand in Task 6 Step 5 with a Playwright script outside the repo: the normal build copied to a folder `anatoMe` and served at `http://localhost:4180/anatoMe/`. 10 requests, all under `/anatoMe/`, none with a status of 400 or more, none to another host. Both model files, `data/hip.json` and the Draco decoder (wrapper and wasm) loaded, and search found piriformis. There is no automated test for this.
4. **A contributor who marks their own rows as checked.** `pipeline/data/test/reviewGuard.test.ts`: "setting checked_by is caught", "adding checked_on is caught", "in a diff of two files the result names the file that sets checked_by", "checked_by as the first key of a list item is caught", "a quoted checked_by key is caught", "flow style with only checked_by set is caught", and the passing cases ("a new row left unchecked passes", "removing a review is not an edit this guard cares about", "the words inside a says text do not trigger it", "null stays fine in quoted-key and flow forms"). The `review-guard` job in `.github/workflows/ci.yml` prints the plan's message. It was not run on GitHub, because no pull request may be opened.
5. **A licence text the fixed list does not cover.** `pipeline/data/test/validate.test.ts`: "a quote from a source with licence id other is refused", "a citation without license_id is refused". The rule for people who add a citation is in `CONTRIBUTING.md` step 2 and in the schema description of `license_id`.

## Checks

Run on `2394625` in the Linux clone:

```
data in data is valid
hip.glb: 65 meshes, 43378 triangles, 234348 bytes, size 0.325 x 1.124 x 0.173
hip-z-anatomy.glb: 38 meshes, 5531 triangles, 54824 bytes, size 0.288 x 0.579 x 0.136
 Test Files  35 passed (35)
      Tests  329 passed (329)
 Test Files  7 passed (7)
      Tests  124 passed (124)
✓ built in 1.18s          (build:review)
✓ built in 1.23s          (build)
  4 passed (15.9s)        (e2e)
apps/web/dist/data: 1 bundle(s), no drafts
median interactive ms: 2953
ok   decoder download fails: message shown after 986 ms
ok   decoder never answers: message shown after 20680 ms
ok   model file missing: message shown after 957 ms
14 passed in 3.39s        (test:py)
```

Perf median: 2953 ms.

## Not verified

- The `review-guard` CI job and the Pages workflow have never run on GitHub. The guard script was tried by hand with piped diffs, and the workflow files were checked by tests and by parsing them.
- The Pages deploy itself, which needs the repo to be public and Pages switched on (checklist items 9 and 10).
- The sub-path check ran on this machine, not on the real `github.io` address, and not on the phone (checklist item 11).
- 21 licence rows rest on the Europe PMC record, not the PubMed Central page, which showed a bot check.
- The new credits lines (version and the two links) were not looked at on the phone.

## Noticed, not done

- The perf and error scripts: the port probe and the fetch in the start-up wait have no timeout of their own, so a port that never answers could keep them waiting past 15 seconds.
- The review guard flags `checked_by: null # comment` and, in flow style, a free-text value that contains ", checked_by: x". Both fail safe. The guard runs the pull request's own copy of the script, so it catches mistakes, not a determined contributor. Making `review-guard` a required check would help.
- The " · " between the two credits links is written in `Credits.tsx`, not in `en.json`.
- Spec section 6 still says the OpenSim model licence is "Unknown". The simtk project page now shows a Stanford permission text (see `docs/phase3/licence-recheck.md`). This is not a status line, so it was left for the owner.
- Z-Anatomy's own README still credits BodyParts3D under the older CC BY-SA 2.1 Japan, which the DBCLS licence page has replaced. It does not change what this repo credits.
- The header of `docs/phase2/medical-device-wording.md` still reads as waiting for the owner's sign-off, although the sign-off was recorded in `edb5979`.
- Once public, `docs/phase3/history-audit.md` tells readers which commits hold the personal items (without values). The owner may prefer to keep it out of the public tree.

## For the owner

1. **The history audit has seven open items (D1 to D7) in `docs/phase3/history-audit.md`.** No key, token, address, hostname or forbidden file was found. The doubtful items are your online handle in the spec header (D1), your own symptoms beyond the general motivation in the spec (D2), personal circumstances in the spec (D3), the description of your home server in the deploy doc (D4), a personal e-mail address in the author and committer fields of six commits (D5), an author name that reads like a computer name (D6), and a local home-folder path in the history of commit `ed43141` (D7, fixed in the file by `bceabaa`, found by the final review after the audit ran). D1, D5, D6 and D7 can only be removed by rewriting history or starting the public repo from a fresh commit. D7 is now also on the pushed working branch. A squash-merge into `main`, or a fresh public repo, keeps it out of `main`. Decide before checklist item 9.
2. **Confirm the licence mapping (Task 1 deviation) and the 21 Europe PMC rows** in `docs/phase3/licence-recheck.md`.
3. **Confirm `REPO_URL`** in `apps/web/src/config.ts`. It was taken from the `origin` remote. If the public repo starts fresh at another address, change it there.
4. **README "What comes next"** is the builder's wording (more regions, more checked rows). Change it if you prefer.
5. **Pages action versions:** the documentation still shows upload-pages-artifact v4 and deploy-pages v4, while v5 releases exist. `pages.yml` follows the documentation. You may want to move to v5 when the documentation does.
6. **Then work through `docs/phase3/publish-checklist.md`.** Phase 3 starts only after the physio review (item 1).
