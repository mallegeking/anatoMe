import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, expect, test } from "vitest";
import en from "../i18n/en.json";
import { createT } from "../i18n/t";
import { setViewport } from "./fixture";
import { Hint } from "./RegionInfo";

const t = createT(en);
afterEach(() => {
  cleanup();
  setViewport("phone");
});

test("phone: the empty state has the tap heading and the help line", () => {
  setViewport("phone");
  render(<Hint t={t} />);
  expect(screen.getByText(en["info.tapHint"])).toBeTruthy();
  expect(screen.getByText(en["info.tapHelp"])).toBeTruthy();
  expect(screen.getByTestId("info-label").textContent).toBe(en["info.tapHint"]);
});

test("wide: the empty state says click and has no help line", () => {
  setViewport("wide");
  render(<Hint t={t} />);
  expect(screen.getByText(en["info.clickHint"])).toBeTruthy();
  expect(screen.queryByText(en["info.tapHelp"])).toBeNull();
  expect(screen.queryByText(en["info.tapHint"])).toBeNull();
});
