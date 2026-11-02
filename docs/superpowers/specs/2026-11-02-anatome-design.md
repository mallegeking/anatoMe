# anatoMe: design

Date: 2026-11-02
Status: draft, waiting for review by the project owner
Owner: @sticks (the project owner, "you" in this document)
Based on: "Interactive Anatomy Movement Explorer: Project Plan" (Nov 2, 2026) and the conversation that followed it.

This document replaces the original plan as the source of truth. Where the two disagree, this one wins. Points marked **(builder's call)** were decided by Claude during the design and the owner can still overrule them. Everything else was stated or confirmed by the owner.

Confidence tags: **high**, **medium**, **low**. They apply to technical claims and estimates.

---

## 1. Intent and why

anatoMe is a free, open-source, browser-based 3D anatomy explorer. It answers two questions for the musculoskeletal system:

1. Which structures does this movement load?
2. Which movements load this area?

**Why it exists.** The owner has hip, shoulder and neck pain from training. They want to understand what is going on under the skin when they move. Curiosity is a big part of it. Being able to explain the problem to a physiotherapist is a nice side effect, not the main goal.

**Why build it.** The owner looked for a free tool that does this and found none. A web search on 2026-11-02 confirmed the gap (see section 5). If it works for the owner, everyone else gets it for free too.

**Who it serves.** First the owner. Then anyone curious about what happens in their body when they move: people with training pain, trainers, students of functional anatomy, physios who want a visual for patients. The core user is a curious person, not a clinician and not a patient being diagnosed.

**What success looks like for v1.** The owner picks a hip movement that hurts, sees which muscles, tendons and ligaments it loads and how that changes with joint angle, and comes away understanding their own hip better than before. A physio has reviewed the hip data and found it sound.

## 2. Goals, non-goals, anti-goals

### Goals

- Explore by **structure**: search or click a muscle, bone, tendon or ligament. See attachments, actions, every movement that uses it, and what lies above and below it.
- Explore by **movement**: pick a joint movement (hip internal rotation) or an exercise (squat). Structures light up ranked primary or secondary. A joint-angle control shows how roles change as the joint moves.
- Explore by **area**: tap a spot on the body. See the structures under it layer by layer and which movements load each one.
- **Symptom notebook**: log which movements hurt and which similar ones do not. The app shows which structures the painful movements share and the painless ones do not, as candidates to look into. It exports a one-page summary.
- Start with the **hip** (hip joint, pelvis, thigh). Grow region by region to the whole musculoskeletal system. The owner's shoulder and neck come in Phase 4.
- Every fact about what a muscle does carries at least one citation and a confidence level.
- Free for anyone to use, copy and build on.

### Non-goals

- Organs, pathology, treatment advice, personalised exercise prescription.
- Peripheral nerves in v1 (they come later).
- Diagnosis of any kind.
- Accounts, logins, sync, analytics, or any server.

### Anti-goals (failure even if everything technically works)

- **A confident wrong answer.** Wrong anatomy data in a tool people use to understand pain is worse than no data. Every action row needs a source and a confidence level, and a physio reviews each region before it ships.
- **Drifting into diagnosis.** Under EU rules, software whose intended purpose is diagnosis can count as a medical device (high confidence on the principle, verify the details before v1 is published). All app text and the README stay educational. The notebook shows "structures to look into", never "what is injured".
- **User data leaving the device.** Symptom notes, and later any video, stay on the phone. No exceptions.
- **Too slow on a phone to bother opening.** The phone is the main device.

## 3. Constraints

- **Static files only.** Meshes, knowledge base and any simulation output are built ahead of time. The app is static files that can be hosted anywhere. No backend.
- **Phone first.** The reference device for every performance gate is the owner's Samsung Galaxy A23 (Android, Chrome). It sits at the lower end of mid-range, which makes it a good test. Target **(builder's call)**: the hip region is interactive within 5 seconds of opening the page on home Wi-Fi, and rotating it does not stutter.
- **Time.** The owner works on this part-time on weekends. Claude writes the code. The owner reads code and asks when something is unclear.
- **Code comments.** Short, plain, friendly comments wherever something is not obvious, written for a reader who knows code but not this codebase.
- **Docs and comments style.** Plain language. No em dashes. No semicolons.
- **Check current docs.** Before writing setup steps or code for three.js, Blender's glTF exporter, React Three Fiber, OpenSim or any other tool, check the current official docs. Do not rely on remembered versions or commands. Setup instructions must leave nothing to guess, including the expected folder structure at each step.
- **Plan before executing. Read files before editing them.**
- **Repo is private until v1** (Phase 3), then made public. Nothing private may ever be committed, because the full history becomes public then.
- **License and attribution files go in with the first real commit**, before any mesh or data is added.

