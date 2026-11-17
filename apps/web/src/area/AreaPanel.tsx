import type { RegionBundle } from "../data/bundle";
import { describeAction } from "../data/describe";
import type { Lang } from "../i18n/lang";
import { nameOf } from "../i18n/names";
import type { Translate } from "../i18n/t";
import { ActionNotes } from "../ui/InfoPanel";
import { Card, PanelTitle } from "../ui/pieces";
import type { AreaTap } from "../viewer/Scene";
import type { Selection } from "../viewer/pick";

// What the last tap found, or null when there is no tap.
export type AreaState = AreaTap | null;

type Props = {
  t: Translate;
  // The language the names show in.
  lang: Lang;
  bundle: RegionBundle;
  area: AreaState;
  selection: Selection | null;
  // Select it, make it visible and turn the camera to it.
  onFocusStructure: (sel: Selection) => void;
  onOpenMovement: (movementId: string) => void;
  onClear: () => void;
};

// Depth in model metres as centimetres, to the nearest half.
function centimetres(depth: number): string {
  return String(Math.round(depth * 100 * 2) / 2);
}

// Lists what the model has under the tapped spot, from the surface inwards.
export function AreaPanel({ t, lang, bundle, area, selection, onFocusStructure, onOpenMovement, onClear }: Props) {
  // Nothing tapped yet: the same empty state as the Structures panel.
  if (!area)
    return (
      <div className="panel-body">
        <h2 className="panel-title">{t("area.hint")}</h2>
      </div>
    );
  const { through } = area;
  const structureName = (sid: string) => {
    const structure = bundle.structures.find((s) => s.id === sid);
    return structure ? nameOf(structure, lang) : sid;
  };
  const same = (a: Selection | null, sid: string, side: string) => a !== null && a.sid === sid && a.side === side;

  // A probe that did not meet its own structure would list something else under its name, so say so instead.
  if (through && !area.entries.some((e) => same(through, e.sid, e.side))) {
    return (
      <section className="area-panel panel-body" data-testid="area-panel">
        <div className="panel-head">
          <PanelTitle>{t("area.throughTitle", { name: structureName(through.sid) })}</PanelTitle>
        </div>
        <Card>
          <p>{t("area.notOnLine", { name: structureName(through.sid) })}</p>
        </Card>
        <div className="panel-actions">
          <button className="btn" type="button" onClick={onClear}>
            {t("area.clear")}
          </button>
        </div>
      </section>
    );
  }

  return (
    <section className="area-panel panel-body" data-testid="area-panel">
      <div className="panel-head">
        <PanelTitle sub={t("area.subtitle")}>{through ? t("area.throughTitle", { name: structureName(through.sid) }) : t("area.title")}</PanelTitle>
      </div>
      <ol className="area-list">
        {area.entries.map((entry, index) => {
          const structure = bundle.structures.find((s) => s.id === entry.sid);
          const name = structureName(entry.sid);
          const label = entry.side === "l" ? t("side.left", { label: name }) : entry.side === "r" ? t("side.right", { label: name }) : name;
          const current = same(selection, entry.sid, entry.side) || same(through, entry.sid, entry.side);
          // One line for each action row of the structure, in the order of the bundle's movement list.
          const rows = structure ? bundle.actions.filter((a) => a.structure === entry.sid) : [];
          const loads = bundle.movements.flatMap((movement) => rows.filter((a) => a.movement === movement.id).map((action) => ({ movement, action })));
          const pending = structure && bundle.mode !== "review" ? (bundle.pendingByStructure[entry.sid] ?? 0) : 0;
          const cm = centimetres(entry.depth);
          return (
            <Card key={`${entry.sid}-${entry.side}`} as="li" current={current}>
              <div className="area-card-head">
                <span className="area-badge" aria-hidden="true">
                  {index + 1}
                </span>
                <button type="button" className="link-button" aria-current={current ? "true" : undefined} onClick={() => onFocusStructure({ sid: entry.sid, side: entry.side })}>
                  {label}
                </button>
              </div>
              {structure && (
                <div className="muted">
                  {t("area.typeDepth", { type: t(`type.${structure.type}`), depth: cm === "0" ? t("area.atSurface") : t("area.depth", { cm }) })}
                </div>
              )}
              {loads.length > 0 && (
                <>
                  <div className="muted">{t("area.loadedBy")}</div>
                  {loads.map(({ movement, action }) => (
                    <div key={action.id} className="area-load">
                      <button type="button" className="link-button" onClick={() => onOpenMovement(movement.id)}>
                        {nameOf(movement, lang)}
                      </button>
                      <div>{describeAction(action, t)}</div>
                      <ActionNotes action={action} t={t} />
                    </div>
                  ))}
                </>
              )}
              {pending > 0 && <p className="muted">{t("info.pending")}</p>}
            </Card>
          );
        })}
      </ol>
      <div className="panel-actions">
        <button className="btn" type="button" onClick={onClear}>
          {t("area.clear")}
        </button>
      </div>
      <p className="muted">{t("area.note")}</p>
      <p className="muted">{t("area.noSkin")}</p>
    </section>
  );
}
