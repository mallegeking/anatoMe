import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, expect, test, vi } from "vitest";
import en from "../i18n/en.json";
import { createT } from "../i18n/t";
import { makeBundle } from "../ui/fixture";
import { InfoPanel } from "../ui/InfoPanel";
import { ReviewBanner } from "./ReviewBanner";
import { ReviewList } from "./ReviewList";

const t = createT(en);
const NOTE = "Does the piriformis turn the thigh outwards at every angle?";
afterEach(cleanup);

test("normal bundle shows no banner and no review list button", () => {
  render(<ReviewBanner bundle={makeBundle("normal")} t={t} onOpenList={() => {}} />);
  expect(screen.queryByText(en["review.banner"])).toBeNull();
  expect(screen.queryByText(en["review.list"])).toBeNull();
});

test("review bundle shows the banner and a button that opens the list", () => {
  const onOpenList = vi.fn();
  render(<ReviewBanner bundle={makeBundle("review")} t={t} onOpenList={onOpenList} />);
  expect(screen.getByText(en["review.banner"])).toBeTruthy();
  fireEvent.click(screen.getByText(en["review.list"]));
  expect(onOpenList).toHaveBeenCalledTimes(1);
});

test("draft rows are marked and show their review note", () => {
  render(<InfoPanel selection={{ sid: "piriformis", side: "" }} bundle={makeBundle("review")} t={t} onSwitchSide={() => {}} onHide={() => {}} />);
  // One mark for the draft action and one for the draft attachment. The checked row has none.
  expect(screen.getAllByText(en["review.draft"])).toHaveLength(2);
  expect(screen.getByText(t("review.note", { note: NOTE }))).toBeTruthy();
  expect(screen.getByText(t("review.rowId", { id: "x2" }))).toBeTruthy();
});

test("review mode hides the waiting line, normal mode keeps it", () => {
  const { unmount } = render(<InfoPanel selection={{ sid: "piriformis", side: "" }} bundle={makeBundle("review")} t={t} onSwitchSide={() => {}} onHide={() => {}} />);
  expect(screen.queryByText(en["info.pending"])).toBeNull();
  unmount();
  render(<InfoPanel selection={{ sid: "piriformis", side: "" }} bundle={makeBundle("normal")} t={t} onSwitchSide={() => {}} onHide={() => {}} />);
  expect(screen.getByText(en["info.pending"])).toBeTruthy();
});

test("review list groups drafts by structure and shows row codes", () => {
  render(<ReviewList bundle={makeBundle("review")} t={t} onClose={() => {}} />);
  expect(screen.getByRole("heading", { name: "Piriformis" })).toBeTruthy();
  expect(screen.getByText(t("review.rowId", { id: "x2" }))).toBeTruthy();
  expect(screen.getByText(t("review.rowId", { id: "a2" }))).toBeTruthy();
  expect(screen.getByText(t("review.note", { note: NOTE }))).toBeTruthy();
  // Checked rows are not listed.
  expect(screen.queryByText(t("review.rowId", { id: "x1" }))).toBeNull();
  expect(screen.queryByText(t("review.rowId", { id: "a1" }))).toBeNull();
});

test("review list shows the whole claim of a draft row, like the info panel", () => {
  render(<ReviewList bundle={makeBundle("review")} t={t} onClose={() => {}} />);
  expect(screen.getByText("Hip external rotation: is stretched, with the hip bent between 0 and 30 degrees")).toBeTruthy();
  expect(screen.getByText(t("info.appliesTo", { text: "Test hips only" }))).toBeTruthy();
  expect(screen.getByText(en["confidence.low"])).toBeTruthy();
});

test("the punctuation between movement and claim comes from the text file", () => {
  render(<ReviewList bundle={makeBundle("review")} t={createT({ ...en, "review.action": "{movement} >> {text}" })} onClose={() => {}} />);
  expect(screen.getByText("Hip external rotation >> is stretched, with the hip bent between 0 and 30 degrees")).toBeTruthy();
});

test("review list close button calls onClose", () => {
  const onClose = vi.fn();
  render(<ReviewList bundle={makeBundle("review")} t={t} onClose={onClose} />);
  fireEvent.click(screen.getByText(en["review.close"]));
  expect(onClose).toHaveBeenCalledTimes(1);
});
