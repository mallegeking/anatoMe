import { useRegionData } from "../data/useRegionData";
import type { Lang } from "../i18n/lang";
import type { Translate } from "../i18n/t";
import type { Selection } from "../viewer/pick";
import { InfoPanel } from "./InfoPanel";

type Props = {
  region: string;
  selection: Selection | null;
  fallbackLabel?: string;
  t: Translate;
  lang: Lang;
  // Called with the same structure on the other side.
  onSwitchSide: (sel: Selection) => void;
  onHide: () => void;
  onOpenMovement: (movementId: string) => void;
  onOverUnder: () => void;
};

// Loads the region data and shows the panel for the selection, or the tap hint.
export function RegionInfo({ region, selection, fallbackLabel, t, lang, onSwitchSide, onHide, onOpenMovement, onOverUnder }: Props) {
  const bundle = useRegionData(region);
  if (!selection) return <Hint t={t} region={region} />;
  return (
    <InfoPanel
      selection={selection}
      bundle={bundle}
      t={t}
      lang={lang}
      fallbackLabel={fallbackLabel}
      onSwitchSide={() => onSwitchSide({ sid: selection.sid, side: selection.side === "l" ? "r" : "l" })}
      onHide={onHide}
      onOpenMovement={onOpenMovement}
      onOverUnder={onOverUnder}
    />
  );
}

// The tap hint, and under it what the region's model does not have yet. It is not a live region:
// the name chip on the stage is the one that announces a new selection. A text that is missing
// comes back as its own key, so a region with no gap line shows nothing.
export function Hint({ t, region }: { t: Translate; region?: string }) {
  const gapKey = region ? `regionGap.${region}` : null;
  const gap = gapKey ? t(gapKey) : null;
  return (
    <>
      <p className="info-label info-label--hint" data-testid="info-label">
        {t("info.tapHint")}
      </p>
      {gap && gap !== gapKey ? <p className="muted region-gap">{gap}</p> : null}
    </>
  );
}
