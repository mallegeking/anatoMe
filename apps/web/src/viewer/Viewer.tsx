import { CameraControls } from "@react-three/drei";
import { Canvas } from "@react-three/fiber";
import { Suspense, useEffect, useRef, useState } from "react";
import type { Object3D } from "three";
import type { Translate } from "../i18n/t";
import { loadManifest, regionFiles, type Manifest } from "./manifest";
import { ModelErrorBoundary } from "./ModelErrorBoundary";
import { shouldSelect, type PickedHit, type PickedStructure } from "./pick";
import { RegionModel } from "./RegionModel";

type Props = { region: string; t: Translate; onPick: (p: PickedStructure | null) => void };

// Reads the manifest and hands back the file URLs. A failure is thrown during render so the error boundary can show it.
function useRegionUrls(region: string): string[] | null {
  const [state, setState] = useState<{ urls: string[] } | { error: unknown } | null>(null);

  useEffect(() => {
    let cancelled = false;
    const base = import.meta.env.BASE_URL;
    loadManifest(`${base}models/manifest.json`)
      .then((manifest: Manifest) => {
        if (!cancelled) setState({ urls: regionFiles(manifest, region).map((path) => base + path) });
      })
      .catch((error: unknown) => {
        if (!cancelled) setState({ error });
      });
    return () => {
      cancelled = true;
    };
  }, [region]);

  if (state && "error" in state) throw state.error;
  return state?.urls ?? null;
}

function Scene({ region, onPick }: { region: string; onPick: Props["onPick"] }) {
  const urls = useRegionUrls(region);
  const [selected, setSelected] = useState<Object3D | null>(null);
  const downAt = useRef<[number, number]>([0, 0]);

  function select(hit: PickedHit | null) {
    setSelected(hit ? hit.object : null);
    onPick(hit ? hit.structure : null);
  }

  // R3F tells us about a click on empty space but not how far the finger moved,
  // so we remember where the press began. A drag to rotate must not clear the selection.
  function handleMissed(event: MouseEvent) {
    const moved = Math.hypot(event.clientX - downAt.current[0], event.clientY - downAt.current[1]);
    if (shouldSelect(moved)) select(null);
  }

  return (
    <Canvas
      dpr={[1, 2]}
      // The model is only a few tenths of a metre across, so the near plane must be small.
      camera={{ fov: 40, near: 0.01, far: 20, position: [0, 0.1, 1.2] }}
      onPointerDown={(event) => {
        downAt.current = [event.clientX, event.clientY];
      }}
      onPointerMissed={handleMissed}
    >
      <hemisphereLight args={["#ffffff", "#4a4f58", 1.6]} />
      <directionalLight position={[1, 2, 2]} intensity={1.8} />
      <directionalLight position={[-1, -0.5, -2]} intensity={0.6} />
      <CameraControls makeDefault minDistance={0.15} maxDistance={4} />
      <Suspense fallback={null}>
        {urls && <RegionModel urls={urls} selected={selected} onSelect={select} />}
      </Suspense>
    </Canvas>
  );
}

export function Viewer({ region, t, onPick }: Props) {
  return (
    <ModelErrorBoundary t={t}>
      <Scene region={region} onPick={onPick} />
    </ModelErrorBoundary>
  );
}
