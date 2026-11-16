import type { Translate } from "../i18n/t";
import { CloseIcon, LayersIcon, MinusIcon, PlusIcon, ResetIcon } from "../ui/icons";
import { markersOf, type ViewName } from "./view";

type Props = {
  t: Translate;
  wide: boolean;
  // The selected structure's name without its side, and its side. null when nothing is selected.
  selected: { name: string; side: "l" | "r" | "" } | null;
  // null until the camera has reported.
  view: ViewName | null;
  onClearSelection: () => void;
  onReset: () => void;
  onZoom: (factor: number) => void;
  layersOpen: boolean;
  // Phone only.
  onToggleLayers: () => void;
};

// One step of the zoom buttons. Zooming in and then out lands where it started.
const ZOOM_IN = 0.8;
const ZOOM_OUT = 1.25;

// The controls at the edges and corners of the stage. The wrapper covers the stage but lets every tap and drag
// through, so only the controls themselves catch them and the centre of the model stays free.
export function StageControls({ t, wide, selected, view, onClearSelection, onReset, onZoom, layersOpen, onToggleLayers }: Props) {
  const markers = view ? markersOf(view) : null;
  const sideName = (side: "l" | "r") => t(side === "l" ? "stage.left" : "stage.right");
  return (
    <div className="stage-controls">
      {/* Always in the page, so screen readers hear every new selection, whichever tab is open. Empty when nothing is selected. */}
      <div className="stage-chip" role="status">
        {selected && (
          <>
            <span className="stage-chip-name">
              {selected.name}
              {selected.side && <span className="stage-chip-side"> {t(`stage.side.${selected.side}`)}</span>}
            </span>
            <button type="button" className="stage-chip-clear" aria-label={t("stage.clear")} onClick={onClearSelection}>
              <CloseIcon size={16} />
            </button>
          </>
        )}
      </div>
      {/* One grid along the bottom edge. The wide layout puts the markers on a line above the badge, the phone in the same line. */}
      <div className="stage-bottom">
        {markers && <span className="stage-marker stage-marker--left">{sideName(markers.screenLeft)}</span>}
        <div className="stage-view">
          {view && <span className="stage-badge">{t(`view.${view}`)}</span>}
          {wide && <span className="stage-hint">{t("stage.hint")}</span>}
        </div>
        {markers && <span className="stage-marker stage-marker--right">{sideName(markers.screenRight)}</span>}
        <div className="stage-buttons">
          {wide && (
            <>
              <button type="button" className="btn stage-icon-btn" aria-label={t("stage.zoomIn")} onClick={() => onZoom(ZOOM_IN)}>
                <PlusIcon />
              </button>
              <button type="button" className="btn stage-icon-btn" aria-label={t("stage.zoomOut")} onClick={() => onZoom(ZOOM_OUT)}>
                <MinusIcon />
              </button>
            </>
          )}
          {!wide && (
            <button type="button" className="btn stage-icon-btn" aria-label={t("layers.open")} aria-expanded={layersOpen} onClick={onToggleLayers}>
              <LayersIcon />
            </button>
          )}
          <button type="button" className="btn stage-icon-btn" aria-label={t("stage.reset")} onClick={onReset}>
            <ResetIcon />
          </button>
        </div>
      </div>
    </div>
  );
}
