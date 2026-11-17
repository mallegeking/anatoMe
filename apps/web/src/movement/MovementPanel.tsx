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
import { BackIcon } from "../ui/icons";
import { Card, Chip, Chips, PanelTitle, SectionHeading } from "../ui/pieces";
import type { Selection } from "../viewer/pick";
import { HIGHLIGHT_COLORS } from "./colors";
import { contextAngles, HIGHLIGHT_ORDER, involved, type Query } from "./roles";
import { clearPick, pickExercise, pickMovement, pickPhase, queryOf, setAngle, setProgress, type MovementPick, type MovementState } from "./state";

// The log form is notebook code, so it loads only when "Log this movement" is first pressed.
// A failed download is tried again the next time the form opens.
const logForm = lazyRetry(() => import("../notebook/LogForm"));

type LogInput = { feeling: Feeling; side: EntrySide; note: string };

// Why a note could not be saved, as the key of the text that says so.
export type LogFailure = "notebook.saveFailed" | "notebook.loadFailed" | "notebook.unavailable";

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
  // Save the picked movement to the notebook. Resolves to null once it is saved, or to why it failed.
  // Without it there is no log button.
  onLog?: (input: LogInput) => Promise<LogFailure | null>;
};

// The panel of the Movements tab: the list to pick from, or the picked movement or exercise with its result.
export function MovementPanel(props: Props) {
  const { t, lang, bundle, state, onChange } = props;
  const query = queryOf(state, bundle);
  // A pick the data does not know (any more) is treated as no pick.
  if (!state.pick || !query) return <Picker t={t} lang={lang} bundle={bundle} onChange={onChange} />;

  const back = (
    <button className="link-button back-link" type="button" onClick={() => onChange(clearPick())}>
      <BackIcon />
      {t("movement.back")}
    </button>
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
    <section className="movement-panel panel-body" data-testid="movement-panel">
      {back}
      <div className="panel-head">
        <PanelTitle>{nameOf(movement, lang)}</PanelTitle>
        <Chips>
          <Chip>{t("movement.kind")}</Chip>
          <Chip>{t(`movement.joint.${jointOf(movement)}`)}</Chip>
        </Chips>
      </div>
      {contextAngles(bundle, query).map(({ angle, min, max }) => {
        const value = state.pose[angle] ?? 0;
        const shown = t("movement.degrees", { value: String(value) });
        return (
          <Card key={angle}>
            <label className="movement-slider">
              <span className="movement-slider-line">
                <span>{t(`angle.${angle}`)}</span>
                <span>{shown}</span>
              </span>
              <input
                type="range"
                min={min}
                max={max}
                step={5}
                value={value}
                aria-label={t(`angle.${angle}`)}
                aria-valuetext={shown}
                onChange={(e) => onChange(setAngle(state, angle, Number(e.target.value)))}
              />
            </label>
          </Card>
        );
      })}
      {log}
      {result}
    </section>
  );
}

// "Log this movement" opens the form in place. A save that worked or a cancel closes it again.
// A save that failed keeps the form open with what was typed and says why next to the Save button,
// where the person is looking, so they can try again.
// If the form's chunk fails to load, the failure stays here and the rest of the panel keeps working.
function LogMovement({ t, onLog }: { t: Translate; onLog: (input: LogInput) => Promise<LogFailure | null> }) {
  const [open, setOpen] = useState(false);
  const logButton = useRef<HTMLButtonElement>(null);
  const wasOpen = useRef(false);
  // True while a save is under way, so a second press does not save the same note twice.
  // The ref guards at once, the state turns the buttons off on the next render.
  const saving = useRef(false);
  const [busy, setBusy] = useState(false);
  const [failure, setFailure] = useState<LogFailure | null>(null);
  // When the form closes, focus goes back to the button that opened it.
  useEffect(() => {
    if (wasOpen.current && !open) logButton.current?.focus();
    wasOpen.current = open;
  }, [open]);
  if (!open) {
    return (
      <div className="panel-actions">
        <button className="btn btn--primary" ref={logButton} type="button" onClick={() => setOpen(true)}>
          {t("notebook.log")}
        </button>
      </div>
    );
  }
  async function save(input: LogInput) {
    if (saving.current) return;
    saving.current = true;
    setBusy(true);
    setFailure(null);
    try {
      const failed = await onLog(input);
      if (failed) setFailure(failed);
      else setOpen(false);
    } finally {
      saving.current = false;
      setBusy(false);
    }
  }
  const LogForm = logForm();
  return (
    <QuietBoundary fallback={<p>{t("notebook.loadFailed")}</p>}>
      <Suspense fallback={null}>
        <LogForm
          t={t}
          onSave={(input) => void save(input)}
          // Cancel waits for a save under way, so it cannot throw away a note that might still fail to save.
          onCancel={() => {
            if (!saving.current) setOpen(false);
          }}
          saving={busy}
          failure={failure ? t(failure) : null}
          onEdit={() => setFailure(null)}
        />
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
    <section className="movement-panel panel-body" data-testid="movement-panel">
      <div className="panel-head">
        <PanelTitle sub={t("movement.pickHint")}>{t("movement.pick")}</PanelTitle>
      </div>
      {joints.map((joint) => (
        <div key={joint} className="panel-section">
          <SectionHeading>{t(`movement.joint.${joint}`)}</SectionHeading>
          <div className="movement-choices movement-choices--grid">
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
        <div className="panel-section">
          <SectionHeading>{t("movement.exercises")}</SectionHeading>
          {exercisesPending && <p className="muted">{t("movement.exercisesPending")}</p>}
          <div className="movement-choices movement-choices--grid">
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
    <section className="movement-panel panel-body" data-testid="movement-panel">
      {back}
      <div className="panel-head">
        <PanelTitle>{nameOf(exercise, lang)}</PanelTitle>
        <Chips>
          <Chip>{t("movement.kindExercise")}</Chip>
        </Chips>
      </div>
      {review && exercise.draft && <DraftMark id={exercise.id} note={exercise.review_note} t={t} />}
      {review && !exercise.draft && exercise.review_note && <div className="review-note">{t("review.note", { note: exercise.review_note })}</div>}
      <Sources uses={exercise.citations} bundle={bundle} t={t} />
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
      <Card>
        <label className="movement-slider">
          <span>{t("movement.progress", { percent: String(percent) })}</span>
          <input type="range" min={0} max={100} step={5} value={percent} onChange={(e) => onChange(setProgress(state, bundle, Number(e.target.value) / 100))} />
        </label>
      </Card>
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
    <Card key={action.id} as="li" current={selection?.sid === action.structure}>
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
    </Card>
  );

  return (
    <>
      {candidates === 0 && <p className="muted">{t("movement.none")}</p>}
      {HIGHLIGHT_ORDER.map((highlight) => {
        const group = rows.filter((r) => r.highlight === highlight);
        if (group.length === 0) return null;
        return (
          <div key={highlight} className="panel-section">
            <SectionHeading swatch={HIGHLIGHT_COLORS[highlight]}>{t(`movement.group.${highlight}`)}</SectionHeading>
            <ul className="action-rows">{group.map((r) => row(r.action))}</ul>
          </div>
        );
      })}
      {silent.length > 0 && (
        <div className="panel-section movement-silent">
          <SectionHeading>{t("movement.silent")}</SectionHeading>
          <ul className="movement-silent-list">
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
