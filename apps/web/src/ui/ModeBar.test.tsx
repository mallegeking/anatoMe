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
