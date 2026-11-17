# anatoMe Phase 2c Symptom Notebook Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Let a person log which movements hurt and which do not, see which structures the painful ones share and the painless ones do not, print a one-page summary and keep a backup file, all on the device.

**Architecture:** A new "Notebook" tab, loaded as its own chunk. Entries live in IndexedDB in the browser and nowhere else. A pure module compares the entries against the checked rows of the bundle, using the movement logic from plan 2a. The summary is a print stylesheet over a plain page section. The backup is a JSON file the person saves and loads by hand.

**Tech Stack:** As plan 2a. New dev dependency: `fake-indexeddb` (tests only, check the current version when installing).

**Spec:** `docs/superpowers/specs/2026-11-02-anatome-design.md` (section 2 goals and anti-goals, section 8 "Symptom log", the Phase 2 row of section 9 and the EU item in section 12). Builds on plans 2a and 2b, which must be merged first.

## Global Constraints

- Everything in the Global Constraints of plan 2a applies here unchanged.
- **User data never leaves the device.** No request of any kind carries notebook data. Notebook data is never written to the repo, to logs or to the console.
- **No diagnosis.** The notebook shows "structures to look into", never what is injured, and never advice on what to do.
- **Task 1 comes first and ends with a stop.** Tasks 2 to 7 start only after the owner has added the sign-off line to `docs/phase2/medical-device-wording.md`.
- Notebook text in `en.json` (keys starting with `notebook.`) must not contain these word stems, apart from the disclaimer key: `diagnos`, `injur`, `damag`, `treat`, `cure`, `caus`, `you have`. A test enforces it.
- The notebook code must not make the first screen slower. It loads only when the Notebook tab or the log form is first opened.

## Design decisions (builder's calls, the owner can overrule)

1. **What is logged.** One entry is a movement or an exercise phase from the Movements tab, the joint angles at that moment, a feeling ("It hurts" or "It feels fine"), a side (left, right or both) and a free note of up to 500 characters.
2. **Left and right are compared apart.** A movement that hurts on the left and feels fine on the right says nothing against the left side.
3. **A structure to look into** is one that at least one painful entry loads and no fine entry of the same side loads. The list is ordered by English name, with plain counts: each line says how many painful entries load the structure.
4. **Only checked rows count**, because the normal build holds nothing else. When rows for a logged movement still wait for review, the list says it may be incomplete.
5. **The printed summary is the browser's own print**, with a print stylesheet. No PDF library. Each table holds at most the 12 newest entries. The summary can run to two pages.
6. **The backup is one JSON file.** Loading it adds entries that are not there yet and leaves existing ones alone. A file with any bad entry is refused whole.
7. **No library for IndexedDB.** The store is about 60 lines.
8. **If the wording check finds the comparison too close to diagnosis**, the owner can sign off Tasks 2, 3, 5, 6 and 7 without Task 4. The panel and the summary then show the log only. Task 5 and Task 6 say what to leave out in that case.

## Review Focus

1. A browser without usable IndexedDB (private window, storage blocked) must show one clear line in the Notebook tab and leave the rest of the app working. Test in Task 2 (`openNotebook` rejects) and Task 5 (`NotebookPanel`).
2. A backup file that is not JSON, has the wrong format, a newer version, a wrong field type, or is larger than 1 MB must change nothing and give a plain message. A note containing HTML must show as text. Test in Task 3 (`parseBackup`) and Task 5.
3. An entry whose movement or exercise the current bundle does not know (data changed, or an exercise logged in the review build) must still be listed, marked as unknown, and must be left out of the comparison. Test in Task 4 and Task 5.
4. Only painful entries, only fine entries, or no checked rows at all must each give a sentence that says what is missing, never an empty box. Test in Task 4 and Task 5.
5. A movement painful on the left and fine on the right must leave the left list untouched. Test in Task 4.

---

## File Structure

