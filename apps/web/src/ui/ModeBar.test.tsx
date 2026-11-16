import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, expect, test, vi } from "vitest";
import en from "../i18n/en.json";
import { createT } from "../i18n/t";
import { ModeBar } from "./ModeBar";

const t = createT(en);
afterEach(cleanup);

test("marks the current tab and reports a change", () => {
  const onChange = vi.fn();
  render(<ModeBar t={t} mode="atlas" modes={["atlas", "movement"]} onChange={onChange} />);
  expect(screen.getByRole("tablist", { name: en["mode.label"] })).toBeTruthy();
  expect(screen.getByRole("tab", { name: "Structures" }).getAttribute("aria-selected")).toBe("true");
  expect(screen.getByRole("tab", { name: "Movements" }).getAttribute("aria-selected")).toBe("false");
  fireEvent.click(screen.getByRole("tab", { name: "Movements" }));
  expect(onChange).toHaveBeenCalledWith("movement");
});

// The tabs pattern of the WAI-ARIA Authoring Practices, with automatic activation.
const all = ["atlas", "movement", "area", "notebook"] as const;
const names = all.map((m) => en[`mode.${m}`]);
function keyFrom(mode: (typeof all)[number], key: string) {
  const onChange = vi.fn();
  render(<ModeBar t={t} mode={mode} modes={[...all]} onChange={onChange} />);
  const from = screen.getByRole("tab", { name: en[`mode.${mode}`] });
  from.focus();
  fireEvent.keyDown(from, { key });
  return onChange;
}

test("only the selected tab is in the Tab order", () => {
  render(<ModeBar t={t} mode="area" modes={[...all]} onChange={() => {}} />);
  expect(names.map((name) => screen.getByRole("tab", { name }).tabIndex)).toEqual([-1, -1, 0, -1]);
});

test("the right arrow selects and focuses the next tab", () => {
  const onChange = keyFrom("movement", "ArrowRight");
  expect(onChange).toHaveBeenCalledWith("area");
  expect(document.activeElement).toBe(screen.getByRole("tab", { name: en["mode.area"] }));
});

test("the left arrow selects and focuses the previous tab", () => {
  const onChange = keyFrom("movement", "ArrowLeft");
  expect(onChange).toHaveBeenCalledWith("atlas");
  expect(document.activeElement).toBe(screen.getByRole("tab", { name: en["mode.atlas"] }));
});

test("the arrows wrap at the ends", () => {
  expect(keyFrom("notebook", "ArrowRight")).toHaveBeenCalledWith("atlas");
  cleanup();
  expect(keyFrom("atlas", "ArrowLeft")).toHaveBeenCalledWith("notebook");
});

test("Home and End go to the first and the last tab", () => {
  expect(keyFrom("area", "Home")).toHaveBeenCalledWith("atlas");
  expect(document.activeElement).toBe(screen.getByRole("tab", { name: en["mode.atlas"] }));
  cleanup();
  expect(keyFrom("movement", "End")).toHaveBeenCalledWith("notebook");
  expect(document.activeElement).toBe(screen.getByRole("tab", { name: en["mode.notebook"] }));
});

test("other keys do nothing", () => {
  expect(keyFrom("movement", "ArrowDown")).not.toHaveBeenCalled();
});
