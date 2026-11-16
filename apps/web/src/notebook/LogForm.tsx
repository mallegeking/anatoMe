import { useEffect, useId, useRef, useState } from "react";
import type { Translate } from "../i18n/t";
import { NOTE_MAX, type EntrySide, type Feeling } from "./types";

type Props = {
  t: Translate;
  onSave: (input: { feeling: Feeling; side: EntrySide; note: string }) => void;
  onCancel: () => void;
  // True while a save is under way. Save and Cancel wait until it is done.
  saving?: boolean;
  // Why the last save failed, shown next to the Save button, or null.
  failure?: string | null;
  // Called on every change to the form, so an old failure message can go.
  onEdit?: () => void;
};

const FEELINGS: Feeling[] = ["painful", "fine"];
const SIDES: EntrySide[] = ["l", "r", "both"];

// The small form under "Log this movement": how it feels, which side, and an optional note.
// Save stays off until a feeling and a side are chosen.
export function LogForm({ t, onSave, onCancel, saving = false, failure = null, onEdit }: Props) {
  const feelingLabel = useId();
  const sideLabel = useId();
  const [feeling, setFeeling] = useState<Feeling | null>(null);
  const [side, setSide] = useState<EntrySide | null>(null);
  const [note, setNote] = useState("");
  // When the form opens, focus goes to its first button.
  const firstFeeling = useRef<HTMLButtonElement>(null);
  useEffect(() => firstFeeling.current?.focus(), []);
  // The message sits right above Save and pushes it down. Scroll the panel just enough to show both.
  const failureLine = useRef<HTMLParagraphElement>(null);
  useEffect(() => {
    const line = failureLine.current;
    if (!failure || !line) return;
    line.nextElementSibling?.scrollIntoView?.({ block: "nearest" });
    line.scrollIntoView?.({ block: "nearest" });
  }, [failure]);
  const edit = <T,>(set: (value: T) => void) => (value: T) => {
    set(value);
    onEdit?.();
  };
  const chooseFeeling = edit(setFeeling);
  const chooseSide = edit(setSide);
  const type = edit(setNote);

  return (
    <div className="log-form" aria-busy={saving}>
      <div className="movement-choices" role="group" aria-labelledby={feelingLabel}>
        <span id={feelingLabel} className="muted">
          {t("notebook.feeling")}
        </span>
        {FEELINGS.map((f, i) => (
          <button className="btn" key={f} ref={i === 0 ? firstFeeling : undefined} type="button" aria-pressed={f === feeling} onClick={() => chooseFeeling(f)}>
            {t(`notebook.${f}`)}
          </button>
        ))}
      </div>
      <div className="movement-choices" role="group" aria-labelledby={sideLabel}>
        <span id={sideLabel} className="muted">
          {t("notebook.side")}
        </span>
        {SIDES.map((s) => (
          <button className="btn" key={s} type="button" aria-pressed={s === side} onClick={() => chooseSide(s)}>
            {t(`notebook.side.${s}`)}
          </button>
        ))}
      </div>
      <label className="log-note">
        <span>{t("notebook.note")}</span>
        {/* Some browsers can send typed text to an online spell check, and notes must stay on the device. */}
        <textarea spellCheck={false} value={note} maxLength={NOTE_MAX} rows={2} onChange={(e) => type(e.target.value)} />
      </label>
      {failure && (
        <p className="log-failure" role="alert" ref={failureLine}>
          {failure}
        </p>
      )}
      <div className="panel-actions">
        <button className="btn btn--primary" type="button" disabled={!feeling || !side || saving} onClick={() => feeling && side && onSave({ feeling, side, note })}>
          {t("notebook.save")}
        </button>
        <button className="btn" type="button" disabled={saving} onClick={onCancel}>
          {t("notebook.cancel")}
        </button>
      </div>
    </div>
  );
}

// React.lazy loads this default export.
export default LogForm;
