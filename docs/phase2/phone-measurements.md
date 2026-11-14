# Phone measurements, Phase 2 (Samsung Galaxy A23)

Fill this in yourself. Follow step 5 of `docs/deploy-homelab.md` for the exact steps. Do everything on home Wi-Fi with Tailscale switched on. Use the review build, so the movement rows that are still waiting for a check show up too. The Phase 1 sheet is `docs/phase1/phone-measurements.md`. This one repeats its speed and rotating checks and adds the Movements and Area tabs.

Pass mark for Phase 2: the model is interactive within 5000 ms (median of 3 runs), it does not stutter when you rotate it or move the slider, and every check below works.

## Test setup

| Item | Value |
| --- | --- |
| Date | |
| Phone | Samsung Galaxy A23 |
| Chrome version (Chrome menu, Settings, About Chrome) | |
| Firefox version, if you also test it (Firefox menu, Settings, About Firefox) | |
| Wi-Fi band (2.4 or 5 GHz, if you know) | |
| Git commit that was deployed (run `git rev-parse --short HEAD` before building) | |

## 1. Time to interactive

Before each run, clear the site data for this address (step 5.2 of the guide). Open the address ending in `?perf=1` and write down the number from the box ("Interactive after ... ms").

| Run | Interactive (ms) | Under 5000 ms? (yes or no) |
| --- | --- | --- |
| 1 | | |
| 2 | | |
| 3 | | |

Median of the three numbers (the middle one): ____ ms

## 2. Rotating

Turn the model with one finger for 10 seconds.

| Check | Answer |
| --- | --- |
| Did it stutter or lag? (yes or no) | |

## 3. Movements tab

Tap "Movements" in the row of tabs under the search bar. Pick "Hip external rotation". Move the slider from 0 to 90 degrees.

| Check | Answer |
| --- | --- |
| Does piriformis change group as the slider moves (for example from Main movers to Helpers, with "Nothing recorded at this angle" in between)? (yes or no) | |
| Does the model stutter while the slider moves? (yes or no) | |
| Is any text cut off? (yes or no) | |
| Can it all be done with one thumb? (yes or no) | |

## 4. Exercises

Plan 2d added two exercises on 2026-11-14 (both drafts, so use the review build). Pick each one in the Movements tab, choose each phase and move the progress slider from 0 to 100.

| Exercise and phase | Does the list change in a sensible way as the slider moves? (yes or no) | Anything odd? |
| --- | --- | --- |
| Bodyweight squat, Lowering (the hip and knee extensors work, the hamstrings show as stretched once the hip bends) | | |
| Bodyweight squat, Rising | | |
| Side-lying hip abduction, Lifting the leg (the abductors work, adductor longus and the pubofemoral ligament show as stretched once the leg is up) | | |
| Side-lying hip abduction, Lowering the leg | | |

## 5. Hiding one side

Select the left piriformis and tap "Hide this". Look at the right side.

| Check | Answer |
| --- | --- |
| Is the right piriformis still there? (yes or no) | |

## 6. Area tab

Tap "Area" in the row of tabs. Tap the side of the hip, then the same spot again after peeling a layer. Use the review build.

| Check | Answer |
| --- | --- |
| Does a dot show where you tapped? (yes or no) | |
| Does the list start at the outermost structure and end at a bone? (yes or no) | |
| After peeling a layer, does a tap on the same spot give the same list? (yes or no) | |
| Does a drag to rotate the model leave the list alone? (yes or no) | |
| Does a tap on a list entry turn the camera to it? (yes or no) | |
| Is the fingertip size right, or do taps list too much or too little? (write which) | |

## 7. Questions for the physio

Between two measured angles the app says nothing about a muscle, for example obturator externus between 60 and 75 degrees of hip flexion. Is that the right thing to show, or should the app carry the nearest measured role across the gap?

Answer: (write here)

Does the order of structures under the front of the hip and under the buttock look right to you?

Answer: (write here)

## 8. Notes

Anything else you noticed, for example slow parts, things that looked odd, or a moment where the page froze.

(write here)
