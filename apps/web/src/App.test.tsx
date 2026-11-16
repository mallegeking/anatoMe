import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { IDBFactory } from "fake-indexeddb";
import { afterEach, beforeEach, expect, test, vi } from "vitest";
import type { RegionBundle } from "./data/bundle";
import { App } from "./App";
import { clearRegionDataCache } from "./data/useRegionData";
import de from "./i18n/de.json";
import en from "./i18n/en.json";
import { createT } from "./i18n/t";
import { makeBundle } from "./ui/fixture";
import type { Selection } from "./viewer/pick";

// What the app last handed the viewer, so a test can see the selection and where the camera should go.
// It also keeps what the viewer was told to colour and show.
const viewer = vi.hoisted(() => ({
  selection: null as unknown,
  focus: null as unknown,
  areaProbe: null as unknown,
  highlights: null as unknown,
  isShown: (() => true) as (sid: string, side: "l" | "r" | "") => boolean,
}));

// Lets one test make the lazy print summary fail. Otherwise it is the real one.
const printSummary = vi.hoisted(() => ({ fails: false }));
vi.mock("./notebook/PrintSummary", async (original) => {
  const real = await original<typeof import("./notebook/PrintSummary")>();
  return {
    default: (props: Parameters<typeof real.default>[0]) => {
      if (printSummary.fails) throw new Error("chunk failed");
      return real.default(props);
    },
  };
});

// Lets one test make the lazy notebook pieces fail. Otherwise they are the real ones.
const lazyParts = vi.hoisted(() => ({ panelFails: false, formFails: false }));
vi.mock("./notebook/NotebookPanel", async (original) => {
  const real = await original<typeof import("./notebook/NotebookPanel")>();
  return {
    ...real,
    default: (props: Parameters<typeof real.default>[0]) => {
      if (lazyParts.panelFails) throw new Error("chunk failed");
      return real.default(props);
    },
  };
});
vi.mock("./notebook/LogForm", async (original) => {
  const real = await original<typeof import("./notebook/LogForm")>();
  return {
    ...real,
    default: (props: Parameters<typeof real.default>[0]) => {
      if (lazyParts.formFails) throw new Error("chunk failed");
      return real.default(props);
    },
  };
});

// jsdom cannot draw 3D, so the model is plain buttons here. "model" is a tap on empty space,
// "tap piriformis" a tap on the left piriformis.
vi.mock("./viewer/Viewer", () => ({
  Viewer: ({
    onSelect,
    selection,
    focus,
    highlights,
    isShown,
    onAreaTap,
    areaProbe,
  }: {
    onAreaTap: (tap: unknown) => void;
    areaProbe: unknown;
    onSelect: (sel: Selection | null) => void;
    selection: Selection | null;
    focus: Selection | null;
    highlights: unknown;
    isShown: typeof viewer.isShown;
  }) => {
    viewer.selection = selection;
    viewer.focus = focus;
    viewer.areaProbe = areaProbe;
    viewer.highlights = highlights;
    viewer.isShown = isShown;
    return (
      <>
        <button type="button" onClick={() => onSelect(null)}>
          model
        </button>
        <button type="button" onClick={() => onSelect({ sid: "piriformis", side: "l" })}>
          tap piriformis
        </button>
        <button type="button" onClick={() => onAreaTap({ point: [0, 0, 0], through: null, entries: [{ sid: "piriformis", side: "l", distance: 1, depth: 0 }, { sid: "femur", side: "l", distance: 1.05, depth: 0.05 }] })}>
          area tap
        </button>
        <button type="button" onClick={() => onAreaTap(null)}>
          area miss
        </button>
      </>
    );
  },
}));

// The model manifest the app reads first. One region, like the real one today.
const oneRegion = { regions: { hip: { files: [{ path: "hip.glb", source: "bp3d", license: "CC-BY-4.0" }] } } };

// Answers the manifest with the given manifest and every other request with the data, or with a 404 when there is none.
function serveFiles(bundle: RegionBundle | null, manifest: unknown = oneRegion) {
  const fetch = vi.fn(async (url: string) => {
    if (url.endsWith("models/manifest.json")) return new Response(JSON.stringify(manifest));
    return bundle ? new Response(JSON.stringify(bundle)) : new Response("", { status: 404 });
  });
  vi.stubGlobal("fetch", fetch);
  return fetch;
}

beforeEach(clearRegionDataCache);
afterEach(() => {
  cleanup();
  // A test that switches the language must not leave the next one in German.
  localStorage.clear();
  // A test that switches region leaves ?region=... in the address.
  history.replaceState(null, "", "/");
  vi.unstubAllGlobals();
  vi.restoreAllMocks();
});

