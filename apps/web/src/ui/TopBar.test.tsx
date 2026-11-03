import { cleanup, fireEvent, render, screen } from "@testing-library/react";
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

function show(onChoose = vi.fn()) {
  render(<TopBar t={t} structures={structures} layersOpen={false} onToggleLayers={() => {}} onChoose={onChoose} />);
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
