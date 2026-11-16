import type { BundleStructure } from "../data/bundle";
import type { Lang } from "../i18n/lang";
import { nameOf } from "../i18n/names";
import type { Translate } from "../i18n/t";
import { CloseIcon } from "../ui/icons";
import { hiddenKey, isVisibleOnAnySide, tissueOf, type LayerState, type TissueGroup } from "./layers";

type Props = {
  t: Translate;
  // The language the names show in.
  lang: Lang;
  state: LayerState;
  structures: BundleStructure[];
  onPeel: () => void;
  onRestore: () => void;
  onToggleTissue: (group: TissueGroup) => void;
  // key is what hiddenKey made for the entry.
  onShow: (key: string) => void;
  // Given on the phone, where the panel opens over the tab panel. It adds a close button next to the title.
  onClose?: () => void;
};

const GROUPS: TissueGroup[] = ["bone", "muscle", "soft"];

// Peel buttons, tissue switches and the list of things hidden one by one.
export function LayersPanel({ t, lang, state, structures, onPeel, onRestore, onToggleTissue, onShow, onClose }: Props) {
  // One entry per hidden side, so hiding the left piriformis lists "Piriformis (left)".
  const hidden = structures.flatMap((s) =>
    (["l", "r", ""] as const)
      .filter((side) => state.hiddenIds.has(hiddenKey(s.id, side)))
      .map((side) => ({ key: hiddenKey(s.id, side), name: side === "" ? nameOf(s, lang) : t(side === "l" ? "side.left" : "side.right", { label: nameOf(s, lang) }) })),
  );
  // Peeling needs at least one visible muscle left.
  const canPeel = structures.some((s) => tissueOf(s.type) === "muscle" && isVisibleOnAnySide(state, s));
  const peeled = state.peeledDepths.length;
  return (
    <section className="layers-panel" data-testid="layers-panel">
      <div className="layers-head">
        <h2 className="layers-title">{t("layers.title")}</h2>
        {onClose && (
          <button className="btn layers-close" type="button" onClick={onClose}>
            <CloseIcon size={16} />
            {t("layers.close")}
          </button>
        )}
      </div>

      <div className="panel-actions">
        <button className="btn" type="button" onClick={onPeel} disabled={!canPeel}>
          {t("layers.peel")}
        </button>
        <button className="btn" type="button" onClick={onRestore} disabled={state.peeledDepths.length === 0}>
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
                <button className="btn" type="button" onClick={() => onShow(h.key)}>
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
