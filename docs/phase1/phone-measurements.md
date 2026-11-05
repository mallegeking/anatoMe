# Phone measurements, Phase 1 (Samsung Galaxy A23)

Fill this in yourself. Follow step 5 of `docs/deploy-homelab.md` for the exact steps. Do everything on home Wi-Fi with Tailscale switched on. The Phase 0 sheet is `docs/phase0/phone-measurements.md`. This one repeats its checks and adds the Phase 1 features: search, layers, the info panel and the side switch.

Pass mark for Phase 1: the model is interactive within 5000 ms (median of 3 runs), it does not stutter when you rotate it, and every check below works.

Use Chrome for the whole sheet if you can, because section 6 has a check that only Chrome can answer. If you also use Firefox, fill in the Firefox column where there is one.

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

## 3. Tapping structures

Tap 5 different structures. Write the structure you aimed at, the name that appeared, and whether they match.

| Tap | Structure you aimed at | Name that appeared | Right name? (yes or no) |
| --- | --- | --- | --- |
| 1 | | | |
| 2 | | | |
| 3 | | | |
| 4 | | | |
| 5 | | | |

## 4. Tapping empty space

Tap a structure so its name shows. Then tap on empty space, away from the model. Does the name go away? Try this 5 times.

| Try | Did the name clear? (yes or no) |
| --- | --- |
| 1 | |
| 2 | |
| 3 | |
| 4 | |
| 5 | |

## 5. Quick taps on a muscle

Tap empty space first, so nothing is selected. Then give one muscle a quick tap (a short touch, no dragging). Repeat this 5 times, clearing in between. Count how many times the muscle was selected.

Selected: ____ out of 5

Muscle you used: ____________________

## 6. Search

Type `piriformis` in the search field at the top.

| Check | Chrome | Firefox |
| --- | --- | --- |
| Does the list show "Piriformis" with "Muscle" next to it and the Latin name below? (yes or no) | | |
| Give the result a quick tap (a short touch). Is piriformis selected, with its name in the panel? (yes or no) | | |
| Did the camera turn to it, and does a line say "1 layer peeled to show Piriformis"? (yes or no) | | |

Quick taps on a search result, Chrome only: repeat the quick tap 5 times. Each time, clear the field, type `piriformis` again and give the result a short touch. Count how many times it was selected.

Selected: ____ out of 5

Closing the list with a drag: type `pirif` so the list opens with one result. Then put your finger on the model below the list and drag to turn it.

| Check | Chrome | Firefox |
| --- | --- | --- |
| Did the list close as soon as you started the drag? (yes or no) | | |
| If not, did it close when you lifted your finger? (yes or no) | | |

## 7. Layers

Tap "Layers" in the top bar.

| Check | Answer (yes or no) |
| --- | --- |
| "Peel a layer" hides the outer muscles, and the label counts the peeled layers | |
| "Restore" brings the last peeled layer back | |
| Switching off "Bones" hides the bones, switching it on shows them again | |
| Select a muscle, tap "Hide this" in the panel. It disappears and shows up under "Hidden" in the layers panel | |
| "Show" next to it brings it back | |
| A tap on the spot where a hidden muscle was selects whatever lies behind it | |

## 8. Info panel

Search for `gluteus maximus` and choose it.

| Check | Answer (yes or no) |
| --- | --- |
| The panel shows the name, the Latin name and "Type: Muscle" | |
| "Where it attaches" lists where it starts and ends | |
| Rows are grouped under "What it does at the hip" (and "What it does at the knee" for a muscle like rectus femoris), or the panel says the information is waiting for a physiotherapist's review | |
| "Sources" opens the list of sources, with a link that opens the source in a new tab | |
| Scroll the panel to the bottom. The line "anatoMe is for learning how the body moves ..." stays visible at the top of the panel | |
| Nothing covers the model, and the page never scrolls sideways | |

## 9. Side switch

Tap a muscle on the left side, then tap "Show the other side" in the panel.

| Check | Answer (yes or no) |
| --- | --- |
| The name in the panel changes from "(left)" to "(right)" | |
| The same muscle on the right side lights up | |
| The camera turns to the right side | |

## 10. Notes

Anything else you noticed, for example slow parts, things that looked odd, or a moment where the page froze.

(write here)
