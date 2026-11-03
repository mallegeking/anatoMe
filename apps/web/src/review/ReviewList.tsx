import type { RegionBundle } from "../data/bundle";
import type { Translate } from "../i18n/t";
import { describeAction } from "../data/describe";
import { ActionNotes, Sources } from "../ui/InfoPanel";
import { DraftMark } from "./DraftMark";

type Props = { bundle: RegionBundle; t: Translate; onClose: () => void };

// Every draft action and attachment, grouped by structure, so the reviewer can go through them one by one.
// Each action shows the whole claim in the same words as the info panel, plus its row code, sources and question.
export function ReviewList({ bundle, t, onClose }: Props) {
  const name = (id: string) => bundle.structures.find((s) => s.id === id)?.english ?? id;
  const lower = (id: string) => name(id).toLowerCase();
  const movementName = (id: string) => bundle.movements.find((m) => m.id === id)?.english ?? id;

  const groups = bundle.structures
    .map((structure) => ({
      structure,
      attachments: bundle.attachments.filter((a) => a.draft && a.muscle === structure.id),
      actions: bundle.actions.filter((a) => a.draft && a.structure === structure.id),
    }))
    .filter((g) => g.attachments.length > 0 || g.actions.length > 0);

  return (
    <section className="review-list" aria-label={t("review.list")}>
      <div className="review-list-bar">
        <h2>{t("review.list")}</h2>
        <button type="button" onClick={onClose}>
          {t("review.close")}
        </button>
      </div>
      {groups.length === 0 && <p className="muted">{t("review.empty")}</p>}
      {groups.map(({ structure, attachments, actions }) => (
        <div key={structure.id}>
          <h3>{structure.english}</h3>
          <ul>
            {attachments.map((a) => (
              <li key={a.id}>
                <div>
                  {t("review.attachment", {
                    text: t(a.end === "origin" ? "info.origin" : "info.insertion", { landmark: a.landmark, bone: lower(a.bone) }),
                  })}
                </div>
                <DraftMark id={a.id} t={t} />
                <Sources uses={a.citations} bundle={bundle} t={t} />
              </li>
            ))}
            {actions.map((a) => (
              <li key={a.id}>
                <div>{t("review.action", { movement: movementName(a.movement), text: describeAction(a, t) })}</div>
                <ActionNotes action={a} t={t} />
                <DraftMark id={a.id} note={a.review_note} t={t} />
                <Sources uses={a.citations} bundle={bundle} t={t} />
              </li>
            ))}
          </ul>
        </div>
      ))}
    </section>
  );
}
