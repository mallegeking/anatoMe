import type { Manifest } from "../viewer/manifest";

// The body regions the model manifest lists, in the manifest's order.
export function regionIds(manifest: Manifest): string[] {
  return Object.keys(manifest.regions);
}

// The region to show: the one the address names with ?region=, if the manifest has it, else the first one.
export function chooseRegion(ids: string[], search: string): string {
  if (ids.length === 0) throw new Error("The manifest lists no body region");
  const asked = new URLSearchParams(search).get("region");
  return asked !== null && ids.includes(asked) ? asked : ids[0];
}
