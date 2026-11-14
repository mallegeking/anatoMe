import type { Translate } from "../i18n/t";

export type Mode = "atlas" | "movement" | "area" | "notebook";

type Props = { t: Translate; mode: Mode; modes: Mode[]; onChange: (mode: Mode) => void };

// The row of tabs under the top bar. It picks what the panel below the model shows.
export function ModeBar({ t, mode, modes, onChange }: Props) {
  return (
    <div className="mode-bar" role="tablist" aria-label={t("mode.label")}>
      {modes.map((m) => (
        <button key={m} type="button" role="tab" aria-selected={m === mode} onClick={() => onChange(m)}>
          {t(`mode.${m}`)}
        </button>
      ))}
    </div>
  );
}
