import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, expect, test, vi } from "vitest";
import type { BundleStructure } from "../data/bundle";
import en from "../i18n/en.json";
import { createT } from "../i18n/t";
import { hideStructure, initialLayers, peel } from "./layers";
import { LayersPanel } from "./LayersPanel";

const t = createT(en);
afterEach(cleanup);

const structures: BundleStructure[] = [
  { id: "gluteus-maximus", type: "muscle", english: "Gluteus maximus", depth: 1 },
  { id: "piriformis", type: "muscle", english: "Piriformis", depth: 2 },
  { id: "femur", type: "bone", english: "Femur", depth: 4 },
];

const noop = () => {};
function show(state = initialLayers(), handlers: Partial<Parameters<typeof LayersPanel>[0]> = {}) {
  render(
    <LayersPanel
      t={t}
      state={state}
      structures={structures}
      onPeel={noop}
      onRestore={noop}
      onToggleTissue={noop}
      onShow={noop}
      {...handlers}
    />,
  );
}

test("panel shows the peeled count and lists hidden structures with a show button", () => {
  const onShow = vi.fn();
  show(hideStructure(peel(initialLayers(), structures), "piriformis"), { onShow });
  expect(screen.getByText("1 layer peeled")).toBeTruthy();
  expect(screen.getByText("Hidden")).toBeTruthy();
  expect(screen.getByText("Piriformis")).toBeTruthy();
  fireEvent.click(screen.getByRole("button", { name: /Show/ }));
  expect(onShow).toHaveBeenCalledWith("piriformis");
});

test("no hidden list when nothing is hidden by hand", () => {
  show();
  expect(screen.queryByText("Hidden")).toBeNull();
});

test("peel and restore buttons call back, restore is off with nothing peeled", () => {
  const onPeel = vi.fn();
  show(initialLayers(), { onPeel });
  fireEvent.click(screen.getByRole("button", { name: "Peel a layer" }));
  expect(onPeel).toHaveBeenCalled();
  expect((screen.getByRole("button", { name: "Restore" }) as HTMLButtonElement).disabled).toBe(true);
});

test("tissue checkboxes reflect and toggle the state", () => {
  const onToggleTissue = vi.fn();
  show(initialLayers(), { onToggleTissue });
  const bones = screen.getByRole("checkbox", { name: "Bones" }) as HTMLInputElement;
  expect(bones.checked).toBe(true);
  fireEvent.click(bones);
  expect(onToggleTissue).toHaveBeenCalledWith("bone");
  expect(screen.getByRole("checkbox", { name: "Ligaments and other soft tissue" })).toBeTruthy();
});

test("peel is off when no visible muscle is left", () => {
  const all = hideStructure(hideStructure(initialLayers(), "gluteus-maximus"), "piriformis");
  show(all);
  expect((screen.getByRole("button", { name: "Peel a layer" }) as HTMLButtonElement).disabled).toBe(true);
});
