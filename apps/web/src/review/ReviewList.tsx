import type { RegionBundle } from "../data/bundle";
import type { Lang } from "../i18n/lang";
import { nameOf } from "../i18n/names";
import type { Translate } from "../i18n/t";
import { describeAction } from "../data/describe";
import { ActionNotes, boneLabel, Sources } from "../ui/InfoPanel";
import { DraftMark } from "./DraftMark";

type Props = { bundle: RegionBundle; t: Translate; lang: Lang; onClose: () => void };

// Every draft action and attachment, grouped by structure, so the reviewer can go through them one by one.
// Each action shows the whole claim in the same words as the info panel, plus its row code, sources and question.
export function ReviewList({ bundle, t, lang, onClose }: Props) {
  const movementName = (id: string) => {
    const movement = bundle.movements.find((m) => m.id === id);
    return movement ? nameOf(movement, lang) : id;
  };

  const groups = bundle.structures
    .map((structure) => ({
      structure,
      attachments: bundle.attachments.filter((a) => a.draft && a.muscle === structure.id),
      actions: bundle.actions.filter((a) => a.draft && a.structure === structure.id),
    }))
    .filter((g) => g.attachments.length > 0 || g.actions.length > 0);

  const exercises = bundle.exercises.filter((e) => e.draft);

  return (
    <section className="review-list" aria-label={t("review.list")}>
      <div className="review-list-bar">
        <h2>{t("review.list")}</h2>
        <button type="button" onClick={onClose}>
          {t("review.close")}
        </button>
      </div>
      {groups.length === 0 && exercises.length === 0 && <p className="muted">{t("review.empty")}</p>}
      {groups.map(({ structure, attachments, actions }) => (
        <div key={structure.id}>
          <h3>{nameOf(structure, lang)}</h3>
          <ul>
            {attachments.map((a) => (
              <li key={a.id}>
                <div>
                  {t("review.attachment", {
                    // The label and the value, joined as the single sentence the reviewer has always seen.
                    text: `${t(a.end === "origin" ? "info.originLabel" : "info.insertionLabel")}: ${t(a.end === "origin" ? "info.originValue" : "info.insertionValue", { landmark: a.landmark, bone: boneLabel(bundle, a.bone, lang) })}`,
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
      {exercises.length > 0 && (
        <div>
          <h3>{t("review.exercises")}</h3>
          <ul>
            {exercises.map((e) => (
              <li key={e.id}>
                <div>{nameOf(e, lang)}</div>
                {e.phases.map((p) => (
                  <div key={p.id}>
                    {t("review.phase", {
                      phase: nameOf(p, lang),
                      path: p.path.map((step) => t("review.pathStep", { angle: t(`angle.${step.angle}`), from: String(step.from), to: String(step.to) })).join(", "),
                      effort: p.effort.map(movementName).join(", "),
                    })}
                  </div>
                ))}
                <DraftMark id={e.id} note={e.review_note} t={t} />
                <Sources uses={e.citations} bundle={bundle} t={t} />
              </li>
            ))}
          </ul>
        </div>
      )}
    </section>
  );
}