```
docs/phase2/medical-device-wording.md   # new (Task 1)
apps/web/src/notebook/
├── types.ts            # NotebookEntry (Task 2)
├── store.ts            # IndexedDB store (Task 2)
├── backup.ts           # pure: file format, parse, merge (Task 3)
├── compare.ts          # pure: structures to look into (Task 4)
├── LogForm.tsx         # the "Log this movement" form (Task 5)
├── NotebookPanel.tsx   # the tab (Task 5)
├── summary.ts          # pure: what goes on the printed page (Task 6)
├── Summary.tsx         # the printed page (Task 6)
└── wording.test.ts     # the word rule (Task 5)
apps/web/src/movement/MovementPanel.tsx   # "Log this movement" button (Task 5)
apps/web/src/App.tsx                      # fourth tab, lazy notebook (Task 5)
apps/web/src/index.css                    # print rules (Task 6)
apps/web/e2e/notebook.spec.ts             # new (Task 7)
```

---

### Task 1: Wording check against the EU medical device rules (research, then stop)

**Files:**
- Create: `docs/phase2/medical-device-wording.md`

This task writes no code. It needs web access. Nothing is written from memory: every statement about the rules names the document, the article or section, a link and the date it was read.

- [ ] **Step 1: Open and read the current versions** of these, and any newer guidance they point to:
  - Regulation (EU) 2017/745 on EUR-Lex: Article 2(1) (the definition of a medical device), recital 19, and Annex VIII Rule 11 (software).
  - The MDCG guidance on qualification and classification of software (MDCG 2019-11, in its latest revision), from the European Commission's medical devices guidance page.
  - The Commission's decision aid or infographic on whether software is a medical device, if the guidance page links one.

- [ ] **Step 2: Write `docs/phase2/medical-device-wording.md`** with these sections, in plain language:
  1. "What this is": research by the builder, not legal advice.
  2. "What the rules say": the definition and the tests the guidance uses, each with source, link and date read.
  3. "How the notebook is meant to work": copy design decisions 1 to 4 of this plan.
  4. "Where the notebook sits": for each test from section 2, what speaks for "educational tool" and what speaks against, honestly. Say plainly how sure the conclusion is (high, medium or low).
  5. "Wording rules": the rules from the Global Constraints of this plan, plus any stricter rule the reading suggests.
  6. "What we do not build": no severity scores, no advice on what to do next, no ranking called a likelihood, no sharing or sending of entries.
  7. "Open questions for the owner".
  8. "Owner sign-off", with the two lines `Notebook log, backup and summary: ` and `Comparison (structures to look into): ` left empty for the owner to fill with "yes" or "no" and a date.

- [ ] **Step 3: Commit and stop**

```bash
git add docs/phase2/medical-device-wording.md
git commit -m "Write up the medical device wording check for the notebook"
```

Report to the owner that the document is ready and wait. Do not start Task 2 before both sign-off lines are filled. If the comparison line says "no", skip Task 4 and follow the "without Task 4" notes in Tasks 5 and 6.

---

### Task 2: The on-device store

**Files:**
- Create: `apps/web/src/notebook/types.ts`, `apps/web/src/notebook/store.ts`
- Modify: `apps/web/package.json` (dev dependency `fake-indexeddb`)
- Test: `apps/web/src/notebook/store.test.ts`

**Interfaces:**
- Consumes: `MovementPick` from `movement/state.ts`, `Pose` from `movement/roles.ts`.
- Produces:

```ts
// types.ts
export type Feeling = "painful" | "fine";
export type EntrySide = "l" | "r" | "both";
export type NotebookEntry = {
  id: string;          // crypto.randomUUID()
  createdAt: number;   // milliseconds since 1970
  date: string;        // local date, YYYY-MM-DD
  pick: MovementPick;  // the movement, or the exercise and phase
  pose: Pose;          // the joint angles when it was logged
  feeling: Feeling;
  side: EntrySide;
  note: string;        // trimmed, at most 500 characters
};
export const NOTE_MAX = 500;
export function makeEntry(input: Pick<NotebookEntry, "pick" | "pose" | "feeling" | "side" | "note">, now: Date, id: string): NotebookEntry;

// store.ts
export type NotebookStore = {
  list(): Promise<NotebookEntry[]>;                 // newest first
  put(entry: NotebookEntry): Promise<void>;
  putMany(entries: NotebookEntry[]): Promise<void>; // one transaction
  remove(id: string): Promise<void>;
};
export function openNotebook(factory?: IDBFactory): Promise<NotebookStore>;
// Database "anatome-notebook", version 1, one object store "entries" with keyPath "id".
// Rejects when factory is undefined or opening fails. After the first put it asks
// navigator.storage.persist() once, when that function exists, and ignores the answer.
```

