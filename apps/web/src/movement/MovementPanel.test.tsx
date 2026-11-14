import { cleanup, fireEvent, render, screen, within } from "@testing-library/react";
import { useState } from "react";
import { afterEach, expect, test, vi } from "vitest";
import type { RegionBundle } from "../data/bundle";
import en from "../i18n/en.json";
import { createT } from "../i18n/t";
import type { Selection } from "../viewer/pick";
import { makeMovementBundle } from "./fixture";
import { MovementPanel } from "./MovementPanel";
import { initialMovementState } from "./state";

const t = createT(en);
afterEach(cleanup);

// The app keeps the movement state, so the tests do the same.
function Harness({ bundle, selection, onFocusStructure }: { bundle: RegionBundle; selection: Selection | null; onFocusStructure: (sid: string) => void }) {
  const [state, setState] = useState(initialMovementState);
  return (
    <MovementPanel
      t={t}
      bundle={bundle}
      state={state}
      onChange={setState}
      selection={selection}
      onFocusStructure={onFocusStructure}
      onOpenStructure={() => {}}
    />
  );
}

function show(bundle = makeMovementBundle(), { selection = null as Selection | null, onFocusStructure = vi.fn() } = {}) {
  render(<Harness bundle={bundle} selection={selection} onFocusStructure={onFocusStructure} />);
  return { onFocusStructure };
}

const pick = (name: string) => fireEvent.click(screen.getByRole("button", { name }));
// The structure buttons in the order they show.
const structureButtons = () => screen.getAllByRole("button").filter((b) => b.classList.contains("movement-structure"));

test("lists movements by joint and the exercises", () => {
  show();
  expect(screen.getByRole("heading", { name: en["movement.pick"] })).toBeTruthy();
  const hip = screen.getByRole("heading", { name: "Hip" }).parentElement!;
  const knee = screen.getByRole("heading", { name: "Knee" }).parentElement!;
  expect(within(hip).getByRole("button", { name: "Hip external rotation" })).toBeTruthy();
  expect(within(hip).queryByRole("button", { name: "Knee flexion" })).toBeNull();
  expect(within(knee).getByRole("button", { name: "Knee flexion" })).toBeTruthy();
  expect(screen.getByRole("heading", { name: "Exercises" })).toBeTruthy();
  expect(screen.getByRole("button", { name: "Bodyweight squat" })).toBeTruthy();
});

test("picking external rotation shows main movers and helpers in order", () => {
  show();
  pick("Hip external rotation");
  expect(screen.getByRole("heading", { name: "Hip external rotation", level: 2 })).toBeTruthy();
  const headings = screen.getAllByRole("heading", { level: 3 }).map((h) => h.textContent);
  expect(headings).toEqual(["Main movers", "Helpers"]);
  expect(structureButtons().map((b) => b.textContent)).toEqual(["Obturator externus", "Piriformis", "Gluteus maximus"]);
  expect(screen.getByLabelText("With the hip bent at 0 degrees")).toBeTruthy();
  expect(screen.getByText(en["movement.hiddenNote"])).toBeTruthy();
  expect(screen.queryByText(en["movement.none"])).toBeNull();
});

test("moving the slider to 65 puts both deep rotators under the silent heading", () => {
  show();
  pick("Hip external rotation");
  const slider = screen.getByRole("slider");
  expect(slider.getAttribute("step")).toBe("5");
  expect(slider.getAttribute("min")).toBe("0");
  expect(slider.getAttribute("max")).toBe("90");
  fireEvent.change(slider, { target: { value: "65" } });
  expect(screen.getByLabelText("With the hip bent at 65 degrees")).toBeTruthy();
  const silent = screen.getByRole("heading", { name: en["movement.silent"] }).parentElement!;
  expect(within(silent).getAllByRole("listitem").map((li) => li.textContent)).toEqual(["Obturator externus", "Piriformis"]);
  expect(structureButtons().map((b) => b.textContent)).toEqual(["Gluteus maximus"]);
});

