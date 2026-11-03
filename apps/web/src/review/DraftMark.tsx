import type { Translate } from "../i18n/t";

type Props = { id: string; note?: string; t: Translate };

// The marker for a row nobody has checked yet: a label, the row code and the question for the reviewer.
export function DraftMark({ id, note, t }: Props) {
  return (
    <div className="draft-mark">
      <strong className="draft-badge">{t("review.draft")}</strong>
      <div className="muted">{t("review.rowId", { id })}</div>
      {note && <div className="review-note">{t("review.note", { note })}</div>}
    </div>
  );
}
