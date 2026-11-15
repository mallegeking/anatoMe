import type { KeyboardEvent } from "react";
import type { Translate } from "../i18n/t";

export type Mode = "atlas" | "movement" | "area" | "notebook";

type Props = { t: Translate; mode: Mode; modes: Mode[]; onChange: (mode: Mode) => void };

// The row of tabs under the top bar. It picks what the panel below the model shows.
// Keys follow the tabs pattern of the WAI-ARIA Authoring Practices, with automatic activation:
// the left and right arrows move to the previous and next tab and wrap at the ends, Home and End go
// to the first and the last, and the tab they reach is selected. Only the selected tab is in the Tab order.
export function ModeBar({ t, mode, modes, onChange }: Props) {
  function onKeyDown(event: KeyboardEvent<HTMLButtonElement>) {
    const at = modes.indexOf(mode);
    const next =
      event.key === "ArrowRight" ? (at + 1) % modes.length
      : event.key === "ArrowLeft" ? (at - 1 + modes.length) % modes.length
      : event.key === "Home" ? 0
      : event.key === "End" ? modes.length - 1
      : -1;
    if (next < 0) return;
    event.preventDefault();
    onChange(modes[next]);
    (event.currentTarget.parentElement?.children[next] as HTMLElement | undefined)?.focus();
  }

  return (
    <div className="mode-bar" role="tablist" aria-label={t("mode.label")}>
      {modes.map((m) => (
        <button key={m} type="button" role="tab" aria-selected={m === mode} tabIndex={m === mode ? 0 : -1} onClick={() => onChange(m)} onKeyDown={onKeyDown}>
          {t(`mode.${m}`)}
        </button>
      ))}
    </div>
  );
}
