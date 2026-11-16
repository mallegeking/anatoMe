import { useState } from "react";
import type { BundleAction, BundleCitationUse, RegionBundle } from "../data/bundle";
import { describeAction, jointOf } from "../data/describe";
import type { Lang } from "../i18n/lang";
import { nameOf } from "../i18n/names";
import type { Translate } from "../i18n/t";
import { DraftMark } from "../review/DraftMark";
import { Card, Chip, Chips, KeyValue, PanelTitle, SectionHeading } from "./pieces";
import { useWide } from "./useMedia";
import type { Selection } from "../viewer/pick";

type Props = {
  selection: Selection;
  bundle: RegionBundle;
  t: Translate;
  // The language the names show in.
  lang: Lang;
  // Name from the 3D file, used when the bundle does not know this structure.
  fallbackLabel?: string;
  onSwitchSide: () => void;
  onHide: () => void;
  // Opens the Movements tab with this movement picked.
  onOpenMovement: (movementId: string) => void;
  // Switches to the Area tab with a look through this structure.
  onOverUnder: () => void;
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

// The lines under an action's sentence: who it applies to, if limited, and how well supported it is.
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

// A bone's name inside a sentence such as "Starts at: ... of the femur". English writes it in lower case.
// German keeps the capital, because German nouns always have one.
export function boneLabel(bundle: RegionBundle, id: string, lang: Lang): string {
  const bone = bundle.structures.find((s) => s.id === id);
  const name = bone ? nameOf(bone, lang) : id;
  return lang === "de" ? name : name.toLowerCase();
}

export function InfoPanel({ selection, bundle, t, lang, fallbackLabel, onSwitchSide, onHide, onOpenMovement, onOverUnder }: Props) {
  const wide = useWide();
  const structure = bundle.structures.find((s) => s.id === selection.sid);
  const name = structure ? nameOf(structure, lang) : (fallbackLabel ?? selection.sid);

  const boneName = (id: string) => boneLabel(bundle, id, lang);
  const attachments = structure ? bundle.attachments.filter((a) => a.muscle === selection.sid) : [];
  const actions = structure ? bundle.actions.filter((a) => a.structure === selection.sid) : [];
  // In the review build the draft rows are shown above, so the waiting line would only repeat them.
  const pending = structure && bundle.mode !== "review" ? (bundle.pendingByStructure[selection.sid] ?? 0) : 0;

  // Group the rows by joint and then by movement, keeping the order of the bundle's movement list.
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

  const otherSide = selection.side === "l" ? "r" : "l";

  return (
    <section className="info-panel panel-body" data-testid="info-panel">
      <div className="panel-head">
        <PanelTitle sub={structure?.latin ? t("info.latin", { latin: structure.latin }) : undefined}>{name}</PanelTitle>
        {structure && (
          <Chips>
            <Chip>{t(`type.${structure.type}`)}</Chip>
            {selection.side !== "" && <Chip>{t(`info.sideChip.${selection.side}`)}</Chip>}
          </Chips>
        )}
      </div>

      <div className="panel-actions">
        {selection.side !== "" && (
          <button className="btn" type="button" onClick={onSwitchSide}>
            {wide ? t("info.switchSide") : t(`info.otherSide.${otherSide}`)}
          </button>
        )}
        <button className="btn" type="button" onClick={onHide}>
          {wide ? t("info.hide") : t("info.hideShort")}
        </button>
        <button className="btn" type="button" onClick={onOverUnder}>
          {wide ? t("info.overUnder") : t("info.overUnderShort")}
        </button>
      </div>

      {attachments.length > 0 && (
        <div className="panel-section">
          <SectionHeading>{t("info.attachments")}</SectionHeading>
          <KeyValue
            rows={attachments.map((a) => ({
              key: t(a.end === "origin" ? "info.originLabel" : "info.insertionLabel"),
              value: (
                <>
                  {t(a.end === "origin" ? "info.originValue" : "info.insertionValue", { landmark: a.landmark, bone: boneName(a.bone) })}
                  {bundle.mode === "review" && a.draft && <DraftMark id={a.id} t={t} />}
                  <Sources uses={a.citations} bundle={bundle} t={t} />
                </>
              ),
            }))}
          />
        </div>
      )}

      {joints.map(({ joint, groups }) => (
        <div key={joint} className="panel-section">
          <SectionHeading>{t("info.does", { joint: t(`joint.${joint}`) })}</SectionHeading>
          {groups.map(({ movement, rows }) => (
            <Card key={movement.id}>
              <h4 className="card-title">
                <button type="button" className="link-button" onClick={() => onOpenMovement(movement.id)}>
                  {nameOf(movement, lang)}
                </button>
              </h4>
              <ul className="action-rows">
                {rows.map((action) => (
                  <ActionRow key={action.id} action={action} bundle={bundle} t={t} />
                ))}
              </ul>
            </Card>
          ))}
        </div>
      ))}

      {pending > 0 && (
        <Card>
          <span className="muted">{t("info.pending")}</span>
        </Card>
      )}
      {/* A part of this structure that the model does not show yet. */}
      {structure?.gap && (
        <Card>
          <span className="muted">{t(`gap.${structure.gap}`)}</span>
        </Card>
      )}
    </section>
  );
}
