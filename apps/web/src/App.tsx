import { Suspense, useState } from "react";
import en from "./i18n/en.json";
import { createT } from "./i18n/t";
import { PerfOverlay } from "./perf/PerfOverlay";
import { Credits } from "./ui/Credits";
import { Hint, RegionInfo } from "./ui/RegionInfo";
import { Viewer } from "./viewer/Viewer";
import { ModelErrorBoundary } from "./viewer/ModelErrorBoundary";
import type { Selection } from "./viewer/pick";

const t = createT(en);
const REGION = "hip";

export function App() {
  const [selection, setSelection] = useState<Selection | null>(null);
  const [label, setLabel] = useState<string | undefined>(undefined);

  function select(sel: Selection | null, fileLabel?: string) {
    setSelection(sel);
    setLabel(fileLabel);
  }

  // A failure to load the data ends in the same readable error as a model failure.
  return (
    <ModelErrorBoundary t={t}>
      <main className="app">
        <div className="stage">
          <Viewer region={REGION} t={t} selection={selection} onSelect={select} />
          <PerfOverlay t={t} />
        </div>
        <footer className="panel">
          <Suspense fallback={<Hint t={t} />}>
            <RegionInfo region={REGION} selection={selection} fallbackLabel={label} t={t} onSelect={select} />
          </Suspense>
          <Credits t={t} />
        </footer>
      </main>
    </ModelErrorBoundary>
  );
}
