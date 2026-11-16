# Three-column layout and stage controls: design

Date: 2026-11-16
Status: waiting for the owner's approval
Mockup: https://claude.ai/artifact/GYYGq9Ug1JwybUuRkVeaEe (private to the owner). The screens that count are "Desktop blend", "Phone: bottom tabs, structure selected" and "Phone: first open". The first desktop screen on the canvas was not chosen.

## 1. Intent

Today the app is one column at every width. On a desktop screen it is a phone layout stretched sideways: the model sits in a thin strip in the middle, the panel runs along the bottom, and the tabs, the layers button and the language switch are far apart. On the phone the tabs sit at the top, away from the thumb.

The owner sketched a desktop layout with navigation on the left, the model in the middle and the information on the right. A review of the current GUI added stage controls and a phone layout with the tabs at the bottom. The owner approved the blend of both. This document turns that mockup into something a builder can plan from.

## 2. Goals

- On a wide screen the app shows three columns: a navigation rail, the model, and an information column.
- On a phone the app shows the model on top, the information in a sheet below it, and the four tabs in a bar at the bottom.
- The same components serve both layouts. Only the arrangement changes with the width.
- The stage gains the controls from the mockup: a name chip for the selection, RIGHT and LEFT markers, a view badge, a reset button and, on the wide layout, zoom buttons.
- Layers no longer replaces the tab panel.
- A failed load can be tried again without reloading the page.
- Colours, borders, radii and the tap size come from a small set of CSS variables, so later restyling is a change of values.

## 3. Non-goals

- No change to the data, the meshes, the pipeline or the review gate.
- No rewrite of how `App.tsx` holds its state. Handlers change only where this layout needs it.
- No rework of search into a full combobox, no deep links, no light theme, no new languages. These came up in the review and stay for later.
- No new look. The dark palette stays. The layout changes.
- No new runtime dependency.

## 4. Anti-goals

- **Losing the phone.** The phone gate stays: interactive within 5000 ms, no stutter, one-handed use, no sideways scroll at 360 px.
- **A request to another host.** The mockup loads the Inter font from Google. The app must not. It keeps the system font stack it has.
- **Controls that hide what the user is looking at.** Stage controls sit at the edges and corners of the stage, never over its centre.
- **Hiding the educational line or the credits.** Both stay reachable on every layout and on the last-resort error page.
- **Text outside the language files.** Every new label goes into `en.json` and `de.json`.

## 5. Constraints

- Work happens on the branch `claude/nifty-sagan-c57kd7`, which now contains the tabbed GUI from `claude/install-superpowers-plugin-v0gy65`. Only the owner merges into `main`.
- The repo rules still hold: plain language in docs and comments, no em dashes, no semicolons in prose, tests first, no weakened checks.
- React 19, react-three-fiber, drei `CameraControls`, one global `index.css`, no CSS tooling. This stays.
- The existing tests select by role, label text and test id. They should keep passing with as few edits as the new structure allows.

## 6. Approaches

Three ways were considered.

1. **One screen, rearranged by CSS (chosen).** The same components everywhere. A CSS grid with named areas places them. One width breakpoint switches between the phone arrangement and the three columns. No new dependency. The markup order in `App.tsx` already suits it.
2. **Two shells, one per layout, chosen by screen width.** Each layout is freer. The markup and the tests double, and resizing a window across the boundary would remount the viewer and load the model again.
3. **A CSS framework or component library.** Quick to restyle. It adds a dependency and download weight to an app with a phone speed gate, and it would mean restyling every existing panel.

The owner talks about outcomes and left the how to the builder. Approach 1 is the builder's call, stated to the owner before this document was written.

## 7. The layout

### 7.1 Areas

The shell is a grid with six named areas: `top`, `nav`, `stage`, `layers`, `panel`, `foot`.

Wide layout (viewport at least 900 px wide):

```
+--------------------------------------------------------------+
| top:  anatoMe      [ search ................. ]   [Region v] |
+-----------+--------------------------------+-----------------+
| nav       | stage                          | layers          |
| Structures| [chip: Piriformis, left  x]    |  Peel  Restore  |
| Movements |                                |  [x]Muscles ... |
| Under ... |            model               +-----------------+
| Notebook  |                                | panel           |
|           | RIGHT                    LEFT  |  the tab's      |
| (edu line)| [Front view] hint       [+]    |  content        |
| Credits   |                         [-]    +-----------------+
|           |                         [reset]| foot: Language  |
+-----------+--------------------------------+-----------------+
```

