import { Suspense, useCallback, useEffect, useMemo, useState } from "react";
import type { BundleStructure, RegionBundle } from "./data/bundle";
import { useRegionData } from "./data/useRegionData";
import en from "./i18n/en.json";
import { createT } from "./i18n/t";
import { hideStructure, initialLayers, isVisible, peel, restore, revealFor, showStructure, toggleTissue, type LayerState } from "./layers/layers";
import { LayersPanel } from "./layers/LayersPanel";
import { ReviewBanner } from "./review/ReviewBanner";
import { ReviewList } from "./review/ReviewList";
import { PerfOverlay } from "./perf/PerfOverlay";
import { selectBySearch } from "./search/search";
import { Credits } from "./ui/Credits";
import { Hint, RegionInfo } from "./ui/RegionInfo";
import { TopBar } from "./ui/TopBar";
import { Viewer } from "./viewer/Viewer";
import { ModelErrorBoundary } from "./viewer/ModelErrorBoundary";
import type { Selection } from "./viewer/pick";

const t = createT(en);
const REGION = "hip";

type PanelAreaProps = {
  selection: Selection | null;
  label: string | undefined;
  layersOpen: boolean;
  layers: LayerState;
  setLayers: (update: (state: LayerState) => LayerState) => void;
  onBundle: (bundle: RegionBundle) => void;
  onSelect: (sel: Selection | null, label?: string) => void;
  onHideSelected: () => void;
};

// Loads the data, tells the app which structures exist, and shows the layers panel or the info panel.
function PanelArea({ selection, label, layersOpen, layers, setLayers, onBundle, onSelect, onHideSelected }: PanelAreaProps) {
  const bundle = useRegionData(REGION);
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
        onShow={(id) => setLayers((s) => showStructure(s, id))}
      />
    );
  }
  return <RegionInfo region={REGION} selection={selection} fallbackLabel={label} t={t} onSelect={onSelect} onHide={onHideSelected} />;
}

export function App() {
  const [selection, setSelection] = useState<Selection | null>(null);
  const [label, setLabel] = useState<string | undefined>(undefined);
  const [layers, setLayers] = useState<LayerState>(initialLayers);
  const [layersOpen, setLayersOpen] = useState(false);
  const [bundle, setBundle] = useState<RegionBundle | null>(null);
  const [focus, setFocus] = useState<Selection | null>(null);
  const [reviewOpen, setReviewOpen] = useState(false);
  const [notice, setNotice] = useState<string | null>(null);
  const [searchOpen, setSearchOpen] = useState(false);
  const structures = useMemo(() => bundle?.structures ?? [], [bundle]);

  function select(sel: Selection | null, fileLabel?: string) {
    setSelection(sel);
    setLabel(fileLabel);
    setNotice(null);
  }

  // A tap on the model also closes the search list, so the list does not hang over the model.
  function tapModel(sel: Selection | null, fileLabel?: string) {
    setSearchOpen(false);
    select(sel, fileLabel);
  }

  // A search result: select it, make it visible, move the camera and say what was peeled.
  function chooseResult(structure: BundleStructure) {
    if (!bundle) return;
    const { state, peeledNow } = revealFor(layers, structure, structures);
    const sel = selectBySearch(structure.id, bundle);
    setLayers(state);
    setSelection(sel);
    setLabel(undefined);
    setFocus({ ...sel });
    setLayersOpen(false);
    setNotice(peeledNow === 0 ? null : t(peeledNow === 1 ? "search.peeledOne" : "search.peeled", { count: String(peeledNow), name: structure.english }));
  }

  // Structures the data does not know are always shown.
  const isVisibleSid = useMemo(() => {
    const byId = new Map(structures.map((s) => [s.id, s]));
    return (sid: string) => {
      const structure = byId.get(sid);
      return structure ? isVisible(layers, structure) : true;
    };
  }, [structures, layers]);

  // If the selected structure disappears, the panel should not keep describing it.
  useEffect(() => {
    if (selection && !isVisibleSid(selection.sid)) {
      setSelection(null);
      setLabel(undefined);
    }
  }, [selection, isVisibleSid]);

  const hideSelected = useCallback(() => {
    if (!selection) return;
    setLayers((s) => hideStructure(s, selection.sid));
    setSelection(null);
    setLabel(undefined);
  }, [selection]);

  // The viewer and the panel each catch their own failures, so the rest of the screen and the credits stay.
  // A failure to load the data gets its own message in the panel, because the model may be fine.
  // The outer catch is a last resort. It still shows the credits, which the licences ask us to keep reachable.
  return (
    <ModelErrorBoundary
      t={t}
      extra={
        <footer className="panel">
          <Credits t={t} />
        </footer>
      }
    >
      <main className="app">
        <ReviewBanner bundle={bundle} t={t} onOpenList={() => setReviewOpen(true)} />
        <TopBar
          t={t}
          structures={structures}
          layersOpen={layersOpen}
          onToggleLayers={() => setLayersOpen(!layersOpen)}
          onChoose={chooseResult}
          open={searchOpen}
          onOpenChange={setSearchOpen}
        />
        {reviewOpen && bundle?.mode === "review" ? (
          <div className="stage review-stage">
            <ReviewList bundle={bundle} t={t} onClose={() => setReviewOpen(false)} />
          </div>
        ) : null}
        <div className="stage" hidden={reviewOpen && bundle?.mode === "review"}>
          <Viewer region={REGION} t={t} selection={selection} focus={focus} isVisibleSid={isVisibleSid} onSelect={tapModel} />
          <PerfOverlay t={t} />
        </div>
        <footer className="panel">
          {notice && (
            <p className="muted search-notice" role="status">
              {notice}
            </p>
          )}
          <ModelErrorBoundary t={t} messageKey="error.dataLoad">
            <Suspense fallback={<Hint t={t} />}>
              <PanelArea
                selection={selection}
                label={label}
                layersOpen={layersOpen}
                layers={layers}
                setLayers={setLayers}
                onBundle={setBundle}
                onSelect={select}
                onHideSelected={hideSelected}
              />
            </Suspense>
          </ModelErrorBoundary>
          <Credits t={t} />
        </footer>
      </main>
    </ModelErrorBoundary>
  );
}
