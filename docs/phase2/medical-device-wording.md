# Medical device wording check for the notebook

Date: 2026-11-14
Written by: Claude (the builder), for plan `docs/superpowers/plans/2026-11-13-phase-2c-symptom-notebook.md`, Task 1.
Status: waiting for the owner's sign-off at the end of this page. Notebook Tasks 2 to 7 are not built before both lines are filled in.

## 1. What this is

This page is research by the builder, not legal advice. It reads the EU rules on when software counts as a medical device and holds the planned symptom notebook against them. Every statement about the rules below names the document, the place in it, a link and the date it was read. Nothing about the rules is written from memory.

How the documents were opened:

- EUR-Lex refused automated reading on 2026-11-14. Every EUR-Lex link (`/legal-content/...`, `/eli/...`, the PDF links) answered with the EUR-Lex start page instead of the text. The same official texts were read from the Publications Office of the EU, which serves the EUR-Lex documents by their CELEX number. Both links are given below.
- The European Commission's guidance pages and PDFs were read from health.ec.europa.eu. The Commission's infographic first answered "429 Too Many Requests" and opened on a second try.

Documents read on 2026-11-14:

| Short name | Document | Link |
| --- | --- | --- |
| MDR | Regulation (EU) 2017/745 on medical devices, consolidated text of 10.01.2025 (the newest consolidation the Publications Office served) | https://eur-lex.europa.eu/legal-content/EN/TXT/?uri=CELEX:02017R0745-20250110 , read from https://publications.europa.eu/resource/celex/02017R0745-20250110 |
| MDR recitals | The same regulation as published in the Official Journal (OJ L 117, 5.5.2017). Consolidated texts leave the recitals out, so recital 19 comes from here | https://eur-lex.europa.eu/eli/reg/2017/745/oj , read from https://publications.europa.eu/resource/celex/32017R0745 |
| MDCG 2019-11 | MDCG 2019-11 Rev.1, "Guidance on Qualification and Classification of Software in Regulation (EU) 2017/745 – MDR and Regulation (EU) 2017/746 – IVDR", October 2019, June 2025 rev.1 | https://health.ec.europa.eu/document/download/b45335c5-1679-4c71-a91c-fc7a4d37f12b_en?filename=mdcg_2019_11_en.pdf (announced at https://health.ec.europa.eu/latest-updates/update-mdcg-2019-11-rev1-qualification-and-classification-software-regulation-eu-2017745-and-2025-06-17_en , 17 June 2025) |
| Infographic | "Is your software a Medical Device?", European Commission, listed as March 2021 | https://health.ec.europa.eu/document/download/b865d8e9-081a-4601-a91a-f120321c0491_en?filename=md_mdcg_2021_mdsw_en.pdf |
| Borderline manual | "Manual on borderline and classification for medical devices under Regulation (EU) 2017/745 on medical devices and Regulation (EU) 2017/746 on in vitro diagnostic medical devices", Version 5, April 2026 | https://health.ec.europa.eu/document/download/71a87df8-5ca1-4555-b453-b65bdf8de909_en?filename=md_borderline_manual_en.pdf |
| Blue Guide | Commission Notice "The 'Blue Guide' on the implementation of EU product rules 2022" (2022/C 247/01) | https://eur-lex.europa.eu/legal-content/EN/TXT/?uri=CELEX:52022XC0629(04) , read from https://publications.europa.eu/resource/celex/52022XC0629%2804%29 |
| Guidance list | European Commission, "Guidance - MDCG endorsed documents and other guidance" (no "last updated" date shown) | https://health.ec.europa.eu/medical-devices-sector/new-regulations/guidance-mdcg-endorsed-documents-and-other-guidance_en |

Page numbers for MDCG 2019-11 and the borderline manual are the numbers printed on the pages.

Linked from these, but not opened: IMDRF/SaMD WG/N81 FINAL:2025 (named in MDCG 2019-11 section 3), MDCG 2020-1 (clinical evaluation of software), MDCG 2023-4 (software with hardware), MDCG 2025-4 (software apps on online platforms) and MDCG 2025-6 (the AI Act). Nothing below relies on them.

