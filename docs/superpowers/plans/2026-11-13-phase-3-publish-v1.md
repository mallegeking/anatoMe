# anatoMe Phase 3 Publish v1 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Make the repo ready to go public as v1: licences re-checked, history audited, the quote rule enforced by the validator, public docs and a correction process in place, and a GitHub Pages deploy that can never ship a draft.

**Architecture:** Two research tasks produce dated records in `docs/phase3/`. The validator gains a machine-readable licence id per citation and a rule that ties quotes to it. CI gains a Pages workflow that builds the normal site, runs the draft check and deploys only when the repo is public, plus a guard that keeps outside pull requests from recording reviews. The last task is a checklist of the steps only the owner can take.

**Tech Stack:** As Phase 2. GitHub Actions for Pages (check the current action versions in the official docs before writing the workflow).

**Spec:** `docs/superpowers/specs/2026-11-02-anatome-design.md` (sections 2, 3, 6, the Phase 3 row of section 9 and all of section 12) and `docs/superpowers/specs/2026-11-03-phase-1-hip-atlas-design.md` (sections 2 and 4, the licence of quoted evidence).

## Global Constraints

- Docs and code comments: plain language, no em dashes, no semicolons in prose.
- **Phase 3 starts only when the Phase 2 gate is met:** the owner's physio has reviewed the hip data. Tasks 1 to 7 can be built on a branch before that. Task 8 (the owner's steps) cannot.
- **The agent never makes the repo public, never enables Pages, never rewrites history and never pushes a tag.** Those are the owner's steps in Task 8.
- The review build is never deployed. Only `apps/web/dist` from `npm run build` ships, and only after `node scripts/check-no-drafts.mjs` passed in the same job.
- Nothing private may be in the repo or its history: hostnames, Tailscale names, IP addresses, keys, reviewer names, symptom data. Findings are described by commit and file, never by pasting the value.
- Research records name the page, the link and the date read. Nothing about a licence is written from memory.
- All app text comes from the language file. No runtime request leaves the app's own host. A link the person taps is not a runtime request.
- Existing checks stay green: `npm run validate`, `npm run check-models`, `npm test`, `npm run build`, `npm run e2e -w apps/web`, `node scripts/check-no-drafts.mjs`.

## Design decisions (builder's calls, the owner can overrule)

1. **`license_id` on every citation.** The free-text `license` stays as the source states it. A new required `license_id` from a fixed list makes the licence checkable by a machine.
2. **A quote needs a compatible licence.** `says_kind: quote` is valid only when the cited source's `license_id` is one of `CC-BY-4.0`, `CC-BY-3.0`, `CC-BY-2.0`, `CC-BY-unversioned`, `CC0-1.0`, `public-domain`. Share-alike, non-commercial and no-derivatives sources may be cited, with a summary.
3. **Outside pull requests cannot record a review.** A CI job fails a pull request that sets `checked_by` to anything but null, unless the repo owner opened it.
4. **Pages deploys from GitHub Actions**, from `main`, and the deploy job is skipped while the repo is private.
5. **The version is `1.0.0`**, read from the root `package.json` and shown in the app's credits.
6. **History is audited, not rewritten.** If the audit finds something private, the plan stops and the owner decides.

## Review Focus

1. A draft row or a review bundle reaching the public site. The Pages job must run the draft check after the build and upload only `apps/web/dist`. Test in Task 6.
2. A quote from a non-commercial or share-alike source. The validator must refuse it. Test in Task 1.
3. The site served from a sub-path (`https://<owner>.github.io/<repo>/`). Every asset, the model, the data and the Draco decoder must load there. Check in Task 6.
4. A contributor who marks their own rows as checked. The CI guard must fail that pull request and say why. Test in Task 5.
5. A citation with a licence text the fixed list does not cover. It must get `license_id: other`, which never allows a quote, instead of being forced into a near match. Test in Task 1.

---

## File Structure

```
data/schema/citations.schema.json     # license_id (Task 1)
data/citations.yaml                   # license_id on every row (Task 1)
pipeline/data/src/validate.ts         # the quote rule (Task 1)
docs/phase3/
├── licence-recheck.md                # new (Task 2)
├── history-audit.md                  # new (Task 3)
└── publish-checklist.md              # new (Task 8)
apps/web/scripts/perf-check.mjs, error-check.mjs   # hardening (Task 4)
README.md, CONTRIBUTING.md, docs/data-corrections.md   # (Task 5)
.github/
├── ISSUE_TEMPLATE/data-correction.yml, bug.yml, config.yml   # new (Task 5)
├── pull_request_template.md          # new (Task 5)
├── workflows/ci.yml                  # review guard job (Task 5)
└── workflows/pages.yml               # new (Task 6)
scripts/check-review-guard.mjs        # new (Task 5)
apps/web/src/ui/Credits.tsx           # version and links (Task 7)
```

