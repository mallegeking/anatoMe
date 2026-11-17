import { useEffect, useMemo } from "react";
import type { RegionBundle } from "../data/bundle";
import type { Lang } from "../i18n/lang";
import type { Translate } from "../i18n/t";
import { SHOW_COMPARISON } from "./NotebookPanel";
import { Summary } from "./Summary";
import { summaryModel } from "./summaryModel";
import type { NotebookEntry } from "./types";

// React.lazy loads this default export. It builds the summary from the notes, puts it on the page,
// and prints only after it is mounted and one frame has painted. Each new press value prints again.
// It only reads the notes, so printing in either language leaves the notes and their backup as they are.
export default function PrintSummary({ t, lang, bundle, entries, press }: { t: Translate; lang: Lang; bundle: RegionBundle; entries: NotebookEntry[]; press: number }) {
  const model = useMemo(() => summaryModel(entries, bundle, new Date(), SHOW_COMPARISON, lang), [entries, bundle, press, lang]);
  useEffect(() => {
    const frame = requestAnimationFrame(() => window.print());
    return () => cancelAnimationFrame(frame);
  }, [press]);
  return <Summary t={t} lang={lang} bundle={bundle} model={model} />;
}