test("a movement with no rows says so and shows no groups", () => {
  show();
  pick("Knee extension");
  expect(screen.getByText(en["movement.none"])).toBeTruthy();
  expect(screen.queryByText("Main movers")).toBeNull();
  expect(screen.queryByText(en["movement.pending"])).toBeNull();
  expect(screen.queryByText(en["movement.hiddenNote"])).toBeNull();
  expect(screen.queryByRole("slider")).toBeNull();
});

test("a movement with waiting rows shows the waiting line", () => {
  show();
  pick("Knee flexion");
  expect(screen.getByText(en["movement.none"])).toBeTruthy();
  expect(screen.getByText(en["movement.pending"])).toBeTruthy();
});

test("the review build does not repeat the waiting line", () => {
  show(makeMovementBundle("review"));
  pick("Knee flexion");
  expect(screen.queryByText(en["movement.pending"])).toBeNull();
});

test("an exercise shows its phases, the progress slider and the effort note", () => {
  show();
  pick("Bodyweight squat");
  expect(screen.getByRole("heading", { name: "Bodyweight squat", level: 2 })).toBeTruthy();
  expect(screen.getByRole("button", { name: "Lowering" }).getAttribute("aria-pressed")).toBe("true");
  expect(screen.getByRole("button", { name: "Rising" }).getAttribute("aria-pressed")).toBe("false");
  const slider = screen.getByLabelText("Through the phase: 0 percent");
  expect([slider.getAttribute("min"), slider.getAttribute("max"), slider.getAttribute("step")]).toEqual(["0", "100", "5"]);
  expect(screen.getByText(en["movement.effortNote"])).toBeTruthy();
  // Lowering lights the hip extensors that control it, not the hip flexors.
  expect(structureButtons().map((b) => b.textContent)).toEqual(["Gluteus maximus"]);
  fireEvent.change(slider, { target: { value: "50" } });
  expect(screen.getByLabelText("Through the phase: 50 percent")).toBeTruthy();
  pick("Rising");
  expect(screen.getByRole("button", { name: "Rising" }).getAttribute("aria-pressed")).toBe("true");
  expect(screen.getByLabelText("Through the phase: 0 percent")).toBeTruthy();
});

test("the structure button reports the structure", () => {
  const { onFocusStructure } = show();
  pick("Hip external rotation");
  fireEvent.click(screen.getByRole("button", { name: "Piriformis" }));
  expect(onFocusStructure).toHaveBeenCalledWith("piriformis");
});

test("the selected structure is marked as current", () => {
  show(makeMovementBundle(), { selection: { sid: "piriformis", side: "l" } });
  pick("Hip external rotation");
  expect(screen.getByRole("button", { name: "Piriformis" }).getAttribute("aria-current")).toBe("true");
  expect(screen.getByRole("button", { name: "Gluteus maximus" }).getAttribute("aria-current")).toBeNull();
});

test("the back button returns to the picker", () => {
  show();
  pick("Hip external rotation");
  pick(en["movement.back"]);
  expect(screen.getByRole("heading", { name: en["movement.pick"] })).toBeTruthy();
});

test("the review build marks a draft exercise and shows its question", () => {
  show(makeMovementBundle("review"));
  pick("Glute bridge");
  expect(screen.getByText(en["review.draft"])).toBeTruthy();
  expect(screen.getByText(t("review.note", { note: "Is the range right?" }))).toBeTruthy();
});

test("no exercises and one waiting shows the waiting line for exercises", () => {
  show({ ...makeMovementBundle(), exercises: [], pendingExercises: 1 });
  expect(screen.getByRole("heading", { name: "Exercises" })).toBeTruthy();
  expect(screen.getByText(en["movement.exercisesPending"])).toBeTruthy();
});

test("no exercises and nothing waiting shows no exercise heading", () => {
  show({ ...makeMovementBundle(), exercises: [], pendingExercises: 0 });
  expect(screen.queryByRole("heading", { name: "Exercises" })).toBeNull();
  expect(screen.queryByText(en["movement.exercisesPending"])).toBeNull();
});
