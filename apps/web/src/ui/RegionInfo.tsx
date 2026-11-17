import { useRegionData } from "../data/useRegionData";
import type { Lang } from "../i18n/lang";
import type { Translate } from "../i18n/t";
import { WHOLE_BODY } from "../region/regions";
import type { Selection } from "../viewer/pick";
import { InfoPanel } from "./InfoPanel";
import { useWide } from "./useMedia";

type Props = {
  region: string;
  // The manifest's region ids, for the whole body's gap list.
  parts: string[];
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
export function RegionInfo({ region, parts, selection, fallbackLabel, t, lang, onSwitchSide, onHide, onOpenMovement, onOverUnder }: Props) {
  const bundle = useRegionData(region);
  if (!selection) return <Hint t={t} region={region} parts={parts} />;
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

// The empty state: a heading that says tap on a phone and click on a wide screen, the help line on a phone,
// and under it what the region's model does not have yet. It is not a live region:
// the name chip on the stage is the one that announces a new selection. A text that is missing
// comes back as its own key, so a region with no gap line shows nothing.
// The whole body shows a heading and, for each of its parts (the manifest's regions) that has a gap line,
// the part's name and that line word for word, so the list never says something different from the regions.
export function Hint({ t, region, parts = [] }: { t: Translate; region?: string; parts?: string[] }) {
  const wide = useWide();
  return (
    <div className="panel-body">
      <h2 className="panel-title" data-testid="info-label">
        {wide ? t("info.clickHint") : t("info.tapHint")}
      </h2>
      {wide ? null : <p className="muted">{t("info.tapHelp")}</p>}
      {region === WHOLE_BODY ? <BodyGaps t={t} parts={parts} /> : <RegionGap t={t} region={region} />}
    </div>
  );
}

// The gap line of a region, or nothing when it has none.
function gapLine(t: Translate, region: string): string | null {
  const key = `regionGap.${region}`;
  const line = t(key);
  return line === key ? null : line;
}

function RegionGap({ t, region }: { t: Translate; region?: string }) {
  const gap = region ? gapLine(t, region) : null;
  return gap ? <p className="muted region-gap">{gap}</p> : null;
}

function BodyGaps({ t, parts }: { t: Translate; parts: string[] }) {
  const rows = parts.filter((id) => id !== WHOLE_BODY).flatMap((id) => {
    const gap = gapLine(t, id);
    return gap ? [{ id, gap }] : [];
  });
  return (
    <>
      <p className="muted region-gap">{t("regionGap.body")}</p>
      {rows.length > 0 && (
        <dl className="muted region-gaps">
          {rows.map(({ id, gap }) => (
            <div key={id}>
              <dt>{t(`region.${id}`)}</dt>
              <dd>{gap}</dd>
            </div>
          ))}
        </dl>
      )}
    </>
  );
}