test("tapping the model closes the search list", async () => {
  serveFiles(makeBundle());
  render(<App />);
  // The panel hint shows once the data is in, so search knows the structures by then.
  await screen.findByText(en["info.tapHint"]);
  fireEvent.change(screen.getByPlaceholderText(en["search.placeholder"]), { target: { value: "pirif" } });
  expect(screen.getByTestId("search-results")).toBeTruthy();
  fireEvent.click(screen.getByText("model"));
  expect(screen.queryByTestId("search-results")).toBeNull();
});

test("show the other side selects that side and turns the camera to it", async () => {
  serveFiles(makeBundle());
  render(<App />);
  await screen.findByText(en["info.tapHint"]);
  fireEvent.click(screen.getByText("tap piriformis"));
  fireEvent.click(screen.getByText(en["info.switchSide"]));
  expect(viewer.selection).toEqual({ sid: "piriformis", side: "r" });
  expect(viewer.focus).toEqual({ sid: "piriformis", side: "r" });
  expect(screen.getByRole("heading", { name: "Piriformis (right)" })).toBeTruthy();
});

test("the educational line stays outside the part of the panel that scrolls", async () => {
  serveFiles(makeBundle());
  render(<App />);
  await screen.findByText(en["info.tapHint"]);
  const line = screen.getByText(en["about.educational"]);
  expect(screen.getByTestId("panel-scroll").contains(line)).toBe(false);
  expect(line.closest("details")).toBeNull();
});

test("a data failure shows the data message and keeps the credits and the educational line", async () => {
  vi.spyOn(console, "error").mockImplementation(() => {});
  serveFiles(null);
  render(<App />);
  // The model is fine here, so the message must not blame it.
  expect((await screen.findByRole("alert")).textContent).toBe(en["error.dataLoad"]);
  expect(screen.queryByText(en["error.modelLoad"])).toBeNull();
  expect(screen.getByText(en["credits.title"])).toBeTruthy();
  expect(screen.getByText(en["about.educational"])).toBeTruthy();
});

function serve(bundle: RegionBundle) {
  serveFiles(bundle);
}

const tab = (name: string) => screen.getByRole("tab", { name });

test("the Movements tab shows the picker and the Structures tab brings the hint back", async () => {
  serve(makeBundle());
  render(<App />);
  await screen.findByText(en["info.tapHint"]);
  expect(tab(en["mode.atlas"]).getAttribute("aria-selected")).toBe("true");
  fireEvent.click(tab(en["mode.movement"]));
  expect(screen.getByRole("heading", { name: en["movement.pick"] })).toBeTruthy();
  expect(screen.queryByText(en["info.tapHint"])).toBeNull();
  fireEvent.click(tab(en["mode.atlas"]));
  expect(screen.getByText(en["info.tapHint"])).toBeTruthy();
});

test("with no checked rows a movement says so, shows the waiting line and keeps the model whole", async () => {
  // Like the real data today: every row for the movement is still waiting for review.
  serve({ ...makeBundle(), actions: [], pendingByMovement: { "hip-ext-rot": 1 } });
  render(<App />);
  await screen.findByText(en["info.tapHint"]);
  fireEvent.click(tab(en["mode.movement"]));
  fireEvent.click(screen.getByRole("button", { name: "Hip external rotation" }));
  expect(screen.getByText(en["movement.none"])).toBeTruthy();
  expect(screen.getByText(en["movement.pending"])).toBeTruthy();
  expect(viewer.highlights).toBeNull();
  expect(viewer.isShown("rectus-femoris", "l")).toBe(true);
  expect(viewer.isShown("piriformis", "r")).toBe(true);
});

test("a movement with a row that applies colours it and hides the muscles that are not involved", async () => {
  serve(makeBundle());
  render(<App />);
  await screen.findByText(en["info.tapHint"]);
  fireEvent.click(tab(en["mode.movement"]));
  fireEvent.click(screen.getByRole("button", { name: "Hip external rotation" }));
  expect(viewer.highlights).toEqual(new Map([["piriformis", "primary"]]));
  expect(viewer.isShown("rectus-femoris", "l")).toBe(false);
  expect(viewer.isShown("femur", "l")).toBe(true);
  // Back on the Structures tab the model is whole again.
  fireEvent.click(tab(en["mode.atlas"]));
  expect(viewer.highlights).toBeNull();
  expect(viewer.isShown("rectus-femoris", "l")).toBe(true);
});