## 2. What the rules say

### 2.1 The definition of a medical device

MDR Article 2, point (1), read 2026-11-14 (link: MDR above): a medical device is "any instrument, apparatus, appliance, software, implant, reagent, material or other article intended by the manufacturer to be used, alone or in combination, for human beings for one or more of the following specific medical purposes". The purposes that matter here are, in the regulation's words:

- "diagnosis, prevention, monitoring, prediction, prognosis, treatment or alleviation of disease"
- "diagnosis, monitoring, treatment, alleviation of, or compensation for, an injury or disability"
- "investigation, replacement or modification of the anatomy or of a physiological or pathological process or state"

So software is a medical device when the person who makes it intends it for one of these purposes. "Software" is named in the definition itself.

### 2.2 What decides the intended purpose

MDR Article 2, point (12), read 2026-11-14 (link: MDR above): "'intended purpose' means the use for which a device is intended according to the data supplied by the manufacturer on the label, in the instructions for use or in promotional or sales materials or statements and as specified by the manufacturer in the clinical evaluation".

For anatoMe this means: the app's own text, the README, the repository description and anything said to promote the app all count as "statements" of what it is for.

MDCG 2019-11, section 3 "Qualification" (page 7) and section 3.1 (page 8), read 2026-11-14: the guidance says that "Crafting a well-defined and clear intended purpose is paramount", that "Software must have a medical purpose on its own to be qualified as a MDSW", and that "the intended purpose, as described by the manufacturer of the software is relevant for the qualification and classification of any device".

MDCG 2019-11, section 3.1 (page 9), read 2026-11-14: "the risk of harm to patients, users of the software, or any other person, related to the use of the software within healthcare, including a possible malfunction is not a criterion on whether the software qualifies as a medical device". So "it is harmless" is not an argument either way.

### 2.3 Lifestyle and well-being software

MDR recital (19), read 2026-11-14 (link: MDR recitals above): "It is necessary to clarify that software in its own right, when specifically intended by the manufacturer to be used for one or more of the medical purposes set out in the definition of a medical device, qualifies as a medical device, while software for general purposes, even when used in a healthcare setting, or software intended for life-style and well-being purposes is not a medical device."

MDCG 2019-11, section 3.1 (page 9), read 2026-11-14: software "only intended for non-medical purposes" such as "wellness or fitness apps, do not qualify as MDSW".

### 2.4 The decision steps

MDCG 2019-11, section 3.3, "Decision steps for deciding if a software is covered by Medical Device Regulations (Figure 1)" (pages 12 and 13), read 2026-11-14. The same steps are drawn in the Commission's infographic (page 2, "Decision steps to assist qualification of Medical Device Software (MDSW)"), read 2026-11-14. In short, in our words, with the guidance's own words in quotes:

1. Is it software as the guidance defines it? (Step 1.)
2. Is it an Annex XVI device, an accessory, or software that drives a hardware device? (Step 2. Not relevant for anatoMe.)
3. Does it "perform an action on data, or performs an action beyond storage, archival, communication, simple search, lossless compression"? If not, it is not covered. (Step 3.)
4. "is the action for the benefit of individual patients?" The guidance names as examples of software that is not: software "intended only to aggregate population data, provide generic diagnostic or treatment pathways (not directed to individual patients), scientific literature, medical atlases, models and templates as well as software intended only for epidemiological studies or registers". (Step 4.)
5. Is it medical device software by the definition, that is, intended for a medical purpose from section 2.1? (Step 5.)

MDCG 2019-11, section 3.1 (page 8), read 2026-11-14, on step 3: "Simple search" is "the retrieval of records by matching record metadata against record search criteria or to the retrieval of information" and "does not qualify as MDSW". But "software which is intended to process, analyse, interpret, calculate, create or modify medical information may be qualified as a MDSW if the creation or modification of that information is governed by a medical intended purpose."

MDCG 2019-11, Annex I section c and c.1 (pages 25 and 26), read 2026-11-14: "Information Systems that are intended only to transfer, store, convert, format, archive data are not qualified as medical devices in themselves." Electronic health record systems "when used solely to replace traditional paper-based patient files, do not meet the definition of a medical device".

