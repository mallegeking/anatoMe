# Phone measurements, the five new regions (Samsung Galaxy A23)

Fill this in yourself. Follow step 5 of `docs/deploy-homelab.md` for the exact steps. Do everything on home Wi-Fi with Tailscale switched on. Use the review build. The Phase 2 sheet is `docs/phase2/phone-measurements.md`. This one measures only what the new regions add.

Pass mark: after you choose a region, the model can be turned within 5000 ms, turning does not stutter, and peeling a layer reads as sensible. The trunk is the heaviest region at 140,296 triangles, so look at it closely.

## Test setup

| Item | Value |
| --- | --- |
| Date | |
| Phone | Samsung Galaxy A23 |
| Chrome version (Chrome menu, Settings, About Chrome) | |
| Wi-Fi band (2.4 or 5 GHz, if you know) | |
| Git commit that was deployed (run `git rev-parse --short HEAD` before building) | |

## How to measure

Open the site and choose the region in the "Body region" list. Start a timer when you tap the region. Stop it when you can first turn the model with one finger and it follows. Then turn the model with one finger for 10 seconds. Then open "Layers", tap "Peel a layer" one time after another until only bones are left.

The app now opens with the whole body. For the whole body, note the time from opening the page, not from picking it in the list. It is the heaviest thing the app draws, about 239,000 triangles in 577 meshes. On the computer's speed check (perf-check, 4 times slower CPU) it took about 1.5 times as long as the hip in the same round.

### Pairs to look at when peeling

These layers were measured from the model, and a few pairs may look wrong on the phone. Please say in the peeling column if one of them does.

- Lower leg: flexor digitorum longus is layer 1 (21 percent of rays free), while soleus, which covers it, is layer 2 (17 percent).
- Arm: flexor digitorum profundus is layer 1 (21 percent), while flexor digitorum superficialis is layer 2 (19 percent).
- Arm: opponens pollicis is layer 1 (70 percent).
- Arm: brachialis sits exactly on the 0.20 line (20 percent), so it is layer 1.

## Results

| Region | Time until the model can be turned (ms) | Does turning stutter? (yes or no) | Does peeling a layer read as sensible? (yes or no, and which muscle looks wrong) | One free line |
| --- | --- | --- | --- | --- |
| Whole body | | | | |
| Lower leg and foot | | | | |
| Shoulder | | | | |
| Arm and hand | | | | |
| Head and neck | | | | |
| Trunk | | | | |

## Other checks

| Check | Answer |
| --- | --- |
| Does the gap line show under the tap hint in each region? (yes or no) | |
| Does choosing a region empty the search field and close the panel? (yes or no) | |
| Does opening the site with `?region=trunk` at the end of the address open the trunk? (yes or no) | |
| Do only the Structures and Area tabs show in the new regions? (yes or no) | |
| Does tapping an intercostal muscle select both sides at once? (yes or no, this is expected) | |
