import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, expect, test, vi } from "vitest";
import en from "../i18n/en.json";
import { createT } from "../i18n/t";
import { makeBundle } from "./fixture";
import { InfoPanel } from "./InfoPanel";

const t = createT(en);
afterEach(cleanup);

function show(sid: string, side: "l" | "r" | "" = "", mode: "normal" | "review" = "normal", onSwitchSide = () => {}) {
  render(<InfoPanel selection={{ sid, side }} bundle={makeBundle(mode)} t={t} onSwitchSide={onSwitchSide} onHide={() => {}} />);
}

test("shows English and Latin names", () => {
  show("piriformis");
  expect(screen.getByText("Piriformis")).toBeTruthy();
  expect(screen.getByText("Latin: Musculus piriformis")).toBeTruthy();
});

test("groups checked rows by movement with load and role words", () => {
  show("piriformis");
  expect(screen.getByText("Hip external rotation")).toBeTruthy();
  expect(screen.getByText(/works/)).toBeTruthy();
  expect(screen.getByText(/main/)).toBeTruthy();
});

test("attachment sentence uses the lower case bone name", () => {
  show("piriformis");
  expect(screen.getByText("Starts at: anterior surface of the sacrum")).toBeTruthy();
});

test("shows the waiting line when rows are pending", () => {
  show("piriformis");
  expect(screen.getByText(en["info.pending"])).toBeTruthy();
});

test("a bone with no rows shows no does-heading and no waiting line", () => {
  show("femur");
  expect(screen.queryByText(en["info.does"])).toBeNull();
  expect(screen.queryByText(en["info.pending"])).toBeNull();
});

test("unpaired structure has no side switch", () => {
  show("sacrum");
  expect(screen.queryByText(en["info.switchSide"])).toBeNull();
});

test("paired structure switch calls onSwitchSide", () => {
  const onSwitchSide = vi.fn();
  show("piriformis", "l", "normal", onSwitchSide);
  fireEvent.click(screen.getByText(en["info.switchSide"]));
  expect(onSwitchSide).toHaveBeenCalledTimes(1);
});

test("sources open on tap and mark quote or summary", () => {
  show("piriformis");
  expect(screen.queryByText(en["source.quote"] + ":")).toBeNull();
  fireEvent.click(screen.getAllByText(en["info.sources"])[1]);
  expect(screen.getByText(en["source.quote"] + ":")).toBeTruthy();
});

test("rectus femoris shows the quadriceps tendon gap line", () => {
  show("rectus-femoris");
  expect(screen.getByText(en["info.gap.quadriceps"])).toBeTruthy();
});

test("normal bundle never renders a review note", () => {
  show("piriformis", "", "normal");
  expect(screen.queryByText("Check the angle")).toBeNull();
});

test("review bundle renders the review note", () => {
  show("piriformis", "", "review");
  expect(screen.getByText(t("review.note", { note: "Check the angle" }))).toBeTruthy();
});

test("an unknown structure shows its file label and no data sections", () => {
  render(<InfoPanel selection={{ sid: "mystery", side: "" }} bundle={makeBundle()} t={t} fallbackLabel="Mystery part" onSwitchSide={() => {}} onHide={() => {}} />);
  expect(screen.getByText("Mystery part")).toBeTruthy();
  expect(screen.queryByText(en["info.pending"])).toBeNull();
});