- `nav` is about 208 px wide and the right column about 380 px. Between 900 px and 1100 px both narrow, to about 176 px and 320 px, and nothing else changes. There is no icon-only rail. An earlier draft had one and it was dropped, because it added a third arrangement for little gain.
- `panel` scrolls inside the right column. `layers` and `foot` do not scroll away.
- `stage` takes the rest.

Phone layout (narrower than 900 px):

```
+---------------------------+
| top: anatoMe [Region][set]|
|      [ search ........ ]  |
+---------------------------+
| stage                     |
| [chip]                    |
|          model            |
| RIGHT  [Front]      LEFT  |
|                  [layers] |
|                  [reset]  |
+---------------------------+
| panel (sheet, scrolls)    |
+---------------------------+
| nav: four tabs with icons |
+---------------------------+
```

- The sheet keeps today's rule: at most 45 percent of the height, the rest scrolls inside it.
- The bottom bar respects the safe area at the bottom of the screen.
- The stage is never shorter than 220 px. On a short phone, 360 x 640 for example, the top bar becomes one row to make room: the search field collapses to a search button, and pressing it opens the field across the bar. If the stage would still be shorter than 220 px, the sheet gives way and gets less than its 45 percent.
- On the phone the RIGHT and LEFT markers sit in the bottom corners beside the view badge, in one line, so the button stack on the right is only the layers and reset buttons.
- The breakpoint value of 900 px is the builder's call. A tablet in portrait gets the phone layout.

### 7.2 Top bar

- The app name "anatoMe" becomes a visible `h1`.
- Search keeps its current behaviour and moves here on both layouts. On the wide layout it is centred and at most about 620 px wide. Its result list drops down from the field as today.
- The region picker stays in the top bar, shown only when there is more than one region, as today.
- The old "Layers" toggle button leaves the top bar.
- Phone only: a settings button opens a small sheet with the language picker and the credits.

### 7.3 Navigation

- `ModeBar` stays one component and stays a real tab list. On the wide layout it is vertical: it sets `aria-orientation="vertical"` and the Up and Down arrows move between tabs. On the phone it is horizontal with Left and Right, as today. Home and End work in both.
- Each tab gets an icon next to its name. Icons are inline SVG, drawn with strokes, hidden from screen readers.
- The tab called "Area" is renamed "Under a spot" in English. This is the builder's call from the mockup. The German tab stays "Stelle". The owner should confirm both.
- The content area that the tabs control becomes a `tabpanel` tied to the selected tab.
- Wide layout: the educational line and a "Credits" button sit at the bottom of the rail.
- Phone: the educational line stays pinned at the top of the sheet, as today. The mockup shows it lower down and leaves it out when a structure is selected. The rule that it is always visible wins over the mockup. Credits move into the settings sheet.

### 7.4 Layers

Layers stops being a mode that overrides the tab panel.

- Wide layout: Layers is its own section, always visible at the top of the right column. It shows the peel and restore buttons, the peeled count and the three tissue toggles. The list of hidden structures appears below them only when something is hidden.
- Phone: a layers button on the stage opens the same content in the sheet. While it is open the sheet shows a clear title and a close button. Changing tab, choosing a search result or tapping a structure on the model closes it. This fixes the review finding that an open Layers panel made the tabs look broken.
- `PanelArea` no longer decides between Layers and the tab content.

### 7.5 Language, credits and the educational line

| Item | Wide layout | Phone |
|---|---|---|
| Language picker | `foot`, bottom of the right column, with a visible "Language" label | settings sheet |
| Credits | a "Credits" button at the bottom of the rail opens them | settings sheet |
| Educational line | bottom of the rail | top of the sheet, pinned |

The language picker is split out of `Credits` into its own small component.

The credits text is too long to unfold inside the rail. On both layouts it opens in one shared component built on the native `dialog` element, which brings focus handling and the Escape key with it. On the phone that dialog also holds the language picker and is opened by the settings button. On the wide layout it holds the credits only. The last-resort error page keeps showing the educational line and the credits.

## 8. Stage controls

All of these are ordinary HTML elements laid over the edges of the stage. They are not drawn in WebGL. They do not catch taps outside their own boxes, so dragging the model next to them still works.

