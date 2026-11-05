import { useRegionData } from "../data/useRegionData";
import type { Translate } from "../i18n/t";
import type { Selection } from "../viewer/pick";
import { InfoPanel } from "./InfoPanel";

type Props = {
  region: string;
  selection: Selection | null;
  fallbackLabel?: string;
  t: Translate;
  // Called with the same structure on the other side.
  onSwitchSide: (sel: Selection) => void;
  onHide: () => void;
};

// Loads the region data and shows the panel for the selection, or the tap hint.
export function RegionInfo({ region, selection, fallbackLabel, t, onSwitchSide, onHide }: Props) {
  const bundle = useRegionData(region);
  if (!selection) return <Hint t={t} />;
  return (
    <InfoPanel
      selection={selection}
      bundle={bundle}
      t={t}
      fallbackLabel={fallbackLabel}
      onSwitchSide={() => onSwitchSide({ sid: selection.sid, side: selection.side === "l" ? "r" : "l" })}
      onHide={onHide}
    />
  );
}

export function Hint({ t }: { t: Translate }) {
  return (
    <p className="info-label info-label--hint" aria-live="polite" data-testid="info-label">
      {t("info.tapHint")}
    </p>
  );
}
