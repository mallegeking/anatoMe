import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, expect, test, vi } from "vitest";
import { AppDialog } from "./AppDialog";

afterEach(cleanup);

function open(onClose = vi.fn()) {
  render(
    <AppDialog open title="Settings" closeLabel="Close" onClose={onClose}>
      <p>Inside</p>
    </AppDialog>,
  );
  return onClose;
}

test("opens as a modal with its title and closes on the button, on Escape and on the backdrop", () => {
  const onClose = open();
  const dialog = screen.getByRole("dialog", { name: "Settings" });
  expect(dialog.hasAttribute("open")).toBe(true);
  expect(screen.getByRole("heading", { name: "Settings", level: 2 })).toBeTruthy();
  expect(screen.getByText("Inside")).toBeTruthy();
  fireEvent.click(screen.getByRole("button", { name: "Close" }));
  expect(onClose).toHaveBeenCalledTimes(1);
  // Escape reaches the dialog as a cancel event.
  fireEvent(dialog, new Event("cancel", { cancelable: true }));
  expect(onClose).toHaveBeenCalledTimes(2);
  // A click on the backdrop lands on the dialog itself, a click inside lands on its content.
  fireEvent.click(screen.getByText("Inside"));
  expect(onClose).toHaveBeenCalledTimes(2);
  fireEvent.click(dialog);
  expect(onClose).toHaveBeenCalledTimes(3);
});

test("closed means nothing is shown", () => {
  render(
    <AppDialog open={false} title="Settings" closeLabel="Close" onClose={() => {}}>
      <p>Inside</p>
    </AppDialog>,
  );
  expect(screen.queryByRole("dialog")).toBeNull();
  expect(screen.queryByText("Inside")).toBeNull();
});
