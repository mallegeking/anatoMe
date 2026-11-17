import { act, cleanup, render, screen } from "@testing-library/react";
import { Suspense } from "react";
import { afterEach, expect, test, vi } from "vitest";
import { lazyRetry } from "./lazyRetry";
import { QuietBoundary } from "./QuietBoundary";

afterEach(() => {
  cleanup();
  vi.restoreAllMocks();
});

test("a part whose download failed downloads again the next time it mounts", async () => {
  vi.spyOn(console, "error").mockImplementation(() => {});
  const load = vi.fn(async () => ({ default: () => <p>part here</p> }));
  load.mockRejectedValueOnce(new Error("offline"));
  const part = lazyRetry(load);
  function Show() {
    const Part = part();
    return (
      <QuietBoundary fallback={<p>failed</p>}>
        <Suspense fallback={null}>
          <Part />
        </Suspense>
      </QuietBoundary>
    );
  }
  const first = render(<Show />);
  expect(await screen.findByText("failed")).toBeTruthy();
  first.unmount();
  await act(async () => {
    render(<Show />);
  });
  expect(await screen.findByText("part here")).toBeTruthy();
  expect(load).toHaveBeenCalledTimes(2);
});

test("a part that loaded is not downloaded again", async () => {
  const load = vi.fn(async () => ({ default: () => <p>part here</p> }));
  const part = lazyRetry(load);
  function Show() {
    const Part = part();
    return (
      <Suspense fallback={null}>
        <Part />
      </Suspense>
    );
  }
  const first = render(<Show />);
  expect(await screen.findByText("part here")).toBeTruthy();
  first.unmount();
  render(<Show />);
  expect(screen.getByText("part here")).toBeTruthy();
  expect(load).toHaveBeenCalledTimes(1);
});
