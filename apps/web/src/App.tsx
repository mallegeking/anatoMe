import { lazy, Suspense, useCallback, useEffect, useMemo, useRef, useState } from "react";
import type { BundleStructure, RegionBundle } from "./data/bundle";
import de from "./i18n/de.json";
import en from "./i18n/en.json";
import { pickLanguage, readStoredLanguage, storeLanguage, type Lang } from "./i18n/lang";
import { createT, type Translate } from "./i18n/t";
import { forgetFailedRegionData } from "./data/useRegionData";
import { hideStructure, initialLayers, peel, restore, revealFor, showStructure, toggleTissue, type LayerState } from "./layers/layers";
import type { AreaState } from "./area/AreaPanel";
import { LayersPanel } from "./layers/LayersPanel";
import { makeIsShown } from "./layers/shown";
import type { LogFailure } from "./movement/MovementPanel";
import { involved } from "./movement/roles";
import { initialMovementState, pickMovement, queryOf, type MovementState } from "./movement/state";
import type { NotebookEntry, EntrySide, Feeling } from "./notebook/types";
import type { NotebookStore } from "./notebook/store";
import type { StoreFailure } from "./notebook/NotebookPanel";
import { QuietBoundary } from "./ui/QuietBoundary";
import { ReviewBanner } from "./review/ReviewBanner";
import { ReviewList } from "./review/ReviewList";
import { PerfOverlay } from "./perf/PerfOverlay";
import { nameOf } from "./i18n/names";
import { selectBySearch } from "./search/search";
import { AppDialog } from "./ui/AppDialog";
import { CreditsBody, EducationalLine } from "./ui/Credits";
import { LanguagePicker } from "./ui/LanguagePicker";
import { ModeBar, type Mode } from "./ui/ModeBar";
import { PanelArea } from "./ui/PanelArea";
import { Hint } from "./ui/RegionInfo";
import { TopBar } from "./ui/TopBar";
import { useShort, useWide } from "./ui/useMedia";
import { chooseRegion, regionIds } from "./region/regions";
import { StageControls } from "./stage/StageControls";
import { viewOf, type ViewName } from "./stage/view";
import { loadManifest, regionFiles, type Manifest, type ModelFiles } from "./viewer/manifest";
import type { ViewDirection, ViewerHandle } from "./viewer/handle";
import { Viewer } from "./viewer/Viewer";
import { ModelErrorBoundary } from "./viewer/ModelErrorBoundary";
import type { Selection } from "./viewer/pick";

// The printed summary is notebook code, so it loads only when the person presses print.
const PrintSummary = lazy(() => import("./notebook/PrintSummary"));

const BASE = import.meta.env.BASE_URL;

// The texts of each language. A text missing in one falls back to the English one.
const MESSAGES: Record<Lang, Record<string, string>> = { en, de };

// The browser's languages, best first. Some browsers have only navigator.language.
function browserLanguages(): readonly string[] {
  if (typeof navigator === "undefined") return [];
  return navigator.languages ?? (navigator.language ? [navigator.language] : []);
}

// Why the notebook store could not be opened. The app tells the two apart, so the message says the right thing.
class StoreOpenError extends Error {
  readonly failure: "blocked" | "load";
  constructor(failure: "blocked" | "load") {
    super(failure === "blocked" ? "The browser does not let the app store notes." : "The notebook code could not be loaded.");
    this.failure = failure;
  }
}

// A notice keeps its text key and what fills it, not the finished text, so it is translated when it shows
// and reads in the new language after a switch. A search notice keeps the structure, so its name follows too.
type Notice = { key: string; count?: number; structure?: BundleStructure };

function noticeText(notice: Notice, t: Translate, lang: Lang): string {
  const vars: Record<string, string> = {};
  if (notice.count !== undefined) vars.count = String(notice.count);
  if (notice.structure) vars.name = nameOf(notice.structure, lang);
  return t(notice.key, vars);
}

