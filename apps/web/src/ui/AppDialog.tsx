import { useEffect, useId, useRef, type ReactNode } from "react";
import { CloseIcon } from "./icons";

type Props = {
  open: boolean;
  title: string;
  closeLabel: string;
  onClose: () => void;
  children: ReactNode;
};

// A modal on the native dialog element, which brings the focus handling and the Escape key.
// The app owns the open state: the button, Escape and a click on the backdrop all call onClose.
// Closed, it renders nothing, so its content is not in the page.
// When it closes, the focus goes back to whatever had it before, usually the button that opened it.
export function AppDialog({ open, title, closeLabel, onClose, children }: Props) {
  const ref = useRef<HTMLDialogElement>(null);
  const titleId = useId();
  // True while the cleanup below closes the dialog itself, so that close is not reported back to the app.
  // Browsers send the close event a moment later, so the handler also skips a dialog that is open again by then.
  const closingHere = useRef(false);

  useEffect(() => {
    const dialog = ref.current;
    if (!open || !dialog) return;
    const opener = document.activeElement instanceof HTMLElement ? document.activeElement : null;
    if (!dialog.open) dialog.showModal();
    return () => {
      if (dialog.open) {
        closingHere.current = true;
        dialog.close();
        closingHere.current = false;
      }
      if (opener && opener !== document.body && opener.isConnected) opener.focus();
    };
  }, [open]);

  if (!open) return null;
  return (
    <dialog
      ref={ref}
      className="app-dialog"
      aria-labelledby={titleId}
      // Escape: keep the dialog in the page until the app has changed its state.
      onCancel={(event) => {
        event.preventDefault();
        onClose();
      }}
      // A close that did not come through cancel, for example one the browser made on its own,
      // still tells the app, so its state cannot stay open.
      onClose={(event) => {
        if (!closingHere.current && !event.currentTarget.open) onClose();
      }}
      // The backdrop is part of the dialog box, so a click on it has the dialog itself as its target.
      onClick={(event) => {
        if (event.target === event.currentTarget) onClose();
      }}
    >
      <div className="app-dialog-body">
        <div className="app-dialog-head">
          <h2 id={titleId}>{title}</h2>
          <button type="button" className="btn app-dialog-close" aria-label={closeLabel} onClick={onClose}>
            <CloseIcon size={18} />
          </button>
        </div>
        {children}
      </div>
    </dialog>
  );
}
