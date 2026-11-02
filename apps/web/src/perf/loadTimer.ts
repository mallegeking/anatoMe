// Measures time to interactive: from the page starting to load until the hip is drawn and the controls work.
declare global {
  interface Window {
    __anatomeInteractiveMs?: number;
  }
}

type Listener = (ms: number) => void;
const listeners = new Set<Listener>();

// Call this when the region is rendered and the controls are ready. Only the first call counts.
export function markInteractive(): number {
  if (window.__anatomeInteractiveMs === undefined) {
    // performance.now() counts from performance.timeOrigin, which is when navigation began.
    window.__anatomeInteractiveMs = Math.round(performance.now());
    listeners.forEach((listener) => listener(window.__anatomeInteractiveMs as number));
  }
  return window.__anatomeInteractiveMs;
}

// Lets the overlay hear about the number. Returns a function that stops listening.
export function onInteractive(listener: Listener): () => void {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

export function perfEnabled(search: string = window.location.search): boolean {
  return new URLSearchParams(search).get("perf") === "1";
}