---

### Task 1: Licence ids and the quote rule

**Files:**
- Modify: `data/schema/citations.schema.json`, `data/citations.yaml`, `pipeline/data/src/validate.ts`, every `citations.yaml` under `pipeline/data/test/fixtures/` and `apps/web/e2e/data/`
- Create: fixture folders `quote-from-nc-source` and `quote-from-other-licence`
- Test: `pipeline/data/test/validate.test.ts`

**Interfaces:**
- Produces:
  - `license_id` is required on citations, an enum: `CC-BY-4.0`, `CC-BY-3.0`, `CC-BY-2.0`, `CC-BY-unversioned`, `CC-BY-SA-4.0`, `CC-BY-SA-3.0`, `CC-BY-NC-4.0`, `CC-BY-NC-unversioned`, `CC-BY-NC-SA-4.0`, `CC-BY-NC-ND-4.0`, `CC-BY-NC-ND-3.0`, `CC0-1.0`, `public-domain`, `other`.
  - Mapping for the licence texts in `data/citations.yaml` on 2026-11-13: "CC BY 4.0" to `CC-BY-4.0`, "CC BY 2.0" to `CC-BY-2.0`, "CC BY-NC 4.0" to `CC-BY-NC-4.0`, "CC BY-NC-ND 3.0" to `CC-BY-NC-ND-3.0`, both "Creative Commons Attribution License ... version not stated" texts to `CC-BY-unversioned`, "Creative Commons Attribution Noncommercial License (version not stated)" to `CC-BY-NC-unversioned`. Any text not in this list gets `other` and a line in the task report.
  - `export const QUOTABLE: ReadonlySet<string>` in `validate.ts` with the six ids of design decision 2.
  - New validator error on a citation use with `says_kind: quote` whose source is not quotable, at path `/<row>/citations/<n>/says_kind`: `a quote needs a source whose licence fits CC BY 4.0, <ref> is <license_id>. Write a summary in our own words instead`. The rule covers actions, attachments and exercises.

- [ ] **Step 1: Write the failing tests**

