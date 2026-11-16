import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { useState } from "react";
import { afterEach, expect, test, vi } from "vitest";
import type { BundleStructure } from "../data/bundle";
import en from "../i18n/en.json";
import type { Lang } from "../i18n/lang";
import { createT } from "../i18n/t";
import { TopBar } from "./TopBar";

const t = createT(en);
afterEach(cleanup);

const structures: BundleStructure[] = [
  { id: "piriformis", type: "muscle", english: "Piriformis", german: "Birnenförmiger Muskel", latin: "Musculus piriformis", depth: 2, paired: true },
  { id: "femur", type: "bone", english: "Femur", depth: 4, paired: true },
];

// The app keeps the open state of the list, so the tests do the same.
function Harness({ onChoose, lang = "en" }: { onChoose: (s: BundleStructure) => void; lang?: Lang }) {
  const [open, setOpen] = useState(false);
  return (
    <TopBar
      t={t}
      lang={lang}
      structures={structures}
      layersOpen={false}
      onToggleLayers={() => {}}
      onChoose={onChoose}
      open={open}
      onOpenChange={setOpen}
      regions={["hip"]}
      region="hip"
      onRegion={() => {}}
    />
  );
}

function show(onChoose = vi.fn(), lang: Lang = "en") {
  render(<Harness onChoose={onChoose} lang={lang} />);
  return { onChoose, field: screen.getByPlaceholderText("Search, for example piriformis") };
}

test("typing lists matches and choosing one reports it and closes the list", () => {
  const { onChoose, field } = show();
  fireEvent.change(field, { target: { value: "pirif" } });
  fireEvent.click(screen.getByRole("button", { name: /Piriformis/ }));
  expect(onChoose).toHaveBeenCalledWith(structures[0]);
  expect(screen.queryByTestId("search-results")).toBeNull();
});

test("no match says so, and clearing the field closes the list", () => {
  const { field } = show();
  fireEvent.change(field, { target: { value: "zzz" } });
  expect(screen.getByText("No structure found")).toBeTruthy();
  fireEvent.change(field, { target: { value: "" } });
  expect(screen.queryByText("No structure found")).toBeNull();
});

test("the list closes when the search field loses focus", () => {
  const { field } = show();
  fireEvent.change(field, { target: { value: "pirif" } });
  expect(screen.getByTestId("search-results")).toBeTruthy();
  fireEvent.blur(field);
  expect(screen.queryByTestId("search-results")).toBeNull();
});

test("a tap on a result still chooses it, because the press does not take focus from the field", () => {
  const { onChoose, field } = show();
  fireEvent.change(field, { target: { value: "pirif" } });
  const result = screen.getByRole("button", { name: /Piriformis/ });
  // fireEvent returns false when the page cancelled the default action, here moving the focus.
  expect(fireEvent.mouseDown(result)).toBe(false);
  fireEvent.click(result);
  expect(onChoose).toHaveBeenCalledWith(structures[0]);
});

test("the list stays open while the focus moves into it, for example with the Tab key", () => {
  const { field } = show();
  fireEvent.change(field, { target: { value: "pirif" } });
  fireEvent.blur(field, { relatedTarget: screen.getByRole("button", { name: /Piriformis/ }) });
  expect(screen.getByTestId("search-results")).toBeTruthy();
});

test("choosing a result lets go of the field, so the phone keyboard closes", () => {
  const { field } = show();
  field.focus();
  fireEvent.change(field, { target: { value: "pirif" } });
  fireEvent.click(screen.getByRole("button", { name: /Piriformis/ }));
  expect(document.activeElement).not.toBe(field);
});

test("a result shows the English name, the type and the Latin name", () => {
  const { field } = show();
  fireEvent.change(field, { target: { value: "pirif" } });
  const result = screen.getByRole("button", { name: /Piriformis/ });
  expect(result.textContent).toContain(en["type.muscle"]);
  expect(result.textContent).toContain("Musculus piriformis");
});

test("after Escape closed the list, Enter chooses nothing", () => {
  const { onChoose, field } = show();
  fireEvent.change(field, { target: { value: "pirif" } });
  fireEvent.keyDown(field, { key: "Escape" });
  fireEvent.keyDown(field, { key: "Enter" });
  expect(onChoose).not.toHaveBeenCalled();
});

// The region picker. These render the bar directly, because the search state does not matter here.
function showRegions(regions: string[], onRegion = vi.fn()) {
  render(
    <TopBar
      t={t}
      lang="en"
      structures={structures}
      layersOpen={false}
      onToggleLayers={() => {}}
      onChoose={() => {}}
      open={false}
      onOpenChange={() => {}}
      regions={regions}
      region="hip"
      onRegion={onRegion}
    />,
  );
  return onRegion;
}

test("one region shows no picker", () => {
  showRegions(["hip"]);
  expect(screen.queryByLabelText(en["region.label"])).toBeNull();
});

test("two regions show a picker that reports the choice", () => {
  const onRegion = showRegions(["hip", "shoulder"]);
  const picker = screen.getByLabelText(en["region.label"]) as HTMLSelectElement;
  expect(picker.value).toBe("hip");
  expect(screen.getByRole("option", { name: en["region.hip"] })).toBeTruthy();
  fireEvent.change(picker, { target: { value: "shoulder" } });
  expect(onRegion).toHaveBeenCalledWith("shoulder");
});

test("in German the list shows the German name and choosing one puts it in the field", () => {
  const { field } = show(vi.fn(), "de");
  fireEvent.change(field, { target: { value: "birnenformig" } });
  fireEvent.click(screen.getByRole("button", { name: /Birnenförmiger Muskel/ }));
  expect((field as HTMLInputElement).value).toBe("Birnenförmiger Muskel");
});
test("in English the German name is not shown", () => {
  const { field } = show();
  fireEvent.change(field, { target: { value: "pirif" } });
  expect(screen.getByRole("button", { name: /Piriformis/ })).toBeTruthy();
  expect(screen.queryByText("Birnenförmiger Muskel")).toBeNull();
});

test("the app name is a level-1 heading before the search field", () => {
  const { field } = show();
  const heading = screen.getByRole("heading", { level: 1, name: en["app.name"] });
  expect(heading.compareDocumentPosition(field) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
});
