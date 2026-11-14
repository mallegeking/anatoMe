import { useFrame, useLoader, useThree, type ThreeEvent } from "@react-three/fiber";
import type CameraControlsImpl from "camera-controls";
import { useEffect, useMemo, useRef, useState } from "react";
import { Box3, Color, DoubleSide, Mesh, MeshStandardMaterial, Vector3, type Camera, type Object3D } from "three";
import { DRACOLoader } from "three/examples/jsm/loaders/DRACOLoader.js";
import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader.js";
import { HIGHLIGHT_COLORS } from "../movement/colors";
import { HIGHLIGHT_ORDER, type Highlight } from "../movement/roles";
import { markInteractive } from "../perf/loadTimer";
import { structuresUnder } from "../area/under";
import { paintOf } from "./appearance";
import { castFingerRays, pointAlong } from "./castRays";
import { pickVisibleHit, shouldSelect, type Selection, type Side } from "./pick";
import type { AreaTap } from "./Scene";

// The decoder files live in public/draco/, so the app never asks another host for them.
const DRACO_PATH = `${import.meta.env.BASE_URL}draco/`;

// One Draco decoder for every file. It starts its helper workers on first use.
const draco = new DRACOLoader().setDecoderPath(DRACO_PATH);

// We use three's own GLTFLoader here, not the one inside drei.
// When the decoder cannot be downloaded, this one reports the failure, so the error boundary can show it.
// The copy inside drei waits forever in that case and the screen stays blank.
function addDraco(loader: GLTFLoader) {
  loader.setDRACOLoader(draco);
}

// Calm colours by kind of tissue. The files carry no materials, so we make plain ones here.
const KIND_COLORS = {
  bone: "#d9d2c0",
  muscle: "#b5605a",
  ligament: "#d6b36a",
  other: "#7aa0b8",
} as const;
type Group = keyof typeof KIND_COLORS;

function groupOf(kind: string): Group {
  if (kind === "bone" || kind === "muscle") return kind;
  if (kind === "ligament" || kind === "tendon") return "ligament";
  return "other";
}

type Pair = { normal: MeshStandardMaterial; selected: MeshStandardMaterial };

// One normal and one lighter material for each group and each highlight, shared by every mesh that uses it.
// All are opaque, with the same surface settings.
function makeMaterials() {
  const make = (c: Color) => new MeshStandardMaterial({ color: c, roughness: 0.75, metalness: 0, side: DoubleSide });
  const pair = (hex: string): Pair => {
    const color = new Color(hex);
    // Lerp towards white for a lighter tint.
    return { normal: make(color), selected: make(color.clone().lerp(new Color("#ffffff"), 0.55)) };
  };
  const groups = {} as Record<Group, Pair>;
  for (const group of Object.keys(KIND_COLORS) as Group[]) groups[group] = pair(KIND_COLORS[group]);
  const highlights = {} as Record<Highlight, Pair>;
  for (const h of HIGHLIGHT_ORDER) highlights[h] = pair(HIGHLIGHT_COLORS[h]);
  return { groups, highlights };
}

type Props = {
  urls: string[];
  // The structure to draw lighter, or null for none.
  selection: Selection | null;
  // Frame this structure with the camera, or null to leave the camera alone.
  focus: Selection | null;
  // Called after a tap on the model. null means the tap hit nothing with a name.
  // The label is the name in the 3D file, for structures the data does not know.
  onSelect: (sel: Selection | null, label?: string) => void;
  // Says whether a structure is shown. Hidden ones are switched off and ignore taps.
  isShown: (sid: string, side: Side) => boolean;
  // The role of each involved structure in the chosen movement, or null when none is chosen.
  highlights: ReadonlyMap<string, Highlight> | null;
  // Called once the files have loaded. It does not wait for a drawn frame,
  // because a tab in the background draws none and the load watchdog would fire for nothing.
  onLoaded: () => void;
  // Told about every click that landed on the model, so the scene does not treat it as a tap on empty space.
  onModelClick: (event: Event) => void;
  // In area mode a tap lists what lies under the spot and onSelect is not called.
  areaMode: boolean;
  // Called after an area tap. null means the tap hit nothing.
  onAreaTap: (tap: AreaTap | null) => void;
  // Where to draw the marker, or null for none.
  areaMarker: [number, number, number] | null;
  // A structure to look through. A new object each time makes it run again.
  areaProbe: Selection | null;
};

