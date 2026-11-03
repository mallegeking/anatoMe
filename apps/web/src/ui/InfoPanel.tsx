import { useState } from "react";
import type { BundleAction, BundleCitationUse, RegionBundle } from "../data/bundle";
import { describeAction, jointOf } from "../data/describe";
import type { Translate } from "../i18n/t";
import { DraftMark } from "../review/DraftMark";
import type { Selection } from "../viewer/pick";

type Props = {
  selection: Selection;
  bundle: RegionBundle;
  t: Translate;
  // Name from the 3D file, used when the bundle does not know this structure.
  fallbackLabel?: string;
  onSwitchSide: () => void;
  onHide: () => void;
};

// One line for each structure with a part that the model does not show yet. The value is the en.json key.
const GAP_LINES: Record<string, string> = {
  "rectus-femoris": "info.gap.quadriceps",
  "vastus-lateralis": "info.gap.quadriceps",
  "vastus-medialis": "info.gap.quadriceps",
  "vastus-intermedius": "info.gap.quadriceps",
  // The vertebrae are not modelled, so psoas major has no origin row.
  "psoas-major": "info.gap.psoasOrigin",
};

export function Sources({ uses, bundle, t }: { uses: BundleCitationUse[]; bundle: RegionBundle; t: Translate }) {
  const [open, setOpen] = useState(false);
  if (uses.length === 0) return null;
  return (
    <div className="sources">
      <button type="button" className="link-button" aria-expanded={open} onClick={() => setOpen(!open)}>
        {t("info.sources")}
      </button>
      {open && (
        <ul>
          {uses.map((use, i) => {
            const citation = bundle.citations.find((c) => c.id === use.ref);
            return (
              <li key={i}>
                <div>{citation ? t("source.citation", { authors: citation.authors, year: String(citation.year), title: citation.title }) : use.ref}</div>
                {citation && (
                  <div className="muted">
                    <a href={citation.url} target="_blank" rel="noopener noreferrer">
                      {t("source.link")}
                    </a>{" "}
                    {t("source.licence", { license: citation.license })}
                  </div>
                )}
                <div className="muted">{t("source.where", { locator: use.locator })}</div>
                <div>
                  <strong>{t("source.label", { kind: t(use.says_kind === "quote" ? "source.quote" : "source.summary") })}</strong> {use.says}
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}

// The lines under an action's sentence: which hips it applies to, if limited, and how well supported it is.
// The review list shows the same lines, so the reviewer sees the whole claim.
export function ActionNotes({ action, t }: { action: BundleAction; t: Translate }) {
  return (
    <>
      {action.applies_to && <div className="muted">{t("info.appliesTo", { text: action.applies_to })}</div>}
      <div className="muted">{t(`confidence.${action.confidence}`)}</div>
    </>
  );
}

function ActionRow({ action, bundle, t }: { action: BundleAction; bundle: RegionBundle; t: Translate }) {
  return (
    <li>
      {/* For example "works (main), with the hip bent between 0 and 45 degrees". */}
      <div>{describeAction(action, t)}</div>
      <ActionNotes action={action} t={t} />
      {bundle.mode === "review" && action.draft && <DraftMark id={action.id} note={action.review_note} t={t} />}
      {bundle.mode === "review" && !action.draft && action.review_note && <div className="review-note">{t("review.note", { note: action.review_note })}</div>}
      <Sources uses={action.citations} bundle={bundle} t={t} />
    </li>
  );
}

export function InfoPanel({ selection, bundle, t, fallbackLabel, onSwitchSide, onHide }: Props) {
  const structure = bundle.structures.find((s) => s.id === selection.sid);
  const name = structure?.english ?? fallbackLabel ?? selection.sid;
  const sideText = selection.side === "l" ? t("side.left", { label: name }) : selection.side === "r" ? t("side.right", { label: name }) : name;

  const boneName = (id: string) => (bundle.structures.find((s) => s.id === id)?.english ?? id).toLowerCase();
  const attachments = structure ? bundle.attachments.filter((a) => a.muscle === selection.sid) : [];
  const actions = structure ? bundle.actions.filter((a) => a.structure === selection.sid) : [];
  // In the review build the draft rows are shown above, so the waiting line would only repeat them.
  const pending = structure && bundle.mode !== "review" ? (bundle.pendingByStructure[selection.sid] ?? 0) : 0;

  // Group the rows by joint (hip, knee) and then by movement, keeping the order of the bundle's movement list.
  // A joint gets its heading only when it has rows.
  const joints = [...new Set(bundle.movements.map(jointOf))]
    .map((joint) => ({
      joint,
      groups: bundle.movements
        .filter((movement) => jointOf(movement) === joint)
        .map((movement) => ({ movement, rows: actions.filter((a) => a.movement === movement.id) }))
        .filter((g) => g.rows.length > 0),
    }))
    .filter((j) => j.groups.length > 0);
  const gap = GAP_LINES[selection.sid];

  return (
    <section className="info-panel" data-testid="info-panel">
      <h2 className="info-name">{sideText}</h2>
      {structure?.latin && <p className="muted">{t("info.latin", { latin: structure.latin })}</p>}
      {structure && <p className="muted">{t("info.type", { type: t(`type.${structure.type}`) })}</p>}

      {attachments.length > 0 && (
        <div>
          <h3>{t("info.attachments")}</h3>
          <ul>
            {attachments.map((a) => (
              <li key={a.id}>
                {t(a.end === "origin" ? "info.origin" : "info.insertion", { landmark: a.landmark, bone: boneName(a.bone) })}
                {bundle.mode === "review" && a.draft && <DraftMark id={a.id} t={t} />}
                <Sources uses={a.citations} bundle={bundle} t={t} />
              </li>
            ))}
          </ul>
        </div>
      )}

      {joints.map(({ joint, groups }) => (
        <div key={joint}>
          <h3>{t(`info.does.${joint}`)}</h3>
          {groups.map(({ movement, rows }) => (
            <div key={movement.id}>
              <h4>{movement.english}</h4>
              <ul>
                {rows.map((action) => (
                  <ActionRow key={action.id} action={action} bundle={bundle} t={t} />
                ))}
              </ul>
            </div>
          ))}
        </div>
      ))}

      {pending > 0 && <p className="muted">{t("info.pending")}</p>}
      {gap && <p className="muted">{t(gap)}</p>}

      <div className="panel-actions">
        {selection.side !== "" && (
          <button type="button" onClick={onSwitchSide}>
            {t("info.switchSide")}
          </button>
        )}
        <button type="button" onClick={onHide}>
          {t("info.hide")}
        </button>
      </div>
    </section>
  );
}