test("a movement whose rows do not apply at the current angle leaves the model whole", async () => {
  // The only row starts at 20 degrees, so at the neutral angle 0 nothing applies.
  const bundle = makeBundle();
  serve({ ...bundle, actions: bundle.actions.map((a) => ({ ...a, when: [{ angle: "hip.flexion", min: 20, max: 60 }] })) });
  render(<App />);
  await screen.findByText(en["info.tapHint"]);
  fireEvent.click(tab(en["mode.movement"]));
  fireEvent.click(screen.getByRole("button", { name: "Hip external rotation" }));
  expect(viewer.highlights).toBeNull();
  expect(viewer.isShown("rectus-femoris", "l")).toBe(true);
  expect(viewer.isShown("piriformis", "r")).toBe(true);
});

test("an old cached bundle without the new fields still opens the Movements tab", async () => {
  // A bundle as it was compiled before plan 2a: no exercises, no waiting counts, no paired flag.
  const old: Partial<RegionBundle> = makeBundle();
  delete old.exercises;
  delete old.pendingByMovement;
  delete old.pendingExercises;
  for (const s of old.structures!) delete (s as { paired?: boolean }).paired;
  serve(old as RegionBundle);
  render(<App />);
  await screen.findByText(en["info.tapHint"]);
  fireEvent.click(tab(en["mode.movement"]));
  fireEvent.click(screen.getByRole("button", { name: "Hip external rotation" }));
  expect(screen.getByRole("heading", { name: "Hip external rotation", level: 2 })).toBeTruthy();
});

test("a movement that hides the selected structure keeps the selection for the way back", async () => {
  serve(makeBundle());
  render(<App />);
  await screen.findByText(en["info.tapHint"]);
  fireEvent.change(screen.getByPlaceholderText(en["search.placeholder"]), { target: { value: "rectus" } });
  fireEvent.click(screen.getByTestId("search-results").querySelector("button")!);
  expect(screen.getByRole("heading", { name: "Rectus femoris (left)" })).toBeTruthy();
  fireEvent.click(tab(en["mode.movement"]));
  fireEvent.click(screen.getByRole("button", { name: "Hip external rotation" }));
  // Rectus femoris is not involved, so the movement hides it.
  expect(viewer.isShown("rectus-femoris", "l")).toBe(false);
  fireEvent.click(tab(en["mode.atlas"]));
  expect(screen.getByRole("heading", { name: "Rectus femoris (left)" })).toBeTruthy();
});

test("a movement heading in the info panel opens that movement", async () => {
  serve(makeBundle());
  render(<App />);
  await screen.findByText(en["info.tapHint"]);
  fireEvent.click(screen.getByText("tap piriformis"));
  fireEvent.click(screen.getByRole("button", { name: "Hip external rotation" }));
  expect(tab(en["mode.movement"]).getAttribute("aria-selected")).toBe("true");
  expect(screen.getByRole("heading", { name: "Hip external rotation", level: 2 })).toBeTruthy();
});

test("a structure in the movement panel can be focused or read about", async () => {
  serve(makeBundle());
  render(<App />);
  await screen.findByText(en["info.tapHint"]);
  fireEvent.click(tab(en["mode.movement"]));
  fireEvent.click(screen.getByRole("button", { name: "Hip external rotation" }));
  fireEvent.click(screen.getByRole("button", { name: "Piriformis" }));
  expect(viewer.selection).toEqual({ sid: "piriformis", side: "l" });
  expect(viewer.focus).toEqual({ sid: "piriformis", side: "l" });
  expect(tab(en["mode.movement"]).getAttribute("aria-selected")).toBe("true");
  fireEvent.click(screen.getByRole("button", { name: en["movement.openStructure"] }));
  expect(tab(en["mode.atlas"]).getAttribute("aria-selected")).toBe("true");
  expect(screen.getByRole("heading", { name: "Piriformis (left)" })).toBeTruthy();
});

test("choosing a search result switches to the Structures tab", async () => {
  serve(makeBundle());
  render(<App />);
  await screen.findByText(en["info.tapHint"]);
  fireEvent.click(tab(en["mode.movement"]));
  fireEvent.change(screen.getByPlaceholderText(en["search.placeholder"]), { target: { value: "pirif" } });
  fireEvent.click(screen.getByTestId("search-results").querySelector("button")!);
  expect(tab(en["mode.atlas"]).getAttribute("aria-selected")).toBe("true");
  expect(screen.getByRole("heading", { name: "Piriformis (left)" })).toBeTruthy();
});

// Picks a language in the switch below the credits.
const pickLanguage = (lang: "en" | "de") => fireEvent.change(screen.getByRole("combobox", { name: en["lang.label"] }), { target: { value: lang } });

