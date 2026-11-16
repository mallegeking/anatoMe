import { useEffect, useId, useRef, useState, type ChangeEvent } from "react";
import type { RegionBundle } from "../data/bundle";
import type { Lang } from "../i18n/lang";
import { nameOf } from "../i18n/names";
import type { Translate } from "../i18n/t";
import type { Selection } from "../viewer/pick";
import { formatAngles } from "./angles";
import { BACKUP_MAX_BYTES, backupFileName, mergeEntries, parseBackup, toBackup } from "./backup";
import { AlertIcon, CheckIcon, LockIcon } from "../ui/icons";
import { Card, Chip, Chips, PanelTitle, SectionHeading } from "../ui/pieces";
import { candidateNotes, compare, isKnown, type Candidate } from "./compare";
import { formatDate } from "./dates";
import type { NotebookStore } from "./store";
import type { NotebookEntry } from "./types";

// Shows the structures to look into. Set it to false to show the notes only, without the comparison.
export const SHOW_COMPARISON = true;

// Why the store could not be opened: the browser blocks storage, or the store's code did not download.
export type StoreFailure = "blocked" | "load" | null;

type Props = {
  t: Translate;
  // The language the names show in. The notes keep ids, so the same notes read in any language.
  lang: Lang;
  bundle: RegionBundle;
  store: NotebookStore | null; // null while it opens
  storeFailure: StoreFailure; // null unless it could not be opened
  showComparison: boolean;
  // Make the structure visible, select it and turn the camera to it.
  onFocusStructure: (sel: Selection) => void;
  onPrint: (entries: NotebookEntry[]) => void;
};

// A status line keeps its text key and the numbers that fill it, not the finished text,
// so it is translated when it shows and reads in the new language after a switch.
type Status = { key: string; vars?: Record<string, string> };

