import { act, cleanup, render, screen, within } from "@testing-library/react";
import { afterEach, expect, test, vi } from "vitest";
import deTexts from "../i18n/de.json";
import en from "../i18n/en.json";
import { createT } from "../i18n/t";
import { makeMovementBundle } from "../movement/fixture";
import PrintSummary from "./PrintSummary";
import { Summary } from "./Summary";
import { summaryModel } from "./summary";
import type { NotebookEntry } from "./types";

const t = createT(en);
const b = makeMovementBundle();
const now = new Date(2026, 10, 14);
afterEach(() => {
  cleanup();
  vi.restoreAllMocks();
});

const entry = (over: Partial<NotebookEntry> = {}): NotebookEntry => ({
  id: "e1",
  createdAt: 1,
  date: "2026-11-13",
  pick: { kind: "movement", id: "hip-external-rotation" },
  pose: { "hip.flexion": 31.6, "hip.rotation": 0 },
  feeling: "painful",
  side: "l",
  note: "",
  ...over,
});

function page(entries: NotebookEntry[], withComparison = true) {
  const model = summaryModel(entries, b, now, withComparison, "en");
  return render(<Summary t={t} lang="en" bundle={b} model={model} />);
}

test("the page shows the disclaimer and both tables", () => {
  const { container } = page([entry(), entry({ id: "e2", feeling: "fine" })]);
  expect(screen.getAllByText(en["notebook.disclaimer"]).length).toBeGreaterThan(0);
  expect(screen.getByRole("heading", { name: en["summary.painful"] })).toBeTruthy();
  expect(screen.getByRole("heading", { name: en["summary.fine"] })).toBeTruthy();
  expect(container.querySelector("section.print-summary")).toBeTruthy();
  expect(container.querySelectorAll("table")).toHaveLength(2);
});

test("left-out notes are counted on the page", () => {
  const entries = Array.from({ length: 15 }, (_, i) => entry({ id: `p${i}`, createdAt: i }));
  page(entries);
  expect(screen.getByText("and 3 older notes")).toBeTruthy();
});

