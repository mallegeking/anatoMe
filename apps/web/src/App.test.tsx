import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, beforeEach, expect, test, vi } from "vitest";
import { App } from "./App";
import { clearRegionDataCache } from "./data/useRegionData";
import en from "./i18n/en.json";
import { makeBundle } from "./ui/fixture";
import type { Selection } from "./viewer/pick";

// jsdom cannot draw 3D, so the model is a plain button here. Pressing it is a tap on empty space.
vi.mock("./viewer/Viewer", () => ({
  Viewer: ({ onSelect }: { onSelect: (sel: Selection | null) => void }) => (
    <button type="button" onClick={() => onSelect(null)}>
      model
    </button>
  ),
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

test("a data failure shows the error and keeps the credits and the educational line", async () => {
  vi.spyOn(console, "error").mockImplementation(() => {});
  vi.stubGlobal("fetch", vi.fn(async () => new Response("", { status: 404 })));
  render(<App />);
  expect((await screen.findByRole("alert")).textContent).toBe(en["error.modelLoad"]);
  expect(screen.getByText(en["credits.title"])).toBeTruthy();
  expect(screen.getByText(en["about.educational"])).toBeTruthy();
});
