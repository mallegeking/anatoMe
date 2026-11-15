import { act, cleanup, fireEvent, render, screen } from "@testing-library/react";
import type { ReactNode } from "react";
import { afterEach, beforeEach, expect, test, vi } from "vitest";
import en from "../i18n/en.json";
import { createT } from "../i18n/t";
import { LOAD_TIMEOUT_MS } from "./useLoadWatchdog";
import { Viewer } from "./Viewer";

// jsdom cannot draw 3D, so these tests swap the 3D parts for stand-ins.
// The real viewer, scene and model code still runs. Only the loading and the drawing are faked.
// "load" is a model download the test finishes by hand. No frame is ever drawn, like a phone tab in the background.
const load = vi.hoisted(() => ({
  done: false,
  finish: () => {},
  promise: Promise.resolve(),
  result: null as unknown,
}));

function newLoad() {
  load.done = false;
  load.result = null;
  load.promise = new Promise<void>((resolve) => {
    load.finish = () => {
      load.done = true;
      resolve();
    };
  });
}

vi.mock("@react-three/fiber", async () => {
  const { Group } = await import("three");
  const { PerspectiveCamera } = await import("three");
  const camera = new PerspectiveCamera(40, 1, 0.01, 20);
  camera.position.z = 5;
  camera.updateMatrixWorld();
  const state = {
    controls: { fitToBox: () => Promise.resolve() },
    invalidate: () => {},
    clock: { getDelta: () => 0 },
    gl: { domElement: document.createElement("canvas") },
    size: { width: 400, height: 400 },
    camera,
  };
  return {
    // A plain box in place of the 3D canvas.
    // It passes on the pointer and click handlers, so the scene's own tap rules can run.
    Canvas: ({ children, onClick, onPointerDown }: { children: ReactNode; onClick?: never; onPointerDown?: never }) => (
      <div data-testid="canvas" onClick={onClick} onPointerDown={onPointerDown}>
        {children}
      </div>
    ),
    // Waits like the real useLoader until the test finishes the download.
    useLoader: (_loader: unknown, urls: string[]) => {
      if (!load.done) throw load.promise;
      load.result ??= urls.map(() => ({ scene: new Group() }));
      return load.result;
    },
    useThree: (select: (s: typeof state) => unknown) => select(state),
    addEffect: () => () => {},
    addTail: () => () => {},
    // Remembers nothing and never calls back, because no frame is ever drawn.
    useFrame: () => {},
  };
});

vi.mock("@react-three/drei", () => ({ CameraControls: () => null }));

const t = createT(en);
// The model files the app hands the viewer once it has read the manifest.
const files = { urls: ["/models/hip.glb"] };

function withWebGL(available: boolean) {
  const context = { getExtension: () => null };
  vi.spyOn(HTMLCanvasElement.prototype, "getContext").mockImplementation((() => (available ? context : null)) as never);
}

beforeEach(() => {
  newLoad();
  // React warns about the 3D tags it does not know, like <group>. Keep the output quiet.
  vi.spyOn(console, "error").mockImplementation(() => {});
  // Only the watchdog timer is faked. The rest of React keeps running normally.
  vi.useFakeTimers({ toFake: ["setTimeout", "clearTimeout"] });
});

afterEach(() => {
  cleanup();
  vi.useRealTimers();
  vi.restoreAllMocks();
});

function show() {
  render(<Viewer files={files} t={t} selection={null} focus={null} isShown={() => true} highlights={null} onSelect={() => {}} />);
}

// A model with a left and a right piriformis, like the real files.
async function loadPiriformisPair() {
  const { Group, Mesh } = await import("three");
  const make = (side: "l" | "r") => {
    const mesh = new Mesh();
    mesh.userData = { sid: "piriformis", label: "Piriformis", side, kind: "muscle" };
    return mesh;
  };
  const left = make("l");
  const right = make("r");
  const scene = new Group();
  scene.add(left, right);
  load.result = [{ scene }];
  return { left, right };
}

// Lets the lazy scene module, the manifest and React catch up.
async function settle() {
  for (let i = 0; i < 5; i++) {
    await act(async () => {
      await vi.dynamicImportSettled();
      vi.advanceTimersByTime(400);
    });
  }
}

test("loading text shows while the model suspends", async () => {
  withWebGL(true);
  show();
  // Straight away, before the 3D code has arrived.
  expect(screen.getByText(en["loading.model"])).toBeTruthy();
  await settle();
  // The scene is there and the model is still downloading.
  expect(screen.getByTestId("canvas")).toBeTruthy();
  expect(screen.getByText(en["loading.model"])).toBeTruthy();
  await act(async () => {
    load.finish();
    await load.promise;
  });
  await settle();
  expect(screen.queryByText(en["loading.model"])).toBeNull();
});

