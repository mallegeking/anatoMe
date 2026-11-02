// Shows the name of the tapped structure, or a hint when nothing is selected.
export function InfoLabel({ text, isHint }: { text: string; isHint: boolean }) {
  return (
    <p className={isHint ? "info-label info-label--hint" : "info-label"} aria-live="polite" data-testid="info-label">
      {text}
    </p>
  );
}
