import { act, cleanup, render, screen } from "@testing-library/react";
import { Suspense } from "react";
import { afterEach, expect, test, vi } from "vitest";
import en from "../i18n/en.json";
import { createT } from "../i18n/t";
import { ModelErrorBoundary } from "./ModelErrorBoundary";
import { useLoadWatchdog } from "./useLoadWatchdog";

const t = createT(en);

// Testing Library only cleans up by itself when vitest globals are on, so we do it here.
afterEach(() => {
  cleanup();
  vi.useRealTimers();
  vi.restoreAllMocks();
});

function Thrower(): never {
  throw new Error("boom");
}

test("shows the load error message when a child throws", () => {
  // React logs the caught error, so keep the test output quiet.
  vi.spyOn(console, "error").mockImplementation(() => {});
  render(
    <ModelErrorBoundary t={t}>
      <Thrower />
    </ModelErrorBoundary>,
  );
  expect(screen.getByText(en["error.modelLoad"])).toBeTruthy();
});

test("the log names the same failure as the message", () => {
  const log = vi.spyOn(console, "error").mockImplementation(() => {});
  render(
    <ModelErrorBoundary t={t} messageKey="error.dataLoad">
      <Thrower />
    </ModelErrorBoundary>,
  );
  expect(log.mock.calls.some((call) => call[0] === en["error.dataLoad"])).toBe(true);
  expect(log.mock.calls.some((call) => call[0] === en["error.modelLoad"])).toBe(false);
});

// This is how a real load fails. The loader suspends on a promise, the same way useLoader does,
// and the promise is rejected later, for example when the Draco decoder cannot be downloaded.
test("shows the load error message when a loading child fails later", async () => {
  vi.spyOn(console, "error").mockImplementation(() => {});
  let failure: Error | null = null;
  let fail: (error: Error) => void = () => {};
  const loading = new Promise<void>((_, reject) => {
    fail = reject;
  }).catch((error: Error) => {
    failure = error;
  });
  function Loader(): null {
    // Still loading: hand React the promise. Failed: throw the error.
    if (failure) throw failure;
    throw loading;
  }

  render(
    <ModelErrorBoundary t={t}>
      <Suspense fallback={null}>
        <Loader />
      </Suspense>
    </ModelErrorBoundary>,
  );
  expect(screen.queryByRole("alert")).toBeNull();

  await act(async () => {
    fail(new Error("decoder missing"));
    await loading;
  });
  expect(screen.getByRole("alert").textContent).toBe(en["error.modelLoad"]);
});

function Watched({ ready }: { ready: boolean }) {
  useLoadWatchdog(() => ready, 1000);
  return null;
}

test("the watchdog shows the load error message when the model is never ready", () => {
  vi.spyOn(console, "error").mockImplementation(() => {});
  vi.useFakeTimers();
  render(
    <ModelErrorBoundary t={t}>
      <Watched ready={false} />
    </ModelErrorBoundary>,
  );
  expect(screen.queryByRole("alert")).toBeNull();
  act(() => vi.advanceTimersByTime(1000));
  expect(screen.getByRole("alert").textContent).toBe(en["error.modelLoad"]);
});

test("the watchdog stays quiet when the model is ready in time", () => {
  vi.useFakeTimers();
  render(
    <ModelErrorBoundary t={t}>
      <Watched ready={true} />
    </ModelErrorBoundary>,
  );
  act(() => vi.advanceTimersByTime(1000));
  expect(screen.queryByRole("alert")).toBeNull();
});

test("a WebGL failure inside three shows the WebGL message", () => {
  vi.spyOn(console, "error").mockImplementation(() => {});
  function NoContext(): never {
    // This is what three throws when the browser will not give it a WebGL context.
    throw new Error("THREE.WebGLRenderer: Error creating WebGL context.");
  }
  render(
    <ModelErrorBoundary t={t}>
      <NoContext />
    </ModelErrorBoundary>,
  );
  expect(screen.getByRole("alert").textContent).toBe(en["error.webgl"]);
});

test("extra content shows next to the error, outside the alert", () => {
  vi.spyOn(console, "error").mockImplementation(() => {});
  render(
    <ModelErrorBoundary t={t} extra={<p>still here</p>}>
      <Thrower />
    </ModelErrorBoundary>,
  );
  expect(screen.getByRole("alert").textContent).toBe(en["error.modelLoad"]);
  expect(screen.getByText("still here")).toBeTruthy();
});

function setHidden(hidden: boolean) {
  Object.defineProperty(document, "hidden", { configurable: true, get: () => hidden });
  document.dispatchEvent(new Event("visibilitychange"));
}

test("the watchdog waits while the page is in a background tab and starts afresh when it shows", () => {
  vi.spyOn(console, "error").mockImplementation(() => {});
  vi.useFakeTimers();
  setHidden(true);
  try {
    render(
      <ModelErrorBoundary t={t}>
        <Watched ready={false} />
      </ModelErrorBoundary>,
    );
    act(() => vi.advanceTimersByTime(5000));
    expect(screen.queryByRole("alert")).toBeNull();
    act(() => setHidden(false));
    act(() => vi.advanceTimersByTime(999));
    expect(screen.queryByRole("alert")).toBeNull();
    act(() => vi.advanceTimersByTime(1));
    expect(screen.getByRole("alert").textContent).toBe(en["error.modelLoad"]);
  } finally {
    // jsdom's own value lives on the prototype, so removing ours brings it back.
    delete (document as { hidden?: boolean }).hidden;
  }
});
