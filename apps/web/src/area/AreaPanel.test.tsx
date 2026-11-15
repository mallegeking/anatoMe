import { cleanup, fireEvent, render, screen, within } from "@testing-library/react";
import { afterEach, expect, test, vi } from "vitest";
import type { RegionBundle } from "../data/bundle";
import de from "../i18n/de.json";
import en from "../i18n/en.json";
import { createT } from "../i18n/t";
import { makeMovementBundle } from "../movement/fixture";
import { AreaPanel, type AreaState } from "./AreaPanel";

const t = createT(en);
afterEach(cleanup);

const area: AreaState = {
  point: [0, 0, 0],
  through: null,
  entries: [
    { sid: "gluteus-maximus", side: "l", distance: 1, depth: 0 },
    { sid: "piriformis", side: "l", distance: 1.024, depth: 0.024 },
    { sid: "femur", side: "l", distance: 1.05, depth: 0.05 },
  ],
};

function show(over: { bundle?: RegionBundle; area?: AreaState; selection?: { sid: string; side: "l" | "r" | "" } | null; onFocusStructure?: (sel: { sid: string; side: "l" | "r" | "" }) => void; onOpenMovement?: (id: string) => void } = {}) {
  render(
    <AreaPanel
      t={t}
      lang="en"
      bundle={over.bundle ?? makeMovementBundle()}
      area={over.area === undefined ? area : over.area}
      selection={over.selection ?? null}
      onFocusStructure={over.onFocusStructure ?? (() => {})}
      onOpenMovement={over.onOpenMovement ?? (() => {})}
      onClear={() => {}}
    />,
  );
}

const item = (name: string) => screen.getAllByRole("listitem").find((li) => within(li).queryByRole("button", { name }) && li.closest("ol"))!;

test("with no tap it shows only the hint", () => {
  show({ area: null });
  expect(screen.getByText(en["area.hint"])).toBeTruthy();
  expect(screen.queryByRole("list")).toBeNull();
});

test("lists the entries in order with side, type and depth", () => {
  show();
  const items = within(screen.getByRole("list")).getAllByRole("listitem", {}).filter((li) => li.parentElement?.tagName === "OL");
  expect(items.map((li) => within(li).getAllByRole("button")[0].textContent)).toEqual(["Gluteus maximus (left)", "Piriformis (left)", "Femur (left)"]);
  expect(within(items[0]).getByText(/outermost here/)).toBeTruthy();
  expect(within(items[1]).getByText(/about 2.5 cm deeper/)).toBeTruthy();
  expect(within(items[2]).getByText(/about 5 cm deeper/)).toBeTruthy();
  expect(within(items[1]).getByText(/Muscle/)).toBeTruthy();
});

test("shows the two notes whenever there is a list", () => {
  show();
  expect(screen.getByText(en["area.note"])).toBeTruthy();
  expect(screen.getByText(en["area.noSkin"])).toBeTruthy();
});

test("lists each movement with its load word once", () => {
  show();
  const li = item("Piriformis (left)");
  const names = within(li).getAllByRole("button").slice(1).map((b) => b.textContent);
  expect(names).toEqual(["Hip internal rotation (works)", "Hip external rotation (works)"]);
});

test("a bone has no movement heading", () => {
  show();
  expect(within(item("Femur (left)")).queryByText(en["area.loadedBy"])).toBeNull();
});

test("a structure with waiting rows shows the waiting line and no empty heading", () => {
  show({ bundle: { ...makeMovementBundle(), actions: [], pendingByStructure: { piriformis: 2 } } });
  expect(within(item("Piriformis (left)")).getByText(en["info.pending"])).toBeTruthy();
  expect(screen.queryByText(en["area.loadedBy"])).toBeNull();
});

test("the name button reports the structure and side", () => {
  const onFocusStructure = vi.fn();
  show({ onFocusStructure });
  fireEvent.click(screen.getByRole("button", { name: "Piriformis (left)" }));
  expect(onFocusStructure).toHaveBeenCalledWith({ sid: "piriformis", side: "l" });
});

test("a movement button opens that movement", () => {
  const onOpenMovement = vi.fn();
  show({ onOpenMovement });
  fireEvent.click(within(item("Piriformis (left)")).getByRole("button", { name: "Hip external rotation (works)" }));
  expect(onOpenMovement).toHaveBeenCalledWith("hip-external-rotation");
});

test("through a structure the title names it and its row is marked", () => {
  show({ area: { ...area, through: { sid: "piriformis", side: "l" } } });
  expect(screen.getByRole("heading", { name: "Over and under Piriformis, seen from here" })).toBeTruthy();
  expect(screen.getByRole("button", { name: "Piriformis (left)" }).getAttribute("aria-current")).toBe("true");
  expect(screen.getByRole("button", { name: "Femur (left)" }).getAttribute("aria-current")).toBeNull();
});

test("an entry the bundle does not know shows its sid and nothing else", () => {
  show({ area: { ...area, entries: [{ sid: "mystery", side: "", distance: 1, depth: 0 }] } });
  const li = item("mystery");
  expect(within(li).getAllByRole("button")).toHaveLength(1);
  expect(li.textContent).toBe("mystery");
});

test("the clear button calls onClear", () => {
  const onClear = vi.fn();
  render(<AreaPanel t={t} lang="en" bundle={makeMovementBundle()} area={area} selection={null} onFocusStructure={() => {}} onOpenMovement={() => {}} onClear={onClear} />);
  fireEvent.click(screen.getByRole("button", { name: en["area.clear"] }));
  expect(onClear).toHaveBeenCalled();
});

test("a probe whose structure is not among the entries shows the title, one line and no list", () => {
  show({ area: { point: null, through: { sid: "piriformis", side: "l" }, entries: [{ sid: "gluteus-maximus", side: "l", distance: 1, depth: 0 }] } });
  expect(screen.getByRole("heading", { name: createT(en)("area.throughTitle", { name: "Piriformis" }) })).toBeTruthy();
  expect(screen.getByText(createT(en)("area.notOnLine", { name: "Piriformis" }))).toBeTruthy();
  expect(screen.queryByRole("list")).toBeNull();
});

test("a probe with no entries at all shows the same line", () => {
  show({ area: { point: null, through: { sid: "piriformis", side: "l" }, entries: [] } });
  expect(screen.getByText(createT(en)("area.notOnLine", { name: "Piriformis" }))).toBeTruthy();
  expect(screen.queryByRole("list")).toBeNull();
});

test("the note speaks of general anatomy and no area text says symptom", () => {
  expect(en["area.note"]).toBe("This lists what the model has under the spot. It shows general anatomy, the same for everyone.");
  expect(de["area.note"]).toBe("Diese Liste zeigt, was das Modell unter der Stelle hat. Sie zeigt allgemeine Anatomie, die für alle gleich ist.");
  // Every text the Area tab shows: its own texts, the tab name, sides, types and the waiting line.
  const shown = (texts: Record<string, string>) =>
    Object.entries(texts).filter(([key]) => key.startsWith("area.") || key.startsWith("type.") || key.startsWith("side.") || key === "mode.area" || key === "info.pending");
  for (const texts of [en, de]) {
    expect(shown(texts).length).toBeGreaterThan(10);
    expect(shown(texts).filter(([, text]) => /symptom/i.test(text))).toEqual([]);
  }
});