(`MovementPick` is the pick type of the Movements tab. The `Pick<...>` in `makeEntry` is the one built into TypeScript.)

- [ ] **Step 1: Write the failing tests**

```ts
import { IDBFactory } from "fake-indexeddb";
const entry = (id: string, createdAt: number): NotebookEntry =>
  ({ id, createdAt, date: "2026-11-13", pick: { kind: "movement", id: "hip-flexion" }, pose: { "hip.flexion": 30 }, feeling: "painful", side: "l", note: "" });

test("entries come back newest first", async () => {
  const store = await openNotebook(new IDBFactory());
  await store.put(entry("a", 1));
  await store.put(entry("b", 2));
  expect((await store.list()).map((e) => e.id)).toEqual(["b", "a"]);
});
test("putting the same id again replaces the entry", ...);
test("remove deletes one entry", ...);
test("putMany stores all of them", ...);
test("entries survive closing and opening again", ...same IDBFactory, second openNotebook lists them);
test("opening without IndexedDB rejects", async () => { await expect(openNotebook(undefined)).rejects.toThrow(); });
test("makeEntry trims the note and cuts it at 500 characters", () => expect(makeEntry({ ...input, note: "  " + "x".repeat(600) }, new Date(2026, 10, 13), "id1").note).toHaveLength(500));
test("makeEntry writes the local date", () => expect(makeEntry(input, new Date(2026, 10, 13, 23, 30), "id1").date).toBe("2026-11-13"));
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `npm install -D fake-indexeddb -w apps/web && npm test -w apps/web -- store`
Expected: FAIL, module not found.

- [ ] **Step 3: Implement** `types.ts` and `store.ts`. `openNotebook` takes `globalThis.indexedDB` when no factory is passed. Wrap each request in a promise. No console output.

- [ ] **Step 4: Run tests to verify they pass**

Run: `npm test -w apps/web -- store`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add apps/web/package.json package-lock.json apps/web/src/notebook
git commit -m "Add the on-device store for notebook entries"
```

---

### Task 3: The backup file

**Files:**
- Create: `apps/web/src/notebook/backup.ts`
- Test: `apps/web/src/notebook/backup.test.ts`

**Interfaces:**
- Consumes: `NotebookEntry`, `NOTE_MAX`.
- Produces (pure):

```ts
export const BACKUP_MAX_BYTES = 1_000_000;
export type BackupFile = { format: "anatome-notebook"; version: 1; exportedAt: string; entries: NotebookEntry[] };
export type ParseResult =
  | { ok: true; entries: NotebookEntry[] }
  | { ok: false; reason: "too-large" | "not-json" | "wrong-format" | "newer-version" | "bad-entry" };
export function toBackup(entries: NotebookEntry[], now: Date): string;       // JSON with two-space indent
export function parseBackup(text: string): ParseResult;
export function mergeEntries(existing: NotebookEntry[], incoming: NotebookEntry[]): { toAdd: NotebookEntry[]; skipped: number };
export function backupFileName(now: Date): string;                            // "anatome-notebook-2026-11-13.json"
```

  - `parseBackup`: text longer than `BACKUP_MAX_BYTES` gives `too-large`. Not parseable gives `not-json`. Not an object with `format: "anatome-notebook"` and an `entries` array gives `wrong-format`. `version` above 1 gives `newer-version`. Any entry that fails the checks below gives `bad-entry`, and no entry is returned.
  - Entry checks: `id` a non-empty string, `createdAt` a finite number, `date` matches `^\d{4}-\d{2}-\d{2}$`, `pick` is `{ kind: "movement", id: string }` or `{ kind: "exercise", id: string, phase: string }`, `pose` an object whose values are all finite numbers, `feeling` one of the two, `side` one of the three, `note` a string of at most `NOTE_MAX` characters. Unknown extra fields are dropped.
  - `mergeEntries`: an incoming entry whose id exists already is skipped.

- [ ] **Step 1: Write the failing tests**