test("the search notice shown in English reads in German after the language changes", async () => {
  const bundle = makeBundle();
  bundle.structures = bundle.structures.map((s) => (s.id === "piriformis" ? { ...s, german: "Birnenförmiger Muskel" } : s));
  serve(bundle);
  render(<App />);
  await screen.findByText(en["info.tapHint"]);
  fireEvent.change(screen.getByPlaceholderText(en["search.placeholder"]), { target: { value: "pirif" } });
  fireEvent.click(screen.getByTestId("search-results").querySelector("button")!);
  expect(screen.getByRole("status").textContent).toBe(createT(en)("search.peeledOne", { name: "Piriformis" }));
  pickLanguage("de");
  expect(screen.getByRole("status").textContent).toBe(createT(de)("search.peeledOne", { name: "Birnenförmiger Muskel" }));
});

test("the Area tab shows the hint", async () => {
  serve(makeBundle());
  render(<App />);
  await screen.findByText(en["info.tapHint"]);
  fireEvent.click(tab(en["mode.area"]));
  expect(screen.getByText(en["area.hint"])).toBeTruthy();
  expect(screen.queryByText(en["info.tapHint"])).toBeNull();
});

test("a tap in the Area tab shows the list and a missed tap brings the hint back", async () => {
  serve(makeBundle());
  render(<App />);
  await screen.findByText(en["info.tapHint"]);
  fireEvent.click(tab(en["mode.area"]));
  fireEvent.click(screen.getByText("area tap"));
  expect(screen.getByRole("heading", { name: en["area.title"] })).toBeTruthy();
  expect(screen.getByRole("button", { name: "Femur (left)" })).toBeTruthy();
  fireEvent.click(screen.getByText("area miss"));
  expect(screen.getByText(en["area.hint"])).toBeTruthy();
});

test("choosing a list entry for a hidden structure makes it visible and selects it", async () => {
  serve(makeBundle());
  render(<App />);
  await screen.findByText(en["info.tapHint"]);
  fireEvent.click(screen.getByText("tap piriformis"));
  fireEvent.click(screen.getByRole("button", { name: en["info.hide"] }));
  expect(viewer.isShown("piriformis", "l")).toBe(false);
  expect(viewer.isShown("piriformis", "r")).toBe(true);
  fireEvent.click(tab(en["mode.area"]));
  fireEvent.click(screen.getByText("area tap"));
  fireEvent.click(screen.getByRole("button", { name: "Piriformis (left)" }));
  expect(viewer.isShown("piriformis", "l")).toBe(true);
  expect(viewer.selection).toEqual({ sid: "piriformis", side: "l" });
  expect(viewer.focus).toEqual({ sid: "piriformis", side: "l" });
});

test("over and under in the info panel switches to the Area tab and probes that structure", async () => {
  serve(makeBundle());
  render(<App />);
  await screen.findByText(en["info.tapHint"]);
  fireEvent.click(screen.getByText("tap piriformis"));
  fireEvent.click(screen.getByRole("button", { name: en["info.overUnder"] }));
  expect(tab(en["mode.area"]).getAttribute("aria-selected")).toBe("true");
  expect(viewer.areaProbe).toEqual({ sid: "piriformis", side: "l" });
});

test("one region shows no region picker", async () => {
  serve(makeBundle());
  render(<App />);
  await screen.findByText(en["info.tapHint"]);
  expect(screen.queryByLabelText(en["region.label"])).toBeNull();
});

test("picking another region loads its data and clears the selection, the layers, the movement and the area", async () => {
  const file = { path: "x.glb", source: "bp3d", license: "CC-BY-4.0" };
  const fetch = serveFiles(makeBundle(), { regions: { hip: { files: [file] }, shoulder: { files: [file] } } });
  render(<App />);
  await screen.findByText(en["info.tapHint"]);
  expect(fetch.mock.calls.some(([url]) => url.endsWith("data/hip.json"))).toBe(true);
  // A selection, a look through it, an area list, a movement pick and a peeled layer.
  fireEvent.click(screen.getByText("tap piriformis"));
  fireEvent.click(screen.getByRole("button", { name: en["info.overUnder"] }));
  fireEvent.click(screen.getByText("area tap"));
  fireEvent.click(tab(en["mode.movement"]));
  fireEvent.click(screen.getByRole("button", { name: "Hip external rotation" }));
  fireEvent.click(tab(en["mode.atlas"]));
  fireEvent.click(screen.getByRole("button", { name: en["layers.open"] }));
  fireEvent.click(screen.getByRole("button", { name: en["layers.peel"] }));
  fireEvent.click(screen.getByRole("button", { name: en["layers.close"] }));
  expect(viewer.isShown("rectus-femoris", "l")).toBe(false);
  expect(viewer.selection).toEqual({ sid: "piriformis", side: "l" });

  fireEvent.change(screen.getByLabelText(en["region.label"]), { target: { value: "shoulder" } });

  await screen.findByText(en["info.tapHint"]);
  expect(fetch.mock.calls.some(([url]) => url.endsWith("data/shoulder.json"))).toBe(true);
  expect(viewer.selection).toBeNull();
  expect(viewer.areaProbe).toBeNull();
  expect(viewer.isShown("rectus-femoris", "l")).toBe(true);
  fireEvent.click(tab(en["mode.movement"]));
  expect(screen.getByRole("heading", { name: en["movement.pick"] })).toBeTruthy();
  fireEvent.click(tab(en["mode.area"]));
  expect(screen.getByText(en["area.hint"])).toBeTruthy();
});

