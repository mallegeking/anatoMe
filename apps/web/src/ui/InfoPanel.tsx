import { useState } from "react";
import type { BundleAction, BundleCitationUse, RegionBundle } from "../data/bundle";
import { describeCondition, loadWord, roleWord } from "../data/describe";
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

const QUADRICEPS = new Set(["rectus-femoris", "vastus-lateralis", "vastus-medialis", "vastus-intermedius"]);

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
                <div>
                  <strong>{t("source.label", { kind: t(use.says_kind === "quote" ? "source.quote" : "source.summary") })}</strong> {use.says}
                </div>
                <div className="muted">{use.locator}</div>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}

function ActionRow({ action, bundle, t }: { action: BundleAction; bundle: RegionBundle; t: Translate }) {
  // For example "works (main), with the hip bent between 0 and 45 degrees". The punctuation lives in en.json.
  const load = loadWord(action.load, t);
  const withRole = action.role ? t("info.actionRole", { load, role: roleWord(action.role, t) }) : load;
  const when = describeCondition(action.when, t);
  const text = when ? t("info.actionWhen", { text: withRole, when }) : withRole;
  return (
    <li>
      <div>{text}</div>
      {action.applies_to && <div className="muted">{t("info.appliesTo", { text: action.applies_to })}</div>}
      <div className="muted">{t(`confidence.${action.confidence}`)}</div>
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

  // Group the rows by movement, keeping the order of the bundle's movement list.
  const groups = bundle.movements
    .map((movement) => ({ movement, rows: actions.filter((a) => a.movement === movement.id) }))
    .filter((g) => g.rows.length > 0);

  return (
    <section className="info-panel" data-testid="info-panel">
      <h2 className="info-name">{sideText}</h2>
      {structure?.latin && <p className="muted">{t("info.latin", { latin: structure.latin })}</p>}

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

      {groups.length > 0 && (
        <div>
          <h3>{t("info.does")}</h3>
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
      )}

      {pending > 0 && <p className="muted">{t("info.pending")}</p>}
      {QUADRICEPS.has(selection.sid) && <p className="muted">{t("info.gap.quadriceps")}</p>}

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
