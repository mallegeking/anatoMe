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
export function AppDialog({ open, title, closeLabel, onClose, children }: Props) {
  const ref = useRef<HTMLDialogElement>(null);
  const titleId = useId();

  useEffect(() => {
    const dialog = ref.current;
    if (open && dialog && !dialog.open) dialog.showModal();
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
