import { useEffect, useState } from "react";

// How long we wait for the model before we call it stuck. A slow phone on mobile data needs about 5 s, so 20 s is generous.
export const LOAD_TIMEOUT_MS = 20000;

// A safety net for loads that never finish and never fail, for example a download that hangs.
// isReady is asked once the time is up. If it says no, this throws during render,
// so the error boundary around it shows the load error instead of a blank screen.
export function useLoadWatchdog(isReady: () => boolean, timeoutMs: number = LOAD_TIMEOUT_MS): void {
  const [stuck, setStuck] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => {
      if (!isReady()) setStuck(true);
    }, timeoutMs);
    return () => clearTimeout(timer);
  }, [isReady, timeoutMs]);

  if (stuck) throw new Error(`The model was not ready after ${timeoutMs} ms`);
}