test("the disclaimer is in the header and again before the first side heading", () => {
  const { container } = page([entry()]);
  const all = screen.getAllByText(en["notebook.disclaimer"]);
  expect(all).toHaveLength(2);
  const side = screen.getByRole("heading", { name: en["notebook.lookIntoSide.l"] });
  expect(all[1].compareDocumentPosition(side) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
  expect(all[0].compareDocumentPosition(container.querySelector("table")!) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
  expect(screen.getByText(en["summary.basis"])).toBeTruthy();
});

test("without the comparison only the header disclaimer shows", () => {
  page([entry()], false);
  expect(screen.getAllByText(en["notebook.disclaimer"])).toHaveLength(1);
  expect(screen.queryByText(en["summary.basis"])).toBeNull();
  expect(screen.queryByRole("heading", { name: en["notebook.lookIntoSide.l"] })).toBeNull();
});

test("the tables have a header row and plain cells", () => {
  const { container } = page([entry({ note: "<b>x</b> on the stairs" }), entry({ id: "u", pick: { kind: "movement", id: "gone" }, side: "both" })]);
  const first = container.querySelector("table")!;
  const heads = within(first).getAllByRole("columnheader").map((h) => h.textContent);
  expect(heads).toEqual([en["summary.column.date"], en["summary.column.movement"], en["summary.column.side"], en["summary.column.angles"], en["summary.column.note"]]);
  const cells = within(first).getAllByRole("row")[1].querySelectorAll("td");
  expect(cells[0].textContent).toBe("13 Nov 2026");
  expect(cells[1].textContent).toBe(b.movements.find((m) => m.id === "hip-external-rotation")!.english);
  expect(cells[2].textContent).toBe(en["notebook.side.l"]);
  expect(cells[3].textContent).toContain("32 degrees");
  expect(cells[4].textContent).toBe("<b>x</b> on the stairs");
  expect(first.querySelector("b")).toBeNull();
  expect(screen.getByText(en["notebook.unknown"])).toBeTruthy();
  expect(screen.getByText(en["notebook.side.both"])).toBeTruthy();
});

test("candidate lines read like the panel's", () => {
  page([entry()]);
  expect(screen.getByText("Piriformis: loaded in 1 of 1 movements you marked as hurting, and in none you marked as fine")).toBeTruthy();
});

test("when a fine movement rules everything out the side says so, not that there is no information", () => {
  page([entry(), entry({ id: "f", feeling: "fine" })]);
  expect(screen.queryByText(en["notebook.noRows"])).toBeNull();
  expect(screen.queryByText(/loaded in \d+ of/)).toBeNull();
  expect(screen.getByText(/^Also loaded by movements that feel fine: .*Piriformis/)).toBeTruthy();
});

test("print runs once per press and only after the summary is in the document", async () => {
  vi.useFakeTimers({ toFake: ["requestAnimationFrame", "cancelAnimationFrame"] });
  let seen: boolean | null = null;
  const print = vi.spyOn(window, "print").mockImplementation(() => {
    seen = document.querySelector("section.print-summary") !== null;
  });
  const props = { t, lang: "en" as const, bundle: b, entries: [entry()] };
  const { rerender } = render(<PrintSummary {...props} press={1} />);
  expect(print).not.toHaveBeenCalled();
  expect(document.querySelector("section.print-summary")).toBeTruthy();
  await act(async () => {
    vi.advanceTimersByTime(20);
  });
  expect(print).toHaveBeenCalledTimes(1);
  expect(seen).toBe(true);
  rerender(<PrintSummary {...props} press={2} />);
  await act(async () => {
    vi.advanceTimersByTime(20);
  });
  expect(print).toHaveBeenCalledTimes(2);
  vi.useRealTimers();
});

test("a side with no fine notes carries the same ask as the panel, after the candidate lines", () => {
  page([entry()]);
  const ask = screen.getByText(en["notebook.needFine"]);
  const last = screen.getAllByRole("listitem").at(-1)!;
  expect(last.compareDocumentPosition(ask) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
});

test("a list that may be incomplete says so on the page", () => {
  page([entry({ pick: { kind: "movement", id: "knee-flexion" } })]);
  expect(screen.getByText(en["notebook.incomplete"])).toBeTruthy();
});

test("the review build prints the review banner instead of the basis line", () => {
  const model = summaryModel([entry()], makeMovementBundle("review"), now, true, "en");
  render(<Summary t={t} lang="en" bundle={makeMovementBundle("review")} model={model} />);
  expect(screen.getByText(en["review.banner"])).toBeTruthy();
  expect(screen.queryByText(en["summary.basis"])).toBeNull();
});

test("the printed list shows the uncertainty notes for each structure", () => {
  const bundle = makeMovementBundle();
  bundle.actions = bundle.actions.map((a) => (a.id === "m1" ? { ...a, confidence: "medium" as const, applies_to: "pincer hips" } : a));
  render(<Summary t={t} lang="en" bundle={bundle} model={summaryModel([entry()], bundle, now, true, "en")} />);
  const item = screen.getByText(/^Piriformis: loaded/).closest("li") as HTMLElement;
  expect(within(item).getByText(en["confidence.medium"])).toBeTruthy();
  expect(within(item).getByText(t("info.appliesTo", { text: "pincer hips" }))).toBeTruthy();
});

test("nothing in the printed summary uses the pale muted class", () => {
  const bundle = makeMovementBundle();
  bundle.actions = bundle.actions.map((a) => (a.id === "m1" ? { ...a, confidence: "medium" as const, applies_to: "pincer hips" } : a));
  const { container } = render(<Summary t={t} lang="en" bundle={bundle} model={summaryModel([entry()], bundle, now, true, "en")} />);
  expect(screen.getByText(en["confidence.medium"])).toBeTruthy();
  expect(container.querySelectorAll(".muted").length).toBe(0);
});

test("the printed dates are in the reader's language", () => {
  const de = createT(deTexts, en);
  const model = summaryModel([entry({ date: "2026-11-13" }), entry({ id: "o", date: "2026-10-01", feeling: "fine" })], b, now, false, "de");
  const { container } = render(<Summary t={de} lang="de" bundle={b} model={model} />);
  expect(container.querySelector("td")!.textContent).toBe("13.11.2026");
  expect(screen.getByText(de("summary.printed", { date: "14.11.2026" }))).toBeTruthy();
  expect(screen.getByText(de("summary.range", { from: "01.10.2026", to: "13.11.2026" }))).toBeTruthy();
});
