import type { RegionBundle } from "./bundle";

type Entry = { status: "pending"; promise: Promise<void> } | { status: "done"; bundle: RegionBundle } | { status: "failed"; error: unknown };

// One entry per region, so the file is fetched once.
const cache = new Map<string, Entry>();

// Only tests need this, to start again with an empty cache.
export function clearRegionDataCache() {
  cache.clear();
}

// Reads the compiled data for a region. While it loads, React waits (suspends).
// A failure is thrown, so the error boundary shows the same message as a model load failure.
export function useRegionData(region: string): RegionBundle {
  let entry = cache.get(region);
  if (!entry) {
    const url = `${import.meta.env.BASE_URL}data/${region}.json`;
    const promise = fetch(url)
      .then((response) => {
        if (!response.ok) throw new Error(`Could not load ${url} (${response.status})`);
        return response.json() as Promise<RegionBundle>;
      })
      .then((bundle) => {
        cache.set(region, { status: "done", bundle });
      })
      .catch((error: unknown) => {
        cache.set(region, { status: "failed", error });
      });
    entry = { status: "pending", promise };
    cache.set(region, entry);
  }
  if (entry.status === "pending") throw entry.promise;
  if (entry.status === "failed") throw entry.error;
  return entry.bundle;
}
