import { useState } from "react";
import en from "./i18n/en.json";
import { createT } from "./i18n/t";
import { PerfOverlay } from "./perf/PerfOverlay";
import { Credits } from "./ui/Credits";
import { InfoLabel } from "./ui/InfoLabel";
import { Viewer } from "./viewer/Viewer";
import { formatLabel, type PickedStructure } from "./viewer/pick";

const t = createT(en);

export function App() {
  const [picked, setPicked] = useState<PickedStructure | null>(null);

  return (
    <main className="app">
      <div className="stage">
        <Viewer region="hip" t={t} onPick={setPicked} />
        <PerfOverlay t={t} />
      </div>
      <footer className="panel">
        <InfoLabel text={picked ? formatLabel(picked, t) : t("info.tapHint")} isHint={!picked} />
        <Credits t={t} />
      </footer>
    </main>
  );
}
