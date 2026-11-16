import { Suspense, useEffect, useId, useRef, useState, type ReactNode } from "react";
import type { BundleAction, RegionBundle } from "../data/bundle";
import { describeAction, jointOf } from "../data/describe";
import { lazyRetry } from "../ui/lazyRetry";
import { QuietBoundary } from "../ui/QuietBoundary";
import type { Lang } from "../i18n/lang";
import { nameOf } from "../i18n/names";
import type { Translate } from "../i18n/t";
import type { EntrySide, Feeling } from "../notebook/types";
import { DraftMark } from "../review/DraftMark";
import { ActionNotes, Sources } from "../ui/InfoPanel";
import type { Selection } from "../viewer/pick";
import { contextAngles, HIGHLIGHT_ORDER, involved, type Query } from "./roles";
import { clearPick, pickExercise, pickMovement, pickPhase, queryOf, setAngle, setProgress, type MovementPick, type MovementState } from "./state";

// The log form is notebook code, so it loads only when "Log this movement" is first pressed.
// A failed download is tried again the next time the form opens.
const logForm = lazyRetry(() => import("../notebook/LogForm"));

type LogInput = { feeling: Feeling; side: EntrySide; note: string };

type Props = {
  t: Translate;
  // The language the names show in.
  lang: Lang;
  bundle: RegionBundle;
  state: MovementState;
  onChange: (state: MovementState) => void;
  selection: Selection | null;
  // Select the structure and turn the camera to it.
  onFocusStructure: (sid: string) => void;
  // The same, and switch to the Structures tab.
  onOpenStructure: (sid: string) => void;
  // Save the picked movement to the notebook. Resolves to true once it is saved. Without it there is no log button.
  onLog?: (input: LogInput) => Promise<boolean>;
};

// The panel of the Movements tab: the list to pick from, or the picked movement or exercise with its result.
export function MovementPanel(props: Props) {
  const { t, lang, bundle, state, onChange } = props;
  const query = queryOf(state, bundle);
  // A pick the data does not know (any more) is treated as no pick.
  if (!state.pick || !query) return <Picker t={t} lang={lang} bundle={bundle} onChange={onChange} />;

  const back = (
    <div className="panel-actions">
      <button className="btn" type="button" onClick={() => onChange(clearPick())}>
        {t("movement.back")}
      </button>
    </div>
  );
  const result = <Result {...props} query={query} />;
  // A new pick starts with the form closed.
  const log = props.onLog ? <LogMovement key={`${state.pick.kind}:${state.pick.id}`} t={t} onLog={props.onLog} /> : null;

  if (state.pick.kind === "exercise") {
    return (
      <ExerciseView {...props} pick={state.pick} back={back} log={log}>
        {result}
      </ExerciseView>
    );
  }

  const pickedId = state.pick.id;
  const movement = bundle.movements.find((m) => m.id === pickedId)!;
  return (
    <section className="movement-panel" data-testid="movement-panel">
      <h2>{nameOf(movement, lang)}</h2>
      {back}
      {contextAngles(bundle, query).map(({ angle, min, max }) => {
        const value = state.pose[angle] ?? 0;
        return (
          <label key={angle} className="movement-slider">
            <span>{t("movement.slider", { angle: t(`angle.${angle}`), value: String(value) })}</span>
            <input type="range" min={min} max={max} step={5} value={value} onChange={(e) => onChange(setAngle(state, angle, Number(e.target.value)))} />
          </label>
        );
      })}
      {log}
      {result}
    </section>
  );
}

// "Log this movement" opens the form in place. A save that worked or a cancel closes it again.
// A save that failed keeps the form open with what was typed, so the person can try again.
// If the form's chunk fails to load, the failure stays here and the rest of the panel keeps working.
function LogMovement({ t, onLog }: { t: Translate; onLog: (input: LogInput) => Promise<boolean> }) {
  const [open, setOpen] = useState(false);
  const logButton = useRef<HTMLButtonElement>(null);
  const wasOpen = useRef(false);
  // True while a save is under way, so a second press does not save the same note twice.
  const saving = useRef(false);
  // When the form closes, focus goes back to the button that opened it.
  useEffect(() => {
    if (wasOpen.current && !open) logButton.current?.focus();
    wasOpen.current = open;
  }, [open]);
  if (!open) {
    return (
      <div className="panel-actions">
        <button className="btn" ref={logButton} type="button" onClick={() => setOpen(true)}>
          {t("notebook.log")}
        </button>
      </div>
    );
  }
  async function save(input: LogInput) {
    if (saving.current) return;
    saving.current = true;
    try {
      if (await onLog(input)) setOpen(false);
    } finally {
      saving.current = false;
    }
  }
  const LogForm = logForm();
  return (
    <QuietBoundary fallback={<p>{t("notebook.loadFailed")}</p>}>
      <Suspense fallback={null}>
        <LogForm t={t} onSave={(input) => void save(input)} onCancel={() => setOpen(false)} />
      </Suspense>
    </QuietBoundary>
  );
}