## 4. What the owner decided

| Topic | Decision |
| --- | --- |
| Project name | anatoMe (the repo name) |
| Who writes code | Claude. The owner reads and reviews. |
| Starting region | Hip first, chosen by the owner even though shoulder and neck also hurt |
| Main goal | Understanding your own body. Physio communication is a side benefit. |
| Openness | "People can do whatever they want with it" within law and morality. Closed or paid reuse by others is fine. |
| Licensing approach | Permissive where possible (see section 6) |
| UI languages | English at launch. German next. Shona after German. |
| Physio reviewer | The owner has a physio in mind and will approach her once there is something to show (end of Phase 1 or during Phase 2) |
| Repo visibility | Private now, public at Phase 3 |
| Video input | Wanted later (Phase 6, see section 10). Not part of v1. |
| What "a movement loads a structure" means | Three load types from the first data row: working (muscles), stretched, pinched. For the hip, working muscles get filled first. Stretched and pinched rows are added where good sources exist. |
| Joint-angle control | The 3D model stays still in Phase 2. Only the highlighting changes with the angle. Bones-only bending is on the ideas list for later. |
| Data sources | Open-access papers and openly licensed sources for now. The owner may borrow textbooks from a friend, which would then be added as sources. |
| Reference phone | Samsung Galaxy A23 (Android) |
| Homelab | Reachable from outside the home network through Tailscale |

## 5. Prior art (checked 2026-11-02)

No free tool found goes down to joint movements, joint-angle-dependent roles, tendons and ligaments, "tap where it hurts", or cited data. Closest matches:

