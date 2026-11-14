import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, expect, test, vi } from "vitest";
import en from "../i18n/en.json";
import { createT } from "../i18n/t";
import { LogForm } from "./LogForm";

const t = createT(en);
afterEach(cleanup);

function show() {
  const onSave = vi.fn();
  const onCancel = vi.fn();
  render(<LogForm t={t} onSave={onSave} onCancel={onCancel} />);
  return { onSave, onCancel };
}

const click = (name: string) => fireEvent.click(screen.getByRole("button", { name }));
const save = () => screen.getByRole("button", { name: en["notebook.save"] }) as HTMLButtonElement;

test("saving reports feeling, side and note", () => {
  const { onSave } = show();
  click(en["notebook.painful"]);
  click(en["notebook.side.l"]);
  fireEvent.change(screen.getByLabelText(en["notebook.note"]), { target: { value: "after a run" } });
  click(en["notebook.save"]);
  expect(onSave).toHaveBeenCalledTimes(1);
  expect(onSave).toHaveBeenCalledWith({ feeling: "painful", side: "l", note: "after a run" });
});

test("save is disabled until a feeling and a side are chosen", () => {
  const { onSave } = show();
  expect(save().disabled).toBe(true);
  click(en["notebook.fine"]);
  expect(save().disabled).toBe(true);
  click(en["notebook.side.both"]);
  expect(save().disabled).toBe(false);
  click(en["notebook.save"]);
  expect(onSave).toHaveBeenCalledWith({ feeling: "fine", side: "both", note: "" });
});

test("the note field stops at 500 characters", () => {
  show();
  expect(screen.getByLabelText(en["notebook.note"]).getAttribute("maxLength")).toBe("500");
});

test("the chosen feeling and side are marked as pressed", () => {
  show();
  click(en["notebook.painful"]);
  click(en["notebook.side.r"]);
  expect(screen.getByRole("button", { name: en["notebook.painful"] }).getAttribute("aria-pressed")).toBe("true");
  expect(screen.getByRole("button", { name: en["notebook.fine"] }).getAttribute("aria-pressed")).toBe("false");
  expect(screen.getByRole("button", { name: en["notebook.side.r"] }).getAttribute("aria-pressed")).toBe("true");
});

test("cancel reports it and saves nothing", () => {
  const { onSave, onCancel } = show();
  click(en["notebook.cancel"]);
  expect(onCancel).toHaveBeenCalledTimes(1);
  expect(onSave).not.toHaveBeenCalled();
});
