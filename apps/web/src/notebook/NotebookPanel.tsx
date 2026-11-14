import { useEffect, useRef, useState, type ChangeEvent } from "react";
import type { RegionBundle } from "../data/bundle";
import type { Translate } from "../i18n/t";
import type { Selection } from "../viewer/pick";
import { formatAngles } from "./angles";
import { BACKUP_MAX_BYTES, backupFileName, mergeEntries, parseBackup, toBackup } from "./backup";
import { compare, isKnown, type Candidate } from "./compare";
import type { NotebookStore } from "./store";
import type { NotebookEntry } from "./types";

// Shows the structures to look into. Set it to false to show the notes only, without the comparison.
export const SHOW_COMPARISON = true;

type Props = {
  t: Translate;
  bundle: RegionBundle;
  store: NotebookStore | null; // null while it opens
  storeError: boolean; // true when it could not be opened
  showComparison: boolean;
  // Make the structure visible, select it and turn the camera to it.
  onFocusStructure: (sel: Selection) => void;
  onPrint: (entries: NotebookEntry[]) => void;
};

// The Notebook tab: the notes, the structures to look into, and the print and backup buttons.
// Every store error is caught here and shown as one plain line. Nothing is ever logged.
export function NotebookPanel({ t, bundle, store, storeError, showComparison, onFocusStructure, onPrint }: Props) {
  const [entries, setEntries] = useState<NotebookEntry[] | null>(null);
  const [listFailed, setListFailed] = useState(false);
  const [status, setStatus] = useState<string | null>(null);
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
      <h2>{t("notebook.title")}</h2>
      <p className="notebook-disclaimer">{t("notebook.disclaimer")}</p>
      <p className="muted">{t("notebook.private")}</p>
    </>
  );
  if (storeError || listFailed) {
    return (
      <section className="notebook-panel" data-testid="notebook-panel">
        {head}
        <p>{t("notebook.unavailable")}</p>
      </section>
    );
  }
  if (!store || !entries) {
    return (
      <section className="notebook-panel" data-testid="notebook-panel">
        {head}
      </section>
    );
  }
  const ready = store;

  // Runs a store change, then shows the list as the store now has it. A failure only shows the line.
  async function change(work: () => Promise<string | null>) {
    try {
      const message = await work();
      setEntries(await ready.list());
      setStatus(message);
    } catch {
      setStatus(t("notebook.unavailable"));
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
      setStatus(t("notebook.loadError.too-large"));
      return;
    }
    let text: string;
    try {
      text = await file.text();
    } catch {
      setStatus(t("notebook.loadError.not-json"));
      return;
    }
    const parsed = parseBackup(text);
    if (!parsed.ok) {
      setStatus(t(`notebook.loadError.${parsed.reason}`));
      return;
    }
    await change(async () => {
      const { toAdd, skipped } = mergeEntries(await ready.list(), parsed.entries);
      if (toAdd.length > 0) await ready.putMany(toAdd);
      return t("notebook.loaded", { added: String(toAdd.length), skipped: String(skipped) });
    });
  }

  const loadButton = (
    <>
      <button type="button" onClick={() => fileInput.current?.click()}>
        {t("notebook.loadBackup")}
      </button>
      <input ref={fileInput} type="file" accept="application/json,.json" hidden aria-label={t("notebook.loadBackup")} onChange={loadBackup} />
    </>
  );
  const statusLine = status && (
    <p className="muted" role="status">
      {status}
    </p>
  );

  if (entries.length === 0) {
    return (
      <section className="notebook-panel" data-testid="notebook-panel">
        {head}
        <p>{t("notebook.empty")}</p>
        <div className="panel-actions">{loadButton}</div>
        {statusLine}
      </section>
    );
  }

  const list = entries;
  return (
    <section className="notebook-panel" data-testid="notebook-panel">
      {head}
      <p className="muted">{t("notebook.backupHint")}</p>
      <h3>{t("notebook.entries")}</h3>
      <ul className="notebook-entries">
        {list.map((entry) => (
          <EntryItem key={entry.id} t={t} bundle={bundle} entry={entry} onDelete={() => remove(entry.id)} />
        ))}
      </ul>
      {showComparison && <LookInto t={t} bundle={bundle} entries={list} onFocusStructure={onFocusStructure} />}
      <div className="panel-actions">
        <button type="button" onClick={() => onPrint(list)}>
          {t("notebook.print")}
        </button>
        <button type="button" onClick={() => saveBackup(list)}>
          {t("notebook.saveBackup")}
        </button>
        {loadButton}
      </div>
      {statusLine}
    </section>
  );
}

