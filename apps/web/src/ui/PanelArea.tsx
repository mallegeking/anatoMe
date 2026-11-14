import { useEffect } from "react";
import type { RegionBundle } from "../data/bundle";
import { useRegionData } from "../data/useRegionData";
import type { Translate } from "../i18n/t";
import { peel, restore, showStructure, toggleTissue, type LayerState } from "../layers/layers";
import { LayersPanel } from "../layers/LayersPanel";
import { AreaPanel, type AreaState } from "../area/AreaPanel";
import { MovementPanel } from "../movement/MovementPanel";
import type { MovementState } from "../movement/state";
import type { Selection } from "../viewer/pick";
import type { Mode } from "./ModeBar";
import { RegionInfo } from "./RegionInfo";

type Props = {
  region: string;
  t: Translate;
  mode: Mode;
  selection: Selection | null;
  label: string | undefined;
  layersOpen: boolean;
  layers: LayerState;
  setLayers: (update: (state: LayerState) => LayerState) => void;
  movement: MovementState;
  onMovementChange: (state: MovementState) => void;
  onBundle: (bundle: RegionBundle) => void;
  onSwitchSide: (sel: Selection) => void;
  onHideSelected: () => void;
  onOpenMovement: (movementId: string) => void;
  onFocusStructure: (sid: string) => void;
  area: AreaState;
  onFocusAreaStructure: (sel: Selection) => void;
  onAreaClear: () => void;
  onOverUnder: () => void;
  onOpenStructure: (sid: string) => void;
};

// Loads the data, tells the app which structures exist, and shows one of the panels:
// the layers panel when it is open, else the movement panel in the Movements tab, else the area panel in the Area tab, else the info panel.
export function PanelArea({ region, t, mode, selection, label, layersOpen, layers, setLayers, movement, onBundle, ...on }: Props) {
  const bundle = useRegionData(region);
  useEffect(() => onBundle(bundle), [bundle, onBundle]);
  if (layersOpen) {
    return (
      <LayersPanel
        t={t}
        state={layers}
        structures={bundle.structures}
        onPeel={() => setLayers((s) => peel(s, bundle.structures))}
        onRestore={() => setLayers(restore)}
        onToggleTissue={(group) => setLayers((s) => toggleTissue(s, group))}
        onShow={(key) => setLayers((s) => showStructure(s, key))}
      />
    );
  }
  if (mode === "movement") {
    return (
      <MovementPanel
        t={t}
        bundle={bundle}
        state={movement}
        onChange={on.onMovementChange}
        selection={selection}
        onFocusStructure={on.onFocusStructure}
        onOpenStructure={on.onOpenStructure}
      />
    );
  }
  if (mode === "area") {
    return (
      <AreaPanel
        t={t}
        bundle={bundle}
        area={on.area}
        selection={selection}
        onFocusStructure={on.onFocusAreaStructure}
        onOpenMovement={on.onOpenMovement}
        onClear={on.onAreaClear}
      />
    );
  }
  return (
    <RegionInfo
      region={region}
      selection={selection}
      fallbackLabel={label}
      t={t}
      onSwitchSide={on.onSwitchSide}
      onHide={on.onHideSelected}
      onOpenMovement={on.onOpenMovement}
      onOverUnder={on.onOverUnder}
    />
  );
}