export function App() {
  // The language is read once at start: the stored choice, else the browser's, else English.
  const [lang, setLang] = useState<Lang>(() => pickLanguage(readStoredLanguage(), browserLanguages()));
  const t = useMemo(() => createT(MESSAGES[lang], en), [lang]);
  // The model manifest, read once. It says which body regions there are and which files each one has.
  const [models, setModels] = useState<{ manifest: Manifest } | { error: unknown } | null>(null);
  // The body region shown. null until the manifest is in.
  const [region, setRegion] = useState<string | null>(null);
  const [selection, setSelection] = useState<Selection | null>(null);
  const [label, setLabel] = useState<string | undefined>(undefined);
  const [layers, setLayers] = useState<LayerState>(initialLayers);
  const [layersOpen, setLayersOpen] = useState(false);
  // The dialog that is open. Settings is the phone's (language and credits), credits the wide layout's.
  const [dialog, setDialog] = useState<"settings" | "credits" | null>(null);
  const [bundle, setBundle] = useState<RegionBundle | null>(null);
  const [focus, setFocus] = useState<Selection | null>(null);
  const [reviewOpen, setReviewOpen] = useState(false);
  const [notice, setNotice] = useState<Notice | null>(null);
  const [searchOpen, setSearchOpen] = useState(false);
  const [mode, setMode] = useState<Mode>("atlas");
  const [movement, setMovement] = useState<MovementState>(initialMovementState);
  const [area, setArea] = useState<AreaState>(null);
  const [areaProbe, setAreaProbe] = useState<Selection | null>(null);
  const [notebookStore, setNotebookStore] = useState<NotebookStore | null>(null);
  const [notebookFailure, setNotebookFailure] = useState<StoreFailure>(null);
  const notebookOpening = useRef<Promise<NotebookStore> | null>(null);
  const [printJob, setPrintJob] = useState<{ entries: NotebookEntry[]; press: number } | null>(null);
  // The wide layout puts the tabs in a column on the left, so the arrow keys that move between them change too.
  const wide = useWide();
  const short = useShort();
  // The viewer's handle for the reset and zoom buttons, and the view the camera last came to rest in.
  const viewerHandle = useRef<ViewerHandle>(null);
  const [view, setView] = useState<ViewName | null>(null);
  const hearView = useCallback((direction: ViewDirection) => setView(viewOf(direction)), []);
  const structures = useMemo(() => bundle?.structures ?? [], [bundle]);
  // On the wide layout Layers always has its own section. On the phone it opens over the tab panel.
  // Going to the wide layout forgets the open state, so coming back to the phone starts with Layers closed.
  useEffect(() => {
    if (wide) setLayersOpen(false);
  }, [wide]);
  // The two layouts have different dialogs, so a change of layout closes the open one.
  useEffect(() => setDialog(null), [wide]);
  const phoneLayers = !wide && layersOpen;
  // A region without joints has no movements, so it has no Movements tab and no Notebook tab.
  const modes = useMemo<Mode[]>(
    () => (!bundle || bundle.movements.length > 0 ? ["atlas", "movement", "area", "notebook"] : ["atlas", "area"]),
    [bundle],
  );
  // A tab the region does not have shows as Structures, and the state follows.
  const shownMode: Mode = modes.includes(mode) ? mode : "atlas";
  useEffect(() => {
    if (shownMode !== mode) setMode(shownMode);
  }, [shownMode, mode]);

  // Counts the reads of the manifest, so only the answer to the latest one is used.
  const manifestRead = useRef(0);
  // Reads the manifest and picks the region the address asks for, or the first one.
  const readManifest = useCallback(() => {
    const read = ++manifestRead.current;
    loadManifest(`${BASE}models/manifest.json`)
      .then((loaded) => {
        const first = chooseRegion(regionIds(loaded), location.search);
        if (read !== manifestRead.current) return;
        setModels({ manifest: loaded });
        setRegion(first);
      })
      .catch((error: unknown) => {
        if (read === manifestRead.current) setModels({ error });
      });
  }, []);
  useEffect(() => {
    readManifest();
    // An answer that arrives after the app is gone is ignored.
    return () => {
      manifestRead.current++;
    };
  }, [readManifest]);

  // "Try again" on the model error. A manifest that failed is read again, and the viewer shows
  // the loading text meanwhile. The viewer itself clears what it keeps of the failed load.
  function retryModel() {
    if (!models || !("error" in models)) return;
    setModels(null);
    readManifest();
  }

  // Screen readers and the browser's hyphenation read the page in the chosen language.
  useEffect(() => {
    document.documentElement.lang = lang;
  }, [lang]);

  // A new choice from the language picker. It is kept for the next visit.
  function changeLang(next: Lang) {
    setLang(next);
    storeLanguage(next);
  }

  const regions = useMemo(() => (models && "manifest" in models ? regionIds(models.manifest) : []), [models]);

  // The model files for the region. A manifest that failed goes to the viewer, which shows the model error.
  const files = useMemo<ModelFiles>(() => {
    if (!models) return null;
    if ("error" in models) return models;
    return region ? { urls: regionFiles(models.manifest, region).map((path) => BASE + path) } : null;
  }, [models, region]);

  // Another region starts afresh: no selection, every layer back, no movement and no area spot.
  function changeRegion(id: string) {
    // Data that failed to load is fetched again, here and when coming back to a region that failed.
    forgetFailedRegionData();
    setRegion(id);
    // The new viewer reports its own view once it has framed the model.
    setView(null);
    setBundle(null);
    select(null);
    setFocus(null);
    setLayers(initialLayers);
    setMovement(initialMovementState);
    setArea(null);
    setAreaProbe(null);
    setMode("atlas");
    setSearchOpen(false);
    setLayersOpen(false);
    setPrintJob(null);
    setNotice(null);
    // The address follows the region, so a reload or a shared link opens the same one. No new history entry.
    const params = new URLSearchParams(location.search);
    params.set("region", id);
    history.replaceState(null, "", `?${params.toString()}${location.hash}`);
  }

  // A change of tab closes Layers on the phone.
  function changeMode(next: Mode) {
    setMode(next);
    setLayersOpen(false);
  }

  function select(sel: Selection | null, fileLabel?: string) {
    setSelection(sel);
    setLabel(fileLabel);
    setNotice(null);
  }

  // A tap on the model also closes the search list, so the list does not hang over the model.
  // A tap on a structure closes Layers on the phone, so the structure shows.
  function tapModel(sel: Selection | null, fileLabel?: string) {
    setSearchOpen(false);
    if (sel !== null) setLayersOpen(false);
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
    setNotice(peeledNow === 0 ? null : { key: peeledNow === 1 ? "search.peeledOne" : "search.peeled", count: peeledNow, structure });
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

  // Opens the notebook store the first time the Notebook tab opens or a movement is logged.
  // Its code loads only then, so the first screen stays as fast as before.
  // A store that opened is kept. A failure is not, so the next try opens it afresh.
  const openStore = useCallback(() => {
    if (!notebookOpening.current) {
      const opening = import("./notebook/store").then(
        (m) =>
          m.openNotebook().catch(() => {
            throw new StoreOpenError("blocked");
          }),
        () => {
          throw new StoreOpenError("load");
        },
      );
      notebookOpening.current = opening;
      opening.then(
        (store) => {
          setNotebookStore(store);
          setNotebookFailure(null);
        },
        (error: StoreOpenError) => {
          if (notebookOpening.current === opening) notebookOpening.current = null;
          setNotebookFailure(error.failure);
        },
      );
    }
    return notebookOpening.current;
  }, []);

  useEffect(() => {
    if (mode === "notebook") void openStore();
  }, [mode, openStore]);

  // "Log this movement": saves the picked movement and its angles with the feeling, the side and the note.
  // Resolves to null once it is saved. A failure resolves to the text that says what went wrong: the notebook
  // code did not load, the browser does not let the app store notes, or this one note could not be saved.
  // The form shows that text next to its Save button, where the person is looking.
  async function logMovement(input: { feeling: Feeling; side: EntrySide; note: string }): Promise<LogFailure | null> {
    const { pick, pose } = movement;
    if (!pick) return "notebook.saveFailed";
    let opened: [typeof import("./notebook/store"), NotebookStore];
    try {
      opened = await Promise.all([import("./notebook/store"), openStore()]);
    } catch (error) {
      const blocked = error instanceof StoreOpenError && error.failure === "blocked";
      return blocked ? "notebook.unavailable" : "notebook.loadFailed";
    }
    const [{ makeEntry }, store] = opened;
    try {
      await store.put(makeEntry({ pick, pose, ...input }, new Date(), crypto.randomUUID()));
    } catch {
      return "notebook.saveFailed";
    }
    setNotice({ key: "notebook.saved" });
    return null;
  }

  // The summary is built and printed by its own lazy part, after it is on the page and painted.
  // Each press counts up, so pressing again prints again.
  function printNotebook(entries: NotebookEntry[]) {
    setPrintJob((job) => ({ entries, press: (job?.press ?? 0) + 1 }));
  }

  // The summary goes away after the print dialog closes and when the person leaves the Notebook tab,
  // so the browser's own Print menu never prints an old snapshot.
  useEffect(() => {
    const clear = () => setPrintJob(null);
    window.addEventListener("afterprint", clear);
    return () => window.removeEventListener("afterprint", clear);
  }, []);
  useEffect(() => {
    if (mode !== "notebook") setPrintJob(null);
  }, [mode]);

  // "See what lies over and under it": switch to the Area tab and look through the selected structure.
  function overUnder() {
    if (!selection) return;
    setLayersOpen(false);
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
    setLayersOpen(false);
    setMode("movement");
    setMovement(pickMovement(bundle, id));
  }

  // The layer buttons. They work on the structures of the region shown.
  const peelLayer = () => setLayers((s) => peel(s, structures));
  const restoreLayers = () => setLayers(restore);
  const toggleLayerTissue = (group: Parameters<typeof toggleTissue>[1]) => setLayers((s) => toggleTissue(s, group));
  const showLayerStructure = (key: string) => setLayers((s) => showStructure(s, key));

  // The colours of the involved structures. Only while the Movements tab has a pick with at least one
  // row that applies. Otherwise there is nothing to colour, so the model stays whole.
  const highlights = useMemo(() => {
    const query = mode === "movement" && bundle ? queryOf(movement, bundle) : null;
    if (!bundle || !query) return null;
    // The colours do not depend on the order, so the language makes no difference here.
    const result = involved(bundle, query, movement.pose, lang);
    return result.rows.length > 0 ? result.bySid : null;
  }, [mode, bundle, movement, lang]);

  // Structures the data does not know are always shown, unless a movement hides what is not involved.
  const isShown = useMemo(() => makeIsShown(structures, layers, highlights), [structures, layers, highlights]);

  // If the layers hide the selected structure, the panel should not keep describing it.
  // A movement that hides it only for a while keeps the selection, so it is back on the Structures tab.
  useEffect(() => {
    if (!highlights && selection && !isShown(selection.sid, selection.side)) {
      setSelection(null);
      setLabel(undefined);
    }
  }, [selection, isShown, highlights]);

  const hideSelected = useCallback(() => {
    if (!selection) return;
    setLayers((s) => hideStructure(s, selection.sid, selection.side));
    setSelection(null);
    setLabel(undefined);
  }, [selection]);

  // The name chip on the stage: the structure's name in the current language, or the 3D file's label for a
  // structure the data does not know. The side is a separate word, so the chip can style it.
  const chipSelection = useMemo(() => {
    if (!selection) return null;
    const structure = structures.find((s) => s.id === selection.sid);
    return { name: structure ? nameOf(structure, lang) : (label ?? selection.sid), side: selection.side };
  }, [selection, structures, lang, label]);

  // The viewer and the panel each catch their own failures, so the rest of the screen and the credits stay.
  // A failure to load the data gets its own message in the panel, because the model may be fine.
  // The outer catch is a last resort. It still shows the credits, which the licences ask us to keep reachable.
  // The educational line sits at the top of the panel on the phone, outside the part that scrolls, and at the bottom of the rail on the wide layout, so it always shows.
  // The grid in index.css places top, nav, stage and side. On a phone the nav sits at the bottom.
  // Every layout renders the same elements, so a change of layout never mounts the viewer again.
  return (
    <ModelErrorBoundary
      t={t}
      extra={
        <footer className="panel">
          <EducationalLine t={t} />
          <div className="panel-scroll">
            <LanguagePicker t={t} lang={lang} onLang={changeLang} showLabel />
            <CreditsBody t={t} />
          </div>
        </footer>
      }
    >
      <main className="app">
        <div className="top">
          <ReviewBanner bundle={bundle} t={t} onOpenList={() => setReviewOpen(true)} />
          <TopBar
            t={t}
            lang={lang}
            compact={short}
            structures={structures}
            onChoose={chooseResult}
            open={searchOpen}
            onOpenChange={setSearchOpen}
            regions={regions}
            region={region ?? ""}
            onRegion={changeRegion}
            onSettings={wide ? undefined : () => setDialog("settings")}
          />
        </div>
        <nav className="nav">
          <ModeBar t={t} mode={shownMode} modes={modes} onChange={changeMode} vertical={wide} />
          {wide && (
            <div className="nav-foot">
              <EducationalLine t={t} />
              <button type="button" className="btn" onClick={() => setDialog("credits")}>
                {t("credits.title")}
              </button>
            </div>
          )}
        </nav>
        {reviewOpen && bundle?.mode === "review" ? (
          <div className="stage review-stage">
            <ReviewList bundle={bundle} t={t} lang={lang} onClose={() => setReviewOpen(false)} />
          </div>
        ) : null}
        <div className="stage" hidden={reviewOpen && bundle?.mode === "review"}>
          {/* A new region gets a fresh viewer, with its own loading text and time limit. */}
          <Viewer key={region ?? ""} files={files} t={t} onRetry={retryModel} selection={selection} focus={focus} isShown={isShown}
            handle={viewerHandle}
            onView={hearView}
            highlights={highlights}
            onSelect={tapModel}
            areaMode={shownMode === "area"}
            onAreaTap={setArea}
            areaMarker={shownMode === "area" ? (area?.point ?? null) : null}
            areaProbe={areaProbe}
          />
          <PerfOverlay t={t} />
          <StageControls
            t={t}
            wide={wide}
            selected={chipSelection}
            view={view}
            onClearSelection={() => select(null)}
            onReset={() => viewerHandle.current?.resetView()}
            onZoom={(factor) => viewerHandle.current?.zoomBy(factor)}
            layersOpen={layersOpen}
            onToggleLayers={() => setLayersOpen(!layersOpen)}
          />
        </div>
        <aside className="side">
          {(wide || layersOpen) && (
            <div className="layers-slot">
              <LayersPanel
                t={t}
                lang={lang}
                state={layers}
                structures={structures}
                onPeel={peelLayer}
                onRestore={restoreLayers}
                onToggleTissue={toggleLayerTissue}
                onShow={showLayerStructure}
                onClose={wide ? undefined : () => setLayersOpen(false)}
              />
            </div>
          )}
          <div className="panel">
            {!wide && <EducationalLine t={t} />}
            <div
              className="panel-scroll"
              data-testid="panel-scroll"
              role="tabpanel"
              id="tabpanel"
              hidden={phoneLayers}
              aria-labelledby={`tab-${shownMode}`}
              tabIndex={0}
            >
              {notice && (
                <p className="muted search-notice" role="status" data-testid="search-notice">
                  {noticeText(notice, t, lang)}
                </p>
              )}
              <ModelErrorBoundary key={region ?? ""} t={t} messageKey="error.dataLoad" onRetry={forgetFailedRegionData}>
                {/* Until the manifest says which region to show, the panel shows the same hint as while the data loads. */}
                {region === null ? (
                  <Hint t={t} />
                ) : (
                  <Suspense fallback={<Hint t={t} region={region} />}>
                    <PanelArea
                      region={region}
                      t={t}
                      lang={lang}
                      mode={shownMode}
                      selection={selection}
                      label={label}
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
                      onLog={logMovement}
                      notebookStore={notebookStore}
                      storeFailure={notebookFailure}
                      onFocusNotebookStructure={focusAreaStructure}
                      onPrintNotebook={printNotebook}
                    />
                  </Suspense>
                )}
              </ModelErrorBoundary>
            </div>
          </div>
          {wide && (
            <div className="side-foot">
              <LanguagePicker t={t} lang={lang} onLang={changeLang} showLabel />
            </div>
          )}
        </aside>
      </main>
      <AppDialog
        open={dialog !== null}
        title={dialog === "settings" ? t("settings.title") : t("credits.title")}
        closeLabel={t("dialog.close")}
        onClose={() => setDialog(null)}
      >
        {dialog === "settings" && <LanguagePicker t={t} lang={lang} onLang={changeLang} showLabel={false} />}
        <CreditsBody t={t} />
      </AppDialog>
      {bundle && printJob && (
        <QuietBoundary>
          <Suspense fallback={null}>
            <PrintSummary t={t} lang={lang} bundle={bundle} entries={printJob.entries} press={printJob.press} />
          </Suspense>
        </QuietBoundary>
      )}
    </ModelErrorBoundary>
  );
}