### 2.5 Examples in the guidance that sit close to anatoMe

MDCG 2019-11, section 3.2 (pages 9 to 12), read 2026-11-14. Software that the guidance counts as medical device software, quoted:

- "MDSW that uses the data of a patient with a specific musculoskeletal pathology (e.g. X-rays, range of motion, weight, age, etc.) and is intended to alleviate pain associated with the musculoskeletal pathology by recommending personalised rehabilitation exercises to be performed." (page 10)
- "MDSW intended to assess, monitor, and manage depression. The MDSW provides patients with questionnaires to track their mood, symptoms, and activities." (page 11)
- "MDSW intended to aid in the treatment of schizophrenia by enabling patients to monitor their symptoms and receive personalised medical interventions based on their response to daily surveys." (page 10)

MDCG 2019-11, Annex I section b (page 25), read 2026-11-14: "Computer Aided Detection systems are intended to provide information that may suggest or exclude medical conditions are qualified as medical devices (MDSW)."

The borderline manual (Version 5, April 2026), read 2026-11-14, has no entry on symptom diaries, pain logs, anatomy apps, exercise or physiotherapy apps. I searched it for "symptom", "pain", "educat", "anatom", "physiother", "exercis", "well-being" and "app". The nearest entry is 1.1.9.2 "Medical calculators" (pages 17 and 18): a calculation from patient-specific values "is an action on data beyond the use of simple search" and "is for the benefit of individual patients, as it does not only provide generic diagnostic or treatment pathways", so the calculator is a medical device under Rule 11.

### 2.6 What class a medical device app would be

MDR Annex VIII, Chapter III, section 6.3 "Rule 11", read 2026-11-14 (link: MDR above): "Software intended to provide information which is used to take decisions with diagnosis or therapeutic purposes is classified as class IIa", with higher classes when such decisions may lead to death, irreversible or serious deterioration of health, or surgery. Software to monitor physiological processes is class IIa or IIb. The rule ends: "All other software is classified as class I."

MDCG 2019-11, section 4.2.1 (page 17), read 2026-11-14: the wording of sub-rule 11a "describes, in very general terms, the 'mode of action' which is characteristic of all MDSW. Therefore, this sub-rule is generally applicable to all MDSW (excluding those MDSW that have no medical purpose)." In plain words: if the notebook were medical device software, the guidance points to class IIa at least, not class I. Class IIa needs a notified body. MDCG 2019-11, section 3 (page 7), adds that claims about a medical purpose must be "supported by appropriate level of clinical evidence". Neither is within reach of this project.

### 2.7 Free, open source and published by one person

MDR Article 2, points (27) and (28), read 2026-11-14 (link: MDR above): "'making available on the market' means any supply of a device, other than an investigational device, for distribution, consumption or use on the Union market in the course of a commercial activity, whether in return for payment or free of charge" and "'placing on the market' means the first making available of a device".

MDR Article 6(1), read 2026-11-14: "A device offered by means of information society services ... to a natural or legal person established in the Union shall comply with this Regulation."

Blue Guide 2022, section 2.2 "Making available on the market", read 2026-11-14: "Commercial activity is understood as providing goods in a business related context." It goes on: this "can only be appreciated on a case by case basis taking into account the regularity of the supplies, the characteristics of the product, the intentions of the supplier, etc. In principle, occasional supplies by charities or hobbyists should not be considered as taking place in a business related context."

What this does not settle: whether a free web app that stays online for anyone counts as "occasional" supply by a hobbyist, and how the Blue Guide (written for goods in general) applies to software offered online under Article 6. I found no passage in the documents I read that answers this for software. So this page does not lean on "it is free" as a way out.

## 3. How the notebook is meant to work

Copied from the design decisions of plan 2c:

1. **What is logged.** One entry is a movement or an exercise phase from the Movements tab, the joint angles at that moment, a feeling ("It hurts" or "It feels fine"), a side (left, right or both) and a free note of up to 500 characters.
2. **Left and right are compared apart.** A movement that hurts on the left and feels fine on the right says nothing against the left side.
3. **A structure to look into** is one that at least one painful entry loads and no fine entry of the same side loads. The list is ordered by how many painful entries load it.
4. **Only checked rows count**, because the normal build holds nothing else. When rows for a logged movement still wait for review, the list says it may be incomplete.