// The Notebook tab: the notes, the structures to look into, and the print and backup buttons.
// Every store error is caught here and shown as one plain line. Nothing is ever logged.
export function NotebookPanel({ t, lang, bundle, store, storeFailure, showComparison, onFocusStructure, onPrint }: Props) {
  const [entries, setEntries] = useState<NotebookEntry[] | null>(null);
  const [listFailed, setListFailed] = useState(false);
  const [status, setStatus] = useState<Status | null>(null);
  const fileInput = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!store) return;
    let live = true;
    store.list().then(
      (list) => live && setEntries(list),
      () => live && setListFailed(true),
    );
    return () => {
      live = false;
    };
  }, [store]);

  const head = (
    <>
      <div className="panel-head">
        <PanelTitle>{t("notebook.title")}</PanelTitle>
      </div>
      <Card>
        <p className="notebook-private">
          <LockIcon />
          {t("notebook.private")}
        </p>
      </Card>
      <p className="notebook-disclaimer">{t("notebook.disclaimer")}</p>
    </>
  );
  if (storeFailure || listFailed) {
    return (
      <section className="notebook-panel panel-body" data-testid="notebook-panel">
        {head}
        <p>{t(storeFailure === "load" ? "notebook.loadFailed" : "notebook.unavailable")}</p>
      </section>
    );
  }
  if (!store || !entries) {
    return (
      <section className="notebook-panel panel-body" data-testid="notebook-panel">
        {head}
      </section>
    );
  }
  const ready = store;

  // Runs a store change, then shows the list as the store now has it. A failure only shows the line.
  async function change(work: () => Promise<Status | null>) {
    try {
      const message = await work();
      setEntries(await ready.list());
      setStatus(message);
    } catch {
      setStatus({ key: "notebook.unavailable" });
    }
  }

  function remove(id: string) {
    if (!window.confirm(t("notebook.deleteConfirm"))) return;
    void change(async () => {
      await ready.remove(id);
      return null;
    });
  }

  // The backup leaves the app only as a file the person saves themselves.
  function saveBackup(list: NotebookEntry[]) {
    const now = new Date();
    const url = URL.createObjectURL(new Blob([toBackup(list, now)], { type: "application/json" }));
    const link = document.createElement("a");
    link.href = url;
    link.download = backupFileName(now);
    document.body.appendChild(link);
    link.click();
    link.remove();
    // Some phone browsers still read the file just after the click, so it is let go a moment later.
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  }

  // A backup file is input from outside. Anything wrong changes nothing and says why.
  async function loadBackup(e: ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;
    if (file.size > BACKUP_MAX_BYTES) {
      setStatus({ key: "notebook.loadError.too-large" });
      return;
    }
    let text: string;
    try {
      text = await file.text();
    } catch {
      setStatus({ key: "notebook.loadError.not-json" });
      return;
    }
    const parsed = parseBackup(text);
    if (!parsed.ok) {
      setStatus({ key: `notebook.loadError.${parsed.reason}` });
      return;
    }
    await change(async () => {
      const { toAdd, skipped } = mergeEntries(await ready.list(), parsed.entries);
      if (toAdd.length > 0) await ready.putMany(toAdd);
      return { key: "notebook.loaded", vars: { added: String(toAdd.length), skipped: String(skipped) } };
    });
  }

  const loadButton = (
    <>
      <button className="btn" type="button" onClick={() => fileInput.current?.click()}>
        {t("notebook.loadBackup")}
      </button>
      <input ref={fileInput} type="file" accept="application/json,.json" hidden aria-label={t("notebook.loadBackup")} onChange={loadBackup} />
    </>
  );
  const statusLine = status && (
    <p className="muted" role="status">
      {t(status.key, status.vars)}
    </p>
  );

  if (entries.length === 0) {
    return (
      <section className="notebook-panel panel-body" data-testid="notebook-panel">
        {head}
        <p>{t("notebook.empty")}</p>
        <div className="panel-actions">{loadButton}</div>
        {statusLine}
      </section>
    );
  }

  const list = entries;
  return (
    <section className="notebook-panel panel-body" data-testid="notebook-panel">
      {head}
      <div className="panel-section">
        <SectionHeading>{t("notebook.entries")}</SectionHeading>
        <ul className="action-rows notebook-entries">
          {list.map((entry) => (
            <EntryItem key={entry.id} t={t} lang={lang} bundle={bundle} entry={entry} onDelete={() => remove(entry.id)} />
          ))}
        </ul>
      </div>
      {showComparison && <LookInto t={t} lang={lang} bundle={bundle} entries={list} onFocusStructure={onFocusStructure} />}
      <div className="panel-section">
        <SectionHeading>{t("notebook.keep")}</SectionHeading>
        <p className="muted">{t("notebook.backupHint")}</p>
        <div className="panel-actions">
          <button className="btn" type="button" onClick={() => onPrint(list)}>
            {t("notebook.print")}
          </button>
          <button className="btn" type="button" onClick={() => saveBackup(list)}>
            {t("notebook.saveBackup")}
          </button>
          {loadButton}
        </div>
        {statusLine}
      </div>
    </section>
  );
}

// The movement's name, the exercise and phase, or a plain word when this version does not know it.
export function entryName(entry: NotebookEntry, bundle: RegionBundle, t: Translate, lang: Lang): string {
  if (!isKnown(entry, bundle)) return t("notebook.unknown");
  const pick = entry.pick;
  if (pick.kind === "movement") {
    const movement = bundle.movements.find((m) => m.id === pick.id);
    return movement ? nameOf(movement, lang) : pick.id;
  }
  const exercise = bundle.exercises.find((x) => x.id === pick.id);
  const phase = exercise?.phases.find((p) => p.id === pick.phase);
  return t("notebook.entryPhase", { exercise: exercise ? nameOf(exercise, lang) : pick.id, phase: phase ? nameOf(phase, lang) : pick.phase });
}

// A structure's name in the language shown, or its id when this version does not know it.
function structureName(bundle: RegionBundle, sid: string, lang: Lang): string {
  const structure = bundle.structures.find((s) => s.id === sid);
  return structure ? nameOf(structure, lang) : sid;
}

// One candidate line. The panel and the printed summary both use it, so they say the same.
export function candidateText(t: Translate, bundle: RegionBundle, cand: Candidate, total: number, lang: Lang): string {
  const name = structureName(bundle, cand.sid, lang);
  return t("notebook.candidate", { name, painful: String(cand.painful), total: String(total) });
}

// The line naming structures that movements feeling fine also load. The printed summary uses it too.
export function ruledOutText(t: Translate, bundle: RegionBundle, ruledOut: string[], lang: Lang): string {
  return t("notebook.ruledOut", { names: ruledOut.map((sid) => structureName(bundle, sid, lang)).join(", ") });
}

