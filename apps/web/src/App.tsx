import { Suspense, useCallback, useEffect, useMemo, useState } from "react";
import type { BundleStructure, RegionBundle } from "./data/bundle";
import en from "./i18n/en.json";
import { createT } from "./i18n/t";
import { hideStructure, initialLayers, revealFor, type LayerState } from "./layers/layers";
import type { AreaState } from "./area/AreaPanel";
import { makeIsShown } from "./layers/shown";
import { involved } from "./movement/roles";
import { initialMovementState, pickMovement, queryOf, type MovementState } from "./movement/state";
import { ReviewBanner } from "./review/ReviewBanner";
import { ReviewList } from "./review/ReviewList";
import { PerfOverlay } from "./perf/PerfOverlay";
import { selectBySearch } from "./search/search";
import { Credits, EducationalLine } from "./ui/Credits";
import { ModeBar, type Mode } from "./ui/ModeBar";
import { PanelArea } from "./ui/PanelArea";
import { Hint } from "./ui/RegionInfo";
import { TopBar } from "./ui/TopBar";
import { Viewer } from "./viewer/Viewer";
import { ModelErrorBoundary } from "./viewer/ModelErrorBoundary";
import type { Selection } from "./viewer/pick";

const t = createT(en);
const REGION = "hip";

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
  const [mode, setMode] = useState<Mode>("atlas");
  const [movement, setMovement] = useState<MovementState>(initialMovementState);
  const [area, setArea] = useState<AreaState>(null);
  const [areaProbe, setAreaProbe] = useState<Selection | null>(null);
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

  // "Show the other side": select the same structure on the other side and turn the camera to it.
  function switchSide(sel: Selection) {
    select(sel);
    setFocus({ ...sel });
  }

  // A search result: select it, make it visible, move the camera and say what was peeled.
  function chooseResult(structure: BundleStructure) {
    if (!bundle) return;
    const sel = selectBySearch(structure.id, bundle);
    const { state, peeledNow } = revealFor(layers, structure, sel.side, structures);
    setLayers(state);
    setSelection(sel);
    setLabel(undefined);
    setFocus({ ...sel });
    setLayersOpen(false);
    setMode("atlas");
    setNotice(peeledNow === 0 ? null : t(peeledNow === 1 ? "search.peeledOne" : "search.peeled", { count: String(peeledNow), name: structure.english }));
  }

  // A structure in the movement panel: select it and turn the camera to it.
  function focusStructure(sid: string) {
    if (!bundle) return;
    const sel = selectBySearch(sid, bundle);
    select(sel);
    setFocus({ ...sel });
  }

  // A structure in the area list: make it visible, select it and turn the camera to it.
  // A structure the data does not know has nothing to reveal, so it is only selected.
  function focusAreaStructure(sel: Selection) {
    const structure = structures.find((s) => s.id === sel.sid);
    if (structure) {
      const { state } = revealFor(layers, structure, sel.side, structures);
      setLayers(state);
    }
    select(sel);
    setFocus({ ...sel });
  }

  // "See what lies over and under it": switch to the Area tab and look through the selected structure.
  function overUnder() {
    if (!selection) return;
    setMode("area");
    setAreaProbe({ ...selection });
  }

  // "Read about this structure" works like a search result, so it also switches to the Structures tab.
  function openStructure(sid: string) {
    const structure = structures.find((s) => s.id === sid);
    if (structure) chooseResult(structure);
  }

  // A movement named in the info panel: open the Movements tab with it picked.
  function openMovement(id: string) {
    if (!bundle) return;
    setMode("movement");
    setMovement(pickMovement(bundle, id));
  }

  // The colours of the involved structures. Only while the Movements tab has a pick with at least one
  // row that applies. Otherwise there is nothing to colour, so the model stays whole.
  const highlights = useMemo(() => {
    const query = mode === "movement" && bundle ? queryOf(movement, bundle) : null;
    if (!bundle || !query) return null;
    const result = involved(bundle, query, movement.pose);
    return result.rows.length > 0 ? result.bySid : null;
  }, [mode, bundle, movement]);

  // Structures the data does not know are always shown, unless a movement hides what is not involved.
  const isShown = useMemo(() => makeIsShown(structures, layers, highlights), [structures, layers, highlights]);

  // If the selected structure disappears, the panel should not keep describing it.
  useEffect(() => {
    if (selection && !isShown(selection.sid, selection.side)) {
      setSelection(null);
      setLabel(undefined);
    }
  }, [selection, isShown]);

  const hideSelected = useCallback(() => {
    if (!selection) return;
    setLayers((s) => hideStructure(s, selection.sid, selection.side));
    setSelection(null);
    setLabel(undefined);
  }, [selection]);

  // The viewer and the panel each catch their own failures, so the rest of the screen and the credits stay.
  // A failure to load the data gets its own message in the panel, because the model may be fine.
  // The outer catch is a last resort. It still shows the credits, which the licences ask us to keep reachable.
  // The educational line sits at the top of the panel, outside the part that scrolls, so it always shows.
  return (
    <ModelErrorBoundary
      t={t}
      extra={
        <footer className="panel">
          <EducationalLine t={t} />
          <div className="panel-scroll">
            <Credits t={t} />
          </div>
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
        <ModeBar t={t} mode={mode} modes={["atlas", "movement", "area"]} onChange={setMode} />
        {reviewOpen && bundle?.mode === "review" ? (
          <div className="stage review-stage">
            <ReviewList bundle={bundle} t={t} onClose={() => setReviewOpen(false)} />
          </div>
        ) : null}
        <div className="stage" hidden={reviewOpen && bundle?.mode === "review"}>
          <Viewer region={REGION} t={t} selection={selection} focus={focus} isShown={isShown}
            highlights={highlights}
            onSelect={tapModel}
            areaMode={mode === "area"}
            onAreaTap={setArea}
            areaMarker={mode === "area" ? (area?.point ?? null) : null}
            areaProbe={areaProbe}
          />
          <PerfOverlay t={t} />
        </div>
        <footer className="panel">
          <EducationalLine t={t} />
          <div className="panel-scroll" data-testid="panel-scroll">
            {notice && (
              <p className="muted search-notice" role="status">
                {notice}
              </p>
            )}
            <ModelErrorBoundary t={t} messageKey="error.dataLoad">
              <Suspense fallback={<Hint t={t} />}>
                <PanelArea
                  region={REGION}
                  t={t}
                  mode={mode}
                  selection={selection}
                  label={label}
                  layersOpen={layersOpen}
                  layers={layers}
                  setLayers={setLayers}
                  movement={movement}
                  onMovementChange={setMovement}
                  onBundle={setBundle}
                  onSwitchSide={switchSide}
                  onHideSelected={hideSelected}
                  onOpenMovement={openMovement}
                  onFocusStructure={focusStructure}
                  onOpenStructure={openStructure}
                  area={area}
                  onFocusAreaStructure={focusAreaStructure}
                  onAreaClear={() => setArea(null)}
                  onOverUnder={overUnder}
                />
              </Suspense>
            </ModelErrorBoundary>
            <Credits t={t} />
          </div>
        </footer>
      </main>
    </ModelErrorBoundary>
  );
}