The plan also keeps every entry on the device, has a one-page print summary and a backup file, and gives no advice.

## 4. Where the notebook sits

Each test from section 2, with what speaks for "educational tool" and what speaks against. The atlas, Movements and Area tabs are looked at briefly too, because the notebook sits inside the same app and the same intended purpose.

### 4.1 Atlas, Movements and Area tabs

- **For educational:** they show general anatomy and general movement knowledge, the same for every user. MDCG 2019-11 step 4 names "medical atlases, models and templates" as software that is not for the benefit of individual patients.
- **Against:** the Area tab answers "what lies under this spot". The plans call it "tap where it hurts". If the app or the README used that phrase, the Area tab would be presented as a tool for one person's pain. Today's app text ("Tap a spot on the model to see what lies under it.") does not say that.
- **How sure:** high that these tabs, worded as they are, are educational software, as long as no public text frames them around one person's pain.

### 4.2 The log, the backup file and the print summary (without the comparison)

- **Step 3 (action on data).** For: storing entries, saving and loading a backup file and printing them are storage, archival and communication, which the guidance lists as not enough (MDCG 2019-11 step 3, Annex I c). An entry is close to a paper diary. Against: the print summary formats the entries for someone else to read. That is still "format" and "communication" in the guidance's words, as long as it adds no analysis.
- **Step 4 (individual benefit).** Against: the entries are about one person.
- **Step 5 (medical purpose).** For: without analysis, the log does not diagnose, monitor or treat anything. It is a notebook. Against: the guidance's depression example "provides patients with questionnaires to track their mood, symptoms, and activities", and it counts as medical device software. What makes it one there is the stated purpose "to assess, monitor, and manage depression" and the individually chosen exercises. The anatoMe log must never be described as tracking or monitoring a condition.
- **Recital 19.** For: a personal notebook about which movements feel fine sits nearer to "life-style and well-being" than to medicine, if it is presented that way. Against: the spec and the plans call it a "symptom notebook". "Symptom" is a medical word.
- **How sure:** medium that the log, backup and summary without the comparison stay outside the rules, provided the wording rules in section 5 hold.

### 4.3 The comparison ("structures to look into")

This is the part that sits closest to the line.

- **Step 3 (action on data).** Against: the comparison takes the person's own entries, combines them with the action rows and produces a new list. That is an action on data beyond storage and simple search. The medical calculator entry in the borderline manual (1.1.9.2) treats a calculation from one person's values the same way.
- **Step 4 (individual benefit).** Against: the list is made for one person from that person's entries. It is not a generic pathway.
- **Step 5 and the definition (medical purpose).** For: the app does not name an injury or a disease, gives no advice, shows no likelihood, and says "structures to look into" as an anatomy pointer. Its stated purpose would be learning which structures movements load. Against: the purposes in MDR Article 2(1) include "diagnosis ... of ... an injury" and "investigation ... of the anatomy or of a physiological or pathological process or state". A list of the structures that the painful movements load and the painless ones do not is, in effect, a pointer to where pain may come from in this person. MDCG 2019-11 Annex I b counts software that provides "information that may suggest or exclude medical conditions" as medical device software. The comparison does not name a condition, but it narrows down a body part for one person in pain. A careful reader at an authority could see a diagnostic purpose in what the function does, whatever the label says.
- **Intended purpose (Article 2(12)).** For: the purpose is set by the manufacturer's own statements, so strict wording helps. Against: the documents I read do not say that a disclaimer alone outweighs what a function plainly does. MDCG 2019-11 section 3 asks for an intended purpose that describes "all functionalities". A disclaimer that says "not for diagnosis" next to a function whose natural use is to locate pain may not be believed.
- **If it is a medical device.** Rule 11a, as MDCG 2019-11 section 4.2.1 reads it, puts it at class IIa at least, with a notified body and clinical evidence. That is out of reach. So the cost of being wrong is not a small fix. It is taking the feature down.
- **Commercial activity.** Possibly a way out for a free hobby project (Blue Guide section 2.2), but not settled for an app that is online for anyone all the time (section 2.7 above).
- **How sure:** low that the comparison stays outside the medical device rules. I cannot honestly call it an educational tool with confidence. The comparison of painful and painless movements is the point closest to the line in the whole app.

