import type { KeyboardEvent } from "react";
import type { Translate } from "../i18n/t";
import { MovementsIcon, NotebookIcon, SpotIcon, StructuresIcon } from "./icons";

export type Mode = "atlas" | "movement" | "area" | "notebook";

type Props = { t: Translate; mode: Mode; modes: Mode[]; onChange: (mode: Mode) => void; vertical: boolean };

const ICONS = { atlas: StructuresIcon, movement: MovementsIcon, area: SpotIcon, notebook: NotebookIcon } as const;

// The tabs that pick what the panel shows: a column in the rail on a wide screen, a row at the bottom on a phone.
// Keys follow the tabs pattern of the WAI-ARIA Authoring Practices, with automatic activation:
// the arrows along the list (Up and Down in a column, Left and Right in a row) move to the previous and next tab
// and wrap at the ends, Home and End go to the first and the last, and the tab they reach is selected.
// Only the selected tab is in the Tab order. Each tab controls the panel with the id "tabpanel".
export function ModeBar({ t, mode, modes, onChange, vertical }: Props) {
  const back = vertical ? "ArrowUp" : "ArrowLeft";
  const forward = vertical ? "ArrowDown" : "ArrowRight";

  function onKeyDown(event: KeyboardEvent<HTMLButtonElement>) {
    const at = modes.indexOf(mode);
    const next =
      event.key === forward ? (at + 1) % modes.length
      : event.key === back ? (at - 1 + modes.length) % modes.length
      : event.key === "Home" ? 0
      : event.key === "End" ? modes.length - 1
      : -1;
    if (next < 0) return;
    event.preventDefault();
    onChange(modes[next]);
    (event.currentTarget.parentElement?.children[next] as HTMLElement | undefined)?.focus();
  }

  return (
    <div className="mode-bar" role="tablist" aria-label={t("mode.label")} aria-orientation={vertical ? "vertical" : "horizontal"}>
      {modes.map((m) => {
        const ModeIcon = ICONS[m];
        return (
          <button
            key={m}
            id={`tab-${m}`}
            type="button"
            role="tab"
            aria-selected={m === mode}
            aria-controls="tabpanel"
            tabIndex={m === mode ? 0 : -1}
            onClick={() => onChange(m)}
            onKeyDown={onKeyDown}
          >
            <ModeIcon />
            <span>{t(`mode.${m}`)}</span>
          </button>
        );
      })}
    </div>
  );
}
