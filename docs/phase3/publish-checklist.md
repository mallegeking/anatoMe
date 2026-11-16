# Publish checklist for v1

This list holds the steps that only the owner can do. An agent did everything before it, and the records are linked below. Tick each box when it is done.

- [ ] 1. The physio has reviewed the hip data, and the results are recorded with `npm run mark-checked` (see `docs/review/how-to-record-a-review.md`).
  - Before committing the review results, set `git config user.email` to the GitHub no-reply address of the account. The history audit (D5) found a personal address in the commit metadata.
- [ ] 2. `npm run data-report` shows what is checked. The owner is content with what the normal build shows.
- [ ] 3. The Phase 2 phone sheet (`docs/phase2/phone-measurements.md`) is filled in and the gate numbers hold.
- [ ] 4. `docs/phase3/licence-recheck.md` has no open "no". At the time of writing there is none in the repo data.
- [ ] 5. `docs/phase3/history-audit.md` has no open finding, or the owner has decided what to do about each. The audit found no real findings, but the seven doubtful items D1 to D7 are still open and wait for the owner's decision.
  - Just before item 9, run the audit searches of `docs/phase3/history-audit.md` again over `git log --all`, because the audit ran before the later commits of this branch. If the owner starts the public repo from a fresh commit, update `REPO_URL` in `apps/web/src/config.ts` to the new address.
  - Pull requests from outside that touch `.github/` or `scripts/check-review-guard.mjs` need a close look, because the review guard runs the pull request's own copy of those files.
- [ ] 6. `docs/phase2/medical-device-wording.md` was read once more against the final app text. Any sentence in the app that reads like a diagnosis or advice is fixed first.
- [ ] 7. The owner decides how the physio is credited, if at all, and only with the physio's consent.
- [ ] 8. All checks pass on `main`.
- [ ] 9. Make the repo public (GitHub, Settings, General, Danger Zone, Change visibility).
- [ ] 10. Turn on Pages (Settings, Pages, Source: GitHub Actions) and run the "Pages" workflow from the Actions tab. The workflow runs on pushes to `main` and by hand.
- [ ] 11. Open the public address on the Galaxy A23, clear the site data and measure the time to interactive three times. The median must be under 5000 ms.
- [ ] 12. Put the live address into `README.md`. Replace the placeholder text "The link is added when the site is live".
- [ ] 13. Tag the commit: `git tag v1.0.0` and `git push origin v1.0.0`.
