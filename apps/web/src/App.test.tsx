import { cleanup, fireEvent, render, screen } from "@testing-library/react";
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
  highlights: null as unknown,
  isShown: (() => true) as (sid: string, side: "l" | "r" | "") => boolean,
}));

// jsdom cannot draw 3D, so the model is plain buttons here. "model" is a tap on empty space,
// "tap piriformis" a tap on the left piriformis.
vi.mock("./viewer/Viewer", () => ({
  Viewer: ({
    onSelect,
    selection,
    focus,
    highlights,
    isShown,
  }: {
    onSelect: (sel: Selection | null) => void;
    selection: Selection | null;
    focus: Selection | null;
    highlights: unknown;
    isShown: typeof viewer.isShown;
  }) => {
    viewer.selection = selection;
    viewer.focus = focus;
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