// The notebook tests give the app its own empty in-memory IndexedDB.
function freshNotebook() {
  const factory = new IDBFactory();
  const open = vi.spyOn(factory, "open");
  vi.stubGlobal("indexedDB", factory);
  return { open };
}

test("the notebook is not opened at start, only when its tab opens", async () => {
  const { open } = freshNotebook();
  serve(makeBundle());
  render(<App />);
  await screen.findByText(en["info.tapHint"]);
  expect(open).not.toHaveBeenCalled();
  fireEvent.click(tab(en["mode.notebook"]));
  expect(await screen.findByText(en["notebook.empty"])).toBeTruthy();
  expect(open).toHaveBeenCalledTimes(1);
  expect(screen.queryByText(en["info.tapHint"])).toBeNull();
});

test("a logged movement is saved, says so and shows in the Notebook tab", async () => {
  freshNotebook();
  serve(makeBundle());
  render(<App />);
  await screen.findByText(en["info.tapHint"]);
  fireEvent.click(tab(en["mode.movement"]));
  fireEvent.click(screen.getByRole("button", { name: "Hip external rotation" }));
  fireEvent.click(screen.getByRole("button", { name: en["notebook.log"] }));
  fireEvent.click(await screen.findByRole("button", { name: en["notebook.painful"] }));
  fireEvent.click(screen.getByRole("button", { name: en["notebook.side.l"] }));
  fireEvent.change(screen.getByLabelText(en["notebook.note"]), { target: { value: "  on the stairs  " } });
  fireEvent.click(screen.getByRole("button", { name: en["notebook.save"] }));
  expect(await screen.findByText(en["notebook.saved"])).toBeTruthy();
  fireEvent.click(tab(en["mode.notebook"]));
  expect(await screen.findByText(/^\d{4}-\d{2}-\d{2}: Hip external rotation, It hurts, Left$/)).toBeTruthy();
  expect(screen.getByText("on the stairs")).toBeTruthy();
});

test("the saved notice shown in English reads in German after the language changes", async () => {
  freshNotebook();
  serve(makeBundle());
  render(<App />);
  await screen.findByText(en["info.tapHint"]);
  fireEvent.click(tab(en["mode.movement"]));
  fireEvent.click(screen.getByRole("button", { name: "Hip external rotation" }));
  fireEvent.click(screen.getByRole("button", { name: en["notebook.log"] }));
  fireEvent.click(await screen.findByRole("button", { name: en["notebook.painful"] }));
  fireEvent.click(screen.getByRole("button", { name: en["notebook.side.l"] }));
  fireEvent.click(screen.getByRole("button", { name: en["notebook.save"] }));
  expect(await screen.findByText(en["notebook.saved"])).toBeTruthy();
  pickLanguage("de");
  expect(screen.getByText(de["notebook.saved"])).toBeTruthy();
  expect(screen.queryByText(en["notebook.saved"])).toBeNull();
});

test("a structure to look into is made visible, selected and turned to", async () => {
  freshNotebook();
  serve(makeBundle());
  render(<App />);
  await screen.findByText(en["info.tapHint"]);
  fireEvent.click(tab(en["mode.movement"]));
  fireEvent.click(screen.getByRole("button", { name: "Hip external rotation" }));
  fireEvent.click(screen.getByRole("button", { name: en["notebook.log"] }));
  fireEvent.click(await screen.findByRole("button", { name: en["notebook.painful"] }));
  fireEvent.click(screen.getByRole("button", { name: en["notebook.side.r"] }));
  fireEvent.click(screen.getByRole("button", { name: en["notebook.save"] }));
  await screen.findByText(en["notebook.saved"]);
  fireEvent.click(tab(en["mode.notebook"]));
  fireEvent.click(await screen.findByRole("button", { name: /^Piriformis: loaded in 1 of 1/ }));
  expect(viewer.selection).toEqual({ sid: "piriformis", side: "r" });
  expect(viewer.focus).toEqual({ sid: "piriformis", side: "r" });
  expect(viewer.isShown("piriformis", "r")).toBe(true);
});

