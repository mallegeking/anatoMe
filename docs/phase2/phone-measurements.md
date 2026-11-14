# Phone measurements, Phase 2 (Samsung Galaxy A23)

Fill this in yourself. Follow step 5 of `docs/deploy-homelab.md` for the exact steps. Do everything on home Wi-Fi with Tailscale switched on. Use the review build, so the movement rows that are still waiting for a check show up too. The Phase 1 sheet is `docs/phase1/phone-measurements.md`. This one repeats its speed and rotating checks and adds the Movements tab.

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

Left empty on purpose. Fill it in once plan 2d has added exercises.

| Exercise | Does the slider play through its phases? (yes or no) | Anything odd? |
| --- | --- | --- |
| | | |

## 5. Hiding one side

Select the left piriformis and tap "Hide this". Look at the right side.

| Check | Answer |
| --- | --- |
| Is the right piriformis still there? (yes or no) | |

## 6. Questions for the physio

Between two measured angles the app says nothing about a muscle, for example obturator externus between 60 and 75 degrees of hip flexion. Is that the right thing to show, or should the app carry the nearest measured role across the gap?

Answer: (write here)

## 7. Notes

Anything else you noticed, for example slow parts, things that looked odd, or a moment where the page froze.

(write here)
