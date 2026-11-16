import { useCallback, useSyncExternalStore } from "react";

// The wide layout: navigation rail, model and information column side by side.
export const WIDE_QUERY = "(min-width: 900px)";
// A phone with little height, where the top bar has to make room for the model.
export const SHORT_QUERY = "(max-width: 899px) and (max-height: 700px)";

// Whether the media query matches now. It follows changes, for example when a window is resized.
// Where the browser has no matchMedia (the unit tests, for example) the answer is false.
export function useMedia(query: string): boolean {
  const subscribe = useCallback(
    (onChange: () => void) => {
      if (typeof window.matchMedia !== "function") return () => {};
      const list = window.matchMedia(query);
      list.addEventListener("change", onChange);
      return () => list.removeEventListener("change", onChange);
    },
    [query],
  );
  const matches = () => typeof window.matchMedia === "function" && window.matchMedia(query).matches;
  return useSyncExternalStore(subscribe, matches, () => false);
}

export function useWide(): boolean {
  return useMedia(WIDE_QUERY);
}

export function useShort(): boolean {
  return useMedia(SHORT_QUERY);
}