```ts
test("a backup reads back to the same entries", () => expect(parseBackup(toBackup([a, b], now))).toEqual({ ok: true, entries: [a, b] }));
test("text that is not JSON is refused", () => expect(parseBackup("<html>")).toEqual({ ok: false, reason: "not-json" }));
test("another JSON file is refused", () => expect(parseBackup('{"hello":1}')).toEqual({ ok: false, reason: "wrong-format" }));
test("a newer version is refused", ...reason "newer-version");
test("one bad entry refuses the whole file", ...entries [a, { ...b, feeling: "awful" }] gives { ok: false, reason: "bad-entry" });
test("a pose with a text value is a bad entry", ...);
test("a note longer than 500 characters is a bad entry", ...);
test("a file over the size limit is refused before parsing", () => expect(parseBackup(" ".repeat(BACKUP_MAX_BYTES + 1))).toEqual({ ok: false, reason: "too-large" }));
test("extra fields are dropped", ...entry with an added field "evil" comes back without it);
test("merging skips ids that exist", () => expect(mergeEntries([a], [a, b])).toEqual({ toAdd: [b], skipped: 1 }));
test("the file name carries the local date", () => expect(backupFileName(new Date(2026, 10, 13))).toBe("anatome-notebook-2026-11-13.json"));
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `npm test -w apps/web -- backup`
Expected: FAIL, module not found.

- [ ] **Step 3: Implement `backup.ts`.**

- [ ] **Step 4: Run tests to verify they pass**

Run: `npm test -w apps/web -- backup`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add apps/web/src/notebook
git commit -m "Add the notebook backup file format with strict reading"
```

---

### Task 4: Structures to look into

Skip this task when the owner's sign-off for the comparison is "no".

**Files:**
- Create: `apps/web/src/notebook/compare.ts`
- Test: `apps/web/src/notebook/compare.test.ts`

**Interfaces:**
- Consumes: `involved`, `neutralPose`, `queryForMovement`, `queryForPhase` (plan 2a), `NotebookEntry`, `makeMovementBundle`.
- Produces (pure):

```ts
export type Candidate = { sid: string; painful: number; evidence: string[] };   // evidence: action ids, sorted
export type Comparison = {
  side: "l" | "r";
  painfulCount: number;     // known painful entries for this side
  fineCount: number;        // known fine entries for this side
  unknownCount: number;     // entries for this side whose pick the bundle does not know
  candidates: Candidate[];  // ordered by English name, with plain counts
  ruledOut: string[];       // loaded by a painful and by a fine entry, by English name
  incomplete: boolean;
};
export function isKnown(entry: NotebookEntry, bundle: RegionBundle): boolean;
export function loadedBy(entry: NotebookEntry, bundle: RegionBundle): Map<string, string[]>;  // sid to action ids, empty for an unknown entry
export function compare(entries: NotebookEntry[], bundle: RegionBundle, side: "l" | "r"): Comparison;
```

  - An entry belongs to a side when its `side` is that side or `both`.
  - `loadedBy` builds the query like the Movements tab does (`queryForMovement`, or `queryForPhase` with the stored pose), lays the stored pose over `neutralPose(bundle)` and takes the rows of `involved`.
  - `incomplete` is true in a normal-mode bundle when `pendingByMovement` has a count for any movement in the query of a known entry of this side, or when an entry of this side is an exercise and `pendingExercises > 0`.

- [ ] **Step 1: Write the failing tests**

