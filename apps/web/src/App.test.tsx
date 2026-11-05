import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, beforeEach, expect, test, vi } from "vitest";
import { App } from "./App";
import { clearRegionDataCache } from "./data/useRegionData";
import en from "./i18n/en.json";
import { makeBundle } from "./ui/fixture";
import type { Selection } from "./viewer/pick";

// What the app last handed the viewer, so a test can see the selection and where the camera should go.
const viewer = vi.hoisted(() => ({ selection: null as unknown, focus: null as unknown }));

// jsdom cannot draw 3D, so the model is plain buttons here. "model" is a tap on empty space,
// "tap piriformis" a tap on the left piriformis.
vi.mock("./viewer/Viewer", () => ({
  Viewer: ({ onSelect, selection, focus }: { onSelect: (sel: Selection | null) => void; selection: Selection | null; focus: Selection | null }) => {
    viewer.selection = selection;
    viewer.focus = focus;
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