```ts
test("a quote from a non-commercial source is refused", ...fixture quote-from-nc-source: message contains "a quote needs a source whose licence fits CC BY 4.0" and "CC-BY-NC-4.0");
test("a quote from a source with licence id other is refused", ...);
test("a summary of a non-commercial source is fine", ...ok true);
test("a citation without license_id is refused", ...message "license_id is required");
test("the real data has no quote from an incompatible source", () => expect(validateDataDir("../../data").ok).toBe(true)); // adjust the path to how the other tests reach data/
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `npm test -w pipeline/data`
Expected: FAIL.

- [ ] **Step 3: Implement.** Add the field to the schema, to every citation in the real data by the mapping above and to every fixture and test citation (`CC-BY-4.0` there unless the fixture is about licences). Add the rule to `checkGated`, which needs the citations by id instead of only their ids.

- [ ] **Step 4: Run the checks**

Run: `npm run validate && npm test`
Expected: PASS. If `npm run validate` reports a real quote from an incompatible source, do not edit `says` from memory. Open the source, rewrite `says` as a summary, set `says_kind: summary` and list the row in the task report.

- [ ] **Step 5: Remove what the rule replaces.** Read `data/LICENSE`. If it still has a carve-out line for non-compatible quotes, remove it now that the validator guarantees there are none.

- [ ] **Step 6: Commit**

```bash
git add data pipeline apps/web/e2e/data
git commit -m "Give every citation a licence id and refuse quotes from incompatible sources"
```

---

### Task 2: Licence re-check (research)

**Files:**
- Create: `docs/phase3/licence-recheck.md`
- Modify: `ATTRIBUTION.md`, `models/LICENSE`, `data/citations.yaml`, `apps/web/src/i18n/en.json` (only where the check finds a difference)

Needs web access.

- [ ] **Step 1: Open every licence page again** and record what it says today. One table row each, with the columns: source, link, licence as the page states it, date read, what the repo says, match (yes or no):
  - BodyParts3D (the DBCLS licence page) and its requested credit line.
  - Z-Anatomy (the repository's licence file and README), including the parts it marks non-commercial.
  - The OERI Human Anatomy pages cited in `data/citations.yaml`.
  - Every other entry in `data/citations.yaml`: open the `url`, find the licence on the page.
  - three.js, Draco, React, React Three Fiber, drei and camera-controls: the licence file of the installed version in `node_modules`.
  - The two pages the spec says were blocked during design: the OpenSim full-body model on simtk.org and AnatomyScope. These do not affect v1. Record what is found, or that the page could not be reached.

- [ ] **Step 2: Fix every "no".** Where a page states a different licence than the repo, update `license`, `license_id`, the credit text in `ATTRIBUTION.md`, `models/LICENSE` and the `credits.*` keys, and run `npm run validate`. A citation whose licence became incompatible turns its quotes into validator errors: handle them as in Task 1 Step 4.

- [ ] **Step 3: Write the summary** at the top of `docs/phase3/licence-recheck.md`: how many sources were checked, how many differed, what changed, and what could not be reached.

- [ ] **Step 4: Run the checks and commit**

Run: `npm run validate && npm test && npm run build`
Expected: PASS.

```bash
git add docs/phase3 ATTRIBUTION.md models/LICENSE data apps/web/src/i18n
git commit -m "Re-check every licence before v1 and record the result"
```

---

### Task 3: History and privacy audit (research, may stop)

**Files:**
- Create: `docs/phase3/history-audit.md`

- [ ] **Step 1: Search the whole history**, every branch, for private things. Run each search over `git log --all -p` and over the file names of `git log --all --name-only`:
  - Tailscale names and addresses: `\.ts\.net`, and addresses in `100.64.0.0/10`.
  - Other IP addresses and local hostnames: IPv4 patterns, `192\.168\.`, `10\.`, `\.local\b`, `\.lan\b`.
  - Keys and tokens: `BEGIN [A-Z ]*PRIVATE KEY`, `ghp_`, `github_pat_`, `sk-`, `AKIA`, `password`, `secret`, `token`.
  - E-mail addresses and personal names in file contents.
  - Health notes: anything that reads like the owner's own symptoms outside the spec's general statement.
  - Files that should never have been committed: `.env`, anything under `sources/`, `tools/`, `apps/web/dist-review/`, notebook backups (`anatome-notebook-*.json`).

- [ ] **Step 2: List the commit authors.** Run `git log --all --format='%an <%ae>' | sort -u`. These names and addresses become public with the repo.

- [ ] **Step 3: Write `docs/phase3/history-audit.md`**: the searches that were run, the date, and for each finding the commit, the file and the kind of thing found. Never the value itself. Add the author list as counts per name without the addresses, and one line that says the addresses will be public.

- [ ] **Step 4: Commit, and stop if anything was found**

```bash
git add docs/phase3/history-audit.md
git commit -m "Record the history and privacy audit before going public"
```

If there is any finding, or an author address the owner may not want public, report it and wait. The owner decides between leaving it, rewriting history or starting the public repo from a fresh commit. Tasks 4 to 7 can go on meanwhile.

---

### Task 4: Tooling and doc follow-ups

**Files:**
- Modify: `apps/web/scripts/perf-check.mjs`, `apps/web/scripts/error-check.mjs`, `docs/deploy-homelab.md`, `docs/phase0/spike-report.md`, `docs/phase0/phase1-follow-ups.md`

Read both scripts fully before changing them.

- [ ] **Step 1: Harden both scripts** the same way:
  - Before starting the preview server, try to connect to port 4173. If something answers, print `Port 4173 is in use. Stop the other server and run this again.` and exit 1.
  - If the preview server has not answered within 15 seconds, or its process exits early, print `The preview server did not start. Run "npm run build" first and check the output above.`, stop the child process and exit 1.
  - Rename the constant `URL` so it no longer hides the global `URL` class (`PAGE_URL`).
  - The child process is stopped on every exit path.

- [ ] **Step 2: Verify by hand**

Run: `npm run build`, then in a second shell `npx vite preview --port 4173 --strictPort` from `apps/web`, then `node apps/web/scripts/perf-check.mjs`.
Expected: the "Port 4173 is in use" line and exit code 1. Stop the second shell and run both scripts again. Expected: both pass as before.

- [ ] **Step 3: Docs.** In `docs/deploy-homelab.md`, replace the claim that Tailscale reads the files fresh on each request with a sentence that does not promise it, and add a line telling the reader to do a hard refresh on the phone after an update. In `docs/phase0/spike-report.md`, add a pointer from the phone result to the tap pass criteria in `docs/phase0/phone-measurements.md`. Mark all four "Tooling and docs" follow-ups in `docs/phase0/phase1-follow-ups.md` as done (the README one is done by Task 5).

- [ ] **Step 4: Commit**

```bash
git add apps/web/scripts docs
git commit -m "Make the perf and error checks fail clearly and close the tooling follow-ups"
```

---

### Task 5: Public docs, correction process and the review guard

**Files:**
- Create: `CONTRIBUTING.md`, `docs/data-corrections.md`, `.github/ISSUE_TEMPLATE/data-correction.yml`, `.github/ISSUE_TEMPLATE/bug.yml`, `.github/ISSUE_TEMPLATE/config.yml`, `.github/pull_request_template.md`, `scripts/check-review-guard.mjs`
- Modify: `README.md`, `.github/workflows/ci.yml`
- Test: `pipeline/data/test/reviewGuard.test.ts`

**Interfaces:**
- Produces:

```js
// scripts/check-review-guard.mjs
// Reads a unified diff of data/ from stdin. Exits 1 and lists the lines when the diff adds
// a line that sets checked_by to anything but null, or adds or changes a checked_on line.
export function findReviewEdits(diff) // returns string[]: the offending added lines, with the file each belongs to
```

  - The script runs `findReviewEdits` on stdin only when it is the entry file, so the test can import the function.
  - New job `review-guard` in `ci.yml`, on `pull_request` only, with `if: github.event.pull_request.user.login != github.repository_owner`. It checks out with full history, runs `git diff origin/${{ github.base_ref }}...HEAD -- data | node scripts/check-review-guard.mjs` and on failure prints: `Only the project owner records reviews. Please leave checked_by: null and remove checked_on. See docs/data-corrections.md.`

- [ ] **Step 1: Write the failing test**

```ts
import { findReviewEdits } from "../../../scripts/check-review-guard.mjs";
const diff = (lines: string[]) => ["diff --git a/data/actions/hip.yaml b/data/actions/hip.yaml", "+++ b/data/actions/hip.yaml", "@@ -1,2 +1,3 @@", ...lines].join("\n");