| Tool | What it does | Relevance |
| --- | --- | --- |
| [free-muscles](https://github.com/tiralonghipol/free-muscles) | Open source (MIT). Tap a muscle to see exercises, or pick one of 876 exercises to light up its muscles. Z-Anatomy meshes, Blender script decimates to about 310k triangles, Draco-compressed glTF of 1.7 MB. React Three Fiber and Vite. | Best technical reference for Phase 0. Read its `scripts/build-anatomy.py` before writing our asset pipeline. |
| [Human Atlas](https://github.com/ashemag/human-atlas) | Open source (MIT code, CC BY 4.0 data). 2,234 BodyParts3D meshes, system toggles, search, mobile panels. No movements. About 4.5k stars. | Reference for using BodyParts3D directly under CC BY 4.0, and for search and mobile UI. |
| AnatomyScope (anatomyscope.com) | Free, pick an exercise to light up muscles. No source code or license found. | Not checked in detail (host was blocked in this session). |
| Muscle & Motion | Paid app. | Not a free alternative. |

What anatoMe adds: the "why" layer. Joint-level movements, role changes with joint angle, tendons and ligaments, area lookup, and sourced data.

## 6. Licensing

### Findings

| Source | License | Notes | Confidence |
| --- | --- | --- | --- |
| [Z-Anatomy](https://github.com/Z-Anatomy/Models-of-human-anatomy) | CC BY-SA 4.0 | Non-commercial parts: inner ear (CC BY-NC-SA 4.0) and kidney (CC BY-NC 4.0). Brain white matter parts list no license. None are musculoskeletal, so none are ever imported. | High |
| BodyParts3D (DBCLS) | **CC BY 4.0** since 2025-02-27 | The original plan said CC BY-SA 2.1 Japan, which is outdated. Old OBJ file headers and Z-Anatomy's credits still mention the old license. Requested credit: "BodyParts3D, © The Database Center for Life Science licensed under CC Attribution 4.0 International". | High. DBCLS license page read directly on 2026-11-02 (last updated 2025/02/27). Re-check before v1. |
| OpenSim engine | Apache 2.0 | Models bundled with OpenSim keep their own licenses. | High |
| OpenSim full-body model (Rajagopal) | Unknown | Only matters in Phase 5. Check before use. | n/a |
| Wikipedia text in Z-Anatomy | CC BY-SA 3.0 | Z-Anatomy warns some definitions contain machine-translation errors. We write our own descriptions. | High |

### Decisions

- **Code: MIT** **(builder's call)**, in `LICENSE`. Simplest "do what you want" license, matches the owner's view.
- **Own data (`data/`): CC BY 4.0** **(builder's call)**, in `data/LICENSE`. This covers the knowledge base: structures, attachments, movements, actions, exercises, region maps, citations. It is the part nobody else has, and it stays permissive whatever mesh source we use. Facts are free, but we never copy a textbook's wording or table layout.
- **Meshes (`models/`): depends on the source**, in `models/LICENSE`.
  - From BodyParts3D directly: CC BY 4.0.
  - Derived from Z-Anatomy: CC BY-SA 4.0 (share-alike is forced by Z-Anatomy).
  - The choice is made in Phase 0 (see section 9, task 2).
- `ATTRIBUTION.md` lists every upstream source, its license and the exact credit text. The app shows a credits screen with the same content.

## 7. Architecture

Everything heavy runs offline. The app only loads static files.

```
 Sources                 Offline pipelines                 Output
 -------                 -----------------                 ------
 Mesh source       --->  Asset pipeline (Blender,     --->
 (BodyParts3D or         Python): pick structures,
  Z-Anatomy)             decimate, export glTF per region
                                                             Static build
 Knowledge base    --->  Data build: validate YAML     ---> (glTF per region,
 (YAML in data/)         against JSON Schema, compile        compiled JSON,
                         to JSON, includes name mapping      later activation
                                                             data)
 OpenSim (Phase 5) --->  Simulation pipeline (OpenSim  --->      |
                         Python): activations per                v
                         exercise                          Web app in the browser
                                                           3D viewer, search,
                                                           movement explorer,
                                                           symptom notebook
```

**The name mapping table is the glue.** It links each mesh name, each knowledge base entry and (later) each OpenSim muscle to one stable structure id. It lives in `data/` and is checked by the data build: every mesh referenced must exist, every structure id must be unique.

### Stack **(builder's call, confirm against current docs before use)**

| Layer | Choice | Why | Confidence |
| --- | --- | --- | --- |
| Language | TypeScript | Catches data shape mistakes early, easier to read with types | High |
| App | Vite, React, React Three Fiber (three.js underneath) | The two closest prior-art projects use it, so their code is directly useful as reference. Large pool of help and future contributors. Static build. | Medium (any static setup would work) |
| 3D format | glTF binary (`.glb`) with Draco compression, one file per region | free-muscles shows the whole body fits in 1.7 MB this way | High |
| Mesh processing | Blender run headless with Python scripts | Scriptable and reproducible | High |
| Data | YAML files in `data/`, JSON Schema, compiled to JSON | Reviewable as text in pull requests | High |
| Validation | Schema check and mapping check in CI (GitHub Actions) | Private repos get enough free minutes for this | High |
| Text and translations | All UI text in language files from day one. English only at launch. | Adding German and Shona later is translation, not code changes | High |
| Search | Client-side index over structure names (English and Latin at launch, German later) | No server | Medium |
| On-device storage | Browser storage (IndexedDB) for the symptom notebook | Never leaves the device | High |
| Hosting during development | Owner's homelab (static files), reached through Tailscale. Tailscale's built-in HTTPS for tailnet hostnames (`tailscale serve`) is the likely way to get HTTPS, check current Tailscale docs. Deploys are done by hand at first **(builder's call)**. No hostnames or keys go into the repo. | GitHub Pages needs a paid plan for private repos. HTTPS is needed later for camera access. | Medium-high |
| Hosting after v1 | GitHub Pages (free once public) and/or homelab | | High |
| App type | Plain web app at launch. Installable offline app (PWA) later. | Keeps v1 simple. Offline use is on the ideas list. | Medium |

## 8. Data model

The knowledge base is the heart of the project. It lives as YAML files in `data/`, validated by a JSON Schema, and compiled into what the app loads.

| Entity | Key fields | Why it exists |
| --- | --- | --- |
| Structure | id, Terminologia Anatomica (Latin) term, English name, FMA id if available, type (bone, muscle, tendon, ligament, joint, capsule, labrum, bursa, nerve), region, mesh references (left and right) | One record per thing you can click |
| Attachment | muscle, bone landmark, origin or insertion | Explains why a muscle moves what it moves |
| Movement | joint, axis, direction (for example hip, transverse axis, internal rotation) | The shared vocabulary |
| Action | structure (any type, not only muscles), movement, load type (working, stretched, pinched), role (primary or secondary), condition, confidence (high, medium, low), citations (one or more), checked_by | What a movement does to each structure, and when |
| Exercise | name, phases, each phase as a set of joint movements with angle ranges | Lets people start from "squat" |
| Region map | body surface area, structures beneath it ordered by depth | Powers "tap where it hurts" |
| Citation | source, page or URL, license, short quote or summary of what the source says | Every action row points to at least one |
| Symptom log | movement or exercise, painful or not, notes, date | Stored only on the user's device. Never in the repo, never sent anywhere. |

**Three rules that must hold from the first row** (medium-high confidence they are needed, retrofitting means rewriting every row):

1. **Condition is structured, not free text** **(builder's call on the exact shape)**. A condition is a joint angle range, for example "hip flexion between 60 and 120 degrees". This is what drives the joint-angle control. Example: piriformis acts as an external rotator with the hip straight, and its rotation role changes once the hip bends past roughly 60 to 90 degrees.
2. **Movements and exercise phases are described as joint angles.** This lets the joint-angle control, and later video input (Phase 6), plug into the same data without rewriting it.
3. **Every action row has a load type.** Working means a muscle is producing or resisting force. Stretched means tissue is put under tension (for example the hip's external rotators and the ischiofemoral ligament during internal rotation). Pinched means tissue is compressed (for example the front of the acetabular labrum in deep flexion with internal rotation). Ligaments, capsule, labrum and bursae only ever appear as stretched or pinched.

**Who writes and checks data rows** **(builder's call):** Claude drafts rows, but only from sources it can actually open and read (open-access papers, openly licensed textbooks, sources the owner provides). Each citation records what the source says, so it can be checked. Each row has a `checked_by` field that stays empty until a person (the owner, later the physio) has looked at the source. The app can show unchecked rows differently. No citation is ever written from memory.

**Sides** **(builder's call):** knowledge base entries describe one side. The mapping table links each structure to its left and right meshes.

**Translations:** structure names carry a Latin term (universal) plus per-language names. Shona anatomy terms may not exist for every structure. Fallback order to be decided when Shona is added (low confidence on availability).

## 9. Roadmap

Effort assumes part-time weekends. Estimates beyond Phase 1 are rough and get revisited after Phase 0.

| Phase | Content | Effort | Gate to pass before the next phase |
| --- | --- | --- | --- |
| 0. Spike | See task list below | Done except the phone gate, pending owner measurement (updated 2026-11-02, was 1 to 2 weekends) | The hip region loads quickly on the owner's phone |
| 1. Hip atlas | Hip, pelvis and thigh (down to and including the knee joint, because several thigh muscles attach below it) with search, info panel and peelable layers. Data schema in place. First sourced action rows for the hip. Credits screen. | 3 to 6 weekends (medium, updated 2026-11-02, was 4 to 8) | It helps the owner understand their own hip |
| 2. Movement explorer, area lookup and notebook | Stretched and pinched rows for the hip where sources exist. Joint-angle control changes highlighting only (the model does not bend). Hip movements, plus knee flexion and extension for the muscles that cross both joints. Exercises show their hip part only until Phase 4 adds knee and ankle data. Roles by joint angle, "tap where it hurts", symptom notebook with one-page export and a backup file the user can save and re-import (iPhone browsers can delete site storage of web apps that are not installed after about 7 days unused). Before the notebook is built, a short check of the EU medical device rules for its wording. | 2 to 4 months part-time (low, updated 2026-11-02, was 1 to 3) | The owner's physio has reviewed the hip data |
| 3. Publish v1 | Make the repo public. README with educational framing up front, CONTRIBUTING.md, a process for data corrections from physios and students. Re-check every license page, including the ones blocked during design. | 1 to 2 weekends (medium) | |
| 4. Whole body, region by region | Spine and neck, shoulder girdle, upper limb, knee and ankle. Each region ships on its own once its data is reviewed. German UI. | Months (low) | Name mapping works for one full region beyond the hip |
| 5. Simulation playback | OpenSim activations computed offline for common exercises, animated over the 3D model | Several months (low) | |
| 6. Your own movement (stretch goal) | See section 10 | Open-ended | |

Shona UI comes after German, timing open.

**Phase 0 result (2026-11-02):** done except the phone gate, which is pending owner measurement on the Galaxy A23. The provisional signal is a Playwright pre-check (4x CPU throttle, phone-sized viewport) with a median of 1457 ms against the 5000 ms limit. Rotation smoothness is not covered by that check. Reasons for the changed estimates: the mesh pipeline, schema, validator, CI and a tap-to-name viewer already exist, which shortens Phase 1 (medium). Source hunting and review for the 11 action rows was slow and open sources for stretched and pinched loads are thin, which lengthens Phase 2 (low). Details are in `docs/phase0/spike-report.md`. Phases 3 to 6 are unchanged.

### Phase 0 task list

1. **Set up the repo skeleton** with `LICENSE` (MIT), `data/LICENSE` (CC BY 4.0), `ATTRIBUTION.md`, a short README with the educational framing, and `docs/ideas.md`. No meshes yet.
2. **Inventory and choose the mesh source.** Download both BodyParts3D and Z-Anatomy. List the hip, pelvis and thigh structures in each: names, structure type, triangle counts, file sizes. Check that muscles, tendons and ligaments around the hip are present as separate meshes. **Rule (builder's call):** use BodyParts3D if it covers the hip muscles, major tendons and hip ligaments well enough to click them individually. Otherwise use Z-Anatomy. Mixing is allowed: if BodyParts3D is good for most structures but missing some (for example ligaments), take only the missing ones from Z-Anatomy and keep them in separate files. `models/` then holds a manifest listing each file's source and license, so most files stay CC BY 4.0 and only the Z-Anatomy files are CC BY-SA 4.0. Write the comparison and the decision into `docs/`.
3. **Export the hip region to glTF** with a Blender script (decimate, Draco). Read free-muscles' script first.
4. **Load it in a minimal app** (Vite, React Three Fiber). Click a structure to show its name.
5. **Measure on the Samsung Galaxy A23**: time from opening the page to the model being interactive, and smoothness when rotating. Hosted on the homelab, opened through Tailscale. Record the numbers in `docs/`. Gate: interactive within 5 seconds on home Wi-Fi, no stutter when rotating.
6. **Draft the JSON Schema** from section 8 and write **10 sourced hip action rows** from open-access sources, including at least one with a joint-angle condition and at least one stretched or pinched row, as a test of the format. Validate them in CI.
7. **Review the roadmap** against what the spike revealed and adjust effort estimates.

## 10. Later ideas (not in v1)

Kept in `docs/ideas.md`, which is the running list across sessions.

- **Video input (Phase 6).** Record a movement on the phone. The app tracks the joints, works out joint angles, matches them to movements in the knowledge base, and lights up the structures involved. This is lighter than the original plan's "estimate muscle loads from video" and fits the joint-angle data model. Runs entirely on the device, the video never leaves the phone. Some movements, especially rotation along the leg, are hard to see in a single phone video (medium-low confidence). Study Stanford's OpenCap project before building anything here.
- Bones-only bending: the thigh bone visibly rotates with the joint-angle control while muscles fade or highlight.
- German UI, then Shona UI.
- Installable offline app (PWA).
- Peripheral nerves.

## 11. Left to the builder

- Exact JSON Schema field names and file layout inside `data/`.
- Choice of search library, state management, UI component approach and styling.
- How peelable layers work in the UI (by depth, by type, or both).
- Decimation targets per region, as long as the Phase 0 gate passes.
- Design of the one-page export (printable page or PDF).
- Which textbooks and papers to cite, as long as every row has a source and wording is our own.
- How the app explains its educational framing in the UI.

## 12. Open items

- Re-check these pages from a session that can reach them: the OpenSim full-body model license on simtk.org, AnatomyScope. (The DBCLS BodyParts3D license page was confirmed on 2026-11-02.)
- Verify the EU medical device rules for the educational framing before the notebook is built (Phase 2) and again before v1 is published. Claude summarises the rules and sources. This is research, not legal advice.
- Shona anatomy terminology availability, when Shona is added.
- How the physio reviews: in person on the owner's phone, or through Tailscale sharing. Decide when she is approached.
- Added 2026-11-02, from the Phase 0 spike (details in `docs/phase0/spike-report.md`):
  - Phone gate: the owner measures on the Galaxy A23 and fills in `docs/phase0/phone-measurements.md`.
  - The action row has no field for "only in some hip shapes" (for example labrum pinching mainly in pincer-type hips). Decide before more rows are written.
  - No meniscus structure type exists, so the two menisci are deferred to Phase 1.
  - Two required structures have no mesh in either source: quadriceps tendon and patellar ligament. Psoas minor (optional) is also missing.
  - OpenStax Anatomy and Physiology 2e is now CC BY-NC-SA with a no-LLM clause. Rows cite the CC BY 4.0 OERI remix on LibreTexts instead. The owner confirms this is acceptable.
  - Two cited papers are non-commercial (Ito 2025, Groh 2009) and are used only as short evidence quotes. Decide the policy for such sources before v1.
