// Reads models/manifest.json, which lists the glb files for each body region.
export type ManifestFile = { path: string; source: string; license: string };
export type Manifest = { regions: Record<string, { files: ManifestFile[] }> };

export async function loadManifest(url: string): Promise<Manifest> {
  const response = await fetch(url);
  if (!response.ok) throw new Error(`Could not load ${url} (${response.status})`);
  return (await response.json()) as Manifest;
}

// Paths in the manifest are relative to models/, so we add that folder back.
export function regionFiles(manifest: Manifest, region: string): string[] {
  const entry = manifest.regions[region];
  if (!entry) throw new Error(`The manifest has no region called ${region}`);
  return entry.files.map((file) => `models/${file.path}`);
}