test("a new row left unchecked passes", () => expect(findReviewEdits(diff(["+- id: new-row", "+  checked_by: null"]))).toEqual([]));
test("setting checked_by is caught", () => expect(findReviewEdits(diff(["-  checked_by: null", "+  checked_by: physio-1"]))).toHaveLength(1));
test("adding checked_on is caught", () => expect(findReviewEdits(diff(["+  checked_on: 2026-12-01"]))).toHaveLength(1));
test("removing a review is not an edit this guard cares about", () => expect(findReviewEdits(diff(["-  checked_by: physio-1", "+  checked_by: null"]))).toEqual([]));
test("the words inside a says text do not trigger it", () => expect(findReviewEdits(diff(['+      says: "the row has checked_by: owner in the text"']))).toEqual([]));
```

- [ ] **Step 2: Run the test to verify it fails**

Run: `npm test -w pipeline/data -- reviewGuard`
Expected: FAIL, module not found.

- [ ] **Step 3: Implement** the script (match only added lines of the form `^\+\s*checked_by:\s*(?!null\s*$)` and `^\+\s*checked_on:`) and the CI job.

- [ ] **Step 4: Run the test to verify it passes**

Run: `npm test -w pipeline/data`
Expected: PASS.

- [ ] **Step 5: Rewrite `README.md`** in this order: the educational line (kept word for word as the first paragraph), one paragraph on what anatoMe is and who it is for, a link to the live site (placeholder text "The link is added when the site is live", filled in by the owner in Task 8), screenshots from `docs/phase1/`, "What it does" in present tense for what exists and a short "What comes next" in future tense, "Your notes stay on your device", "How the data is checked" (the review gate in four sentences), "How to run it" (kept), "How to help" (points to `CONTRIBUTING.md` and `docs/data-corrections.md`), "License" (kept).

- [ ] **Step 6: Write `CONTRIBUTING.md`**: who this is for, how to set up and run the checks, the style rules (plain language, no em dashes, no semicolons in prose, all app text in the language files), how to add or change a data row (the steps of "How to write a row" from the Phase 2d plan, copied in full so the file stands alone), that every new row stays `checked_by: null`, that contributions to `data/` are licensed CC BY 4.0 and code MIT, and that nothing private goes into a pull request.

- [ ] **Step 7: Write `docs/data-corrections.md`**: how a physio, student or reader reports a wrong or missing claim (open a "Data correction" issue with the row code from the app's sources view, what they think is right, and a source), what happens next (the owner reads the source, a corrected row goes in as a draft, a physio checks it, then it shows), and how long a disputed row stays visible (it is set back to unchecked while it is looked at, which hides it from the normal build).

- [ ] **Step 8: Write the templates.** `data-correction.yml`: fields for the structure, the movement, the row code if known, what is wrong, what the reporter thinks is right, the source with a link, and a checkbox "I am not asking for medical advice". `bug.yml`: what happened, what was expected, device and browser. `config.yml`: `blank_issues_enabled: false`. `pull_request_template.md`: a checklist with "every new row cites a source I opened", "quotes only from sources whose licence fits CC BY 4.0", "checked_by is null on every row I added", "nothing private is in this change", "the checks pass".

- [ ] **Step 9: Commit**

```bash
git add README.md CONTRIBUTING.md docs/data-corrections.md .github scripts pipeline/data/test
git commit -m "Add the public docs, the data correction process and the review guard"
```

---

### Task 6: GitHub Pages deploy

**Files:**
- Create: `.github/workflows/pages.yml`
- Test: `pipeline/data/test/pagesWorkflow.test.ts`

**Interfaces:**
- Produces: a workflow named "Pages" that runs on a push to `main` and on `workflow_dispatch`, with `concurrency: { group: pages, cancel-in-progress: false }` and two jobs:
  - `build`: checkout, Node 22 with the npm cache, `npm ci`, `npm run validate`, `npm run check-models`, `npm run build`, `node scripts/check-no-drafts.mjs`, then the official upload action for Pages with `path: apps/web/dist`.
  - `deploy`: `needs: build`, `if: github.event.repository.private == false`, permissions `pages: write` and `id-token: write`, environment `github-pages`, the official deploy action.
  - Take the action names and versions from the current GitHub Pages documentation. Do not copy versions from memory or from `ci.yml`.

- [ ] **Step 1: Write the failing test**

```ts
const text = readFileSync(new URL("../../../.github/workflows/pages.yml", import.meta.url), "utf8");
test("the Pages workflow never builds the review copy", () => expect(text).not.toMatch(/build:review|dist-review/));
test("it uploads only the normal build", () => expect(text).toMatch(/path:\s*apps\/web\/dist\s*$/m));
test("the draft check runs after the build and before the upload", () => {
  const build = text.indexOf("npm run build");
  const check = text.indexOf("check-no-drafts.mjs");
  const upload = text.indexOf("upload-pages-artifact");
  expect(build).toBeGreaterThan(-1);
  expect(check).toBeGreaterThan(build);
  expect(upload).toBeGreaterThan(check);
});
test("the deploy is skipped while the repo is private", () => expect(text).toContain("github.event.repository.private == false"));
```

- [ ] **Step 2: Run the test to verify it fails**

Run: `npm test -w pipeline/data -- pagesWorkflow`
Expected: FAIL, file not found.

- [ ] **Step 3: Write the workflow** with a comment above each job saying what it does and why the deploy has its condition.

- [ ] **Step 4: Run the test to verify it passes**

Run: `npm test -w pipeline/data`
Expected: PASS.

- [ ] **Step 5: Check the site from a sub-path.** Run `npm run build`. Copy `apps/web/dist` to a folder `anatoMe` inside a new temporary folder outside the repo, serve the temporary folder with `npx vite preview --outDir <that folder> --port 4180` from `apps/web`, and open `http://localhost:4180/anatoMe/`. Expected: the model loads, search finds piriformis, the browser's network view shows no 404 and every request path starts with `/anatoMe/`. Delete the temporary folder afterwards.