// One note. The note text is shown as plain text, never as HTML.
// Delete is described by the hidden line, which reads the name and the date as one phrase.
function EntryItem({ t, lang, bundle, entry, onDelete }: { t: Translate; lang: Lang; bundle: RegionBundle; entry: NotebookEntry; onDelete: () => void }) {
  const angles = formatAngles(entry.pose, bundle, t);
  const lineId = useId();
  const name = entryName(entry, bundle, t, lang);
  const date = formatDate(entry.date, lang);
  const painful = entry.feeling === "painful";
  return (
    <Card as="li">
      <div className="entry-line">
        <span className="card-title">{name}</span>
        <span className="muted">{date}</span>
      </div>
      <Chips>
        <Chip tone={painful ? "warn" : "plain"} icon={painful ? <AlertIcon size={14} /> : <CheckIcon size={14} />}>
          {t(`notebook.${entry.feeling}`)}
        </Chip>
        <Chip>{t(`notebook.side.${entry.side}`)}</Chip>
      </Chips>
      {angles && <p className="muted">{t("notebook.angles", { angles })}</p>}
      {entry.note && <p className="notebook-note">{entry.note}</p>}
      <span id={lineId} hidden>
        {t("notebook.entryAria", { name, date })}
      </span>
      <button type="button" className="link-button" aria-describedby={lineId} onClick={onDelete}>
        {t("notebook.delete")}
      </button>
    </Card>
  );
}

// The lines under a candidate: the limits on who it applies to, then how well supported the rows are.
// The printed summary shows the same lines, without the pale muted class so they print black.
export function CandidateNotes({ t, bundle, cand, className }: { t: Translate; bundle: RegionBundle; cand: Candidate; className?: string }) {
  const { confidence, appliesTo } = candidateNotes(bundle, cand);
  return (
    <>
      {appliesTo.map((text) => (
        <div key={text} className={className}>
          {t("info.appliesTo", { text })}
        </div>
      ))}
      <div className={className}>{t(`confidence.${confidence}`)}</div>
    </>
  );
}

// The structures to look into, side by side apart. The disclaimer sits right under the heading,
// next to the result. The candidates come in the order compare() gives, by name, with plain counts.
function LookInto({ t, lang, bundle, entries, onFocusStructure }: { t: Translate; lang: Lang; bundle: RegionBundle; entries: NotebookEntry[]; onFocusStructure: (sel: Selection) => void }) {
  const sides = (["l", "r"] as const).map((side) => compare(entries, bundle, side, lang)).filter((c) => c.painfulCount > 0);
  return (
    <div className="panel-section notebook-look-into">
      <SectionHeading>{t("notebook.lookInto")}</SectionHeading>
      <p className="notebook-disclaimer">{t("notebook.disclaimer")}</p>
      {sides.length === 0 && <p>{t("notebook.needPainful")}</p>}
      {sides.map((c) => (
        <div key={c.side} className="panel-section">
          <h4 className="notebook-side">{t(`notebook.lookIntoSide.${c.side}`)}</h4>
          {c.candidates.length === 0 && c.ruledOut.length === 0 ? (
            <p>{t("notebook.noRows")}</p>
          ) : (
            c.candidates.length > 0 && (
            <ul className="action-rows">
              {c.candidates.map((cand) => (
                <Card as="li" key={cand.sid}>
                  <button type="button" className="link-button" onClick={() => onFocusStructure({ sid: cand.sid, side: c.side })}>
                    {candidateText(t, bundle, cand, c.painfulCount, lang)}
                  </button>
                  <CandidateNotes t={t} bundle={bundle} cand={cand} className="muted" />
                </Card>
              ))}
            </ul>
            )
          )}
          {c.ruledOut.length > 0 && <p className="muted">{ruledOutText(t, bundle, c.ruledOut, lang)}</p>}
          {c.fineCount === 0 && <p className="muted">{t("notebook.needFine")}</p>}
          {c.incomplete && <p className="muted">{t("notebook.incomplete")}</p>}
        </div>
      ))}
    </div>
  );
}

// React.lazy loads this default export. It passes the switch on, so the switch stays in the notebook chunk.
export default function LazyNotebookPanel(props: Omit<Props, "showComparison">) {
  return <NotebookPanel {...props} showComparison={SHOW_COMPARISON} />;
}
