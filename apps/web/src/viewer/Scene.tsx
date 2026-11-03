// The 3D part of the viewer. Viewer.tsx loads this file on its own, after the first screen is up,
// because it pulls in three.js, which is most of the app's size.
import { CameraControls } from "@react-three/drei";
import { addEffect, addTail, Canvas, useThree } from "@react-three/fiber";
import { Suspense, useEffect, useRef, useState, type MouseEvent } from "react";
import { loadManifest, regionFiles, type Manifest } from "./manifest";
import { shouldClear, type Selection } from "./pick";
import { RegionModel } from "./RegionModel";

export type SceneProps = {
  region: string;
  selection: Selection | null;
  // Where the camera should go. A new object each time makes it move again, even for the same structure.
  focus: Selection | null;
  isVisibleSid: (sid: string) => boolean;
  onSelect: (sel: Selection | null, label?: string) => void;
  // Called once, when the model files have finished loading.
  onLoaded: () => void;
};

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

// The canvas clock keeps counting while nothing is drawn. Without this, the first frame after a rest
// would see a long gap, and a camera glide would jump most of the way in one step.
// So when drawing wakes up, the clock starts counting afresh.
function SteadyClock() {
  const clock = useThree((state) => state.clock);
  useEffect(() => {
    let resting = true;
    const stopBefore = addEffect(() => {
      if (resting) clock.getDelta();
      resting = false;
    });
    // Runs when the drawing stops.
    const stopTail = addTail(() => {
      resting = true;
    });
    return () => {
      stopBefore();
      stopTail();
    };
  }, [clock]);
  return null;
}

export default function Scene({ region, selection, focus, isVisibleSid, onSelect, onLoaded }: SceneProps) {
  const urls = useRegionUrls(region);
  const downAt = useRef<[number, number]>([0, 0]);
  // The last click that landed on the model. The model handles those itself.
  const modelClick = useRef<Event | null>(null);

  // Every click on the canvas comes here, after the model has seen it.
  // A tap on empty space clears the selection. A drag to rotate must not, so we measure how far the finger moved.
  function handleClick(event: MouseEvent) {
    if (event.nativeEvent === modelClick.current) return;
    const moved = Math.hypot(event.clientX - downAt.current[0], event.clientY - downAt.current[1]);
    if (shouldClear(moved)) onSelect(null);
  }

  return (
    <Canvas
      // Draw only when something changes, so the phone's graphics chip can rest while nothing moves.
      // The camera controls ask for frames themselves. The model asks after each change it makes.
      frameloop="demand"
      dpr={[1, 2]}
      // The model is only a few tenths of a metre across, so the near plane must be small.
      camera={{ fov: 40, near: 0.01, far: 20, position: [0, 0.1, 1.2] }}
      onPointerDown={(event) => {
        downAt.current = [event.clientX, event.clientY];
      }}
      onClick={handleClick}
    >
      <hemisphereLight args={["#ffffff", "#4a4f58", 1.6]} />
      <directionalLight position={[1, 2, 2]} intensity={1.8} />
      <directionalLight position={[-1, -0.5, -2]} intensity={0.6} />
      <SteadyClock />
      <CameraControls makeDefault minDistance={0.15} maxDistance={4} />
      <Suspense fallback={null}>
        {urls && (
          <RegionModel
            urls={urls}
            selection={selection}
            focus={focus}
            isVisibleSid={isVisibleSid}
            onSelect={onSelect}
            onLoaded={onLoaded}
            onModelClick={(event) => {
              modelClick.current = event;
            }}
          />
        )}
      </Suspense>
    </Canvas>
  );
}