```ts
const b = makeMovementBundle();
const e = (id: string, movement: string, feeling: Feeling, side: EntrySide, flexion = 0): NotebookEntry =>
  ({ id, createdAt: 0, date: "2026-11-13", pick: { kind: "movement", id: movement }, pose: { "hip.flexion": flexion }, feeling, side, note: "" });

test("what a painful movement loads is a candidate", () => {
  const c = compare([e("1", "hip-external-rotation", "painful", "l")], b, "l");
  expect(c.candidates.map((x) => x.sid)).toEqual(["gluteus-maximus", "obturator-externus", "piriformis"]);
  expect(c.painfulCount).toBe(1);
  expect(c.fineCount).toBe(0);
});
test("a fine movement that loads a structure rules it out", () => {
  const c = compare([e("1", "hip-external-rotation", "painful", "l"), e("2", "hip-extension", "fine", "l")], b, "l");
  expect(c.candidates.map((x) => x.sid)).toEqual(["obturator-externus", "piriformis"]);
  expect(c.ruledOut).toEqual(["gluteus-maximus"]);
});
test("more painful entries raise a structure's count", () => {
  const c = compare([e("1", "hip-external-rotation", "painful", "l"), e("2", "hip-internal-rotation", "painful", "l", 90)], b, "l");
  expect(c.candidates.find((x) => x.sid === "piriformis")).toEqual({ sid: "piriformis", painful: 2, evidence: ["m1", "m2"] });
  expect(c.candidates.map((x) => x.sid)).toEqual(["gluteus-maximus", "ischiofemoral-ligament", "obturator-externus", "piriformis"]);
});
test("the stored angle decides which rows count", () =>
  expect(compare([e("1", "hip-external-rotation", "painful", "l", 50)], b, "l").candidates.map((x) => x.sid)).toEqual(["gluteus-maximus", "obturator-externus"]));
test("fine on the right does not rule out the left", () => {
  const c = compare([e("1", "hip-external-rotation", "painful", "l"), e("2", "hip-external-rotation", "fine", "r")], b, "l");
  expect(c.candidates).toHaveLength(3);
  expect(c.fineCount).toBe(0);
});
test("an entry for both sides counts on each side", ...);
test("an unknown movement is counted apart and ignored", () => {
  const c = compare([e("1", "hip-wiggle", "painful", "l")], b, "l");
  expect(c).toMatchObject({ painfulCount: 0, unknownCount: 1, candidates: [] });
});
test("waiting rows for a logged movement mark the list incomplete", () =>
  expect(compare([e("1", "knee-flexion", "painful", "l")], b, "l").incomplete).toBe(true));
test("an exercise phase uses its effort", ...entry with pick { kind: "exercise", id: "squat", phase: "lowering" } and pose { "hip.flexion": 50, "knee.flexion": 55 } gives the candidate gluteus-maximus only);
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `npm test -w apps/web -- compare`
Expected: FAIL, module not found.

- [ ] **Step 3: Implement `compare.ts`.**

- [ ] **Step 4: Run tests to verify they pass**

Run: `npm test -w apps/web -- compare`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add apps/web/src/notebook
git commit -m "Add the comparison that finds structures to look into"
```

---

### Task 5: The Notebook tab and the log form

**Files:**
- Create: `apps/web/src/notebook/LogForm.tsx`, `apps/web/src/notebook/NotebookPanel.tsx`, `apps/web/src/notebook/wording.test.ts`
- Modify: `apps/web/src/movement/MovementPanel.tsx`, `apps/web/src/ui/PanelArea.tsx`, `apps/web/src/App.tsx`, `apps/web/src/i18n/en.json`, `apps/web/src/index.css`
- Test: `apps/web/src/notebook/LogForm.test.tsx`, `apps/web/src/notebook/NotebookPanel.test.tsx`, `apps/web/src/movement/MovementPanel.test.tsx`

**Interfaces:**
- Consumes: Tasks 2, 3 and 4, `describeCondition`-style angle words (`angle.<id>` keys), `Mode`.
- Produces:

