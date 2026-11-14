import { useId, useState } from "react";
import type { Translate } from "../i18n/t";
import { NOTE_MAX, type EntrySide, type Feeling } from "./types";

type Props = {
  t: Translate;
  onSave: (input: { feeling: Feeling; side: EntrySide; note: string }) => void;
  onCancel: () => void;
};

const FEELINGS: Feeling[] = ["painful", "fine"];
const SIDES: EntrySide[] = ["l", "r", "both"];

// The small form under "Log this movement": how it feels, which side, and an optional note.
// Save stays off until a feeling and a side are chosen.
export function LogForm({ t, onSave, onCancel }: Props) {
  const feelingLabel = useId();
  const sideLabel = useId();
  const [feeling, setFeeling] = useState<Feeling | null>(null);
  const [side, setSide] = useState<EntrySide | null>(null);
  const [note, setNote] = useState("");

  return (
    <div className="log-form">
      <div className="movement-choices" role="group" aria-labelledby={feelingLabel}>
        <span id={feelingLabel} className="muted">
          {t("notebook.feeling")}
        </span>
        {FEELINGS.map((f) => (
          <button key={f} type="button" aria-pressed={f === feeling} onClick={() => setFeeling(f)}>
            {t(`notebook.${f}`)}
          </button>
        ))}
      </div>
      <div className="movement-choices" role="group" aria-labelledby={sideLabel}>
        <span id={sideLabel} className="muted">
          {t("notebook.side")}
        </span>
        {SIDES.map((s) => (
          <button key={s} type="button" aria-pressed={s === side} onClick={() => setSide(s)}>
            {t(`notebook.side.${s}`)}
          </button>
        ))}
      </div>
      <label className="log-note">
        <span>{t("notebook.note")}</span>
        <textarea value={note} maxLength={NOTE_MAX} rows={2} onChange={(e) => setNote(e.target.value)} />
      </label>
      <div className="panel-actions">
        <button type="button" disabled={!feeling || !side} onClick={() => feeling && side && onSave({ feeling, side, note })}>
          {t("notebook.save")}
        </button>
        <button type="button" onClick={onCancel}>
          {t("notebook.cancel")}
        </button>
      </div>
    </div>
  );
}

// React.lazy loads this default export.
export default LogForm;