export function RegionModel({ urls, selection, focus, isShown, highlights, onSelect, onLoaded, onModelClick, areaMode, onAreaTap, areaMarker, areaProbe }: Props) {
  // useLoader with a list of urls loads all of them in parallel and waits (suspends) until all are done.
  // A failed load is thrown, so the error boundary around the viewer catches it.
  const gltfs = useLoader(GLTFLoader, urls, addDraco);
  const materials = useMemo(makeMaterials, []);
  const [ready, setReady] = useState(false);
  const reported = useRef(false);
  const controls = useThree((state) => state.controls) as CameraControlsImpl | null;
  // The canvas only draws when asked. invalidate asks for one more frame.
  // Every change below that should show on screen calls it.
  const invalidate = useThree((state) => state.invalidate);

  const scenes = useMemo(() => gltfs.map((g) => g.scene), [gltfs]);
  const size = useThree((state) => state.size);
  const camera = useThree((state) => state.camera);
  // The probe effect should run only when the probe changes, so it reads the latest callback from here.
  const areaTapRef = useRef(onAreaTap);
  areaTapRef.current = onAreaTap;

  // useLoader only gets past its first line once every file is in, so reaching this point means the load finished.
  useEffect(() => {
    onLoaded();
  }, [scenes, onLoaded]);

  // Paint every mesh: shown or hidden, and which material. This runs when the selection, the layers or the highlights change.
  useEffect(() => {
    for (const scene of scenes) {
      scene.traverse((node: Object3D) => {
        if (!(node instanceof Mesh)) return;
        const kindPair = materials.groups[groupOf(String(node.userData.kind ?? ""))];
        if (typeof node.userData.sid !== "string") {
          node.material = kindPair.normal;
          return;
        }
        const side = node.userData.side;
        const paint = paintOf({ sid: node.userData.sid, side: side === "l" || side === "r" ? side : "" }, { selection, highlights, isShown });
        const pair = paint.highlight ? materials.highlights[paint.highlight] : kindPair;
        node.visible = paint.visible;
        node.material = paint.selected ? pair.selected : pair.normal;
      });
    }
    invalidate();
  }, [scenes, materials, selection, highlights, isShown, invalidate]);

  // Frame the camera on everything we loaded.
  useEffect(() => {
    if (!controls) return;
    const box = new Box3();
    for (const scene of scenes) box.expandByObject(scene);
    void controls.fitToBox(box, false, { paddingLeft: 0.05, paddingRight: 0.05, paddingTop: 0.05, paddingBottom: 0.05 });
    // A jump without a glide does not wake the controls, so ask for the frame here.
    invalidate();
    setReady(true);
  }, [controls, scenes, invalidate]);

  // Glide the camera to the structure a search chose. Hidden meshes still count for the box.
  useEffect(() => {
    if (!focus || !controls || !ready) return;
    const box = new Box3();
    for (const scene of scenes) {
      scene.traverse((node: Object3D) => {
        if (node instanceof Mesh && node.userData.sid === focus.sid && (node.userData.side ?? "") === focus.side) box.expandByObject(node);
      });
    }
    if (box.isEmpty()) return;
    // The glide wakes the controls, and they ask for frames until the camera rests.
    void controls.fitToBox(box, true, { paddingLeft: 0.02, paddingRight: 0.02, paddingTop: 0.02, paddingBottom: 0.02 });
  }, [focus, controls, scenes, ready]);

  // Report the time once the model has been drawn at least once with the controls ready.
  // ready is set during a re-render, so ask for one more frame after it, or the check below might never run.
  useEffect(() => {
    if (ready) invalidate();
  }, [ready, invalidate]);
  useFrame(() => {
    if (ready && !reported.current) {
      reported.current = true;
      markInteractive();
    }
  });

  // Casts the five rays through a spot and reports what lies under it.
  function areaTapAt(pointer: { x: number; y: number }, cam: Camera, probe: Selection | null, boxMiddle?: [number, number, number]) {
    const { center, around } = castFingerRays(pointer, size, cam, scenes);
    // Only a tap reports null for a miss. A probe always reports, even with an empty list.
    if (center.length === 0 && !boxMiddle) {
      areaTapRef.current(null);
      return;
    }
    const nearest = center.length > 0 ? Math.min(...center.map((h) => h.distance)) : 0;
    const entries = structuresUnder(center, around, probe ?? undefined);
    areaTapRef.current({ entries, point: boxMiddle ?? pointAlong(pointer, cam, nearest), through: probe });
  }

  // Look through a structure the panel chose: aim at the middle of its box, as the camera sees it now.
  useEffect(() => {
    if (!areaProbe || !ready) return;
    const box = new Box3();
    for (const scene of scenes) {
      scene.traverse((node: Object3D) => {
        if (node instanceof Mesh && node.userData.sid === areaProbe.sid && (node.userData.side ?? "") === areaProbe.side) box.expandByObject(node);
      });
    }
    if (box.isEmpty()) return;
    const middle = box.getCenter(new Vector3());
    const ndc = middle.clone().project(camera);
    areaTapAt({ x: ndc.x, y: ndc.y }, camera, areaProbe, [middle.x, middle.y, middle.z]);
    // Only a new probe should run this.
  }, [areaProbe, ready]);

  // The marker shows only when asked for, so ask for a frame when it changes.
  useEffect(() => {
    invalidate();
  }, [areaMarker, invalidate]);

  function handleClick(event: ThreeEvent<MouseEvent>) {
    event.stopPropagation();
    onModelClick(event.nativeEvent);
    // Dragging to rotate also ends in a click. Only a real tap selects.
    if (!shouldSelect(event.delta)) return;
    if (areaMode) {
      areaTapAt(event.pointer, event.camera, null);
      return;
    }
    // Hidden meshes still show up in the hit list, so we pass them over.
    const hit = pickVisibleHit(event.intersections, isShown);
    onSelect(hit ? { sid: hit.structure.sid, side: hit.structure.side } : null, hit?.structure.label);
  }

  return (
    <>
      <group onClick={handleClick}>
        {scenes.map((scene, i) => (
          <primitive key={urls[i]} object={scene} />
        ))}
      </group>
      {areaMarker && (
        // Opaque and drawn last, ignoring depth, so it shows through the model. It cannot be tapped.
        <mesh position={areaMarker} renderOrder={999} raycast={() => null}>
          <sphereGeometry args={[0.006, 16, 12]} />
          <meshBasicMaterial color="#ffffff" depthTest={false} />
        </mesh>
      )}
    </>
  );
}
