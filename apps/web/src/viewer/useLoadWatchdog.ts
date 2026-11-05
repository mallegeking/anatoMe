import { useEffect, useState } from "react";

// How long we wait for the model before we call it stuck. A slow phone on mobile data needs about 5 s, so 20 s is generous.
export const LOAD_TIMEOUT_MS = 20000;

// A safety net for loads that never finish and never fail, for example a download that hangs.
// isReady is asked once the time is up. If it says no, this throws during render,
// so the error boundary around it shows the load error instead of a blank screen.
// A background tab gets no time limit, because the browser holds back the 3D setup there.
// When the page shows again, the full time starts afresh.
export function useLoadWatchdog(isReady: () => boolean, timeoutMs: number = LOAD_TIMEOUT_MS): void {
  const [stuck, setStuck] = useState(false);

  useEffect(() => {
    let timer: ReturnType<typeof setTimeout> | undefined;
    function stop() {
      clearTimeout(timer);
      timer = undefined;
    }
    function startOrPause() {
      stop();
      if (document.hidden) return;
      timer = setTimeout(() => {
        if (!isReady()) setStuck(true);
      }, timeoutMs);
    }
    startOrPause();
    document.addEventListener("visibilitychange", startOrPause);
    return () => {
      stop();
      document.removeEventListener("visibilitychange", startOrPause);
    };
  }, [isReady, timeoutMs]);

  if (stuck) throw new Error(`The model was not ready after ${timeoutMs} ms`);
}
