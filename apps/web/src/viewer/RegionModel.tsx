import { useFrame, useLoader, useThree, type ThreeEvent } from "@react-three/fiber";
import type CameraControlsImpl from "camera-controls";
import { useEffect, useMemo, useRef, useState } from "react";
import { Box3, Color, DoubleSide, Mesh, MeshStandardMaterial, type Object3D } from "three";
import { DRACOLoader } from "three/examples/jsm/loaders/DRACOLoader.js";
import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader.js";
import { markInteractive } from "../perf/loadTimer";
import { pickVisibleHit, shouldSelect, type Selection } from "./pick";

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

// One normal and one lighter material for each group, shared by every mesh in that group.
function makeMaterials() {
  const materials = {} as Record<Group, { normal: MeshStandardMaterial; selected: MeshStandardMaterial }>;
  for (const group of Object.keys(KIND_COLORS) as Group[]) {
    const color = new Color(KIND_COLORS[group]);
    const make = (c: Color) => new MeshStandardMaterial({ color: c, roughness: 0.75, metalness: 0, side: DoubleSide });
    materials[group] = {
      normal: make(color),
      // Lerp towards white for a lighter tint.
      selected: make(color.clone().lerp(new Color("#ffffff"), 0.55)),
    };
  }
  return materials;
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
  isVisibleSid: (sid: string) => boolean;
  // Called once, when the model is drawn and the controls work.
  onReady: () => void;
};

export function RegionModel({ urls, selection, focus, isVisibleSid, onSelect, onReady }: Props) {
  // useLoader with a list of urls loads all of them in parallel and waits (suspends) until all are done.
  // A failed load is thrown, so the error boundary around the viewer catches it.
  const gltfs = useLoader(GLTFLoader, urls, addDraco);
  const materials = useMemo(makeMaterials, []);
  const [ready, setReady] = useState(false);
  const reported = useRef(false);
  const controls = useThree((state) => state.controls) as CameraControlsImpl | null;

  const scenes = useMemo(() => gltfs.map((g) => g.scene), [gltfs]);

  // Give every mesh a plain material by kind.
  useEffect(() => {
    for (const scene of scenes) {
      scene.traverse((node: Object3D) => {
        if (node instanceof Mesh) node.material = materials[groupOf(String(node.userData.kind ?? ""))].normal;
      });
    }
  }, [scenes, materials]);

  // Draw the meshes of the selected structure (and side) lighter and put them back when it changes.
  useEffect(() => {
    if (!selection) return;
    const found: Mesh[] = [];
    for (const scene of scenes) {
      scene.traverse((node: Object3D) => {
        if (node instanceof Mesh && node.userData.sid === selection.sid && (node.userData.side ?? "") === selection.side) found.push(node);
      });
    }
    for (const mesh of found) mesh.material = materials[groupOf(String(mesh.userData.kind ?? ""))].selected;
    return () => {
      for (const mesh of found) mesh.material = materials[groupOf(String(mesh.userData.kind ?? ""))].normal;
    };
  }, [selection, scenes, materials]);

  // Show or hide each mesh when the layers change.
  useEffect(() => {
    for (const scene of scenes) {
      scene.traverse((node: Object3D) => {
        if (node instanceof Mesh && typeof node.userData.sid === "string") node.visible = isVisibleSid(node.userData.sid);
      });
    }
  }, [scenes, isVisibleSid]);

  // Frame the camera on everything we loaded.
  useEffect(() => {
    if (!controls) return;
    const box = new Box3();
    for (const scene of scenes) box.expandByObject(scene);
    controls.fitToBox(box, false, { paddingLeft: 0.05, paddingRight: 0.05, paddingTop: 0.05, paddingBottom: 0.05 });
    setReady(true);
  }, [controls, scenes]);

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
    void controls.fitToBox(box, true, { paddingLeft: 0.02, paddingRight: 0.02, paddingTop: 0.02, paddingBottom: 0.02 });
  }, [focus, controls, scenes, ready]);

  // Report the time once the model has been drawn at least once with the controls ready.
  useFrame(() => {
    if (ready && !reported.current) {
      reported.current = true;
      markInteractive();
      onReady();
    }
  });

  function handleClick(event: ThreeEvent<MouseEvent>) {
    event.stopPropagation();
    // Dragging to rotate also ends in a click. Only a real tap selects.
    if (!shouldSelect(event.delta)) return;
    // Hidden meshes still show up in the hit list, so we pass them over.
    const hit = pickVisibleHit(event.intersections, isVisibleSid);
    onSelect(hit ? { sid: hit.structure.sid, side: hit.structure.side } : null, hit?.structure.label);
  }

  return (
    <group onClick={handleClick}>
      {scenes.map((scene, i) => (
        <primitive key={urls[i]} object={scene} />
      ))}
    </group>
  );
}
