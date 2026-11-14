import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { IDBFactory } from "fake-indexeddb";
import { afterEach, beforeEach, expect, test, vi } from "vitest";
import type { RegionBundle } from "./data/bundle";
import { App } from "./App";
import { clearRegionDataCache } from "./data/useRegionData";
import en from "./i18n/en.json";
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

beforeEach(clearRegionDataCache);
afterEach(() => {
  cleanup();
  vi.unstubAllGlobals();
  vi.restoreAllMocks();
});

test("tapping the model closes the search list", async () => {
  vi.stubGlobal("fetch", vi.fn(async () => new Response(JSON.stringify(makeBundle()))));
  render(<App />);
  // The panel hint shows once the data is in, so search knows the structures by then.
  await screen.findByText(en["info.tapHint"]);
  fireEvent.change(screen.getByPlaceholderText(en["search.placeholder"]), { target: { value: "pirif" } });
  expect(screen.getByTestId("search-results")).toBeTruthy();
  fireEvent.click(screen.getByText("model"));
  expect(screen.queryByTestId("search-results")).toBeNull();
});

test("show the other side selects that side and turns the camera to it", async () => {
  vi.stubGlobal("fetch", vi.fn(async () => new Response(JSON.stringify(makeBundle()))));
  render(<App />);
  await screen.findByText(en["info.tapHint"]);
  fireEvent.click(screen.getByText("tap piriformis"));
  fireEvent.click(screen.getByText(en["info.switchSide"]));
  expect(viewer.selection).toEqual({ sid: "piriformis", side: "r" });
  expect(viewer.focus).toEqual({ sid: "piriformis", side: "r" });
  expect(screen.getByRole("heading", { name: "Piriformis (right)" })).toBeTruthy();
});

test("the educational line stays outside the part of the panel that scrolls", async () => {
  vi.stubGlobal("fetch", vi.fn(async () => new Response(JSON.stringify(makeBundle()))));
  render(<App />);
  await screen.findByText(en["info.tapHint"]);
  const line = screen.getByText(en["about.educational"]);
  expect(screen.getByTestId("panel-scroll").contains(line)).toBe(false);
  expect(line.closest("details")).toBeNull();
});

test("a data failure shows the data message and keeps the credits and the educational line", async () => {
  vi.spyOn(console, "error").mockImplementation(() => {});
  vi.stubGlobal("fetch", vi.fn(async () => new Response("", { status: 404 })));
  render(<App />);
  // The model is fine here, so the message must not blame it.
  expect((await screen.findByRole("alert")).textContent).toBe(en["error.dataLoad"]);
  expect(screen.queryByText(en["error.modelLoad"])).toBeNull();
  expect(screen.getByText(en["credits.title"])).toBeTruthy();
  expect(screen.getByText(en["about.educational"])).toBeTruthy();
});

function serve(bundle: RegionBundle) {
  vi.stubGlobal("fetch", vi.fn(async () => new Response(JSON.stringify(bundle))));
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