test("watchdog is satisfied when loading finishes, not on the first frame", async () => {
  withWebGL(true);
  show();
  await settle();
  await act(async () => {
    load.finish();
    await load.promise;
  });
  await settle();
  // No frame was ever drawn, yet the finished load is enough.
  act(() => vi.advanceTimersByTime(LOAD_TIMEOUT_MS + 1000));
  expect(screen.queryByRole("alert")).toBeNull();
});

test("while the manifest is still loading, the loading text shows and nothing fails", async () => {
  withWebGL(true);
  render(<Viewer files={null} t={t} selection={null} focus={null} isShown={() => true} highlights={null} onSelect={() => {}} />);
  await settle();
  expect(screen.getByText(en["loading.model"])).toBeTruthy();
  expect(screen.queryByRole("alert")).toBeNull();
});

test("a manifest that could not be loaded shows the model load message", async () => {
  withWebGL(true);
  render(<Viewer files={{ error: new Error("Could not load models/manifest.json (404)") }} t={t} selection={null} focus={null} isShown={() => true} highlights={null} onSelect={() => {}} />);
  await settle();
  expect(screen.getByRole("alert").textContent).toBe(en["error.modelLoad"]);
});

test("a WebGL failure shows the WebGL message, not the connection message", () => {
  withWebGL(false);
  show();
  expect(screen.getByRole("alert").textContent).toBe(en["error.webgl"]);
  expect(screen.queryByText(en["error.modelLoad"])).toBeNull();
});

test("switching to the other side lights up that side's mesh and puts the first one back", async () => {
  withWebGL(true);
  const { left, right } = await loadPiriformisPair();
  const props = { files, t, isShown: () => true, highlights: null, onSelect: () => {} };
  const { rerender } = render(<Viewer {...props} selection={{ sid: "piriformis", side: "l" }} focus={null} />);
  await settle();
  await act(async () => {
    load.finish();
    await load.promise;
  });
  await settle();
  // Both start with the same plain material, then the selected side gets the lighter one.
  const lit = left.material;
  const plain = right.material;
  expect(lit).not.toBe(plain);

  rerender(<Viewer {...props} selection={{ sid: "piriformis", side: "r" }} focus={{ sid: "piriformis", side: "r" }} />);
  await settle();
  expect(right.material).toBe(lit);
  expect(left.material).toBe(plain);
});

// Area mode taps. The fake canvas has no pointer events, so we call the model's click handler directly
// with the fields R3F would give it, and click the canvas div for taps that miss the model.
async function loadBox() {
  const { BoxGeometry, Group, Mesh } = await import("three");
  const mesh = new Mesh(new BoxGeometry(1, 1, 0.1));
  mesh.userData = { sid: "piriformis", label: "Piriformis", side: "l", kind: "muscle" };
  const scene = new Group();
  scene.add(mesh);
  scene.updateMatrixWorld(true);
  load.result = [{ scene }];
}

async function showArea() {
  withWebGL(true);
  await loadBox();
  const onAreaTap = vi.fn();
  const onSelect = vi.fn();
  render(
    <Viewer files={files} t={t} selection={null} focus={null} isShown={() => true} highlights={null} onSelect={onSelect} areaMode onAreaTap={onAreaTap} areaMarker={null} areaProbe={null} />,
  );
  await settle();
  await act(async () => {
    load.finish();
    await load.promise;
  });
  await settle();
  return { onAreaTap, onSelect };
}

// The click handler React put on the model's group.
function modelClick(): (event: unknown) => void {
  const group = screen.getByTestId("canvas").querySelector("group") as Element;
  const key = Object.keys(group).find((k) => k.startsWith("__reactProps"))!;
  return (group as unknown as Record<string, { onClick: (event: unknown) => void }>)[key].onClick;
}

async function clickModel(delta: number, pointer = { x: 0, y: 0 }) {
  const { PerspectiveCamera } = await import("three");
  const camera = new PerspectiveCamera(40, 1, 0.01, 20);
  camera.position.z = 5;
  camera.updateMatrixWorld();
  act(() => modelClick()({ stopPropagation: () => {}, nativeEvent: new MouseEvent("click"), delta, pointer, camera, intersections: [] }));
}

test("area mode: a drag over the model calls neither onAreaTap nor onSelect", async () => {
  const { onAreaTap, onSelect } = await showArea();
  await clickModel(20);
  expect(onAreaTap).not.toHaveBeenCalled();
  expect(onSelect).not.toHaveBeenCalled();
});

