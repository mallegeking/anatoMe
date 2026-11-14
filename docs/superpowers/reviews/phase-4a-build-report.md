# Phase 4a regions and German: build report

Plan: `docs/superpowers/plans/2026-11-13-phase-4a-regions-and-german.md`, Tasks 1 to 5.
Built on 2026-11-14 on the working branch `claude/install-superpowers-plugin-v0gy65`, in the Linux clone, with subagent-driven development: one implementer per task, a task review after each, and a final review of the whole range on the strongest model.

## Summary

The app no longer names the hip in its code. The region comes from the model manifest (with `?region=` and a picker that shows only when there is more than one region), and the gap lines and joint headings live in the data and the language files. The app has a complete German UI with a language switch in the credits, English as the fallback for every missing text, and German names for 47 of 52 structures, all 8 movements and the squat with its two phases, each taken from a page opened today. Task 4 (mesh pipeline follow-ups) is blocked, because the new surface gate measures 7.0 to 8.0 mm against the 5 mm limit on the real hip data. Task 5 (the region playbook) was not started, because the build rules skip the rest of a plan behind a blocked task.

## Commits

First: `6a50511`. Last: `1162e94`.

| Task | Commits | State |
| --- | --- | --- |
| 1 No hip in the app code | `6a50511` | done with deviation |
| 2 Language choice and the German texts | `c27cdcc` | done with deviation |
| 3 German names in the data | `529dd1c` | done with deviation |
| Final review fixes | `1162e94` | done |
| 4 Mesh pipeline follow-ups | none | blocked |
| 5 The region playbook | none | not started (behind the blocked Task 4) |

## Deviations

