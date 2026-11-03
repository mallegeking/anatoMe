import { act, cleanup, render, screen } from "@testing-library/react";
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
  const state = { controls: { fitToBox: () => Promise.resolve() }, invalidate: () => {}, clock: { getDelta: () => 0 } };
  return {
    // A plain box in place of the 3D canvas.
    Canvas: ({ children }: { children: ReactNode }) => <div data-testid="canvas">{children}</div>,
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

vi.mock("./manifest", async (importOriginal) => ({
  ...(await importOriginal<typeof import("./manifest")>()),
  loadManifest: async () => ({ regions: { hip: { files: [{ path: "hip.glb", source: "bp3d", license: "CC-BY-4.0" }] } } }),
}));

const t = createT(en);

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
  render(<Viewer region="hip" t={t} selection={null} focus={null} isVisibleSid={() => true} onSelect={() => {}} />);
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

test("a WebGL failure shows the WebGL message, not the connection message", () => {
  withWebGL(false);
  show();
  expect(screen.getByRole("alert").textContent).toBe(en["error.webgl"]);
  expect(screen.queryByText(en["error.modelLoad"])).toBeNull();
});
