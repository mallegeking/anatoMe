import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { useState } from "react";
import { afterEach, expect, test, vi } from "vitest";
import type { BundleStructure } from "../data/bundle";
import en from "../i18n/en.json";
import { createT } from "../i18n/t";
import { TopBar } from "./TopBar";

const t = createT(en);
afterEach(cleanup);

const structures: BundleStructure[] = [
  { id: "piriformis", type: "muscle", english: "Piriformis", latin: "Musculus piriformis", depth: 2 },
  { id: "femur", type: "bone", english: "Femur", depth: 4 },
];

// The app keeps the open state of the list, so the tests do the same.
function Harness({ onChoose }: { onChoose: (s: BundleStructure) => void }) {
  const [open, setOpen] = useState(false);
  return <TopBar t={t} structures={structures} layersOpen={false} onToggleLayers={() => {}} onChoose={onChoose} open={open} onOpenChange={setOpen} />;
}

function show(onChoose = vi.fn()) {
  render(<Harness onChoose={onChoose} />);
  return { onChoose, field: screen.getByPlaceholderText("Search, for example piriformis") };
}

test("typing lists matches and choosing one reports it and closes the list", () => {
  const { onChoose, field } = show();
  fireEvent.change(field, { target: { value: "pirif" } });
  fireEvent.click(screen.getByRole("button", { name: /Piriformis/ }));
  expect(onChoose).toHaveBeenCalledWith(structures[0]);
  expect(screen.queryByTestId("search-results")).toBeNull();
});

test("no match says so, and clearing the field closes the list", () => {
  const { field } = show();
  fireEvent.change(field, { target: { value: "zzz" } });
  expect(screen.getByText("No structure found")).toBeTruthy();
  fireEvent.change(field, { target: { value: "" } });
  expect(screen.queryByText("No structure found")).toBeNull();
});

test("the list closes when the search field loses focus", () => {
  const { field } = show();
  fireEvent.change(field, { target: { value: "pirif" } });
  expect(screen.getByTestId("search-results")).toBeTruthy();
  fireEvent.blur(field);
  expect(screen.queryByTestId("search-results")).toBeNull();
});

test("a tap on a result still chooses it, because the press does not take focus from the field", () => {
  const { onChoose, field } = show();
  fireEvent.change(field, { target: { value: "pirif" } });
  const result = screen.getByRole("button", { name: /Piriformis/ });
  // fireEvent returns false when the page cancelled the default action, here moving the focus.
  expect(fireEvent.mouseDown(result)).toBe(false);
  fireEvent.click(result);
  expect(onChoose).toHaveBeenCalledWith(structures[0]);
});

test("the list stays open while the focus moves into it, for example with the Tab key", () => {
  const { field } = show();
  fireEvent.change(field, { target: { value: "pirif" } });
  fireEvent.blur(field, { relatedTarget: screen.getByRole("button", { name: /Piriformis/ }) });
  expect(screen.getByTestId("search-results")).toBeTruthy();
});

test("choosing a result lets go of the field, so the phone keyboard closes", () => {
  const { field } = show();
  field.focus();
  fireEvent.change(field, { target: { value: "pirif" } });
  fireEvent.click(screen.getByRole("button", { name: /Piriformis/ }));
  expect(document.activeElement).not.toBe(field);
});

test("a result shows the English name, the type and the Latin name", () => {
  const { field } = show();
  fireEvent.change(field, { target: { value: "pirif" } });
  const result = screen.getByRole("button", { name: /Piriformis/ });
  expect(result.textContent).toContain(en["type.muscle"]);
  expect(result.textContent).toContain("Musculus piriformis");
});