- [ ] **Step 6: Commit**

```bash
git add .github/workflows/pages.yml pipeline/data/test
git commit -m "Add the GitHub Pages deploy that ships only the checked build"
```

---

### Task 7: Version and links in the app

**Files:**
- Modify: `package.json` (version), `apps/web/vite.config.ts`, `apps/web/src/ui/Credits.tsx`, `apps/web/src/i18n/en.json` (and every other language file that exists by then), `apps/web/src/vite-env.d.ts` or the file that declares globals
- Create: `apps/web/src/config.ts`
- Test: `apps/web/src/ui/Credits.test.tsx`

**Interfaces:**
- Produces:
  - Root `package.json` gets `"version": "1.0.0"`.
  - `vite.config.ts` defines `__APP_VERSION__` from the root `package.json` version (also under `test`, so Vitest sees it).
  - `config.ts`: `export const REPO_URL: string` (the public address of the repo, taken from `git remote get-url origin` and written as an `https://github.com/<owner>/<repo>` address without `.git`) and `export const CORRECTION_URL = REPO_URL + "/issues/new?template=data-correction.yml"`.
  - New en.json keys (exact text): `about.version` "Version {version}", `about.source` "Source code", `about.report` "Report a mistake in the data".
  - `Credits` shows, under the existing content, the version line and the two links, both with `target="_blank"` and `rel="noopener noreferrer"`.