### 4.4 Overall

- Atlas, Movements and Area tabs: high confidence they are educational, with the wording rules below.
- Notebook log, backup and summary without the comparison: medium confidence they stay outside.
- Comparison: low confidence it stays outside. My recommendation is to build the notebook without Task 4 (design decision 8 of the plan allows that), or to have the comparison looked at by someone qualified in EU medical device regulation before it is built.

## 5. Wording rules

From the Global Constraints of plan 2c:

- User data never leaves the device. No request of any kind carries notebook data. Notebook data is never written to the repo, to logs or to the console.
- No diagnosis. The notebook shows "structures to look into", never what is injured, and never advice on what to do.
- Notebook text in `en.json` (keys starting with `notebook.`) must not contain these word stems, apart from the disclaimer key: `diagnos`, `injur`, `damag`, `treat`, `cure`, `caus`, `you have`. A test enforces it.

Stricter rules that the reading suggests (builder's suggestions, the owner decides):

1. **Every public text counts.** MDR Article 2(12) counts the label, the instructions and any "promotional or sales materials or statements". The word rules above should also apply to the README, the repository description, the GitHub Pages page and anything the owner writes when sharing the app, not only to `en.json`.
2. **Add these stems to the banned list** for notebook text: `assess`, `monitor`, `detect`, `track` (when about the body), `symptom`, `patient`, `likel` (likely, likelihood), `risk`, `source of`, `relie` (relieve, relief), `recover`, `rehab`, `heal`. Each one appears in the guidance's descriptions of medical device software, or describes a medical purpose from Article 2(1).
3. **Do not call the feature a "symptom notebook" in the app or the README.** "Movement notebook" or "Notebook" keeps the same function without a medical word. The spec and the plans can keep their internal name.
4. **Describe the Area tab without pain.** No "tap where it hurts" in the app, the README or any public text.
5. **Plain counts, not a ranking.** If the comparison is built, each structure shows plainly how many painful entries load it ("loaded by 3 of your painful entries"). No "top", "most likely", "main suspect" or colour scale from green to red.
6. **The disclaimer sits next to the result every time** it shows, on screen and on the printed page, not only on a separate page.
7. **No "for physiotherapists" or "for clinicians" framing.** The print summary is for the person to take along if they want. The app does not present itself as a tool for professionals to assess people.

## 6. What we do not build

- No severity scores and no pain scale numbers that the app adds up.
- No advice on what to do next, no exercises chosen for the person, no "see a doctor if" logic.
- No ranking called a likelihood, and no probability of any kind.
- No sharing or sending of entries. The backup file and the printed page are made and handled by the person, by hand.
- No reminders or schedules that turn the log into monitoring.

## 7. Open questions for the owner

1. **Build the comparison (Task 4) or not?** The reading puts it closest to the line, with low confidence that it stays outside the rules. The plan allows building the notebook without it.
2. **Ask a qualified person?** If you want the comparison, consider asking someone who knows EU medical device regulation (for example a regulatory consultant, or the competent authority of your member state) before it is built. This page is not legal advice.
3. **Rename the feature** in the app and the README ("Notebook" or "Movement notebook" instead of "Symptom notebook")?
4. **The extra banned stems** in section 5, rule 2: take all of them, some, or none?
5. **Commercial activity.** Do you want the free, hobby nature of the project written into the README as part of the intended purpose? It may help, but section 2.7 shows it does not settle the question.
6. **Check again before v1.** The spec asks for the rules to be checked again before v1 is published. MDCG 2019-11 was revised in June 2025 and the borderline manual in April 2026, so a newer version may exist by then.

## 8. Owner sign-off

Fill in "yes" or "no" and a date.

Notebook log, backup and summary: 
Comparison (structures to look into): 