test("without storage a log says the notebook is unavailable and the tab says so too", async () => {
  vi.stubGlobal("indexedDB", undefined);
  serve(makeBundle());
  render(<App />);
  await screen.findByText(en["info.tapHint"]);
  fireEvent.click(tab(en["mode.movement"]));
  fireEvent.click(screen.getByRole("button", { name: "Hip external rotation" }));
  fireEvent.click(screen.getByRole("button", { name: en["notebook.log"] }));
  fireEvent.click(await screen.findByRole("button", { name: en["notebook.fine"] }));
  fireEvent.click(screen.getByRole("button", { name: en["notebook.side.both"] }));
  fireEvent.click(screen.getByRole("button", { name: en["notebook.save"] }));
  expect(await screen.findByText(en["notebook.unavailable"])).toBeTruthy();
  fireEvent.click(tab(en["mode.notebook"]));
  await waitFor(() => expect(screen.getAllByText(en["notebook.unavailable"]).length).toBeGreaterThan(0));
  expect(await screen.findByRole("heading", { name: en["notebook.title"] })).toBeTruthy();
  // The rest of the app still works.
  fireEvent.click(tab(en["mode.atlas"]));
  expect(screen.getByText(en["info.tapHint"])).toBeTruthy();
});

test("the print button prints once per press, after the summary is on the page", async () => {
  freshNotebook();
  serve(makeBundle());
  const seen: boolean[] = [];
  const print = vi.spyOn(window, "print").mockImplementation(() => {
    seen.push(document.querySelector("section.print-summary") !== null);
  });
  render(<App />);
  await screen.findByText(en["info.tapHint"]);
  fireEvent.click(tab(en["mode.movement"]));
  fireEvent.click(screen.getByRole("button", { name: "Hip external rotation" }));
  fireEvent.click(screen.getByRole("button", { name: en["notebook.log"] }));
  fireEvent.click(await screen.findByRole("button", { name: en["notebook.painful"] }));
  fireEvent.click(screen.getByRole("button", { name: en["notebook.side.l"] }));
  fireEvent.click(screen.getByRole("button", { name: en["notebook.save"] }));
  await screen.findByText(en["notebook.saved"]);
  fireEvent.click(tab(en["mode.notebook"]));
  const button = await screen.findByRole("button", { name: en["notebook.print"] });
  expect(print).not.toHaveBeenCalled();
  fireEvent.click(button);
  await waitFor(() => expect(print).toHaveBeenCalledTimes(1));
  expect(seen).toEqual([true]);
  fireEvent.click(button);
  await waitFor(() => expect(print).toHaveBeenCalledTimes(2));
  expect(seen).toEqual([true, true]);
  print.mockRestore();
});

test("a print summary that fails to load leaves the rest of the app on screen", async () => {
  freshNotebook();
  serve(makeBundle());
  printSummary.fails = true;
  const quiet = vi.spyOn(console, "error").mockImplementation(() => {});
  const print = vi.spyOn(window, "print").mockImplementation(() => {});
  try {
    render(<App />);
    await screen.findByText(en["info.tapHint"]);
    fireEvent.click(tab(en["mode.movement"]));
    fireEvent.click(screen.getByRole("button", { name: "Hip external rotation" }));
    fireEvent.click(screen.getByRole("button", { name: en["notebook.log"] }));
    fireEvent.click(await screen.findByRole("button", { name: en["notebook.painful"] }));
    fireEvent.click(screen.getByRole("button", { name: en["notebook.side.l"] }));
    fireEvent.click(screen.getByRole("button", { name: en["notebook.save"] }));
    await screen.findByText(en["notebook.saved"]);
    fireEvent.click(tab(en["mode.notebook"]));
    fireEvent.click(await screen.findByRole("button", { name: en["notebook.print"] }));
    await waitFor(() => expect(quiet).toHaveBeenCalled());
    expect(print).not.toHaveBeenCalled();
    expect(screen.queryByRole("alert")).toBeNull();
    expect(tab(en["mode.notebook"]).getAttribute("aria-selected")).toBe("true");
    expect(screen.getByRole("button", { name: en["notebook.print"] })).toBeTruthy();
    expect(screen.getByTestId("notebook-panel")).toBeTruthy();
  } finally {
    printSummary.fails = false;
  }
});

test("a notebook tab that fails to load stays inside that tab", async () => {
  freshNotebook();
  serve(makeBundle());
  lazyParts.panelFails = true;
  vi.spyOn(console, "error").mockImplementation(() => {});
  try {
    render(<App />);
    await screen.findByText(en["info.tapHint"]);
    fireEvent.click(tab(en["mode.notebook"]));
    expect(await screen.findByText(en["notebook.unavailable"])).toBeTruthy();
    expect(screen.queryByText(en["error.dataLoad"])).toBeNull();
    fireEvent.click(tab(en["mode.atlas"]));
    expect(screen.getByText(en["info.tapHint"])).toBeTruthy();
    fireEvent.click(tab(en["mode.movement"]));
    expect(screen.getByRole("heading", { name: en["movement.pick"] })).toBeTruthy();
    expect(screen.queryByText(en["error.dataLoad"])).toBeNull();
  } finally {
    lazyParts.panelFails = false;
  }
});

