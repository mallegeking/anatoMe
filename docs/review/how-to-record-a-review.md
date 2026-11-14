# How to record a review

Every row in the knowledge base starts with `checked_by: null`. A row only reaches the normal app build after a person has checked it. This page shows how a finished review gets written back into the data files.

## What the reviewer does

Open the review build and go through the review list. For each row, write down the row code with one of three answers:

- `ok` means the row is right as written.
- `change` means the row needs a different wording or value. Say what should change.
- `remove` means the row should not be in the app.

Send the list back to the owner. Use the label you were given, such as `physio-1`, and never your name.

## What the owner does

1. Put the row codes marked `ok` into a text file, one per line. Blank lines and lines starting with `#` are ignored.
2. Run the command with the reviewer's label and the date of the review:

   ```
   npm run mark-checked -- --by physio-1 --on 2026-11-20 --from ok-rows.txt
   ```

   You can also list row codes directly after the options instead of using a file.
3. Edit the `change` rows by hand and show them to the reviewer again before marking them.
4. Delete the `remove` rows and note why in the commit message.

The command changes only two lines per row, `checked_by` and the new `checked_on` line. Comments, blank lines and quotes stay exactly as they were. It prints one line per row: `marked`, `already checked`, `not found` or `not written`. The last one means the row was fine but the run was refused or failed, so nothing was saved. If any row is missing or already checked, or if the data no longer validates afterwards, it writes nothing and exits with an error.

## Who may check what

- Action rows and exercise rows need a physio label such as `physio-1`.
- Attachment rows are plain textbook facts, so they may also be checked by `owner`.

The validator refuses an action row or an exercise row checked by `owner`, and the command then puts the files back as they were.

## After marking

1. Run `npm run validate`.
2. Run `npm run build` and then `node scripts/check-no-drafts.mjs`.
3. Open the normal build and read the rows that are now public.

## Labels, not names

The label `physio-1` stands for the first reviewer, `physio-2` for the second, and so on. Real names never go into the repo without the person's consent.
