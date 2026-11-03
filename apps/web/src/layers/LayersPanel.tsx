import type { BundleStructure } from "../data/bundle";
import type { Translate } from "../i18n/t";
import { isVisible, tissueOf, type LayerState, type TissueGroup } from "./layers";

type Props = {
  t: Translate;
  state: LayerState;
  structures: BundleStructure[];
  onPeel: () => void;
  onRestore: () => void;
  onToggleTissue: (group: TissueGroup) => void;
  onShow: (id: string) => void;
};

const GROUPS: TissueGroup[] = ["bone", "muscle", "soft"];

// Peel buttons, tissue switches and the list of things hidden one by one.
export function LayersPanel({ t, state, structures, onPeel, onRestore, onToggleTissue, onShow }: Props) {
  const hidden = structures.filter((s) => state.hiddenIds.has(s.id));
  // Peeling needs at least one visible muscle left.
  const canPeel = structures.some((s) => tissueOf(s.type) === "muscle" && isVisible(state, s));
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
            {hidden.map((s) => (
              <li key={s.id} className="layers-row">
                <span>{s.english}</span>
                <button type="button" onClick={() => onShow(s.id)}>
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
