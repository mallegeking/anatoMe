import { act, cleanup, render, screen, within } from "@testing-library/react";
import { afterEach, expect, test, vi } from "vitest";
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
  const model = summaryModel(entries, b, now, withComparison);
  return render(<Summary t={t} bundle={b} model={model} />);
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
  expect(cells[0].textContent).toBe("2026-11-13");
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

test("print runs once per press and only after the summary is in the document", async () => {
  vi.useFakeTimers({ toFake: ["requestAnimationFrame", "cancelAnimationFrame"] });
  let seen: boolean | null = null;
  const print = vi.spyOn(window, "print").mockImplementation(() => {
    seen = document.querySelector("section.print-summary") !== null;
  });
  const props = { t, bundle: b, entries: [entry()] };
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
