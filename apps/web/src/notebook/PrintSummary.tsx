import { useEffect, useMemo } from "react";
import type { RegionBundle } from "../data/bundle";
import type { Translate } from "../i18n/t";
import { SHOW_COMPARISON } from "./NotebookPanel";
import { Summary } from "./Summary";
import { summaryModel } from "./summary";
import type { NotebookEntry } from "./types";

// React.lazy loads this default export. It builds the summary from the notes, puts it on the page,
// and prints only after it is mounted and one frame has painted. Each new press value prints again.
export default function PrintSummary({ t, bundle, entries, press }: { t: Translate; bundle: RegionBundle; entries: NotebookEntry[]; press: number }) {
  const model = useMemo(() => summaryModel(entries, bundle, new Date(), SHOW_COMPARISON), [entries, bundle, press]);
  useEffect(() => {
    const frame = requestAnimationFrame(() => window.print());
    return () => cancelAnimationFrame(frame);
  }, [press]);
  return <Summary t={t} bundle={bundle} model={model} />;
}
