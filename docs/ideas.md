# Ideas

A running list of ideas for later. Nothing here is planned yet. When an idea gets picked up, it moves into a design or plan in `docs/superpowers/`.

## Video input

Record a movement with the phone camera. The app tracks the joints, works out joint angles, matches them to movements in the knowledge base, and lights up the structures involved. Everything runs on the device, the video never leaves the phone.

- Fits the data model because movements and exercise phases are described as joint angles.
- Rotation along the leg is hard to see in a single phone video (medium-low confidence).
- Study Stanford's OpenCap project first.
- Roadmap: Phase 6.

## Languages

- German UI after the English launch.
- Shona UI after German. Check how many anatomy terms have settled Shona equivalents and decide a fallback (English or Latin) for the rest.

## Bending model

When the joint-angle control moves, the thigh bone visibly rotates while muscles fade or highlight. Full muscle deformation is much more work and stays out of scope for now.

## Offline use

Make the app installable and usable offline (PWA), for example at the gym.

## Peripheral nerves

Add major peripheral nerves after the musculoskeletal regions.

## Whole body as one model

Added 2026-11-17. Being picked up: see the build prompt in `docs/superpowers/plans/2026-11-17-opus-prompt-whole-body.md`.

The region picker gets a "Whole body" entry next to the six regions, and the app opens with it instead of "Hip and thigh". The regions stay, because they are quicker to load and easier to read up close.

- Why: bent postures and positions only make sense on a whole body. They cannot be shown by putting region pieces next to each other.
- All six regions together are about 479,000 triangles and 2.7 MB. One region may have 150,000 triangles today. The phone gate (interactive within 5000 ms on the Galaxy A23) decides whether the whole body can be the opener.
- It is the base for the two ideas below.

## Movable model

Added 2026-11-17. The owner's idea.

The parts of the model can be moved by hand. When a movement is hard to put into words, a person plays with the model until it does the movement that hurts or that they want to understand.

- Fits the data model: a pose made by hand is a set of joint angles, and movements and exercise phases are already described as joint angles. The app could match the pose to the movements it knows, light up the structures involved and offer to log it in the notebook.
- The model has no skeleton today. Bones and muscles are separate still meshes. Moving a bone without changing the muscles around it looks broken, see "Bending model" above. A first step could move the bones at the joints and fade the muscles, before any muscle changes shape.
- Needs the whole body, see above.
- Wording stays educational. The notebook shows "structures to look into", never what is injured.
- Not sized yet. Likely a phase of its own.

## Load shown as colour gradients

Added 2026-11-17. The owner's idea.

During a movement the muscles involved light up by how much they are loaded. More load is brighter, less load is dimmer, shown as a gradient and not as a few fixed colours. Every other muscle and the rest of the model turn see-through, so the eye stays on the muscles the movement is about.

- Today a movement paints four fixed colours (main mover, helper, pinched, stretched) and hides the muscles that are not involved.
- The data has no amount of load. A row says what a muscle does (works, is stretched, is pinched), whether it is a main mover or a helper, and how well that is supported. A true gradient needs a number per muscle and joint angle, with a source and a physio's check. Such sources are thin, and a made-up number would be a confident wrong answer, which the main spec names as an anti-goal.
- A sound first step: brightness from what the data already has (main mover brighter than helper), and a real gradient only where a source gives numbers.
- See-through parts cost drawing time on a phone. Measure on the Galaxy A23 before deciding between see-through and hidden.
- Meaning must not rest on colour alone. The panel keeps saying it in words.