- [ ] **Step 1: Write the failing test**

```ts
test("the credits show the version and the two links", () => {
  // open the details as the other tests do
  expect(screen.getByText(/^Version \d+\.\d+\.\d+$/)).toBeTruthy();
  expect(screen.getByRole("link", { name: "Source code" }).getAttribute("href")).toBe(REPO_URL);
  const report = screen.getByRole("link", { name: "Report a mistake in the data" });
  expect(report.getAttribute("href")).toBe(CORRECTION_URL);
  expect(report.getAttribute("rel")).toBe("noopener noreferrer");
});
```

- [ ] **Step 2: Run the test to verify it fails**

Run: `npm test -w apps/web -- Credits`
Expected: FAIL.

- [ ] **Step 3: Implement.**

- [ ] **Step 4: Run every check**

Run: `npm run validate && npm run check-models && npm test && npm run build && npm run e2e -w apps/web && node scripts/check-no-drafts.mjs`
Expected: all pass. The end-to-end tests still see requests to the preview host only, because the links are not followed.

- [ ] **Step 5: Commit**

```bash
git add package.json apps/web
git commit -m "Show the version, the source link and the correction link in the credits"
```

---

### Task 8: The owner's publish checklist

**Files:**
- Create: `docs/phase3/publish-checklist.md`
- Modify: `docs/superpowers/specs/2026-11-02-anatome-design.md` (status lines only, in Step 2)

- [ ] **Step 1: Write `docs/phase3/publish-checklist.md`** as a list of boxes for the owner, in this order:
  1. The physio has reviewed the hip data, and the results are recorded with `npm run mark-checked` (see `docs/review/how-to-record-a-review.md`).
  2. `npm run data-report` shows what is checked. The owner is content with what the normal build shows.
  3. The Phase 2 phone sheet (`docs/phase2/phone-measurements.md`) is filled in and the gate numbers hold.
  4. `docs/phase3/licence-recheck.md` has no open "no".
  5. `docs/phase3/history-audit.md` has no open finding, or the owner has decided what to do about each.
  6. `docs/phase2/medical-device-wording.md` was read once more against the final app text. Any sentence in the app that reads like a diagnosis or advice is fixed first.
  7. The owner decides how the physio is credited, if at all, and only with her consent.
  8. All checks pass on `main`.
  9. Make the repo public (GitHub, Settings, General, Danger Zone, Change visibility).
  10. Turn on Pages (Settings, Pages, Source: GitHub Actions) and run the "Pages" workflow from the Actions tab.
  11. Open the public address on the Galaxy A23, clear the site data and measure the time to interactive three times. The median must be under 5000 ms.
  12. Put the live address into `README.md`.
  13. Tag the commit: `git tag v1.0.0` and `git push origin v1.0.0`.

- [ ] **Step 2: Update the main spec** so it matches the repo at v1: in section 9 mark Phase 3 as prepared with the date, and in section 12 strike the open items this plan closed (licence pages re-checked, the policy for non-commercial sources decided and enforced, the EU wording check done), each with a pointer to its record.

- [ ] **Step 3: Commit and hand over**

```bash
git add docs
git commit -m "Add the publish checklist for v1"
```

Report to the owner that everything an agent can do is done and that the checklist holds the remaining steps.
