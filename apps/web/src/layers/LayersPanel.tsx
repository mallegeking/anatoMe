import type { BundleStructure } from "../data/bundle";
import type { Translate } from "../i18n/t";
import { hiddenKey, isVisibleOnAnySide, tissueOf, type LayerState, type TissueGroup } from "./layers";

type Props = {
  t: Translate;
  state: LayerState;
  structures: BundleStructure[];
  onPeel: () => void;
  onRestore: () => void;
  onToggleTissue: (group: TissueGroup) => void;
  // key is what hiddenKey made for the entry.
  onShow: (key: string) => void;
};

const GROUPS: TissueGroup[] = ["bone", "muscle", "soft"];

// Peel buttons, tissue switches and the list of things hidden one by one.
export function LayersPanel({ t, state, structures, onPeel, onRestore, onToggleTissue, onShow }: Props) {
  // One entry per hidden side, so hiding the left piriformis lists "Piriformis (left)".
  const hidden = structures.flatMap((s) =>
    (["l", "r", ""] as const)
      .filter((side) => state.hiddenIds.has(hiddenKey(s.id, side)))
      .map((side) => ({ key: hiddenKey(s.id, side), name: side === "" ? s.english : t(side === "l" ? "side.left" : "side.right", { label: s.english }) })),
  );
  // Peeling needs at least one visible muscle left.
  const canPeel = structures.some((s) => tissueOf(s.type) === "muscle" && isVisibleOnAnySide(state, s));
  const peeled = state.peeledDepths.length;
  return (
    <section className="layers-panel" data-testid="layers-panel">
      <h2 className="layers-title">{t("layers.title")}</h2>

      <div className="panel-actions">
        <button type="button" onClick={onPeel} disabled={!canPeel}>
          {t("layers.peel")}
        </button>
        <button type="button" onClick={onRestore} disabled={state.peeledDepths.length === 0}>
          {t("layers.restore")}
        </button>
      </div>
      <p className="muted" aria-live="polite">
        {peeled === 1 ? t("layers.peeledOne") : t("layers.peeledCount", { count: String(peeled) })}
      </p>

      <div className="layers-tissues">
        {GROUPS.map((group) => (
          <label key={group} className="layers-row">
            <input type="checkbox" checked={!state.hiddenTissues.has(group)} onChange={() => onToggleTissue(group)} />
            <span>{t(`layers.${group}`)}</span>
          </label>
        ))}
      </div>

      {hidden.length > 0 && (
        <div>
          <h3 className="layers-hidden-title">{t("layers.hidden")}</h3>
          <ul className="layers-hidden">
            {hidden.map((h) => (
              <li key={h.key} className="layers-row">
                <span>{h.name}</span>
                <button type="button" onClick={() => onShow(h.key)}>
                  {t("layers.show")}
                </button>
              </li>
            ))}
          </ul>
        </div>
      )}
    </section>
  );
}