| Control | Where | What it does |
|---|---|---|
| Name chip | top left | Shows the selected structure's name and side. Its close button clears the selection. Hidden when nothing is selected. It is the one always-mounted status region, so screen readers hear a new selection on every tab. |
| RIGHT and LEFT markers | bottom corners | Show which side of the body is on which side of the screen. They swap when the model is seen from behind and hide when the view is from the side, from above or from below. |
| View badge | bottom left | Says "Front view", "Back view", "Left side", "Right side", "From above" or "From below", whichever is nearest to the camera direction. |
| Hint | next to the badge, wide layout only | "Drag to turn, scroll to zoom, click a structure". The phone says the same in the empty sheet with "pinch" and "tap". |
| Zoom in, zoom out | bottom right, wide layout only | Step the camera distance. The phone uses pinch. |
| Reset view | bottom right | Fits the camera to the whole model again, the same framing as on first load. |
| Layers button | bottom right, phone only | See 7.4. |

How the viewer supports this:

- The viewer exposes a small handle with `resetView()`, `zoomBy(step)` and nothing else. The stage controls call it. This is the first imperative handle on the viewer and stays this small.
- The viewer reports the camera direction through one callback, called when the camera comes to rest and not on every frame. The view badge and the markers are worked out from that direction by a pure function with its own tests.
- The builder must confirm from the meshes which model axis is the body's left, using the `side` value the meshes already carry, and write a test that pins it. A wrong RIGHT or LEFT marker is worse than none.
- The render loop stays on demand. The controls ask for a frame only when they move the camera.

Spec amendment: the Phase 1 spec, section 5.1, says nothing covers the model. With this design that rule becomes: nothing covers the centre of the stage, and small controls may sit at its edges and corners. The amendment is written into the Phase 1 spec as part of this work.

## 9. Fixes that ride along

Two findings from the review are in scope because the new layout touches the same code.

1. **Layers hides the tabs.** Fixed by 7.4.
2. **A failed load is never tried again.**
   - A failed fetch of a region's data is not kept in the cache. Switching region away and back, or pressing "Try again" in the panel, fetches again.
   - A failed load of the notebook's storage code is not kept either. The next attempt tries again.
   - The model's load error gets a "Try again" button. Remounting the viewer is not enough on its own, because three things remember the failure: the manifest result held in `App`, the model loader's cache and the lazy import of the 3D code. "Try again" clears all three.
   - The single message "This browser does not let the app store notes" is split in three: storage is blocked, the note could not be saved, this part of the app could not be loaded. English and German texts for all three.
   - The log form closes only after the note is saved, so a failed save does not throw away what the user typed.

## 10. Styling

- `index.css` gets a token block on `:root`: surface, raised surface, border, divider, accent, accent surface, text, muted text, warning pair, radius, tap size and a short spacing scale. The values are today's colours. The repeated hex values in the file are replaced by the variables.
- The button style that is written five times becomes one `.btn` class, and the field style one `.field` class.
- The colours of the 3D model and of the movement highlights stay where they are, in TypeScript. Moving them is out of scope.
- The file stays one global stylesheet. Splitting it is out of scope.

## 11. Testing

- Unit tests, written first, for: the view name and marker function, the vertical tab keys, Layers closing on a tab change and on a model tap, the retry paths, the three notebook messages, and the name chip as a status region.
- Playwright gains three sizes: 360 x 640 with touch, 412 x 915 with touch, and 1280 x 800. Only the new layout spec and the new stage flow run at all three. The five existing specs keep running once at 412 x 915 and are edited only where a control moved, for example the credits now sitting behind the settings button. `perf-check.mjs` and `error-check.mjs` stay at their current size.
- The layout spec runs in English and in German and checks:
  - no sideways overflow of the page
  - no tab label is cut off
  - every button, tab and select is at least 44 px high
  - the stage keeps a useful minimum height with each panel open
  - at 1280 px the rail is left of the stage and the panel is right of it. At 360 px the tab bar is below the sheet.
- One e2e flow for the stage: select a structure by tapping the model, see the chip, clear it with the chip's button, press reset view.
- The existing checks keep passing, including `perf-check.mjs` and `error-check.mjs`. The owner measures the phone gate on the real phone at the end, as in earlier phases.

## 12. Left to the builder

- Exact widths, paddings and icon drawings, within the mockup's proportions.
- Whether the phone's settings sheet and layers view share one sheet component.
- The zoom step size and whether zoom glides or jumps.
- How the camera direction callback is throttled, as long as it does not keep the render loop awake.
- File placement for the new components.

## 13. Calls the builder made that the owner should check

- The breakpoint at 900 px.
- On a short phone the search field collapses to a button so the stage keeps at least 220 px.
- Credits open in a dialog on both layouts.
- "Area" renamed "Under a spot" in English, German left as "Stelle".
- Zoom buttons on the wide layout only.
- Language and credits behind a settings button on the phone.
- The amendment to the "nothing covers the model" rule.
- The review findings that stay out of scope (section 3).
