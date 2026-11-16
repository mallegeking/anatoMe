import type { ReactNode } from "react";

type Props = { size?: number };

// The frame every icon shares: drawn with lines in the text colour, hidden from screen readers,
// because the button or tab next to it already says what it does.
function Icon({ size = 20, children }: Props & { children: ReactNode }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      focusable="false"
    >
      {children}
    </svg>
  );
}

// A bone: the Structures tab.
export function StructuresIcon(props: Props) {
  return (
    <Icon {...props}>
      <path d="M8.5 15.5l7-7" />
      <path d="M8.5 15.5a2.5 2.5 0 1 1-3.5 3.5 2.5 2.5 0 1 1-1-4 2.5 2.5 0 1 1 4.5.5z" />
      <path d="M15.5 8.5a2.5 2.5 0 1 1 3.5-3.5 2.5 2.5 0 1 1 1 4 2.5 2.5 0 1 1-4.5-.5z" />
    </Icon>
  );
}

// A bent joint with an arc: the Movements tab.
export function MovementsIcon(props: Props) {
  return (
    <Icon {...props}>
      <path d="M5 20l6-8 8-2" />
      <circle cx="11" cy="12" r="1.5" />
      <path d="M15 5a8 8 0 0 1 4 5" />
    </Icon>
  );
}

// A spot with rings under it: the Under a spot tab.
export function SpotIcon(props: Props) {
  return (
    <Icon {...props}>
      <circle cx="12" cy="12" r="2" />
      <circle cx="12" cy="12" r="6" />
      <circle cx="12" cy="12" r="10" />
    </Icon>
  );
}

// A notebook: the Notebook tab.
export function NotebookIcon(props: Props) {
  return (
    <Icon {...props}>
      <rect x="5" y="3" width="14" height="18" rx="2" />
      <path d="M9 3v18" />
      <path d="M12 8h4" />
      <path d="M12 12h4" />
    </Icon>
  );
}

export function SearchIcon(props: Props) {
  return (
    <Icon {...props}>
      <circle cx="11" cy="11" r="7" />
      <path d="M20 20l-4-4" />
    </Icon>
  );
}

// Three sliders.
export function SettingsIcon(props: Props) {
  return (
    <Icon {...props}>
      <path d="M4 6h16" />
      <path d="M4 12h16" />
      <path d="M4 18h16" />
      <circle cx="9" cy="6" r="2" />
      <circle cx="15" cy="12" r="2" />
      <circle cx="8" cy="18" r="2" />
    </Icon>
  );
}

// Stacked sheets.
export function LayersIcon(props: Props) {
  return (
    <Icon {...props}>
      <path d="M12 3l9 5-9 5-9-5z" />
      <path d="M3 13l9 5 9-5" />
    </Icon>
  );
}

// A turning arrow: back to the start view.
export function ResetIcon(props: Props) {
  return (
    <Icon {...props}>
      <path d="M4 12a8 8 0 1 0 2.5-5.8" />
      <path d="M4 4v5h5" />
    </Icon>
  );
}

export function PlusIcon(props: Props) {
  return (
    <Icon {...props}>
      <path d="M12 5v14" />
      <path d="M5 12h14" />
    </Icon>
  );
}

export function MinusIcon(props: Props) {
  return (
    <Icon {...props}>
      <path d="M5 12h14" />
    </Icon>
  );
}

export function CloseIcon(props: Props) {
  return (
    <Icon {...props}>
      <path d="M6 6l12 12" />
      <path d="M18 6L6 18" />
    </Icon>
  );
}

export function BackIcon(props: Props) {
  return (
    <Icon {...props}>
      <path d="M15 5l-7 7 7 7" />
    </Icon>
  );
}

export function LockIcon(props: Props) {
  return (
    <Icon {...props}>
      <rect x="5" y="11" width="14" height="10" rx="2" />
      <path d="M8 11V8a4 4 0 0 1 8 0v3" />
    </Icon>
  );
}

// A triangle with an exclamation mark.
export function AlertIcon(props: Props) {
  return (
    <Icon {...props}>
      <path d="M12 3l10 18H2z" />
      <path d="M12 10v4" />
      <path d="M12 17.5v.5" />
    </Icon>
  );
}

export function CheckIcon(props: Props) {
  return (
    <Icon {...props}>
      <path d="M5 12l5 5 9-10" />
    </Icon>
  );
}
