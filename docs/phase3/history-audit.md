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
- Doubtful items for the owner to judge: 6 (D1 to D6 below).
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
| Home paths | 0 | |
| Health words, broad pass | 397 lines in 130 commit-files | Product vocabulary: the physio reviewer role, the symptom notebook, UI labels, test data, schema fields |
| First-person health phrases | about 25 lines | A feature name and UI or test strings written for a generic user, not the owner's notes |
| `checked_by` values | 134 values, 130 empty, 4 set | The 4 are generic role placeholders in end-to-end test data (commits 6bdae8b and a21ab01) |
| Source hash list `pipeline/sources.sha256` (commit 934668b) | 1 file | File names and hashes only, no source content. It does show which data sources are used locally |
| Forbidden files | 0 | No `.env`, `sources/`, `tools/`, `dist-review`, notebook backup, key, database or log file, and no object over 2 MB was ever committed |

## Findings

No real finding. Six doubtful items are open. None of them is a secret. Each one may matter only for the owner's privacy. All six are open, and the owner decides what to do with each: leave it, rewrite history, or start the public repo from a fresh commit. Nothing was changed.

- **D1.** Commit 769fb8d, file `docs/superpowers/specs/2026-11-02-anatome-design.md` (first written there, still in later edits such as 63dfd00, 3c46bf4 and ab155a0, and at the tip). Kind: the owner's online handle written as an at-mention in the header. It may matter because on GitHub an at-mention in a public file links to whoever owns that handle. Check that this is the account the owner wants linked.
- **D2.** Same file, same commit and later versions, at the tip. Kind: statements about the owner's own pain. The motivation paragraph names pain in three body regions, which is the allowed general statement. The decision table, the roadmap and the success paragraph repeat which joints hurt and what the owner would choose to move. It may matter because it goes beyond the single general statement.
- **D3.** Same file, at the tip. Kind: personal circumstances without secrets. They are the owner's phone model as the performance reference, working part time on weekends, a physio reviewer "in mind" described with a gendered pronoun, a friend lending textbooks, and hosting on the owner's home server over Tailscale. It may matter because together they identify the owner more closely.
- **D4.** `docs/deploy-homelab.md` (commits 0605104, 7ee0c3f, 77ada8f, f21abf1, f2b2a77, at the tip) and the phase 0 plan (commit 9711834). Kind: description of the owner's home server layout. It names a service file, folders under `/srv`, ports, the fact that the site is only reachable on a private tailnet, and that a physiotherapist is invited. All host names are placeholders. It may matter only because it describes private home infrastructure.
- **D5.** Author and committer identities (see Authors). Kind: one personal webmail address, used on 6 human commits as author or committer, in the content of git metadata rather than files. It may matter because it becomes public in `git log` and cannot be removed without rewriting history.
- **D6.** Commits edb5979, 3eeeeed and 396d1c9. Kind: an author name that reads like a computer name, a device name leaking through the git config. It is in history only, not in the tip contents. It may matter because it exposes a name of the owner's home machine.

D1, D5 and D6 can only be fixed by rewriting history (an author mapping, and replacing the spec text from commit 769fb8d onward). D2, D3 and D4 can also be fixed by editing the files for the future, but the old text would stay in history.

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
