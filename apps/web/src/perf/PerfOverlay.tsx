import { useEffect, useState } from "react";
import type { Translate } from "../i18n/t";
import { onInteractive, perfEnabled } from "./loadTimer";

// A small box with the time to interactive. Only shows when the URL has ?perf=1.
export function PerfOverlay({ t }: { t: Translate }) {
  const [ms, setMs] = useState<number | undefined>(window.__anatomeInteractiveMs);

  useEffect(() => {
    // The number may have arrived between the first render and now, so check once more.
    setMs(window.__anatomeInteractiveMs);
    return onInteractive(setMs);
  }, []);

  if (!perfEnabled() || ms === undefined) return null;
  return (
    <div className="perf-overlay" data-testid="perf-overlay">
      {t("perf.interactive", { ms: String(ms) })}
    </div>
  );
}