test("area mode: a tap on the model calls onAreaTap with the list and never onSelect", async () => {
  const { onAreaTap, onSelect } = await showArea();
  await clickModel(0);
  expect(onSelect).not.toHaveBeenCalled();
  expect(onAreaTap).toHaveBeenCalledTimes(1);
  const tap = onAreaTap.mock.calls[0][0];
  expect(tap.entries.map((e: { sid: string }) => e.sid)).toEqual(["piriformis"]);
  expect(tap.through).toBeNull();
  expect(tap.point[2]).toBeCloseTo(0.05);
});

test("area mode: a tap that misses the model calls onAreaTap(null)", async () => {
  const { onAreaTap } = await showArea();
  await clickModel(0, { x: 0.95, y: 0.95 });
  expect(onAreaTap).toHaveBeenCalledWith(null);
});

test("area mode: a tap where only an outer ray hits calls onAreaTap(null)", async () => {
  const { onAreaTap } = await showArea();
  // The centre ray passes just beside the box, the left outer ray still meets it.
  await clickModel(0, { x: 0.3, y: 0 });
  expect(onAreaTap).toHaveBeenCalledWith(null);
});

test("area mode: a probe lists what lies in front of its structure, past bone", async () => {
  withWebGL(true);
  const { BoxGeometry, Group, Mesh } = await import("three");
  const piriformis = new Mesh(new BoxGeometry(1, 1, 0.1));
  piriformis.userData = { sid: "piriformis", label: "Piriformis", side: "l", kind: "muscle" };
  // A bone between the camera and the piriformis. A tap would stop at it, a probe goes on.
  const femur = new Mesh(new BoxGeometry(1, 1, 0.1));
  femur.userData = { sid: "femur", label: "Femur", side: "l", kind: "bone" };
  femur.position.z = 1;
  const scene = new Group();
  scene.add(piriformis, femur);
  scene.updateMatrixWorld(true);
  load.result = [{ scene }];
  const onAreaTap = vi.fn();
  const props = { files, t, selection: null, focus: null, isShown: () => true, highlights: null, onSelect: () => {}, areaMode: true, onAreaTap, areaMarker: null };
  const probe = { sid: "piriformis", side: "l" as const };
  const { rerender } = render(<Viewer {...props} areaProbe={null} />);
  await settle();
  await act(async () => {
    load.finish();
    await load.promise;
  });
  await settle();
  rerender(<Viewer {...props} areaProbe={probe} />);
  await settle();
  expect(onAreaTap).toHaveBeenCalledTimes(1);
  expect(onAreaTap.mock.calls[0][0].entries.map((e: { sid: string }) => e.sid)).toEqual(["femur", "piriformis"]);
});

test("area mode: a tap on empty canvas calls onAreaTap(null) and a drag over it does not", async () => {
  const { onAreaTap, onSelect } = await showArea();
  const canvas = screen.getByTestId("canvas");
  fireEvent.pointerDown(canvas, { clientX: 10, clientY: 10 });
  fireEvent.click(canvas, { clientX: 40, clientY: 10 });
  expect(onAreaTap).not.toHaveBeenCalled();
  fireEvent.pointerDown(canvas, { clientX: 10, clientY: 10 });
  fireEvent.click(canvas, { clientX: 11, clientY: 10 });
  expect(onAreaTap).toHaveBeenCalledWith(null);
  expect(onSelect).not.toHaveBeenCalled();
});

test("area mode: a probe whose rays miss still reports through the probe, not null", async () => {
  withWebGL(true);
  const { BoxGeometry, Group, Mesh } = await import("three");
  // The mesh has a box but cannot be hit, so every ray misses it.
  const mesh = new Mesh(new BoxGeometry(1, 1, 0.1));
  mesh.userData = { sid: "piriformis", label: "Piriformis", side: "l", kind: "muscle" };
  mesh.raycast = () => {};
  const scene = new Group();
  scene.add(mesh);
  scene.updateMatrixWorld(true);
  load.result = [{ scene }];
  const onAreaTap = vi.fn();
  const props = { files, t, selection: null, focus: null, isShown: () => true, highlights: null, onSelect: () => {}, areaMode: true, onAreaTap, areaMarker: null };
  const probe = { sid: "piriformis", side: "l" as const };
  const { rerender } = render(<Viewer {...props} areaProbe={null} />);
  await settle();
  await act(async () => {
    load.finish();
    await load.promise;
  });
  await settle();
  rerender(<Viewer {...props} areaProbe={probe} />);
  await settle();
  expect(onAreaTap).toHaveBeenCalledTimes(1);
  expect(onAreaTap).toHaveBeenCalledWith({ entries: [], point: [0, 0, 0], through: probe });
});
