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