test("a log form that fails to load stays inside the Movements panel", async () => {
  freshNotebook();
  serve(makeBundle());
  lazyParts.formFails = true;
  vi.spyOn(console, "error").mockImplementation(() => {});
  try {
    render(<App />);
    await screen.findByText(en["info.tapHint"]);
    fireEvent.click(tab(en["mode.movement"]));
    fireEvent.click(screen.getByRole("button", { name: "Hip external rotation" }));
    fireEvent.click(screen.getByRole("button", { name: en["notebook.log"] }));
    expect(await screen.findByText(en["notebook.unavailable"])).toBeTruthy();
    expect(screen.queryByText(en["error.dataLoad"])).toBeNull();
    expect(screen.getByRole("heading", { name: "Hip external rotation", level: 2 })).toBeTruthy();
    fireEvent.click(tab(en["mode.atlas"]));
    expect(screen.getByText(en["info.tapHint"])).toBeTruthy();
  } finally {
    lazyParts.formFails = false;
  }
});

// Logs one painful note and presses print, so a summary is on the page.
async function printOnce() {
  fireEvent.click(tab(en["mode.movement"]));
  fireEvent.click(screen.getByRole("button", { name: "Hip external rotation" }));
  fireEvent.click(screen.getByRole("button", { name: en["notebook.log"] }));
  fireEvent.click(await screen.findByRole("button", { name: en["notebook.painful"] }));
  fireEvent.click(screen.getByRole("button", { name: en["notebook.side.l"] }));
  fireEvent.click(screen.getByRole("button", { name: en["notebook.save"] }));
  await screen.findByText(en["notebook.saved"]);
  fireEvent.click(tab(en["mode.notebook"]));
  fireEvent.click(await screen.findByRole("button", { name: en["notebook.print"] }));
  await waitFor(() => expect(document.querySelector("section.print-summary")).not.toBeNull());
}

test("the print summary goes away on afterprint", async () => {
  freshNotebook();
  serve(makeBundle());
  vi.spyOn(window, "print").mockImplementation(() => {});
  render(<App />);
  await screen.findByText(en["info.tapHint"]);
  await printOnce();
  fireEvent(window, new Event("afterprint"));
  await waitFor(() => expect(document.querySelector("section.print-summary")).toBeNull());
});

test("the print summary goes away when the person leaves the Notebook tab", async () => {
  freshNotebook();
  serve(makeBundle());
  vi.spyOn(window, "print").mockImplementation(() => {});
  render(<App />);
  await screen.findByText(en["info.tapHint"]);
  await printOnce();
  fireEvent.click(tab(en["mode.atlas"]));
  expect(document.querySelector("section.print-summary")).toBeNull();
});

// Two regions: the hip has movements, the shoulder has none. The shoulder bundle has no joints of its own.
const twoFile = { path: "x.glb", source: "bp3d", license: "CC-BY-4.0" };
const twoRegions = { regions: { hip: { files: [twoFile] }, shoulder: { files: [twoFile] } } };
function serveTwo(shoulderOk = true, hipOk = true) {
  const hip = makeBundle();
  const shoulder: RegionBundle = { ...makeBundle(), region: "shoulder", movements: [], actions: [] };
  const fetch = vi.fn(async (url: string) => {
    if (url.endsWith("models/manifest.json")) return new Response(JSON.stringify(twoRegions));
    if (url.endsWith("data/shoulder.json")) return shoulderOk ? new Response(JSON.stringify(shoulder)) : new Response("", { status: 404 });
    return hipOk ? new Response(JSON.stringify(hip)) : new Response("", { status: 404 });
  });
  vi.stubGlobal("fetch", fetch);
}
const pickRegion = (id: string) => fireEvent.change(screen.getByLabelText(en["region.label"]), { target: { value: id } });

test("a region without movements shows only the Structures and Area tabs", async () => {
  serveTwo();
  render(<App />);
  await screen.findByText(en["info.tapHint"]);
  pickRegion("shoulder");
  await screen.findByText(en["info.tapHint"]);
  await waitFor(() => expect(screen.getAllByRole("tab").map((x) => x.textContent)).toEqual([en["mode.atlas"], en["mode.area"]]));
});

test("switching to a region without movements while on the Movements tab goes to Structures", async () => {
  serveTwo();
  render(<App />);
  await screen.findByText(en["info.tapHint"]);
  fireEvent.click(tab(en["mode.movement"]));
  pickRegion("shoulder");
  await waitFor(() => expect(tab(en["mode.atlas"]).getAttribute("aria-selected")).toBe("true"));
});