// The movement's name, the exercise and phase, or a plain word when this version does not know it.
export function entryName(entry: NotebookEntry, bundle: RegionBundle, t: Translate): string {
  if (!isKnown(entry, bundle)) return t("notebook.unknown");
  const pick = entry.pick;
  if (pick.kind === "movement") return bundle.movements.find((m) => m.id === pick.id)?.english ?? pick.id;
  const exercise = bundle.exercises.find((x) => x.id === pick.id);
  const phase = exercise?.phases.find((p) => p.id === pick.phase);
  return t("notebook.entryPhase", { exercise: exercise?.english ?? pick.id, phase: phase?.english ?? pick.phase });
}

// One candidate line. The panel and the printed summary both use it, so they say the same.
export function candidateText(t: Translate, bundle: RegionBundle, cand: Candidate, total: number): string {
  const name = bundle.structures.find((s) => s.id === cand.sid)?.english ?? cand.sid;
  return t("notebook.candidate", { name, painful: String(cand.painful), total: String(total) });
}

// The line naming structures that movements feeling fine also load. The printed summary uses it too.
export function ruledOutText(t: Translate, bundle: RegionBundle, ruledOut: string[]): string {
  const nameOf = (sid: string) => bundle.structures.find((s) => s.id === sid)?.english ?? sid;
  return t("notebook.ruledOut", { names: ruledOut.map(nameOf).join(", ") });
}

// One note. The note text is shown as plain text, never as HTML.
function EntryItem({ t, bundle, entry, onDelete }: { t: Translate; bundle: RegionBundle; entry: NotebookEntry; onDelete: () => void }) {
  const angles = formatAngles(entry.pose, bundle, t);
  return (
    <li>
      <p>
        {t("notebook.entry", {
          date: entry.date,
          name: entryName(entry, bundle, t),
          feeling: t(`notebook.${entry.feeling}`),
          side: t(`notebook.side.${entry.side}`),
        })}
      </p>
      {angles && <p className="muted">{t("notebook.angles", { angles })}</p>}
      {entry.note && <p className="notebook-note">{entry.note}</p>}
      <button type="button" className="link-button" onClick={onDelete}>
        {t("notebook.delete")}
      </button>
    </li>
  );
}

// The structures to look into, side by side apart. The disclaimer sits right under the heading,
// next to the result. The candidates come in the order compare() gives, by name, with plain counts.
function LookInto({ t, bundle, entries, onFocusStructure }: { t: Translate; bundle: RegionBundle; entries: NotebookEntry[]; onFocusStructure: (sel: Selection) => void }) {
  const sides = (["l", "r"] as const).map((side) => compare(entries, bundle, side)).filter((c) => c.painfulCount > 0);
  return (
    <div className="notebook-look-into">
      <h3>{t("notebook.lookInto")}</h3>
      <p className="notebook-disclaimer">{t("notebook.disclaimer")}</p>
      {sides.length === 0 && <p>{t("notebook.needPainful")}</p>}
      {sides.map((c) => (
        <div key={c.side}>
          <h4>{t(`notebook.lookIntoSide.${c.side}`)}</h4>
          {c.candidates.length === 0 && c.ruledOut.length === 0 ? (
            <p>{t("notebook.noRows")}</p>
          ) : (
            c.candidates.length > 0 && (
            <ul>
              {c.candidates.map((cand) => (
                <li key={cand.sid}>
                  <button type="button" className="link-button" onClick={() => onFocusStructure({ sid: cand.sid, side: c.side })}>
                    {candidateText(t, bundle, cand, c.painfulCount)}
                  </button>
                </li>
              ))}
            </ul>
            )
          )}
          {c.ruledOut.length > 0 && <p className="muted">{ruledOutText(t, bundle, c.ruledOut)}</p>}
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
