import { act, cleanup, fireEvent, render, screen, waitFor, within } from "@testing-library/react";
import { IDBFactory } from "fake-indexeddb";
import type { Ref } from "react";
import { afterEach, beforeEach, expect, test, vi } from "vitest";
import type { RegionBundle } from "./data/bundle";
import { App } from "./App";
import { clearRegionDataCache } from "./data/useRegionData";
import de from "./i18n/de.json";
import en from "./i18n/en.json";
import { LANG_KEY } from "./i18n/lang";
import { createT } from "./i18n/t";
import { makeBundle, setViewport } from "./ui/fixture";
import type { ViewDirection, ViewerHandle } from "./viewer/handle";
import type { Selection } from "./viewer/pick";

// What the app last handed the viewer, so a test can see the selection and where the camera should go.
// It also keeps what the viewer was told to colour and show.
const viewer = vi.hoisted(() => ({
  selection: null as unknown,
  focus: null as unknown,
  areaProbe: null as unknown,
  highlights: null as unknown,
  isShown: (() => true) as (sid: string, side: "l" | "r" | "") => boolean,
  // How often a viewer was mounted, so a test can see that a layout change keeps the same one.
  mounts: 0,
  // Makes the next render of the stand-in viewer throw, to reach the outer error boundary.
  throws: false,
  // What the app asked of the viewer's handle, in order: "reset" or a zoom factor.
  calls: [] as unknown[],
  // The model files and the Try again callback the viewer was last given.
  files: null as unknown,
  onRetry: (() => {}) as () => void,
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

// Lets a test make opening the notebook or saving a note fail. Otherwise the store is the real one.
const storeParts = vi.hoisted(() => ({ openFails: 0, putFails: false }));
vi.mock("./notebook/store", async (original) => {
  const real = await original<typeof import("./notebook/store")>();
  return {
    ...real,
    openNotebook: async () => {
      if (storeParts.openFails > 0) {
        storeParts.openFails--;
        throw new Error("The notebook could not be opened.");
      }
      const store = await real.openNotebook();
      return { ...store, put: (entry: Parameters<typeof store.put>[0]) => (storeParts.putFails ? Promise.reject(new Error("full")) : store.put(entry)) };
    },
  };
});

// jsdom cannot draw 3D, so the model is plain buttons here. "model" is a tap on empty space,
// "tap piriformis" a tap on the left piriformis.
vi.mock("./viewer/Viewer", async () => {
  const { useEffect, useImperativeHandle } = await import("react");
  return {
  Viewer: ({
    files,
    onRetry,
    handle,
    onView,
    onSelect,
    selection,
    focus,
    highlights,
    isShown,
    onAreaTap,
    areaProbe,
  }: {
    files: unknown;
    onRetry: () => void;
    handle?: Ref<ViewerHandle>;
    onView?: (direction: ViewDirection) => void;
    onAreaTap: (tap: unknown) => void;
    areaProbe: unknown;
    onSelect: (sel: Selection | null, label?: string) => void;
    selection: Selection | null;
    focus: Selection | null;
    highlights: unknown;
    isShown: typeof viewer.isShown;
  }) => {
    if (viewer.throws) throw new Error("viewer broke");
    viewer.files = files;
    viewer.onRetry = onRetry;
    viewer.selection = selection;
    viewer.focus = focus;
    viewer.areaProbe = areaProbe;
    viewer.highlights = highlights;
    viewer.isShown = isShown;
    useEffect(() => {
      viewer.mounts++;
    }, []);
    useImperativeHandle(handle, () => ({
      resetView: () => viewer.calls.push("reset"),
      zoomBy: (factor: number) => viewer.calls.push(factor),
    }));
    // The camera starts in front of the model, as the real viewer reports after its first framing.
    useEffect(() => {
      onView?.([0, 0, 1]);
    }, [onView]);
    return (
      <>
        <button type="button" onClick={() => onSelect(null)}>
          model
        </button>
        <button type="button" onClick={() => onSelect({ sid: "piriformis", side: "l" })}>
          tap piriformis
        </button>
        <button type="button" onClick={() => onSelect({ sid: "mystery", side: "r" }, "Mystery muscle")}>
          tap unknown
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
  };
});

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

beforeEach(() => {
  clearRegionDataCache();
  viewer.calls = [];
  storeParts.openFails = 0;
  storeParts.putFails = false;
  // Every test starts on a phone, unless it asks for another screen.
  setViewport("phone");
});
afterEach(() => {
  cleanup();
  // A test that switches the language must not leave the next one in German.
  localStorage.clear();
  document.documentElement.removeAttribute("lang");
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
  fireEvent.click(screen.getByText(en["info.otherSide.r"]));
  expect(viewer.selection).toEqual({ sid: "piriformis", side: "r" });
  expect(viewer.focus).toEqual({ sid: "piriformis", side: "r" });
  expect(screen.getByRole("heading", { name: "Piriformis", level: 2 })).toBeTruthy();
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
  expect(screen.getByText(en["about.educational"])).toBeTruthy();
  // On the phone the credits are in the settings dialog.
  fireEvent.click(screen.getByRole("button", { name: en["settings.title"] }));
  expect(within(screen.getByRole("dialog")).getByText(en["credits.modified"])).toBeTruthy();
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
  expect(screen.getByRole("heading", { name: "Rectus femoris", level: 2 })).toBeTruthy();
  fireEvent.click(tab(en["mode.movement"]));
  fireEvent.click(screen.getByRole("button", { name: "Hip external rotation" }));
  // Rectus femoris is not involved, so the movement hides it.
  expect(viewer.isShown("rectus-femoris", "l")).toBe(false);
  fireEvent.click(tab(en["mode.atlas"]));
  expect(screen.getByRole("heading", { name: "Rectus femoris", level: 2 })).toBeTruthy();
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
  expect(screen.getByRole("heading", { name: "Piriformis", level: 2 })).toBeTruthy();
});

test("choosing a search result switches to the Structures tab", async () => {
  serve(makeBundle());
  render(<App />);
  await screen.findByText(en["info.tapHint"]);
  fireEvent.click(tab(en["mode.movement"]));
  fireEvent.change(screen.getByPlaceholderText(en["search.placeholder"]), { target: { value: "pirif" } });
  fireEvent.click(screen.getByTestId("search-results").querySelector("button")!);
  expect(tab(en["mode.atlas"]).getAttribute("aria-selected")).toBe("true");
  expect(screen.getByRole("heading", { name: "Piriformis", level: 2 })).toBeTruthy();
});

// Picks a language: on the phone the picker is in the settings dialog, on the wide layout in the side foot.
function pickLanguage(lang: "en" | "de") {
  const settings = screen.queryByRole("button", { name: en["settings.title"] });
  if (settings) fireEvent.click(settings);
  fireEvent.change(screen.getByRole("combobox", { name: en["lang.label"] }), { target: { value: lang } });
}

test("the search notice shown in English reads in German after the language changes", async () => {
  const bundle = makeBundle();
  bundle.structures = bundle.structures.map((s) => (s.id === "piriformis" ? { ...s, german: "Birnenförmiger Muskel" } : s));
  serve(bundle);
  render(<App />);
  await screen.findByText(en["info.tapHint"]);
  fireEvent.change(screen.getByPlaceholderText(en["search.placeholder"]), { target: { value: "pirif" } });
  fireEvent.click(screen.getByTestId("search-results").querySelector("button")!);
  expect(screen.getByTestId("search-notice").textContent).toBe(createT(en)("search.peeledOne", { name: "Piriformis" }));
  pickLanguage("de");
  expect(screen.getByTestId("search-notice").textContent).toBe(createT(de)("search.peeledOne", { name: "Birnenförmiger Muskel" }));
});

// The browser's languages for one test. The afterEach puts the real ones back.
const browserLanguages = (languages: string[]) => vi.spyOn(navigator, "languages", "get").mockReturnValue(languages);

test("picking Deutsch in the language switch stores de for the next visit", async () => {
  serve(makeBundle());
  render(<App />);
  await screen.findByText(en["info.tapHint"]);
  expect(localStorage.getItem(LANG_KEY)).toBeNull();
  // On the phone the language switch sits in the settings dialog.
  fireEvent.click(screen.getByRole("button", { name: en["settings.title"] }));
  const deutsch = screen.getByRole("option", { name: en["lang.de"] }) as HTMLOptionElement;
  fireEvent.change(screen.getByRole("combobox", { name: en["lang.label"] }), { target: { value: deutsch.value } });
  expect(localStorage.getItem(LANG_KEY)).toBe("de");
});

test("a stored de starts the app in German", async () => {
  browserLanguages(["en-US"]);
  localStorage.setItem(LANG_KEY, "de");
  serve(makeBundle());
  render(<App />);
  expect(await screen.findByRole("tab", { name: de["mode.atlas"] })).toBeTruthy();
  expect(screen.queryByRole("tab", { name: en["mode.atlas"] })).toBeNull();
});

test("with nothing stored a German browser starts the app in German", async () => {
  browserLanguages(["de-AT"]);
  serve(makeBundle());
  render(<App />);
  expect(await screen.findByRole("tab", { name: de["mode.atlas"] })).toBeTruthy();
  expect(screen.queryByRole("tab", { name: en["mode.atlas"] })).toBeNull();
});

test("the page's lang attribute is en with an English browser and de after the switch", async () => {
  browserLanguages(["en-US"]);
  serve(makeBundle());
  render(<App />);
  await screen.findByText(en["info.tapHint"]);
  expect(document.documentElement.lang).toBe("en");
  pickLanguage("de");
  expect(document.documentElement.lang).toBe("de");
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
  fireEvent.click(screen.getByRole("button", { name: en["info.hideShort"] }));
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
  fireEvent.click(screen.getByRole("button", { name: en["info.overUnderShort"] }));
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
  fireEvent.click(screen.getByRole("button", { name: en["info.overUnderShort"] }));
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
  const item = (await screen.findByText("on the stairs")).closest("li") as HTMLElement;
  expect(within(item).getByText(/^Hip external rotation$/)).toBeTruthy();
  expect([...item.querySelectorAll(".chip")].map((c) => c.textContent)).toEqual([en["notebook.painful"], en["notebook.side.l"]]);
  expect(item.querySelector("[hidden]")!.textContent).toMatch(/^Hip external rotation, \d{1,2} \w{3} \d{4}$/);
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
    expect(await screen.findByText(en["notebook.loadFailed"])).toBeTruthy();
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
    expect(await screen.findByText(en["notebook.loadFailed"])).toBeTruthy();
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
  return fetch;
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
  expect(screen.getByTestId("search-notice")).toBeTruthy();
  fireEvent.click(screen.getByRole("button", { name: en["layers.open"] }));
  fireEvent.change(screen.getByPlaceholderText(en["search.placeholder"]), { target: { value: "pirif" } });
  expect(screen.getByTestId("search-results")).toBeTruthy();
  expect(screen.getByRole("button", { name: en["layers.close"] })).toBeTruthy();

  pickRegion("shoulder");

  await screen.findByText(en["info.tapHint"]);
  expect(screen.queryByTestId("search-results")).toBeNull();
  expect(screen.queryByRole("button", { name: en["layers.close"] })).toBeNull();
  expect(screen.queryByTestId("search-notice")).toBeNull();
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

test("the app name is the page heading", async () => {
  serve(makeBundle());
  render(<App />);
  await screen.findByText(en["info.tapHint"]);
  expect(screen.getByRole("heading", { level: 1, name: "anatoMe" })).toBeTruthy();
});

test("the panel is the tab panel of the selected tab", async () => {
  serve(makeBundle());
  render(<App />);
  await screen.findByText(en["info.tapHint"]);
  const panel = screen.getByRole("tabpanel");
  expect(panel.getAttribute("aria-labelledby")).toBe("tab-atlas");
  expect(panel.id).toBe("tabpanel");
  expect(panel.contains(screen.getByText(en["info.tapHint"]))).toBe(true);
  fireEvent.click(tab(en["mode.movement"]));
  expect(screen.getByRole("tabpanel").getAttribute("aria-labelledby")).toBe("tab-movement");
});

test("the Area tab is called Under a spot", async () => {
  serve(makeBundle());
  render(<App />);
  await screen.findByText(en["info.tapHint"]);
  expect(en["mode.area"]).toBe("Under a spot");
  expect(tab(en["mode.area"])).toBeTruthy();
});

test("switching between phone and wide keeps the viewer mounted and the selection", async () => {
  setViewport("phone");
  serve(makeBundle());
  render(<App />);
  await screen.findByText(en["info.tapHint"]);
  fireEvent.click(screen.getByText("tap piriformis"));
  // The viewer is keyed by region, so it mounted once more when the manifest named the region.
  // The click above runs inside act, which has run that mount's effect, so the count starts here.
  const before = viewer.mounts;
  expect(screen.getByRole("tablist").getAttribute("aria-orientation")).toBe("horizontal");
  act(() => setViewport("wide"));
  expect(screen.getByRole("tablist").getAttribute("aria-orientation")).toBe("vertical");
  act(() => setViewport("phone"));
  expect(viewer.mounts).toBe(before);
  expect(viewer.selection).toEqual({ sid: "piriformis", side: "l" });
  expect(screen.getByRole("heading", { name: "Piriformis", level: 2 })).toBeTruthy();
});

// Shown means in the page and not inside a hidden element.
const shown = (el: HTMLElement) => el.closest("[hidden]") === null;

test("wide: the layers section is always there, next to the tab panel", async () => {
  setViewport("wide");
  serve(makeBundle());
  render(<App />);
  await screen.findByText(en["info.clickHint"]);
  expect(shown(screen.getByTestId("layers-panel"))).toBe(true);
  expect(shown(screen.getByTestId("info-label"))).toBe(true);
  expect(screen.queryByRole("button", { name: en["layers.close"] })).toBeNull();
  expect(screen.queryByRole("button", { name: en["layers.open"] })).toBeNull();
});

test("phone: the layers button opens Layers in the sheet, and a tab change closes it", async () => {
  serve(makeBundle());
  render(<App />);
  await screen.findByText(en["info.tapHint"]);
  expect(screen.queryByTestId("layers-panel")).toBeNull();
  const open = screen.getByRole("button", { name: en["layers.open"] });
  fireEvent.click(open);
  expect(open.getAttribute("aria-expanded")).toBe("true");
  expect(shown(screen.getByTestId("layers-panel"))).toBe(true);
  // The tab panel keeps its state but is out of sight.
  expect(screen.getByTestId("panel-scroll").hidden).toBe(true);
  fireEvent.click(tab(en["mode.movement"]));
  expect(screen.queryByTestId("layers-panel")).toBeNull();
  expect(screen.getByTestId("panel-scroll").hidden).toBe(false);
  expect(screen.getByTestId("movement-panel")).toBeTruthy();
});

test("phone: a tap on a structure closes Layers and shows the structure", async () => {
  serve(makeBundle());
  render(<App />);
  await screen.findByText(en["info.tapHint"]);
  fireEvent.click(screen.getByRole("button", { name: en["layers.open"] }));
  fireEvent.click(screen.getByText("tap piriformis"));
  expect(screen.queryByTestId("layers-panel")).toBeNull();
  expect(shown(screen.getByTestId("info-panel"))).toBe(true);
});

test("phone: a tap on empty space leaves Layers open", async () => {
  serve(makeBundle());
  render(<App />);
  await screen.findByText(en["info.tapHint"]);
  fireEvent.click(screen.getByRole("button", { name: en["layers.open"] }));
  fireEvent.click(screen.getByText("model"));
  expect(screen.getByTestId("layers-panel")).toBeTruthy();
});

test("phone: the close button closes Layers", async () => {
  serve(makeBundle());
  render(<App />);
  await screen.findByText(en["info.tapHint"]);
  fireEvent.click(screen.getByRole("button", { name: en["layers.open"] }));
  fireEvent.click(screen.getByRole("button", { name: en["layers.close"] }));
  expect(screen.queryByTestId("layers-panel")).toBeNull();
  expect(screen.getByTestId("panel-scroll").hidden).toBe(false);
});

test("the top bar has no layers button", async () => {
  serve(makeBundle());
  render(<App />);
  await screen.findByText(en["info.tapHint"]);
  expect(within(screen.getByRole("banner")).queryByRole("button", { name: en["layers.open"] })).toBeNull();
});

test("going from phone to wide with Layers open keeps Layers, the selection and the tab", async () => {
  serve(makeBundle());
  render(<App />);
  await screen.findByText(en["info.tapHint"]);
  fireEvent.click(screen.getByText("tap piriformis"));
  fireEvent.click(screen.getByRole("button", { name: en["layers.open"] }));
  act(() => setViewport("wide"));
  expect(shown(screen.getByTestId("layers-panel"))).toBe(true);
  expect(shown(screen.getByTestId("info-panel"))).toBe(true);
  expect(screen.queryByRole("button", { name: en["layers.close"] })).toBeNull();
  expect(viewer.selection).toEqual({ sid: "piriformis", side: "l" });
  act(() => setViewport("phone"));
  expect(shown(screen.getByTestId("info-panel"))).toBe(true);
  expect(screen.queryByTestId("layers-panel")).toBeNull();
});

test("wide: the educational line and the credits button sit in the rail, the language picker in the side foot", async () => {
  setViewport("wide");
  serve(makeBundle());
  render(<App />);
  await screen.findByText(en["info.clickHint"]);
  const rail = screen.getByRole("navigation");
  expect(shown(within(rail).getByText(en["about.educational"]))).toBe(true);
  expect(screen.getAllByText(en["about.educational"])).toHaveLength(1);
  expect(screen.queryByRole("button", { name: en["settings.title"] })).toBeNull();
  fireEvent.click(within(rail).getByRole("button", { name: en["credits.title"] }));
  const dialog = screen.getByRole("dialog", { name: en["credits.title"] });
  expect(within(dialog).getByText(en["credits.modified"])).toBeTruthy();
  // Only the credits, the language picker is not in the dialog.
  expect(within(dialog).queryByLabelText(en["lang.label"])).toBeNull();
  fireEvent.click(within(dialog).getByRole("button", { name: en["dialog.close"] }));
  expect(screen.queryByRole("dialog")).toBeNull();
  const picker = screen.getByLabelText(en["lang.label"]);
  expect(picker.closest(".side-foot")).not.toBeNull();
  expect(screen.getByText(en["lang.label"]).tagName).toBe("SPAN");
});

test("phone: settings opens the language picker and the credits", async () => {
  serve(makeBundle());
  render(<App />);
  await screen.findByText(en["info.tapHint"]);
  expect(screen.getAllByText(en["about.educational"])).toHaveLength(1);
  // The educational line is the top of the panel, outside the part that scrolls.
  expect(screen.getByTestId("panel-scroll").contains(screen.getByText(en["about.educational"]))).toBe(false);
  expect(screen.queryByRole("button", { name: en["credits.title"] })).toBeNull();
  fireEvent.click(screen.getByRole("button", { name: en["settings.title"] }));
  const dialog = screen.getByRole("dialog", { name: en["settings.title"] });
  expect(within(dialog).getByText(en["credits.modified"])).toBeTruthy();
  fireEvent.change(within(dialog).getByLabelText(en["lang.label"]), { target: { value: "de" } });
  expect(document.documentElement.lang).toBe("de");
  expect(within(screen.getByRole("dialog")).getByRole("button", { name: de["dialog.close"] })).toBeTruthy();
});

test("a dialog that is open closes when the layout changes", async () => {
  serve(makeBundle());
  render(<App />);
  await screen.findByText(en["info.tapHint"]);
  fireEvent.click(screen.getByRole("button", { name: en["settings.title"] }));
  expect(screen.getByRole("dialog")).toBeTruthy();
  act(() => setViewport("wide"));
  expect(screen.queryByRole("dialog")).toBeNull();
});

test("the tab panel holds only the tab content, never the credits or the language picker", async () => {
  serve(makeBundle());
  render(<App />);
  await screen.findByText(en["info.tapHint"]);
  const panel = screen.getByRole("tabpanel");
  expect(panel.querySelector(".credits, select")).toBeNull();
});

test("the last-resort error page still shows the educational line and the credits", async () => {
  vi.spyOn(console, "error").mockImplementation(() => {});
  serve(makeBundle());
  // The real viewer catches its own failures. A throw from outside it reaches the outer boundary.
  viewer.throws = true;
  try {
    render(<App />);
    expect(await screen.findByRole("alert")).toBeTruthy();
  } finally {
    viewer.throws = false;
  }
  expect(screen.getByText(en["about.educational"])).toBeTruthy();
  expect(screen.getByText(en["credits.modified"])).toBeTruthy();
  expect(screen.queryByRole("dialog")).toBeNull();
});

// The chip is the status region on the stage, next to the model.
const chip = () => screen.getAllByRole("status").find((el) => el.classList.contains("stage-chip"))!;

test("selecting a structure on the Movements tab still names it in the chip", async () => {
  serve(makeBundle());
  render(<App />);
  await screen.findByText(en["info.tapHint"]);
  expect(chip().textContent).toBe("");
  fireEvent.click(tab(en["mode.movement"]));
  fireEvent.click(screen.getByText("tap piriformis"));
  expect(chip().textContent).toContain("Piriformis");
  expect(chip().textContent).toContain(en["stage.side.l"]);
});

test("the chip names the structure in the chosen language", async () => {
  const bundle = makeBundle();
  bundle.structures = bundle.structures.map((s) => (s.id === "piriformis" ? { ...s, german: "Birnenförmiger Muskel" } : s));
  serve(bundle);
  render(<App />);
  await screen.findByText(en["info.tapHint"]);
  fireEvent.click(screen.getByText("tap piriformis"));
  pickLanguage("de");
  expect(chip().textContent).toContain("Birnenförmiger Muskel");
  expect(chip().textContent).toContain(de["stage.side.l"]);
});

test("a structure the data does not know shows its file label in the chip", async () => {
  serve(makeBundle());
  render(<App />);
  await screen.findByText(en["info.tapHint"]);
  fireEvent.click(screen.getByText("tap unknown"));
  expect(chip().textContent).toContain("Mystery muscle");
  expect(chip().textContent).toContain(en["stage.side.r"]);
});

test("the chip's clear button clears the selection", async () => {
  serve(makeBundle());
  render(<App />);
  await screen.findByText(en["info.tapHint"]);
  fireEvent.click(screen.getByText("tap piriformis"));
  expect(viewer.selection).toEqual({ sid: "piriformis", side: "l" });
  fireEvent.click(screen.getByRole("button", { name: en["stage.clear"] }));
  expect(viewer.selection).toBeNull();
  expect(chip().textContent).toBe("");
  expect(screen.getByText(en["info.tapHint"])).toBeTruthy();
});

test("the view badge and the markers follow what the viewer reports", async () => {
  serve(makeBundle());
  render(<App />);
  await screen.findByText(en["info.tapHint"]);
  expect(screen.getByText(en["view.front"])).toBeTruthy();
  expect(screen.getByText(en["stage.right"])).toBeTruthy();
  expect(screen.getByText(en["stage.left"])).toBeTruthy();
});

test("wide: the zoom and reset buttons ask the viewer", async () => {
  setViewport("wide");
  serve(makeBundle());
  render(<App />);
  await screen.findByText(en["info.clickHint"]);
  fireEvent.click(screen.getByRole("button", { name: en["stage.zoomIn"] }));
  fireEvent.click(screen.getByRole("button", { name: en["stage.zoomOut"] }));
  fireEvent.click(screen.getByRole("button", { name: en["stage.reset"] }));
  expect(viewer.calls).toEqual([0.8, 1.25, "reset"]);
});

// Answers the manifest and fails the hip data the given number of times before it works.
function serveFlakyData(failures: number) {
  const bundle = makeBundle();
  const fetch = vi.fn(async (url: string) => {
    if (url.endsWith("models/manifest.json")) return new Response(JSON.stringify(oneRegion));
    if (failures > 0) {
      failures--;
      return new Response("", { status: 404 });
    }
    return new Response(JSON.stringify(bundle));
  });
  vi.stubGlobal("fetch", fetch);
  return fetch;
}
const callsTo = (fetch: { mock: { calls: unknown[][] } }, end: string) => fetch.mock.calls.filter(([url]) => String(url).endsWith(end)).length;
const retryButton = () => screen.getByRole("button", { name: en["error.retry"] });

test("data: Try again fetches the data once more and shows the panel", async () => {
  vi.spyOn(console, "error").mockImplementation(() => {});
  const fetch = serveFlakyData(1);
  render(<App />);
  expect((await screen.findByRole("alert")).textContent).toBe(en["error.dataLoad"]);
  fireEvent.click(retryButton());
  expect(await screen.findByText(en["info.tapHint"])).toBeTruthy();
  expect(screen.queryByRole("alert")).toBeNull();
  expect(callsTo(fetch, "data/hip.json")).toBe(2);
});

test("data: Try again while still offline shows the error and the button again, one request per press", async () => {
  vi.spyOn(console, "error").mockImplementation(() => {});
  const fetch = serveFlakyData(3);
  render(<App />);
  expect((await screen.findByRole("alert")).textContent).toBe(en["error.dataLoad"]);
  fireEvent.click(retryButton());
  expect((await screen.findByRole("alert")).textContent).toBe(en["error.dataLoad"]);
  expect(retryButton()).toBeTruthy();
  expect(callsTo(fetch, "data/hip.json")).toBe(2);
  fireEvent.click(retryButton());
  expect((await screen.findByRole("alert")).textContent).toBe(en["error.dataLoad"]);
  expect(retryButton()).toBeTruthy();
  expect(callsTo(fetch, "data/hip.json")).toBe(3);
});

test("data: going to another region and back fetches again", async () => {
  vi.spyOn(console, "error").mockImplementation(() => {});
  const fetch = serveTwo(true, false);
  render(<App />);
  expect((await screen.findByRole("alert")).textContent).toBe(en["error.dataLoad"]);
  pickRegion("shoulder");
  await screen.findByText(en["info.tapHint"]);
  pickRegion("hip");
  expect((await screen.findByRole("alert")).textContent).toBe(en["error.dataLoad"]);
  expect(callsTo(fetch, "data/hip.json")).toBe(2);
});

test("model: Try again reads the manifest again after it failed", async () => {
  let manifestFails = 1;
  const fetch = vi.fn(async (url: string) => {
    if (url.endsWith("models/manifest.json")) {
      if (manifestFails-- > 0) return new Response("", { status: 404 });
      return new Response(JSON.stringify(oneRegion));
    }
    return new Response(JSON.stringify(makeBundle()));
  });
  vi.stubGlobal("fetch", fetch);
  render(<App />);
  await waitFor(() => expect(viewer.files).toEqual({ error: expect.any(Error) }));
  act(() => viewer.onRetry());
  await waitFor(() => expect(viewer.files).toEqual({ urls: [expect.stringMatching(/hip\.glb$/)] }));
  expect(callsTo(fetch, "models/manifest.json")).toBe(2);
  expect(await screen.findByText(en["info.tapHint"])).toBeTruthy();
});

test("notebook: a store that is blocked says so", async () => {
  vi.stubGlobal("indexedDB", undefined);
  serve(makeBundle());
  render(<App />);
  await screen.findByText(en["info.tapHint"]);
  fireEvent.click(tab(en["mode.notebook"]));
  expect(await screen.findByText(en["notebook.unavailable"])).toBeTruthy();
  expect(screen.queryByText(en["notebook.loadFailed"])).toBeNull();
});

// Opens the log form for external rotation and chooses painful and left.
async function fillLogForm(note = "") {
  fireEvent.click(tab(en["mode.movement"]));
  fireEvent.click(screen.getByRole("button", { name: "Hip external rotation" }));
  fireEvent.click(screen.getByRole("button", { name: en["notebook.log"] }));
  fireEvent.click(await screen.findByRole("button", { name: en["notebook.painful"] }));
  fireEvent.click(screen.getByRole("button", { name: en["notebook.side.l"] }));
  if (note) fireEvent.change(screen.getByLabelText(en["notebook.note"]), { target: { value: note } });
}

test("notebook: a save that fails says so and keeps the typed note", async () => {
  freshNotebook();
  storeParts.putFails = true;
  serve(makeBundle());
  render(<App />);
  await screen.findByText(en["info.tapHint"]);
  await fillLogForm("sharp pain");
  fireEvent.click(screen.getByRole("button", { name: en["notebook.save"] }));
  expect(await screen.findByText(en["notebook.saveFailed"])).toBeTruthy();
  // The message shows inside the log form, next to Save, not at the top of the panel, which may be scrolled away.
  const alert = screen.getByRole("alert");
  expect(alert.textContent).toBe(en["notebook.saveFailed"]);
  expect(alert.closest(".log-form")).not.toBeNull();
  expect(screen.queryByTestId("search-notice")).toBeNull();
  expect((screen.getByLabelText(en["notebook.note"]) as HTMLTextAreaElement).value).toBe("sharp pain");
  // The next save works: the message goes, the form closes and the saved notice shows.
  storeParts.putFails = false;
  fireEvent.click(screen.getByRole("button", { name: en["notebook.save"] }));
  expect(await screen.findByText(en["notebook.saved"])).toBeTruthy();
  expect(screen.queryByRole("alert")).toBeNull();
  expect(screen.queryByRole("button", { name: en["notebook.save"] })).toBeNull();
  fireEvent.click(tab(en["mode.notebook"]));
  expect(await screen.findByText("sharp pain")).toBeTruthy();
});

test("notebook: a part that failed to load says so and can be tried again", async () => {
  freshNotebook();
  serve(makeBundle());
  lazyParts.panelFails = true;
  vi.spyOn(console, "error").mockImplementation(() => {});
  try {
    render(<App />);
    await screen.findByText(en["info.tapHint"]);
    fireEvent.click(tab(en["mode.notebook"]));
    expect(await screen.findByText(en["notebook.loadFailed"])).toBeTruthy();
    expect(screen.queryByText(en["notebook.unavailable"])).toBeNull();
    lazyParts.panelFails = false;
    fireEvent.click(tab(en["mode.atlas"]));
    fireEvent.click(tab(en["mode.notebook"]));
    expect(await screen.findByText(en["notebook.empty"])).toBeTruthy();
    expect(screen.queryByText(en["notebook.loadFailed"])).toBeNull();
  } finally {
    lazyParts.panelFails = false;
  }
});

test("notebook: after a failed open the next log tries again", async () => {
  freshNotebook();
  storeParts.openFails = 1;
  serve(makeBundle());
  render(<App />);
  await screen.findByText(en["info.tapHint"]);
  await fillLogForm("on the stairs");
  fireEvent.click(screen.getByRole("button", { name: en["notebook.save"] }));
  expect(await screen.findByText(en["notebook.unavailable"])).toBeTruthy();
  expect(screen.getByRole("alert").closest(".log-form")).not.toBeNull();
  // The form stays open with the note, so the second press saves it.
  fireEvent.click(screen.getByRole("button", { name: en["notebook.save"] }));
  expect(await screen.findByText(en["notebook.saved"])).toBeTruthy();
  expect(screen.queryByRole("button", { name: en["notebook.save"] })).toBeNull();
  fireEvent.click(tab(en["mode.notebook"]));
  expect(await screen.findByText("on the stairs")).toBeTruthy();
});
