import type { RegionBundle } from "./bundle";

type Entry = { status: "pending"; promise: Promise<void> } | { status: "done"; bundle: RegionBundle } | { status: "failed"; error: unknown };

// Fills what an older bundle on disk may lack, so the rest of the app can rely on every field.
export function normalizeBundle(raw: Partial<RegionBundle> & Pick<RegionBundle, "region" | "mode" | "structures">): RegionBundle {
  return {
    movements: [],
    attachments: [],
    actions: [],
    citations: [],
    pendingByStructure: {},
    ...raw,
    structures: raw.structures.map((s) => ({ ...s, paired: s.paired ?? true })),
    exercises: raw.exercises ?? [],
    pendingByMovement: raw.pendingByMovement ?? {},
    pendingExercises: raw.pendingExercises ?? 0,
  };
}

// One entry per region, so the file is fetched once. A failure stays until forgetFailedRegionData.
const cache = new Map<string, Entry>();

// Only tests need this, to start again with an empty cache.
export function clearRegionDataCache() {
  cache.clear();
}

// Forgets every region whose data failed to load, so the next render fetches it again.
// Data that is loading or loaded stays, so this never starts a second request for it.
export function forgetFailedRegionData() {
  for (const [region, entry] of cache) {
    if (entry.status === "failed") cache.delete(region);
  }
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
        return response.json() as Promise<Parameters<typeof normalizeBundle>[0]>;
      })
      .then((bundle) => {
        cache.set(region, { status: "done", bundle: normalizeBundle(bundle) });
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
