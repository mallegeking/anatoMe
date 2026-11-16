import { act, renderHook } from "@testing-library/react";
import { expect, test } from "vitest";
import { setViewport } from "./fixture";
import { useShort, useWide } from "./useMedia";

test("useWide follows the 900 px query and updates on change", () => {
  setViewport("phone");
  const { result } = renderHook(() => useWide());
  expect(result.current).toBe(false);
  act(() => setViewport("wide"));
  expect(result.current).toBe(true);
});

test("useShort is true only on a short phone", () => {
  setViewport("short");
  const { result } = renderHook(() => [useShort(), useWide()]);
  expect(result.current).toEqual([true, false]);
  act(() => setViewport("wide"));
  expect(result.current).toEqual([false, true]);
});

test("without matchMedia the hooks say false", () => {
  // @ts-expect-error removing it on purpose
  delete window.matchMedia;
  expect(renderHook(() => useWide()).result.current).toBe(false);
  expect(renderHook(() => useShort()).result.current).toBe(false);
});
