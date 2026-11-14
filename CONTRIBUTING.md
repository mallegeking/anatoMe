# Contributing to anatoMe

Thank you for wanting to help. This page is for developers, students and physiotherapists who want to fix or add something. To report a wrong claim without touching the files, open a "Data correction" issue instead. See [docs/data-corrections.md](docs/data-corrections.md).

anatoMe is an educational tool. It is not a diagnostic tool and it is not medical advice. Please keep every change in that spirit.

## Set up and run the checks

You need Node.js 22 or newer.

```bash
npm install
npm run validate        # checks the knowledge base in data/
npm run check-models    # checks the meshes in models/ against data/
npm test                # runs all the tests
npm run build           # builds the app
```

Run all four before you open a pull request. [README.md](README.md) has the rest of the commands.

## Style

- Write in plain language. Short sentences, no jargon where an everyday word works.
- No em dashes and no semicolons in prose. Use a full stop or a comma.
- All text that people see in the app lives in `apps/web/src/i18n/en.json`, never in the components.
- Wording stays educational. Do not diagnose and do not tell anyone what to do about their own body.
- Code comments are short and friendly, for an owner who reads code but did not write it.

## Add or change a data row

The knowledge base is in `data/`. Each claim is a row that cites a source. The files in `data/actions/` show finished examples.

Follow these steps for every row.

1. Find a source you can open in full. Good places: PubMed Central (open-access subset), the OERI Human Anatomy text on LibreTexts, open-access journals. A paywalled abstract is not enough.
2. Read the licence on the page itself. Copy it into the citation's `license` as stated, and set its `license_id`.
3. Find the sentence, table row or figure that supports the claim. Write its place into `locator` so that another person finds it in under a minute.
4. Write `says`. Use the source's own words (`quote`) only when its `license_id` is CC BY, CC0 or public domain, because those fit our CC BY 4.0 data. For any other licence, write one or two sentences of your own (`summary`). The validator refuses a quote from any other source.
5. Write the row. Take angles for `when` only from what the source states. Set `confidence` by the header rule in `data/actions/hip.yaml`.
6. Where anything is your own judgment (the role, the direction a stretch is filed under, an angle read off a figure), say so in `review_note` as a question the physiotherapist can answer.
7. Leave `checked_by: null`.
8. Run `npm run validate` after every few rows.

If two opened sources disagree, write the row with the better supported reading, cite both, set `confidence: low` and put the disagreement into `review_note`.

### Every new row stays unchecked

A row only shows in the app after a person has checked it. Only the project owner records a review. Leave `checked_by: null` on every row you add, and do not add a `checked_on` line. A check in the pull request process fails a change from anyone else that sets them.

## Licences

- Contributions to `data/` are licensed CC BY 4.0, like the rest of our own data. See [data/LICENSE](data/LICENSE).
- Contributions to code are licensed MIT. See [LICENSE](LICENSE).
- 3D models are licensed per file. Please do not add any without talking to us first.

## Keep it private

Nothing private goes into a pull request. That means no hostnames, addresses, keys, passwords, e-mail addresses or names of people who reviewed data. This applies to commit messages and screenshots too.

## Pull requests

The pull request template has a short checklist. Please tick it honestly. Small changes are easier to read than large ones.
