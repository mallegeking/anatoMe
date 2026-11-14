import type { RegionBundle } from "../data/bundle";
import { loadWord } from "../data/describe";
import type { Translate } from "../i18n/t";
import type { AreaTap } from "../viewer/Scene";
import type { Selection } from "../viewer/pick";

// What the last tap found, or null when there is no tap.
export type AreaState = AreaTap | null;

type Props = {
  t: Translate;
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
export function AreaPanel({ t, bundle, area, selection, onFocusStructure, onOpenMovement, onClear }: Props) {
  if (!area) return <p className="info-label info-label--hint">{t("area.hint")}</p>;
  const { through } = area;
  const nameOf = (sid: string) => bundle.structures.find((s) => s.id === sid)?.english ?? sid;
  const same = (a: Selection | null, sid: string, side: string) => a !== null && a.sid === sid && a.side === side;

  return (
    <section className="area-panel" data-testid="area-panel">
      <h2>{through ? t("area.throughTitle", { name: nameOf(through.sid) }) : t("area.title")}</h2>
      <p className="muted">{t("area.note")}</p>
      <p className="muted">{t("area.noSkin")}</p>
      <ol>
        {area.entries.map((entry) => {
          const structure = bundle.structures.find((s) => s.id === entry.sid);
          const name = nameOf(entry.sid);
          const label = entry.side === "l" ? t("side.left", { label: name }) : entry.side === "r" ? t("side.right", { label: name }) : name;
          const current = same(selection, entry.sid, entry.side) || same(through, entry.sid, entry.side);
          // One button for each distinct movement and load, in the order of the bundle's movement list.
          const rows = structure ? bundle.actions.filter((a) => a.structure === entry.sid) : [];
          const loads = bundle.movements.flatMap((movement) =>
            [...new Set(rows.filter((a) => a.movement === movement.id).map((a) => a.load))].map((load) => ({ movement, load })),
          );
          const pending = structure && bundle.mode !== "review" ? (bundle.pendingByStructure[entry.sid] ?? 0) : 0;
          const cm = centimetres(entry.depth);
          return (
            <li key={`${entry.sid}-${entry.side}`}>
              <button type="button" className="link-button" aria-current={current ? "true" : undefined} onClick={() => onFocusStructure({ sid: entry.sid, side: entry.side })}>
                {label}
              </button>
              {structure && (
                <div className="muted">
                  {t("area.typeDepth", { type: t(`type.${structure.type}`), depth: cm === "0" ? t("area.atSurface") : t("area.depth", { cm }) })}
                </div>
              )}
              {loads.length > 0 && (
                <div>
                  <h3>{t("area.loadedBy")}</h3>
                  {loads.map(({ movement, load }) => (
                    <button key={`${movement.id}-${load}`} type="button" className="link-button" onClick={() => onOpenMovement(movement.id)}>
                      {t("area.movement", { movement: movement.english, load: loadWord(load, t) })}
                    </button>
                  ))}
                </div>
              )}
              {pending > 0 && <p className="muted">{t("info.pending")}</p>}
            </li>
          );
        })}
      </ol>
      <div className="panel-actions">
        <button type="button" onClick={onClear}>
          {t("area.clear")}
        </button>
      </div>
    </section>
  );
}
