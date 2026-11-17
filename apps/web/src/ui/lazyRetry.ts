import { lazy, type ComponentType, type LazyExoticComponent } from "react";

// Like React's lazy, but a failed download is not kept. React keeps a failed lazy part for good,
// so this swaps in a fresh one when the download fails. The next time the part mounts, it downloads again.
// Call the returned function during render to get the part to show.
// The props type is left open, like React's own lazy.
export function lazyRetry<T extends ComponentType<any>>(load: () => Promise<{ default: T }>): () => LazyExoticComponent<T> {
  let current: LazyExoticComponent<T>;
  const fresh = () => {
    current = lazy(() =>
      load().catch((error: unknown) => {
        fresh();
        throw error;
      }),
    );
  };
  fresh();
  return () => current;
}
