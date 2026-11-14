import type { RegionBundle } from "../data/bundle";
import type { Translate } from "../i18n/t";
import { formatAngles } from "./angles";
import { candidateText, entryName } from "./NotebookPanel";
import type { SummaryModel } from "./summary";
import type { NotebookEntry } from "./types";

// The one-page summary. It is hidden on screen and is the only thing the print layout shows.
// Every text is plain text, so a note can never turn into HTML.
export function Summary({ t, bundle, model }: { t: Translate; bundle: RegionBundle; model: SummaryModel }) {
  const table = (rows: NotebookEntry[], more: number) => (
    <>
      <table>
        <thead>
          <tr>
            {(["date", "movement", "side", "angles", "note"] as const).map((c) => (
              <th key={c} scope="col">
                {t(`summary.column.${c}`)}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((entry) => (
            <tr key={entry.id}>
              <td>{entry.date}</td>
              <td>{entryName(entry, bundle, t)}</td>
              <td>{t(`notebook.side.${entry.side}`)}</td>
              <td>{formatAngles(entry.pose, bundle, t)}</td>
              <td>{entry.note}</td>
            </tr>
          ))}
        </tbody>
      </table>
      {more > 0 && <p>{t("summary.more", { count: String(more) })}</p>}
    </>
  );
  const hasComparison = model.comparisons.length > 0;
  return (
    <section className="print-summary">
      <h1>{t("summary.title")}</h1>
      <p>{t("summary.printed", { date: model.printedOn })}</p>
      {model.from && model.to && <p>{t("summary.range", { from: model.from, to: model.to })}</p>}
      <p>{t("notebook.disclaimer")}</p>
      <h2>{t("summary.painful")}</h2>
      {table(model.painful, model.painfulMore)}
      <h2>{t("summary.fine")}</h2>
      {table(model.fine, model.fineMore)}
      {hasComparison && (
        <>
          <p>{t("notebook.disclaimer")}</p>
          {model.comparisons.map((c) => (
            <div key={c.side}>
              <h3>{t(`notebook.lookIntoSide.${c.side}`)}</h3>
              {c.candidates.length === 0 ? (
                <p>{t("notebook.noRows")}</p>
              ) : (
                <ul>
                  {c.candidates.map((cand) => (
                    <li key={cand.sid}>{candidateText(t, bundle, cand, c.painfulCount)}</li>
                  ))}
                </ul>
              )}
            </div>
          ))}
          <p>{t("summary.basis")}</p>
        </>
      )}
    </section>
  );
}