```ts
export function LogForm(props: { t: Translate; onSave: (input: { feeling: Feeling; side: EntrySide; note: string }) => void; onCancel: () => void }): JSX.Element;

export function NotebookPanel(props: {
  t: Translate;
  bundle: RegionBundle;
  store: NotebookStore | null;     // null while opening
  storeError: boolean;             // true when opening failed
  showComparison: boolean;         // false when Task 4 was skipped
  onFocusStructure: (sel: Selection) => void;
  onPrint: (entries: NotebookEntry[]) => void;
}): JSX.Element;

// MovementPanel: new prop onLog?: (input: { feeling: Feeling; side: EntrySide; note: string }) => void.
// With a pick and onLog set it shows a "Log this movement" button that opens LogForm in place.
```

  - New en.json keys (exact text): `notebook.title` "Notebook", `notebook.disclaimer` "This notebook is for your own notes. It is not a diagnosis and not medical advice. If you are worried, talk to a qualified health professional.", `notebook.private` "Your notes stay in this browser on this device. They are never sent anywhere.", `notebook.backupHint` "Some phones delete stored notes after a while without use. Save a backup file now and then.", `notebook.unavailable` "This browser does not let the app store notes, for example in a private window. The rest of the app works as usual.", `notebook.empty` "No notes yet. Pick a movement in the Movements tab and log how it feels.", `notebook.log` "Log this movement", `notebook.feeling` "How does it feel?", `notebook.painful` "It hurts", `notebook.fine` "It feels fine", `notebook.side` "Which side?", `notebook.side.l` "Left", `notebook.side.r` "Right", `notebook.side.both` "Both", `notebook.note` "Note (optional)", `notebook.save` "Save", `notebook.cancel` "Cancel", `notebook.saved` "Saved to your notebook.", `notebook.entries` "Your notes", `notebook.entry` "{date}: {name}, {feeling}, {side}", `notebook.entryPhase` "{exercise}, {phase}", `notebook.angles` "Logged with {angles}", `notebook.angle` "{angle} at {value} degrees", `notebook.unknown` "a movement this version does not know", `notebook.delete` "Delete", `notebook.deleteConfirm` "Delete this note?", `notebook.lookInto` "Structures to look into", `notebook.lookIntoSide.l` "Left side", `notebook.lookIntoSide.r` "Right side", `notebook.candidate` "{name}: loaded in {painful} of {total} movements you marked as hurting, and in none you marked as fine", `notebook.needPainful` "Log at least one movement that hurts to see structures to look into.", `notebook.needFine` "Log movements that feel fine too. They narrow this list down.", `notebook.noRows` "There is no checked movement information for the movements you logged yet.", `notebook.incomplete` "Some movement information is still waiting for review, so this list may be incomplete.", `notebook.ruledOut` "Also loaded by movements that feel fine: {names}", `notebook.print` "Print a one-page summary", `notebook.saveBackup` "Save a backup file", `notebook.loadBackup` "Load a backup file", `notebook.loaded` "{added} notes added, {skipped} were already there.", `notebook.loadError.too-large` "That file is too large to be a notebook backup.", `notebook.loadError.not-json` "That file is not a notebook backup.", `notebook.loadError.wrong-format` "That file is not a notebook backup.", `notebook.loadError.newer-version` "That backup was made by a newer version of anatoMe.", `notebook.loadError.bad-entry` "That backup is damaged, so nothing was loaded."

    (`notebook.loadError.bad-entry` contains "damag". The word test below exempts keys starting with `notebook.loadError.` together with the disclaimer.)
  - Panel behaviour, top to bottom: `h2` title, the disclaimer, the privacy line, then:
    - `storeError`: the unavailable line and nothing else.
    - `store` null: nothing more (it is opening).
    - no entries: the empty line, then the load backup button.
    - entries: the backup hint. The heading `notebook.entries` and a list, newest first. Each item shows `notebook.entry` (the name is the movement's English name, or `notebook.entryPhase`, or `notebook.unknown` when `isKnown` is false. The feeling and side use their own keys), the angles line when the pose has a non-zero angle (`notebook.angles` with `notebook.angle` parts joined by ", "), the note as plain text, and a delete button that asks with `window.confirm(notebook.deleteConfirm)`.
    - when `showComparison`: the heading `notebook.lookInto`. For each side with `painfulCount > 0`: a side heading, then either `notebook.noRows` (no candidates and nothing ruled out), or the candidates as buttons with the text of `notebook.candidate` (`total` is `painfulCount`) that call `onFocusStructure` with that side, then `notebook.ruledOut` when not empty, `notebook.needFine` when `fineCount` is 0, and `notebook.incomplete` when set. When no side has a painful entry: `notebook.needPainful`.
    - the buttons print, save backup and load backup. Save builds the text with `toBackup` and downloads it through a `Blob` and a temporary `<a download>` with `backupFileName`. Load uses an `<input type="file" accept="application/json,.json">`, checks `file.size` against `BACKUP_MAX_BYTES` before reading, runs `parseBackup`, `mergeEntries` and `putMany`, and shows `notebook.loaded` or the matching `notebook.loadError.<reason>` in a `role="status"` line.
  - `App.tsx`: `modes` is now `["atlas", "movement", "area", "notebook"]`. The notebook modules load with `React.lazy` and a dynamic import, and `openNotebook()` is called the first time the Notebook tab opens or a log is saved, never at start. `showComparison` is a constant `SHOW_COMPARISON = true` at the top of `NotebookPanel.tsx` (set it to false when Task 4 was skipped). `onLog` builds the entry with `makeEntry(..., new Date(), crypto.randomUUID())`, stores it and shows `notebook.saved` as the notice line.

- [ ] **Step 1: Write the failing tests**

```ts
// wording.test.ts
const banned = /diagnos|injur|damag|treat|cure|caus|you have/i;
test("notebook text stays clear of diagnostic words", () => {
  const bad = Object.entries(en).filter(([key, text]) =>
    key.startsWith("notebook.") && key !== "notebook.disclaimer" && !key.startsWith("notebook.loadError.") && banned.test(text));
  expect(bad).toEqual([]);
});

// LogForm.test.tsx
test("saving reports feeling, side and note", ...choose "It hurts", "Left", type "after a run", click Save: onSave toHaveBeenCalledWith({ feeling: "painful", side: "l", note: "after a run" }));
test("save is disabled until a feeling and a side are chosen", ...);
test("the note field stops at 500 characters", ...maxLength attribute is 500);

// NotebookPanel.test.tsx (a store over fake-indexeddb, bundle makeMovementBundle())
test("always shows the disclaimer and the privacy line", ...);
test("without storage it shows the unavailable line and no buttons", ...storeError true);
test("with no notes it shows the empty line", ...);
test("lists a note with date, movement, feeling, side and angle", ...expects "2026-11-13: Hip external rotation, It hurts, Left" and "Logged with the hip bent at 30 degrees");
test("a note for a movement the bundle lacks is listed as unknown", ...expects text containing en["notebook.unknown"]);
test("a note with HTML shows it as text", ...note "<img src=x onerror=alert(1)>" is found by getByText and no img element exists);
test("shows structures to look into for the left side", ...one painful left external rotation: heading "Left side", a button starting "Piriformis: loaded in 1 of 1", and en["notebook.needFine"]);
test("with only fine notes it asks for a painful one", ...en["notebook.needPainful"]);
test("with no rows for the logged movement it says so", ...painful "knee-extension": en["notebook.noRows"]);
test("loading a damaged backup changes nothing and says why", ...upload a file with a bad entry: en["notebook.loadError.bad-entry"], list unchanged);
test("loading a good backup adds the new notes", ...en["notebook.loaded"] with 1 and 1);
test("deleting asks first", ...window.confirm mocked to false keeps the note, true removes it);
test("with the comparison off no look-into heading shows", ...showComparison false);

// MovementPanel.test.tsx
test("a picked movement can be logged", ...click "Log this movement", fill the form, Save: onLog called once);
test("without a pick there is no log button", ...);
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `npm test -w apps/web`
Expected: FAIL, modules not found.

- [ ] **Step 3: Implement** the form, the panel and the wiring.

- [ ] **Step 4: Check the first screen did not grow**

Run: `npm test -w apps/web && npm run build`
Expected: PASS. In the build output the notebook code sits in its own chunk and the entry chunk (`index-*.js`) is no more than 6 kB larger than on `main`. Write both sizes into the commit message body.

- [ ] **Step 5: Commit**

```bash
git add apps/web/src
git commit -m "Add the Notebook tab and the form to log how a movement feels"
```

---

### Task 6: The one-page summary

**Files:**
- Create: `apps/web/src/notebook/summary.ts`, `apps/web/src/notebook/Summary.tsx`
- Modify: `apps/web/src/App.tsx`, `apps/web/src/index.css`, `apps/web/src/i18n/en.json`
- Test: `apps/web/src/notebook/summary.test.ts`, `apps/web/src/notebook/Summary.test.tsx`

**Interfaces:**
- Consumes: `NotebookEntry`, `compare`, `isKnown`.
- Produces:

```ts
export const SUMMARY_ROWS = 12;
export type SummaryModel = {
  printedOn: string;                                   // YYYY-MM-DD
  from: string | null; to: string | null;              // oldest and newest entry date
  painful: NotebookEntry[]; painfulMore: number;       // newest SUMMARY_ROWS, and how many were left out
  fine: NotebookEntry[]; fineMore: number;
  comparisons: Comparison[];                           // sides with painfulCount > 0, empty when the comparison is off
};
export function summaryModel(entries: NotebookEntry[], bundle: RegionBundle, now: Date, withComparison: boolean): SummaryModel;
export function Summary(props: { t: Translate; bundle: RegionBundle; model: SummaryModel }): JSX.Element;   // <section class="print-summary">
```

  - New en.json keys (exact text): `summary.title` "anatoMe notebook summary", `summary.printed` "Printed on {date}", `summary.range` "Notes from {from} to {to}", `summary.painful` "Movements marked as hurting", `summary.fine` "Movements marked as feeling fine", `summary.more` "and {count} older notes", `summary.basis` "The list of structures uses only movement information that a physiotherapist has checked. Sources are shown in the app."
  - The summary shows, in this order: title, printed date, range, the disclaimer (`notebook.disclaimer`), the painful table (date, movement, side, angles, note), the fine table, and for each comparison the side heading and the candidate lines with the same text as in the panel, then `summary.basis`. Without the comparison the last two parts are left out.
  - `App.tsx` keeps the model in state. `onPrint` sets it and calls `window.print()` after the next paint. The `Summary` renders as a sibling of `<main className="app">`.
  - CSS: `.print-summary { display: none; }`. Under `@media print`: `.app { display: none; }`, `.print-summary { display: block; }`, black text on white, 11 pt, `html, body, #root { height: auto; overflow: visible; }`, tables with thin borders, `@page { size: A4; margin: 15mm; }`.

- [ ] **Step 1: Write the failing tests**

```ts
test("keeps the 12 newest per table and counts the rest", ...15 painful entries: painful toHaveLength(12), painfulMore toBe(3), painful[0] is the newest);
test("the range runs from the oldest to the newest date", ...);
test("no entries gives null range and empty tables", ...);
test("with the comparison off there are no comparisons", ...);
test("only sides with a painful entry get a comparison", ...);
test("the page shows the disclaimer and both tables", ...Summary rendered: en["notebook.disclaimer"], headings en["summary.painful"] and en["summary.fine"]);
test("left-out notes are counted on the page", ..."and 3 older notes");
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `npm test -w apps/web -- summary Summary`
Expected: FAIL, modules not found.

- [ ] **Step 3: Implement** the model, the component, the wiring and the print rules.

- [ ] **Step 4: Check the page by eye.** Run the review build, log five movements, press the print button and look at the print preview. Expected: one or two A4 pages (the summary can run to two pages), black on white, no part of the app visible, nothing cut off at the right edge.

- [ ] **Step 5: Run tests and commit**

Run: `npm test -w apps/web && npm run build`
Expected: PASS.

```bash
git add apps/web/src
git commit -m "Add the printable one-page notebook summary"
```

---

### Task 7: End-to-end test, phone sheet and docs

**Files:**
- Create: `apps/web/e2e/notebook.spec.ts`
- Modify: `docs/phase2/phone-measurements.md`, `README.md`

- [ ] **Step 1: Write the test.** With the request listener of `atlas.spec.ts`, also recording each request's method: open the app, go to the Movements tab, pick "Hip external rotation", click `notebook.log`, choose `notebook.painful` and `notebook.side.l`, save. Go to the Notebook tab. Expect the heading `notebook.entries`, a list item containing "Hip external rotation" and the heading `notebook.lookInto`. Reload the page, go to the Notebook tab again and expect the same list item. At the end expect that every request went to the preview host and that every request method was `GET`.

- [ ] **Step 2: Run every check**

Run: `npm run validate && npm run check-models && npm test && npm run build:review -w apps/web && npm run build && npm run e2e -w apps/web && node scripts/check-no-drafts.mjs && node apps/web/scripts/perf-check.mjs && node apps/web/scripts/error-check.mjs`
Expected: all pass, the perf median stays under 5000 ms.

- [ ] **Step 3: Add a section "Notebook" to `docs/phase2/phone-measurements.md`**: log one painful and one fine movement, close the browser fully and open it again (are both notes still there), save a backup file (where did the phone put it), delete a note and load the backup (is it back), print the summary (does the phone offer "Save as PDF", is it one page), switch the phone to flight mode and log a movement (does it still work), and one line to fill in: "Does any sentence in the Notebook tab read like a diagnosis or like advice? Write it down.".

- [ ] **Step 4: Update `README.md`**: a "Notebook" bullet under "What it does today" that repeats the privacy sentence, and one sentence in the first paragraph area saying that notes never leave the device.

- [ ] **Step 5: Commit**

```bash
git add apps/web/e2e docs/phase2 README.md
git commit -m "Test the notebook end to end and add it to the phone sheet"
```