- **Task 1, manifest.** The plan has App read the manifest once. It was read inside the 3D chunk (`viewer/Scene.tsx`) before. App now loads it and passes the file list through `Viewer` to `Scene`, so `Viewer.tsx`, `Scene.tsx` and `Viewer.test.tsx` changed too, although the plan's file list does not name them. A failed manifest still shows the same model error message. The panel now waits for the manifest before it loads the region data.
- **Task 1, region change.** Besides the selection, layers, movement pick and area tap that the plan names, a region change also clears the loaded bundle and the camera focus, so nothing of the old region stays on screen. The viewer is keyed by region. A small `.region-picker` style was added.
- **Task 1, hip and knee search.** No hip or knee is left in code. Six comments still give "hip" or "knee" as an example (for example how "knee.flexion" gives the joint "knee"). Two comments that treated the hip as the only region were reworded.
- **Task 2, word rule scope.** The plan applies the German stems to keys starting with `notebook.`. The English rule also covers `summary.`, so the German test covers both, with the same exemptions. Because "Physiotherapeut" contains the banned stem "therap", the summary says "Physio-Fachkraft". The final review fixes added the stems `symptom`, `patient`, `risik`, `rehab`, `erhol` and `genes`, for the words the English rule bans.
- **Task 2, short tab labels.** The plain translations of three tab names and the search placeholder were cut off at 360 px. The tabs are "Strukturen", "Bewegung", "Stelle" and "Notizen" now, and the placeholder is "Suche: Piriformis".
- **Task 2, extra test.** `lang.test.ts` has one test more than the plan ("a stored choice can be read back").
- **Task 3, search order.** The plan says results sort by `nameOf`. The search keeps three groups (a match on the current language's name first, then English, then Latin) and sorts each group by `nameOf`. No English order changed.
- **Task 3, bone names.** The info panel and the review list wrote bone names in lower case inside a sentence. That would break German nouns, so `boneLabel` lowers the case only in English.
- **Task 3, `loadedBy`.** It calls `involved()` with "en", because the order does not matter there. `summaryModel` and `PrintSummary` gained a `lang` parameter, because `summaryModel` calls `compare`.
- **Task 3, sources.** The research notes said the German Wikipedia hip page has "Abspreizen" and "Heranführen". It has only "Abspreizbewegung" and "Heranführungsbewegung". Both words are on the DocCheck Flexikon pages "Abduktion" and "Adduktion", which are now named in the header of `data/movements.yaml`.
- **Task 3, names checked against the raw pages.** The name research used WebFetch, which returns a model-written extract. Every proposed name was then looked up in the raw HTML of its page. The long German phrase for the trochanteric bursa was not on the page, so that structure has no German name.
- **Final review fixes (`1162e94`).** Three German sentences broke once a German name with an adjective was put into them ("um Kleiner Gesäßmuskel zu zeigen"), so the name now stands alone as a label. `confidence.medium` was made as weak as the English. A test keeps the German licence credit lines equal to the English. Notices are stored as keys and translated when shown, so they follow a language switch. The language-file test also requires `movement.joint.<id>`, `angle.<joint>.<dof>` and `region.<id>` in every language file.

## Review Focus

1. **A missing German text or name shows the English one.** `apps/web/src/i18n/t.test.ts` "a key missing in the language falls back to the fallback text". `apps/web/src/i18n/names.test.ts` "English when the German name is missing". `apps/web/src/i18n/files.test.ts` "de.json has exactly the keys of en.json", "every German text keeps the placeholders of the English one", "no German text is empty".
2. **An unknown `?region=` falls back to the first region.** `apps/web/src/region/regions.test.ts` "an unknown region falls back to the first", "no parameter gives the first", "no regions at all is an error".
3. **A stored language the app does not have, or a browser that blocks `localStorage`.** `apps/web/src/i18n/lang.test.ts` "an unknown stored value is ignored", "nothing known gives English", "reading survives a browser that blocks storage", "storing survives it too".
4. **A note logged in one language reads in the other.** `apps/web/src/notebook/NotebookPanel.test.tsx` "a note logged in English reads in German after the switch" (renders the same store in English, German and English again). Also "the status line shown in English reads in German after the language changes".
5. **The backup does not depend on the language.** `apps/web/src/notebook/backup.test.ts` "the backup format has no language in it" (exact top-level keys, entry keys, and a file name with the date only).

## Checks

Run on `1162e94` in the Linux clone:

```
data in data is valid
hip.glb: 65 meshes, 43378 triangles, 234348 bytes, size 0.325 x 1.124 x 0.173
hip-z-anatomy.glb: 38 meshes, 5531 triangles, 54824 bytes, size 0.288 x 0.579 x 0.136
 Test Files  39 passed (39)
      Tests  371 passed (371)
 Test Files  8 passed (8)
      Tests  127 passed (127)
✓ built in 1.27s          (build:review)
✓ built in 812ms          (build)
  4 passed (13.1s)        (e2e)
apps/web/dist/data: 1 bundle(s), no drafts
median interactive ms: 2174
ok   decoder download fails: message shown after 982 ms
ok   decoder never answers: message shown after 20558 ms
ok   model file missing: message shown after 922 ms
14 passed in 3.49s        (test:py)
```

Perf median: 2174 ms.

## Task 4: why it is blocked

Setup worked here. `bash pipeline/get-blender.sh` installed Blender 5.2.3. `bash pipeline/fetch-sources.sh` downloaded every source with matching checksums, then stopped at the unpack with `unzip: command not found` (exit 127). That is exactly the missing up-front check of Step 1. The machine has no `unzip` and no root access, so the builder unpacked an `unzip` binary from the Ubuntu package into a folder outside the repo. With it, the script unpacked everything. Before any code changed, both models were rebuilt into a scratch folder: they were byte-identical to the committed files, so the build is deterministic.

Step 2 adds `surface_gate` (95th percentile of the surface distances between the fitted Z-Anatomy bones and the BodyParts3D bones, limit 5 mm) and runs it before and after decimation. On the real hip data it fails:

| Side | Before decimation | After decimation |
| --- | --- | --- |
| Left | 7.8 mm | 7.0 mm |
| Right | 8.0 mm | 7.3 mm |

The femurs are within the limit (3.7 and 3.6 mm), and so is the hip bone near the joint (about 3.2 mm within 6 cm of it). The whole hip bone is not (10.4 and 10.6 mm). About 90 percent of its points over 5 mm lie on the iliac wing, where the two models' bones have a different shape. The fit itself is unchanged from before (hip joint centre error 1.7 and 1.5 mm).

Gating only the joint area or giving the hip bone its own limit would narrow the check the plan asks for, and raising the limit is not allowed. That is a decision for the owner, so the task is blocked. Following the build rules, nothing of Task 4 was committed and the working tree was restored. The work is kept outside the repo for the owner:

- the uncommitted changes of Steps 1 and 2 as a patch: `~/build/research/phase4a-task4-wip.patch` in the Linux home (the scripts' up-front tool checks, `unzip -t` before checksums, a re-fetch of half-unpacked files, no retry on a permanent HTTP error, and the gate with its 4 tests). Do not apply the gate part as it is: with it, the Z-Anatomy build stops and writes nothing.
- the full Task 4 report: `~/build/research/phase4a-task4-report.md`.

What the report found for the other steps:

- **Step 1** was done and run: each script twice, each missing tool, a 404, a dropped connection, a damaged zip and an interrupted unpack. The destructive cases ran on a temp copy.
- **Step 4** was investigated: dropping midline names with a period loses no real structure, only the three group helpers `Skeletal system.g`, `Joints.g` and `Muscular system.g`.
- **Step 7** finding: Zona orbicularis is missing from the inventory because its base mesh has 0 faces (an edge skeleton made solid by modifiers).
- **Steps 3, 5, 6, 7 and 8** were not started.

## Not verified

- The German UI on the phone. The 360 px walk ran in headless Chromium with screenshots, not on the Galaxy A23.
- The German texts and names by a native speaker. See "For the owner to proofread".
- The region picker with two real regions. There is only one region, so the picker never shows in the app. Unit tests cover it.
- A German end-to-end test. The end-to-end tests run in English, as the plan says.
- The quotes in the name research notes for the names that were found word for word. Only the presence of each name on its page was checked.

## Noticed, not done

- Attachment landmarks and `applies_to` texts are English inside German sentences ("Beginnt an: anterior surface (Kreuzbein)"). Every row is a draft today, so this shows only in the review build. German landmarks would need a data field.
- The area list shows "3.5 cm" with a decimal point in German, and counts of one read "1 Notizen" (the English has "1 notes" too).
- The search field keeps the chosen name in the old language after a switch until the next search.
- An empty `navigator.languages` ignores `navigator.language`.
- `info.does` "Bei Bewegungen im {joint}" works only with a neuter German joint name such as "…gelenk". The playbook should say so.
- Region-specific gaps that matter only with a second region: the data error boundary is not keyed by region, a region change keeps the search, the tab and the layers panel open, notes on exercises of another region read as unknown, the print summary is not cleared on a region change, and the address does not change with the picker.
- The viewer remounts once when the manifest arrives, so the 20 s load watchdog starts after the manifest.
- There is no App-level test for a failed manifest (it is covered at Viewer level).
- One App test (around `App.test.tsx:194`) failed once under load and passed on every re-run. It is an older race: `findByText` resolves before the panel is in, then `getByRole` runs at once.
- The German banned stem `erhol` also matches "wiederholen".
- No test checks that every `notebook.loadError` reason has a text in each language.
- The helper that turns an id into a name is copied in four components.
- `data/structures/hip.yaml` gives the iliotibial tract the German name "Tractus iliotibialis", which repeats its Latin name (it is what the source page uses).

## For the owner

1. **Task 4 needs your decision on the surface gate** (numbers above). The options from the report:
   - (a) gate only the bone area where Z-Anatomy parts attach, which narrows the check
   - (b) a separate, reasoned limit for the hip bone
   - (c) keep the full gate, so the mixed build fails and the hip falls back to `--whole-region`, which changes the licence situation of the whole model
   - (d) improve the fit (for example weight the joint area) and measure again, which changes the Z-Anatomy model

   After the decision, Task 4 can start from the saved patch, then Task 5 follows.
2. **Proofread the German** (list below). Especially the disclaimer and the educational line, which must say exactly as much as the English.
3. **German word rule:** the summary says "Physio-Fachkraft" because "Physiotherapeut" contains the banned stem "therap". Loosen the rule for that word if you prefer the full word.
4. **German names:** decide whether the movement names should be one consistent set, and whether glosses of the Latin ("Birnenförmiger Muskel") are what you want, or the Latin name, or no German name.
5. **Setup on this machine:** `unzip` is not installed and there is no root access here. The builder used a copy unpacked from the Ubuntu package in a folder outside the repo. Install `unzip` properly if you run the pipeline here again.

## For the owner to proofread

Every German text and name the builder was unsure about. Key or id: English / German / why.

### Texts in `apps/web/src/i18n/de.json`

- `about.educational`: "anatoMe is for learning how the body moves. It is not a diagnostic tool and not medical advice." / "anatoMe ist dafür da, zu lernen, wie sich der Körper bewegt. Es ist kein Diagnosewerkzeug und kein medizinischer Rat." / Must say exactly as much as the English. The first sentence is a little stiff.
- `notebook.disclaimer`: "This notebook is for your own notes. It is not a diagnosis and not medical advice. If you are worried, talk to a qualified health professional." / "Dieses Notizbuch ist für deine eigenen Notizen. Es ist keine Diagnose und kein medizinischer Rat. Wenn du dir Sorgen machst, sprich mit einer qualifizierten Fachperson aus dem Gesundheitswesen." / Must say exactly as much as the English.
- `info.does` with `joint.hip` and `joint.knee`: "What it does at the {joint}" with "hip", "knee" / "Bei Bewegungen im {joint}" with "Hüftgelenk", "Kniegelenk" / Reworded so no pronoun has to match the structure's gender.
- `info.attachments`, `info.origin`, `info.insertion`: "Where it attaches", "Starts at: {landmark} of the {bone}", "Ends at: …" / "Befestigung am Knochen", "Beginnt an: {landmark} ({bone})", "Endet an: {landmark} ({bone})" / The bone in brackets avoids a genitive. "am Knochen" is added.
- `angle.hip.flexion`, `angle.hip.abduction`, `angle.hip.rotation`, `angle.knee.flexion`: "the hip bent", "the hip spread out", "the hip turned", "the knee bent" / "Hüftbeugung", "Hüftabspreizung", "Hüftdrehung", "Kniebeugung" / Nouns, so they fit the combined lines `when.between`, `movement.slider`, `notebook.angle` inside `notebook.angles`, and `review.pathStep`. Check that those read well.
- `mode.movement`, `mode.area`, `mode.notebook`: "Movements", "Area", "Notebook" / "Bewegung", "Stelle", "Notizen" / Shortened to fit 360 px. "Stelle" alone may be unclear.
- `search.placeholder`: "Search, for example piriformis" / "Suche: Piriformis" / Shortened to fit. It may read like a search that is already running.
- `search.peeled`, `search.peeledOne`: "{count} layers peeled to show {name}" / "{count} Schichten abgetragen. Jetzt sichtbar: {name}" and "1 Schicht abgetragen. Jetzt sichtbar: {name}" / Rewritten so German names with adjectives fit.
- `area.throughTitle`: "Over and under {name}, seen from here" / "{name}: was darüber und darunter liegt, von hier aus gesehen" / Same reason.
- `notebook.candidate`: "{name}: loaded in {painful} of {total} movements you marked as hurting, and in none you marked as fine" / "{name}: belastet in {painful} von {total} als schmerzhaft markierten Bewegungen und in keiner als gut markierten" / Check that it still clearly means the person's own markings.
- `notebook.empty`: names the tab "Bewegung" and repeats the word ("Wähle im Tab Bewegung eine Bewegung").
- `summary.painful`, `summary.fine`: "Als schmerzhaft markierte Bewegungen", "Als gut markierte Bewegungen" / "gut" for "fine".
- `summary.basis`: "…a physiotherapist has checked…" / "…die eine Physio-Fachkraft geprüft hat…" / The word rule bans "therap" here. Other texts say "eine Physiotherapeutin oder einen Physiotherapeuten".
- `notebook.lookInto` (also in `notebook.needPainful`): "Structures to look into" / "Strukturen zum Nachlesen" / Softer than "look into".
- `confidence.medium`: "supported by one study or angle-dependent" / "von einer einzelnen Studie gestützt oder vom Winkel abhängig" / Was "durch eine Studie belegt", which sounded stronger. Check `confidence.high` "gut belegt" alongside it.
- `credits.title`: "Credits" / "Nachweise und Lizenzen" / Longer, chosen over the loanword.
- `credits.modified`: "…meshes shown here were simplified and repositioned…" / "Die hier gezeigten 3D-Modelle … wurden für anatoMe vereinfacht und neu positioniert." / A licence change notice. "meshes" as "3D-Modelle".
- `layers.peel`, `layers.restore`: "Eine Schicht abtragen", "Zurückholen" / Tone.
- `type.labrum`: "Labrum" / "Gelenklippe" / A plain word instead of the Latin.
- `area.loadedBy`: "Movements that load it" / "Bewegungen, die diese Struktur belasten" / Neutral instead of a gendered pronoun.
- `area.note`: "…It does not say what causes a symptom." / "…Sie sagt nicht, was ein Symptom verursacht." / Outside the notebook keys, kept close to the English.
- `gap.psoas-origin`: "Its origin on the lower spine is not modelled yet." / "Sein Ursprung an der unteren Wirbelsäule ist noch nicht im Modell." / "Sein" assumes the masculine psoas.
- `mode.label`: "What to explore" / "Was du erkunden willst" / Screen reader label only.
- `movement.effortNote`: "Muskeln, die als arbeitend gezeigt werden, …" / Stiff.
- `review.phase`: "{phase}: {path}. Working: {effort}" / "{phase}: {path}. Muskelarbeit: {effort}" / Review build only. `{effort}` is a list of movement names.

### Names in the data

- All 8 movement names in `data/movements.yaml` ("Beugung im Hüftgelenk", "Streckung im Hüftgelenk", "Abspreizen im Hüftgelenk", "Heranführen im Hüftgelenk", "Innenrotation im Hüftgelenk", "Außenrotation im Hüftgelenk", "Beugung des Kniegelenks", "Streckung des Kniegelenks"). They are combinations of the pages' words. They mix plain German (Beugung, Abspreizen) with Innenrotation and Außenrotation. A plain set would say "Einwärtsdrehung" and "Auswärtsdrehung". The hip names say "im Hüftgelenk", the knee names "des Kniegelenks".
- "Abspreizen im Hüftgelenk" and "Heranführen im Hüftgelenk": verbs used as nouns. German Wikipedia uses Abspreizbewegung and Heranführungsbewegung.
- "Langer Kopf des Musculus biceps femoris" and "Kurzer Kopf des Musculus biceps femoris": the builder's combination of the page's words. Long for the phone.
- "Queres Pfannenband": nominative made from "das quere Pfannenband".
- Glosses of the Latin used as labels, not everyday names: Birnenförmiger Muskel, Oberer and Unterer Zwillingsmuskel, Viereckiger Schenkelmuskel, Langer, Kurzer and Großer Adduktor, Gerader Muskel des Oberschenkels, Seitlicher breiter Muskel, Innerer Schenkelmuskel, Mittlerer breiter Muskel. The three vastus names do not follow one pattern, because each is what its own page gives.
- Großer Gesäßmuskel (DocCheck Flexikon) where German Wikipedia says "größter Gesäßmuskel".
- Hüftkopfband (DocCheck Flexikon) where German Wikipedia says "Oberschenkelknochenkopfband".
- Faserknorpellippe for the acetabular labrum, Hüftgelenkskapsel, Plattsehnenmuskel for semimembranosus, Oberschenkelbindenspanner for tensor fasciae latae (German Wikipedia calls "Sprintermuskel" colloquial).
- Tractus iliotibialis: no German everyday name was found, so the Latin term is the German label.
- Kniebeuge for "Bodyweight squat" (the page is about squats in general), Abwärtsbewegung and Aufwärtsbewegung for its phases.
- Left without a German name (no opened source gave one): sacrotuberous ligament, sacrospinous ligament, trochanteric bursa, iliopectineal bursa, ischial bursa, side-lying hip abduction and its two phases.
