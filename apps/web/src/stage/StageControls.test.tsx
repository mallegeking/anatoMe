import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import type { ComponentProps } from "react";
import { afterEach, expect, test, vi } from "vitest";
import en from "../i18n/en.json";
import { createT } from "../i18n/t";
import { StageControls } from "./StageControls";

const t = createT(en);
afterEach(cleanup);

type Props = ComponentProps<typeof StageControls>;

function props(over: Partial<Props> = {}): Props {
  return {
    t,
    wide: false,
    selected: null,
    view: null,
    onClearSelection: vi.fn(),
    onReset: vi.fn(),
    onZoom: vi.fn(),
    layersOpen: false,
    onToggleLayers: vi.fn(),
    ...over,
  };
}

test("the chip names the selection in a status region that is always there", () => {
  const p = props();
  const { rerender } = render(<StageControls {...p} />);
  expect(screen.getByRole("status").textContent).toBe("");
  expect(screen.queryByRole("button", { name: en["stage.clear"] })).toBeNull();

  rerender(<StageControls {...p} selected={{ name: "Piriformis", side: "l" }} />);
  const status = screen.getByRole("status");
  expect(status.textContent).toContain("Piriformis");
  expect(status.textContent).toContain(en["stage.side.l"]);
  fireEvent.click(screen.getByRole("button", { name: en["stage.clear"] }));
  expect(p.onClearSelection).toHaveBeenCalledTimes(1);
});

test("a midline structure shows no side word", () => {
  render(<StageControls {...props({ selected: { name: "Sacrum", side: "" } })} />);
  const text = screen.getByRole("status").textContent ?? "";
  expect(text).toContain("Sacrum");
  expect(text).not.toContain(en["stage.side.l"]);
  expect(text).not.toContain(en["stage.side.r"]);
});

test("front view: badge and both markers", () => {
  render(<StageControls {...props({ view: "front" })} />);
  expect(screen.getByText(en["view.front"])).toBeTruthy();
  // From the front the body's right is on the screen's left.
  expect(screen.getByText(en["stage.right"]).classList.contains("stage-marker--left")).toBe(true);
  expect(screen.getByText(en["stage.left"]).classList.contains("stage-marker--right")).toBe(true);
});

test("back view: the markers swap", () => {
  render(<StageControls {...props({ view: "back" })} />);
  expect(screen.getByText(en["view.back"])).toBeTruthy();
  expect(screen.getByText(en["stage.left"]).classList.contains("stage-marker--left")).toBe(true);
  expect(screen.getByText(en["stage.right"]).classList.contains("stage-marker--right")).toBe(true);
});

test("side view: badge, no markers", () => {
  render(<StageControls {...props({ view: "left" })} />);
  expect(screen.getByText(en["view.left"])).toBeTruthy();
  expect(screen.queryByText(en["stage.left"])).toBeNull();
  expect(screen.queryByText(en["stage.right"])).toBeNull();
});

test("no view yet: no badge and no markers", () => {
  render(<StageControls {...props({ view: null })} />);
  for (const key of ["view.front", "view.back", "view.left", "view.right", "view.top", "view.bottom", "stage.left", "stage.right"] as const) {
    expect(screen.queryByText(en[key])).toBeNull();
  }
});

test("wide: zoom buttons and the hint, no layers button", () => {
  const p = props({ wide: true });
  render(<StageControls {...p} />);
  fireEvent.click(screen.getByRole("button", { name: en["stage.zoomIn"] }));
  expect(p.onZoom).toHaveBeenLastCalledWith(0.8);
  fireEvent.click(screen.getByRole("button", { name: en["stage.zoomOut"] }));
  expect(p.onZoom).toHaveBeenLastCalledWith(1.25);
  fireEvent.click(screen.getByRole("button", { name: en["stage.reset"] }));
  expect(p.onReset).toHaveBeenCalledTimes(1);
  expect(screen.getByText(en["stage.hint"])).toBeTruthy();
  expect(screen.queryByRole("button", { name: en["layers.open"] })).toBeNull();
});

test("phone: layers and reset buttons, no zoom buttons and no hint", () => {
  const p = props({ wide: false, layersOpen: true });
  const { rerender } = render(<StageControls {...p} />);
  const layers = screen.getByRole("button", { name: en["layers.open"] });
  expect(layers.getAttribute("aria-expanded")).toBe("true");
  fireEvent.click(layers);
  expect(p.onToggleLayers).toHaveBeenCalledTimes(1);
  rerender(<StageControls {...p} layersOpen={false} />);
  expect(screen.getByRole("button", { name: en["layers.open"] }).getAttribute("aria-expanded")).toBe("false");
  fireEvent.click(screen.getByRole("button", { name: en["stage.reset"] }));
  expect(p.onReset).toHaveBeenCalledTimes(1);
  expect(screen.queryByRole("button", { name: en["stage.zoomIn"] })).toBeNull();
  expect(screen.queryByRole("button", { name: en["stage.zoomOut"] })).toBeNull();
  expect(screen.queryByText(en["stage.hint"])).toBeNull();
});

test("every stage button has an aria-label", () => {
  const { container } = render(<StageControls {...props({ wide: true, selected: { name: "Femur", side: "r" }, view: "front" })} />);
  expect(container.querySelector(".stage-controls")).not.toBeNull();
  for (const button of screen.getAllByRole("button")) expect(button.getAttribute("aria-label")).toBeTruthy();
});