// Nothing picked: the movements grouped by joint, then the exercises.
function Picker({ t, lang, bundle, onChange }: Pick<Props, "t" | "lang" | "bundle" | "onChange">) {
  const joints = [...new Set(bundle.movements.map(jointOf))];
  // In the review build the waiting exercises are listed as drafts, so the waiting line would only repeat them.
  const exercisesPending = bundle.exercises.length === 0 && bundle.pendingExercises > 0 && bundle.mode !== "review";
  return (
    <section className="movement-panel" data-testid="movement-panel">
      <h2>{t("movement.pick")}</h2>
      {joints.map((joint) => (
        <div key={joint}>
          <h3>{t(`movement.joint.${joint}`)}</h3>
          <div className="movement-choices">
            {bundle.movements
              .filter((m) => jointOf(m) === joint)
              .map((m) => (
                <button className="btn" key={m.id} type="button" onClick={() => onChange(pickMovement(bundle, m.id))}>
                  {nameOf(m, lang)}
                </button>
              ))}
          </div>
        </div>
      ))}
      {(bundle.exercises.length > 0 || exercisesPending) && (
        <div>
          <h3>{t("movement.exercises")}</h3>
          {exercisesPending && <p className="muted">{t("movement.exercisesPending")}</p>}
          <div className="movement-choices">
            {bundle.exercises.map((e) => (
              <button className="btn" key={e.id} type="button" onClick={() => onChange(pickExercise(bundle, e.id))}>
                {nameOf(e, lang)}
              </button>
            ))}
          </div>
        </div>
      )}
    </section>
  );
}

// An exercise: its phases, how far through the phase, and the result.
type ExerciseProps = Props & { pick: Extract<MovementPick, { kind: "exercise" }>; back: ReactNode; log: ReactNode; children: ReactNode };

function ExerciseView({ t, lang, bundle, state, onChange, pick, back, log, children }: ExerciseProps) {
  const phaseLabel = useId();
  const exercise = bundle.exercises.find((e) => e.id === pick.id)!;
  const percent = Math.round(state.progress * 100);
  const review = bundle.mode === "review";
  return (
    <section className="movement-panel" data-testid="movement-panel">
      <h2>{nameOf(exercise, lang)}</h2>
      {review && exercise.draft && <DraftMark id={exercise.id} note={exercise.review_note} t={t} />}
      {review && !exercise.draft && exercise.review_note && <div className="review-note">{t("review.note", { note: exercise.review_note })}</div>}
      <Sources uses={exercise.citations} bundle={bundle} t={t} />
      {back}
      <div className="movement-choices" role="group" aria-labelledby={phaseLabel}>
        <span id={phaseLabel} className="muted">
          {t("movement.phase")}
        </span>
        {exercise.phases.map((p) => (
          <button className="btn" key={p.id} type="button" aria-pressed={p.id === pick.phase} onClick={() => onChange(pickPhase(state, bundle, p.id))}>
            {nameOf(p, lang)}
          </button>
        ))}
      </div>
      <label className="movement-slider">
        <span>{t("movement.progress", { percent: String(percent) })}</span>
        <input type="range" min={0} max={100} step={5} value={percent} onChange={(e) => onChange(setProgress(state, bundle, Number(e.target.value) / 100))} />
      </label>
      <p className="muted">{t("movement.effortNote")}</p>
      {log}
      {children}
    </section>
  );
}

// The structures involved, grouped by role, then the ones with nothing recorded at this angle.
function Result({ t, lang, bundle, state, query, selection, onFocusStructure, onOpenStructure }: Props & { query: Query }) {
  const { rows, silent, candidates } = involved(bundle, query, state.pose, lang);
  const names = new Map(bundle.structures.map((s) => [s.id, nameOf(s, lang)]));
  const structureName = (sid: string) => names.get(sid) ?? sid;
  // In the review build the waiting rows are shown as drafts, so the waiting line would only repeat them.
  const pending = bundle.mode !== "review" && [...query.working, ...query.position].some((m) => (bundle.pendingByMovement[m] ?? 0) > 0);
  const review = bundle.mode === "review";

  const row = (action: BundleAction) => (
    <li key={action.id}>
      <button
        type="button"
        className="link-button movement-structure"
        aria-current={selection?.sid === action.structure ? "true" : undefined}
        onClick={() => onFocusStructure(action.structure)}
      >
        {structureName(action.structure)}
      </button>
      <div>{describeAction(action, t)}</div>
      <ActionNotes action={action} t={t} />
      {review && action.draft && <DraftMark id={action.id} note={action.review_note} t={t} />}
      {review && !action.draft && action.review_note && <div className="review-note">{t("review.note", { note: action.review_note })}</div>}
      <Sources uses={action.citations} bundle={bundle} t={t} />
      <button type="button" className="link-button" onClick={() => onOpenStructure(action.structure)}>
        {t("movement.openStructure")}
      </button>
    </li>
  );

  return (
    <>
      {candidates === 0 && <p className="muted">{t("movement.none")}</p>}
      {HIGHLIGHT_ORDER.map((highlight) => {
        const group = rows.filter((r) => r.highlight === highlight);
        if (group.length === 0) return null;
        return (
          <div key={highlight} className="movement-group">
            <h3>
              <span className={`swatch swatch--${highlight}`} aria-hidden="true" />
              {t(`movement.group.${highlight}`)}
            </h3>
            <ul>{group.map((r) => row(r.action))}</ul>
          </div>
        );
      })}
      {silent.length > 0 && (
        <div className="movement-silent">
          <h3>{t("movement.silent")}</h3>
          <ul>
            {silent.map((sid) => (
              <li key={sid}>{structureName(sid)}</li>
            ))}
          </ul>
        </div>
      )}
      {rows.length > 0 && <p className="muted">{t("movement.hiddenNote")}</p>}
      {pending && <p className="muted">{t("movement.pending")}</p>}
    </>
  );
}