test("switching to a region without movements while on the Notebook tab goes to Structures", async () => {
  freshNotebook();
  serveTwo();
  render(<App />);
  await screen.findByText(en["info.tapHint"]);
  fireEvent.click(tab(en["mode.notebook"]));
  await screen.findByText(en["notebook.empty"]);
  pickRegion("shoulder");
  await waitFor(() => expect(tab(en["mode.atlas"]).getAttribute("aria-selected")).toBe("true"));
  expect(screen.queryByText(en["notebook.empty"])).toBeNull();
});

test("switching region closes the search, the layers panel and the print summary and clears the notice", async () => {
  freshNotebook();
  serveTwo();
  vi.spyOn(window, "print").mockImplementation(() => {});
  render(<App />);
  await screen.findByText(en["info.tapHint"]);
  // A print summary on the page.
  await printOnce();
  expect(document.querySelector("section.print-summary")).not.toBeNull();
  fireEvent.click(tab(en["mode.atlas"]));
  // Logging the movement left a notice. Now open the layers panel and the search list too.
  expect(screen.getByRole("status")).toBeTruthy();
  fireEvent.click(screen.getByRole("button", { name: en["layers.open"] }));
  fireEvent.change(screen.getByPlaceholderText(en["search.placeholder"]), { target: { value: "pirif" } });
  expect(screen.getByTestId("search-results")).toBeTruthy();
  expect(screen.getByRole("button", { name: en["layers.close"] })).toBeTruthy();

  pickRegion("shoulder");

  await screen.findByText(en["info.tapHint"]);
  expect(screen.queryByTestId("search-results")).toBeNull();
  expect(screen.queryByRole("button", { name: en["layers.close"] })).toBeNull();
  expect(screen.queryByRole("status")).toBeNull();
  expect(document.querySelector("section.print-summary")).toBeNull();
});

test("switching region writes ?region=<id> into the address without a new history entry", async () => {
  serveTwo();
  render(<App />);
  await screen.findByText(en["info.tapHint"]);
  const before = history.length;
  pickRegion("shoulder");
  await screen.findByText(en["info.tapHint"]);
  expect(history.length).toBe(before);
  expect(location.search).toBe("?region=shoulder");
});

test("switching region keeps the rest of the address", async () => {
  history.replaceState(null, "", "/?x=1#top");
  serveTwo();
  render(<App />);
  await screen.findByText(en["info.tapHint"]);
  pickRegion("shoulder");
  await screen.findByText(en["info.tapHint"]);
  const params = new URLSearchParams(location.search);
  expect(params.get("x")).toBe("1");
  expect(params.get("region")).toBe("shoulder");
  expect(location.hash).toBe("#top");
});

test("a data error in one region does not stay on screen after switching to another", async () => {
  vi.spyOn(console, "error").mockImplementation(() => {});
  serveTwo(true, false);
  render(<App />);
  expect((await screen.findByRole("alert")).textContent).toBe(en["error.dataLoad"]);
  pickRegion("shoulder");
  await screen.findByText(en["info.tapHint"]);
  expect(screen.queryByText(en["error.dataLoad"])).toBeNull();
});

test("the gap line of the region shows under the tap hint, and nothing shows for a region without one", async () => {
  serveTwo();
  const { container } = render(<App />);
  await screen.findByText(en["info.tapHint"]);
  expect(container.querySelector(".region-gap")).toBeNull();
  pickRegion("shoulder");
  expect(await screen.findByText("Not in the model yet: latissimus dorsi.")).toBeTruthy();
  expect(container.querySelector(".region-gap")).not.toBeNull();
});

test("the gap line of the region stays under the tap hint after the region's data has loaded", async () => {
  serveTwo();
  render(<App />);
  await screen.findByText(en["info.tapHint"]);
  pickRegion("shoulder");
  // Only the shoulder's own data takes the Movements and Notebook tabs away, so the panel is no longer the loading fallback.
  await waitFor(() => expect(screen.getAllByRole("tab").map((x) => x.textContent)).toEqual([en["mode.atlas"], en["mode.area"]]));
  expect(screen.getByText(en["info.tapHint"])).toBeTruthy();
  expect(screen.getByText("Not in the model yet: latissimus dorsi.")).toBeTruthy();
});

test("switching region empties the search field", async () => {
  serveTwo();
  render(<App />);
  await screen.findByText(en["info.tapHint"]);
  const field = screen.getByPlaceholderText(en["search.placeholder"]) as HTMLInputElement;
  fireEvent.change(field, { target: { value: "pirif" } });
  expect(field.value).toBe("pirif");
  pickRegion("shoulder");
  await screen.findByText(en["info.tapHint"]);
  expect(field.value).toBe("");
});
