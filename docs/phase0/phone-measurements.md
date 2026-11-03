# Phone measurements (Samsung Galaxy A23, Firefox)

Fill this in yourself. Follow step 5 of `docs/deploy-homelab.md` for the exact steps. Do everything on home Wi-Fi with Tailscale switched on.

Pass mark for Phase 0: the model is interactive within 5000 ms, and it does not stutter when you rotate it.

## Test setup

| Item | Value |
| --- | --- |
| Date | |
| Phone | Samsung Galaxy A23 |
| Firefox version (Firefox menu, Settings, About Firefox) | 159.0 (Build #2016191887),GV: 159.0-20261022150525, AS: 159.0.1, OS: Android 14 |
| Wi-Fi band (2.4 or 5 GHz, if you know) | |
| Git commit that was deployed (run `git rev-parse --short HEAD` before building) | |

## 1. Time to interactive

Before each run, clear Chrome's site data and cached files. Open the address ending in `?perf=1` and write down the number from the box ("Interactive after ... ms").

| Run | Interactive (ms) | Under 5000 ms? (yes or no) |
| --- | --- | --- |
| 1 |1489 |yes |
| 2 |727 |yes |
| 3 |783 |yes |

Median of the three numbers (the middle one): _727_ ms

## 2. Rotating

Turn the model with one finger for 10 seconds.

| Check | Answer |
| --- | --- |
| Did it stutter or lag? (yes or no) |No |

## 3. Tapping structures

Tap 5 different structures. Write the structure you aimed at, the name that appeared, and whether they match.

| Tap | Structure you aimed at | Name that appeared | Right name? (yes or no) |
| --- | --- | --- | --- |
| 1 |rectus femoris (right)  | Rectus femoris (right) | yes |
| 2 |Vastus medialis (right) | Vastus medialis (right) | yes |
| 3 |Semitendinosus (left) |Semitendinosus (left) | yes |
| 4 |Semimembranosus (left) | Semimembranosus (left) | yes |
| 5 | Beceps femoris (right) | Beceps femoris (right) | yes |

## 4. Tapping empty space

Tap a structure so its name shows. Then tap on empty space, away from the model. Does the name go away? Try this 5 times.

| Try | Did the name clear? (yes or no) |
| --- | --- |
| 1 | | yes
| 2 | | yes
| 3 | | yes
| 4 | | yes
| 5 | | yes

## 5. Quick taps on a muscle

Pick one muscle. Give it a quick tap (a short touch, no dragging), 5 times. Count how many times it was selected.

Selected: __1__ out of 5 # It remained selected the entire time

Muscle you used: ____Gluteus maximus (left)__________________

## 6. Notes

Anything else you noticed, for example slow parts, things that looked odd, or a moment where the page froze.

(write here)
The app performed well for a first version. I used firefox instead of chrome. I'm not a big fan of chrome, hope that's okay