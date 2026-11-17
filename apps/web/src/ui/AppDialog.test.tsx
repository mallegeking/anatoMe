import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { StrictMode, useState } from "react";
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

// The app keeps the open state, and a button opens the dialog, as in the app.
function Harness({ onClose = () => {} }: { onClose?: () => void }) {
  const [open, setOpen] = useState(false);
  return (
    <>
      <button type="button" onClick={() => setOpen(true)}>
        Open settings
      </button>
      <AppDialog
        open={open}
        title="Settings"
        closeLabel="Close"
        onClose={() => {
          onClose();
          setOpen(false);
        }}
      >
        <p>Inside</p>
      </AppDialog>
    </>
  );
}

// Opens the dialog the way a person does: the opener has the focus when it is pressed.
function openFromButton(onClose?: () => void) {
  render(<Harness onClose={onClose} />);
  const opener = screen.getByRole("button", { name: "Open settings" });
  opener.focus();
  fireEvent.click(opener);
  return { opener, dialog: screen.getByRole("dialog", { name: "Settings" }) };
}

const ways: [string, (dialog: HTMLElement) => void][] = [
  ["the close button", () => fireEvent.click(screen.getByRole("button", { name: "Close" }))],
  ["Escape", (dialog) => fireEvent(dialog, new Event("cancel", { cancelable: true }))],
  ["a click on the backdrop", (dialog) => fireEvent.click(dialog)],
];

for (const [way, close] of ways) {
  test(`the focus goes back to the opener after ${way}`, () => {
    const { opener, dialog } = openFromButton();
    screen.getByRole("button", { name: "Close" }).focus();
    close(dialog);
    expect(screen.queryByRole("dialog")).toBeNull();
    expect(document.activeElement).toBe(opener);
  });
}

test("a native close event tells the app, so it does not stay open", () => {
  const onClose = vi.fn();
  const { opener, dialog } = openFromButton(onClose);
  // For example a close the browser did on its own, without a cancel event first.
  (dialog as HTMLDialogElement).close();
  expect(onClose).toHaveBeenCalledTimes(1);
  expect(screen.queryByRole("dialog")).toBeNull();
  expect(document.activeElement).toBe(opener);
});

test("the dialog is closed when it goes away while open", () => {
  const close = vi.spyOn(HTMLDialogElement.prototype, "close");
  const { unmount } = render(
    <AppDialog open title="Settings" closeLabel="Close" onClose={() => {}}>
      <p>Inside</p>
    </AppDialog>,
  );
  unmount();
  expect(close).toHaveBeenCalledTimes(1);
});

test("the focus is not sent to an opener that has left the page", () => {
  function Gone() {
    const [open, setOpen] = useState(false);
    return (
      <>
        {!open && (
          <button type="button" onClick={() => setOpen(true)}>
            Open settings
          </button>
        )}
        <AppDialog open={open} title="Settings" closeLabel="Close" onClose={() => setOpen(false)}>
          <p>Inside</p>
        </AppDialog>
      </>
    );
  }
  render(<Gone />);
  const opener = screen.getByRole("button", { name: "Open settings" });
  opener.focus();
  const focus = vi.spyOn(opener, "focus");
  fireEvent.click(opener);
  fireEvent.click(screen.getByRole("button", { name: "Close" }));
  expect(focus).not.toHaveBeenCalled();
});

test("a dialog that starts open stays open when React runs its effects twice in development", () => {
  const onClose = vi.fn();
  render(
    <StrictMode>
      <AppDialog open title="Settings" closeLabel="Close" onClose={onClose}>
        <p>Inside</p>
      </AppDialog>
    </StrictMode>,
  );
  expect(onClose).not.toHaveBeenCalled();
  expect(screen.getByRole("dialog", { name: "Settings" }).hasAttribute("open")).toBe(true);
});
