import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, expect, test } from "vitest";
import de from "../i18n/de.json";
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

const parts = ["body", "hip", "lower-leg", "shoulder", "arm", "neck", "trunk"];
// The language files as plain maps, so a text can be looked up by a built key.
const enTexts: Record<string, string> = en;
const deTexts: Record<string, string> = de;
const gapRows = () => [...document.querySelectorAll(".region-gaps dt")].map((dt) => [dt.textContent, dt.nextElementSibling?.textContent]);

test("the whole body lists each region's own gap line under the region's name", () => {
  render(<Hint t={t} region="body" parts={parts} />);
  expect(screen.getByText(enTexts["regionGap.body"])).toBeTruthy();
  const rows = gapRows();
  expect(rows).toEqual(["lower-leg", "shoulder", "neck", "trunk"].map((r) => [enTexts[`region.${r}`], enTexts[`regionGap.${r}`]]));
});

test("in German the whole body's gap list is German", () => {
  render(<Hint t={createT(de, en)} region="body" parts={parts} />);
  expect(screen.getByText(deTexts["regionGap.body"])).toBeTruthy();
  const rows = gapRows();
  expect(rows).toEqual(["lower-leg", "shoulder", "neck", "trunk"].map((r) => [deTexts[`region.${r}`], deTexts[`regionGap.${r}`]]));
});

test("a region keeps its one gap line and no list", () => {
  render(<Hint t={t} region="shoulder" parts={parts} />);
  expect(screen.getByText(en["regionGap.shoulder"])).toBeTruthy();
  expect(document.querySelector(".region-gaps")).toBeNull();
});
