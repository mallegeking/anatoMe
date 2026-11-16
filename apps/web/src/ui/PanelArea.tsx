import { Suspense, useEffect } from "react";
import type { RegionBundle } from "../data/bundle";
import { useRegionData } from "../data/useRegionData";
import type { Lang } from "../i18n/lang";
import type { Translate } from "../i18n/t";
import { AreaPanel, type AreaState } from "../area/AreaPanel";
import { lazyRetry } from "./lazyRetry";
import { QuietBoundary } from "./QuietBoundary";
import { MovementPanel } from "../movement/MovementPanel";
import type { MovementState } from "../movement/state";
import type { NotebookStore } from "../notebook/store";
import type { StoreFailure } from "../notebook/NotebookPanel";
import type { EntrySide, Feeling, NotebookEntry } from "../notebook/types";
import type { Selection } from "../viewer/pick";
import type { Mode } from "./ModeBar";
import { RegionInfo } from "./RegionInfo";

// The Notebook tab is its own chunk, so it loads only when the tab is first opened.
// If that chunk fails to load, the failure stays inside the tab and the other tabs keep working.
// Leaving the tab and coming back tries the download again.
const notebookPanel = lazyRetry(() => import("../notebook/NotebookPanel"));

type Props = {
  region: string;
  t: Translate;
  // The language the names show in.
  lang: Lang;
  mode: Mode;
  selection: Selection | null;
  label: string | undefined;
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
  // Resolves to true once the note is saved.
  onLog: (input: { feeling: Feeling; side: EntrySide; note: string }) => Promise<boolean>;
  notebookStore: NotebookStore | null;
  storeFailure: StoreFailure;
  onFocusNotebookStructure: (sel: Selection) => void;
  onPrintNotebook: (entries: NotebookEntry[]) => void;
};

// Loads the data, tells the app which structures exist, and shows one of the panels:
// the movement panel in the Movements tab, else the area panel in the Area tab,
// else the notebook in the Notebook tab, else the info panel.
export function PanelArea({ region, t, lang, mode, selection, label, movement, onBundle, ...on }: Props) {
  const bundle = useRegionData(region);
  useEffect(() => onBundle(bundle), [bundle, onBundle]);
  if (mode === "movement") {
    return (
      <MovementPanel
        t={t}
        lang={lang}
        bundle={bundle}
        state={movement}
        onChange={on.onMovementChange}
        selection={selection}
        onFocusStructure={on.onFocusStructure}
        onOpenStructure={on.onOpenStructure}
        onLog={on.onLog}
      />
    );
  }
  if (mode === "area") {
    return (
      <AreaPanel
        t={t}
        lang={lang}
        bundle={bundle}
        area={on.area}
        selection={selection}
        onFocusStructure={on.onFocusAreaStructure}
        onOpenMovement={on.onOpenMovement}
        onClear={on.onAreaClear}
      />
    );
  }
  if (mode === "notebook") {
    const NotebookPanel = notebookPanel();
    return (
      <QuietBoundary fallback={<p>{t("notebook.loadFailed")}</p>}>
        <Suspense fallback={null}>
          <NotebookPanel
            t={t}
            lang={lang}
            bundle={bundle}
            store={on.notebookStore}
            storeFailure={on.storeFailure}
            onFocusStructure={on.onFocusNotebookStructure}
            onPrint={on.onPrintNotebook}
          />
        </Suspense>
      </QuietBoundary>
    );
  }
  return (
    <RegionInfo
      region={region}
      selection={selection}
      fallbackLabel={label}
      t={t}
      lang={lang}
      onSwitchSide={on.onSwitchSide}
      onHide={on.onHideSelected}
      onOpenMovement={on.onOpenMovement}
      onOverUnder={on.onOverUnder}
    />
  );
}
