// The 3D part of the viewer. Viewer.tsx loads this file on its own, after the first screen is up,
// because it pulls in three.js, which is most of the app's size.
import { CameraControls } from "@react-three/drei";
import { addEffect, addTail, Canvas, useLoader, useThree } from "@react-three/fiber";
import { Suspense, useEffect, useRef, type MouseEvent, type Ref } from "react";
import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader.js";
import type { UnderEntry } from "../area/under";
import { shouldClear, type Selection, type Side } from "./pick";
import type { Highlight } from "../movement/roles";
import { redrawWhenBack } from "./redraw";
import type { ViewDirection, ViewerHandle } from "./handle";
import { RegionModel, renewDecoder } from "./RegionModel";

export type SceneProps = {
  // The glb files to show, or null while the app is still reading the manifest.
  urls: string[] | null;
  selection: Selection | null;
  // Where the camera should go. A new object each time makes it move again, even for the same structure.
  focus: Selection | null;
  isShown: (sid: string, side: Side) => boolean;
  // The role of each involved structure, or null when no movement is chosen.
  highlights: ReadonlyMap<string, Highlight> | null;
  onSelect: (sel: Selection | null, label?: string) => void;
  // Called once, when the model files have finished loading.
  onLoaded: () => void;
  // In area mode a tap lists what lies under the spot, and does not select. Off when left out.
  areaMode?: boolean;
  // Called after an area tap. null means the tap hit nothing.
  onAreaTap?: (tap: AreaTap | null) => void;
  // Where to draw the marker, or null for none.
  areaMarker?: [number, number, number] | null;
  // A structure to look through. A new object each time makes it run again, like focus.
  areaProbe?: Selection | null;
  // Receives resetView and zoomBy once the model has loaded.
  handle?: Ref<ViewerHandle>;
  // Called after the first framing and each time the camera comes to rest.
  onView?: (direction: ViewDirection) => void;
};

// The loader keeps a failed download, so the same files would fail again at once.
// "Try again" calls this first, so the files and the decoder are downloaded afresh.
export function forgetModelFiles(urls: string[]) {
  useLoader.clear(GLTFLoader, urls);
  renewDecoder();
}

// point is where the marker goes, null when a probed structure has no mesh.
export type AreaTap = { entries: UnderEntry[]; point: [number, number, number] | null; through: Selection | null };

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

// Asks for a frame when the WebGL context comes back or the page shows again, see redraw.ts.
function RedrawWhenBack() {
  const canvas = useThree((state) => state.gl.domElement);
  const invalidate = useThree((state) => state.invalidate);
  useEffect(() => redrawWhenBack(canvas, invalidate), [canvas, invalidate]);
  return null;
}

export default function Scene({
  urls,
  selection,
  focus,
  isShown,
  highlights,
  onSelect,
  onLoaded,
  areaMode = false,
  onAreaTap = () => {},
  areaMarker = null,
  areaProbe = null,
  handle,
  onView,
}: SceneProps) {
  const downAt = useRef<[number, number]>([0, 0]);
  // The last click that landed on the model. The model handles those itself.
  const modelClick = useRef<Event | null>(null);

  // Every click on the canvas comes here, after the model has seen it.
  // A tap on empty space clears the selection, or in area mode the list. A drag to rotate must not, so we measure how far the finger moved.
  function handleClick(event: MouseEvent) {
    if (event.nativeEvent === modelClick.current) return;
    const moved = Math.hypot(event.clientX - downAt.current[0], event.clientY - downAt.current[1]);
    if (!shouldClear(moved)) return;
    if (areaMode) onAreaTap(null);
    else onSelect(null);
  }

  // Do not give this Canvas a custom eventSource. The check in handleClick relies on R3F's own click listener
  // sitting on the Canvas div, so it runs before React's onClick and the model has marked its clicks by then.
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
      <RedrawWhenBack />
      <CameraControls makeDefault minDistance={0.15} maxDistance={4} />
      <Suspense fallback={null}>
        {urls && (
          <RegionModel
            urls={urls}
            selection={selection}
            focus={focus}
            isShown={isShown}
            highlights={highlights}
            onSelect={onSelect}
            areaMode={areaMode}
            onAreaTap={onAreaTap}
            areaMarker={areaMarker}
            areaProbe={areaProbe}
            onLoaded={onLoaded}
            handle={handle}
            onView={onView}
            onModelClick={(event) => {
              modelClick.current = event;
            }}
          />
        )}
      </Suspense>
    </Canvas>
  );
}
