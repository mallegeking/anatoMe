# History and privacy audit before going public

Date: 2026-11-14

This audit was done before the repository goes public. Nothing was changed. The document names each finding by commit, file and kind only. It never repeats a value.

## Scope

- All refs were searched (`--all`): the local branch, local and origin main, local and origin list, and the origin branch.
- 103 commits in total (102 when the audit started, one more landed while it ran and was checked separately for the key, address and path patterns, with no hits).
- 464 distinct file paths were ever committed.

## Searches run

Content searches looked at added and removed lines of `git log --all -p -U0`, counted per commit and file. They were cross-checked with `git grep` on the tip.

1. Tailscale: `\.ts\.net` and any address in the Tailscale CGNAT range (the pattern `(?<![\d.])100\.(6[4-9]|[7-9]\d|1[01]\d|12[0-7])\.\d+\.\d+`).
2. Other addresses and hostnames: any IPv4 shape (`(?<![\w.])\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3}`), `192\.168\.`, `(?<![\d.])10\.\d+\.\d+\.\d+`, `\.local\b`, `\.lan\b`, and home paths (`/home/[a-z]`, `/Users/`, `C:\\Users`, `/mnt/c/`).
3. Keys and tokens: `BEGIN [A-Z ]*PRIVATE KEY`, `ghp_`, `github_pat_`, `\bsk-[A-Za-z0-9]`, `AKIA[0-9A-Z]{8}`, `password`, `secret`, `token` (case blind).
4. E-mail addresses (`[\w.+-]+@[\w-]+\.[\w.-]+`) and personal names (owner and author name fragments, the owner's online handle).
5. Health notes: first-person patterns about the body, pain, diagnosis or sessions, plus a broad pass on `diagnos|symptom|physio|hurts`. Hits were read in context and compared with the design spec.
6. File names from `git log --all --name-only`, checked for `.env`, `sources/`, `tools/`, `dist-review`, `anatome-notebook-*.json`, key, database, archive and log files, and for any stored object over 2 MB.
7. Commit messages, with all the patterns above.
8. Authors and committers: `git log --all --format='%an|%ae'` and the same with `%cn|%ce`, counted per name.

## Result in short

- Real findings (a key, token, password, real hostname, real address, e-mail address in file content, or a file that should never have been committed): 0.
- Doubtful items for the owner to judge: 8 (D1 to D8 below). D8 was added by the re-run of 2026-11-17.
- Nothing needs to be rotated.

## Harmless hits

| Search | Hits | Why harmless |
|---|---|---|
| Tailscale host name pattern | 7 lines in 4 commit-files, all still at the tip | Only the placeholder form of a machine name and tailnet, in the deploy guide and the phase 0 plan |
| Tailscale address range | 0 real, 1 line in the phase 3 plan | The plan lists the range as a search pattern |
| `192\.168\.` | 0 | |
| Private ten-net addresses | 0 | Looser patterns only matched version strings, citation DOIs and vendored third-party code |
| Any IPv4 shape | 12 lines in 5 commit-files | Loopback address in local server commands, version strings and spec numbers, and the pattern listed in the plan. No private LAN or tailnet address |
| `.local`, `.lan` | 1 line each, phase 3 plan | The pattern listed as text |
| Private key, `sk-`, `AKIA` | 0 | |
| `ghp_`, `github_pat_` | 1 line, phase 3 plan | The search words, not a token |
| `password` | 2 | Pattern list, and an instruction in the deploy guide that sudo asks for a password |
| `secret` | 1 | Pattern list |
| `token` | 11 | Pattern list (2) and package lock file entries (9) |
| E-mail addresses in file content | 0 | Co-author lines exist only in commit messages, with the model vendor's no-reply address |
| Home paths | 2 real, in commit-files ed43141 and 8b37ec6, plus the pattern list in this file (commit 7d94a5c) | Not harmless. The first run of 2026-11-14 said 0 here, which was wrong. See D7, D8 and "Re-run of the home-path searches" below |
| Health words, broad pass | 397 lines in 130 commit-files | Product vocabulary: the physio reviewer role, the symptom notebook, UI labels, test data, schema fields |
| First-person health phrases | about 25 lines | A feature name and UI or test strings written for a generic user, not the owner's notes |
| `checked_by` values | 134 values, 130 empty, 4 set | The 4 are generic role placeholders in end-to-end test data (commits 6bdae8b and a21ab01) |
| Source hash list `pipeline/sources.sha256` (commit 934668b) | 1 file | File names and hashes only, no source content. It does show which data sources are used locally |
| Forbidden files | 0 | No `.env`, `sources/`, `tools/`, `dist-review`, notebook backup, key, database or log file, and no object over 2 MB was ever committed |

## Findings

No real finding. Eight doubtful items are open. None of them is a secret. Each one may matter only for the owner's privacy. All eight are open, and the owner decides what to do with each: leave it, rewrite history, or start the public repo from a fresh commit. Nothing was changed.

- **D1.** Commit 769fb8d, file `docs/superpowers/specs/2026-11-02-anatome-design.md` (first written there, still in later edits such as 63dfd00, 3c46bf4 and ab155a0, and at the tip). Kind: the owner's online handle written as an at-mention in the header. It may matter because on GitHub an at-mention in a public file links to whoever owns that handle. Check that this is the account the owner wants linked.
- **D2.** Same file, same commit and later versions, at the tip. Kind: statements about the owner's own pain. The motivation paragraph names pain in three body regions, which is the allowed general statement. The decision table, the roadmap and the success paragraph repeat which joints hurt and what the owner would choose to move. It may matter because it goes beyond the single general statement.
- **D3.** Same file, at the tip. Kind: personal circumstances without secrets. They are the owner's phone model as the performance reference, working part time on weekends, a physio reviewer "in mind" described with a gendered pronoun, a friend lending textbooks, and hosting on the owner's home server over Tailscale. It may matter because together they identify the owner more closely.
- **D4.** `docs/deploy-homelab.md` (commits 0605104, 7ee0c3f, 77ada8f, f21abf1, f2b2a77, at the tip) and the phase 0 plan (commit 9711834). Kind: description of the owner's home server layout. It names a service file, folders under `/srv`, ports, the fact that the site is only reachable on a private tailnet, and that a physiotherapist is invited. All host names are placeholders. It may matter only because it describes private home infrastructure.
- **D5.** Author and committer identities (see Authors). Kind: one personal webmail address, used on 6 human commits as author or committer, in the content of git metadata rather than files. It may matter because it becomes public in `git log` and cannot be removed without rewriting history.
- **D6.** Commits edb5979, 3eeeeed and 396d1c9. Kind: an author name that reads like a computer name, a device name leaking through the git config. It is in history only, not in the tip contents. It may matter because it exposes a name of the owner's home machine.
- **D7.** Commit ed43141, file `docs/phase3/licence-recheck.md`. Kind: a local home folder path, with the local user name in it, in seven library rows. Commit bceabaa fixed it in the file, but it is still in the history of this branch. Found by the final review after the audit ran. It may matter because it exposes the owner's local user name.

- **D8.** Commit 8b37ec6, file `docs/superpowers/reviews/three-column-layout-build-report.md`, on the origin branch `claude/nifty-sagan-c57kd7` only. Kind: a local home folder path, with the local user name in it, in one line. It is still at the tip of that branch. Found by the re-run of 2026-11-17. That branch did not exist when the first audit ran. It may matter because it exposes the owner's local user name if that branch is pushed to the public repo.

D8 can be fixed by not pushing that branch to the public repo, or by rewriting its history. D1, D5, D6 and D7 can only be fixed by rewriting history (an author mapping, and replacing the spec text from commit 769fb8d onward). D2, D3 and D4 can also be fixed by editing the files for the future, but the old text would stay in history.

## Re-run of the home-path searches

Date: 2026-11-17

The home-path searches of search 2 (`/home/[a-z]`, `/Users/`, `C:\\Users`, `/mnt/c/`) were run again over the added and removed lines of `git log --all -p -U0`, counted per commit and file. The refs were the local branch and local main and list, and the origin branch, main, list and `claude/nifty-sagan-c57kd7`, 192 commits in all. History was not changed.

| Commit | File | Lines | What it is |
|---|---|---|---|
| ed43141 | `docs/phase3/licence-recheck.md` | 7 added | A local home folder path with the user name (D7) |
| bceabaa | `docs/phase3/licence-recheck.md` | 7 removed | The fix of D7. The path stays in the history of ed43141 |
| 8b37ec6 | `docs/superpowers/reviews/three-column-layout-build-report.md` | 1 added | A local home folder path with the user name (D8), still at the tip of `claude/nifty-sagan-c57kd7` |
| 7d94a5c | `docs/phase3/history-audit.md` | 3 added | The search patterns written as text in this file. Harmless |

Why the first run missed D7: the first run counted 102 commits at its start and 103 at its end. By commit time, the 102 are exactly the commits before fd7fc22, and fd7fc22 is the 103rd. ed43141 (14:10) and bceabaa (14:11) came after it and before the audit was committed (14:13), so they were outside the commits the first run searched. This is read from the commit times, the first run left no log that would prove it.

## Authors

Source: `git log --all --format='%an|%ae' | sort | uniq -c`. There are 3 author names across 103 commits.

| Author name | Commits | Address kinds |
|---|---|---|
| Claude | 96 | one no-reply address of the model vendor, not personal |
| The owner's full name | 4 | two addresses: one personal webmail address (3 commits: 21dd176, 4ef9da6, 01253c6) and one GitHub no-reply address (1 commit: a964bbd, made in the web interface) |
| A second name of the owner that reads like a computer name | 3 (edb5979, 3eeeeed, 396d1c9) | one personal webmail address |

The personal webmail address is shared by the two human names, so they are very likely the same person.

The addresses will be public together with the repo. One of them is a personal webmail address.

## Committers

Source: `git log --all --format='%cn|%ce' | sort | uniq -c`.

| Committer name | Commits | Address kinds |
|---|---|---|
| Claude | 96 | one no-reply address of the model vendor |
| The owner's full name | 3 | one personal webmail address |
| The computer-like second name | 3 | the same personal webmail address |
| GitHub | 1 | GitHub's own web interface address (commit a964bbd) |

The committer addresses will be public with the repo too, and the personal webmail address is among them.
